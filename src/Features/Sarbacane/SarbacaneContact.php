<?php
/**
 * Construction d'un contact Sarbacane
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Sarbacane;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Transforme les champs d'une soumission Ninja Forms en contact Sarbacane.
 *
 * Reprise à l'identique du script fourni par le client (`sb_norm`,
 * `sb_campagne`, `sb_caption`, `sb_truthy`, `sb_build_contact`). Ne pose aucun hook.
 */
final class SarbacaneContact {

    /** Champs jamais envoyés (libellés normalisés) : minimisation RGPD. */
    public const EXCLUDE = [ 'date de naissance', 'adresse' ];

    /** Types de champs Ninja Forms ignorés. */
    private const SKIP = [ 'submit', 'html', 'hr', 'recaptcha', 'recaptcha_v3', 'spam', 'note', 'confirm', 'password', 'passwordconfirm', 'unknown' ];

    /** Minuscules, sans accents ni espaces autour. */
    public static function norm( mixed $s ): string {
        return strtolower( trim( remove_accents( (string) $s ) ) );
    }

    /** « Formulaire campagne spécial Noël 2026 » → « Noël 2026 ». */
    public static function campagne( mixed $title ): string {
        $t = trim( (string) preg_replace( '/^formulaire\s+(de\s+|d\x27)?/iu', '', (string) $title ) );
        $t = trim( (string) preg_replace( '/^(landing page\s+)?(campagne\s+)?(sp[e\x{e9}]cial\s+)?/iu', '', $t ) );
        return '' !== $t ? mb_strtoupper( mb_substr( $t, 0, 1 ) ) . mb_substr( $t, 1 ) : (string) $title;
    }

    /** Libellé Ninja Forms → libellé de champ Sarbacane (équivalents regroupés). */
    public static function caption( mixed $label ): string {
        $l = trim( (string) preg_replace( '/[\s:*]+$/u', '', html_entity_decode( wp_strip_all_tags( (string) $label ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) );
        $n = self::norm( $l );
        if ( str_contains( $n, 'code postal' ) || 'ville' === $n ) {
            return 'Code postal et ville';
        }
        if ( str_contains( $n, 'question' ) || str_contains( $n, 'message' ) ) {
            return 'Question';
        }
        return mb_substr( $l, 0, 60 );
    }

    /** Valeur de case cochée ? */
    public static function truthy( mixed $v ): bool {
        return in_array( self::norm( $v ), [ '1', 'checked', 'coche', 'on', 'true', 'yes', 'oui' ], true );
    }

    /**
     * Contact prêt pour l'API, ou null sans e-mail ni téléphone.
     *
     * @param string                           $list_id ID de la liste.
     * @param int                              $form_id ID du formulaire.
     * @param mixed                            $title   Titre du formulaire.
     * @param array<int|string, array<string, mixed>> $fields  Réglages + valeur de chaque champ.
     * @param int                              $ts      Horodatage de la demande.
     * @return array<string, mixed>|null
     */
    public static function build( ?string $list_id, int $form_id, mixed $title, array $fields, int $ts ): ?array {
        $c     = [];
        $pixel = false;
        foreach ( $fields as $f ) {
            $type  = $f['type'] ?? '';
            $key   = $f['key'] ?? '';
            $label = $f['label'] ?? '';
            if ( in_array( $type, self::SKIP, true ) ) {
                continue;
            }
            $val = $f['value'] ?? '';
            if ( ! empty( $f['options'] ) && is_array( $f['options'] ) ) {
                $labels = [];
                foreach ( (array) $val as $vv ) {
                    $lab = $vv;
                    foreach ( $f['options'] as $o ) {
                        if ( (string) ( $o['value'] ?? '' ) === (string) $vv ) {
                            $lab = $o['label'] ?? $vv;
                            break;
                        }
                    }
                    if ( '' !== (string) $lab ) {
                        $labels[] = $lab;
                    }
                }
                $val = implode( ', ', $labels );
            }
            if ( is_array( $val ) ) {
                $val = implode( ', ', $val );
            }
            $val = trim( html_entity_decode( (string) $val, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
            if ( 'consentement_suivi_emails' === $key ) {
                $pixel = self::truthy( $val );
                continue;
            }
            if ( 'checkbox' === $type ) {
                $val = self::truthy( $val ) ? 'Oui' : 'Non';
            }
            if ( '' === $val ) {
                continue;
            }
            if ( 'email' === $type ) {
                if ( empty( $c['email'] ) && is_email( $val ) ) {
                    $c['email'] = sanitize_email( $val );
                }
                continue;
            }
            if ( 'phone' === $type ) {
                if ( empty( $c['phone'] ) ) {
                    $t = (string) preg_replace( '/[^0-9+]/', '', $val );
                    if ( $t ) {
                        $c['phone'] = preg_replace( '/^0/', '+33', $t );
                    }
                }
                continue;
            }
            if ( 'firstname' === $type ) {
                $full = trim( (string) preg_replace( '/\s+/', ' ', $val ) );
                if ( preg_match( '/\bnom\b/', str_replace( 'prenom', '', self::norm( $label ) ) ) ) {
                    $p                   = explode( ' ', $full, 2 );
                    $c['@Prénom et nom'] = $full;
                    $c['@Prénom']        = $p[0];
                    if ( ! empty( $p[1] ) ) {
                        $c['@Nom'] = $p[1];
                    }
                } else {
                    $c['@Prénom'] = $full;
                }
                continue;
            }
            if ( 'lastname' === $type ) {
                $c['@Nom'] = $val;
                continue;
            }
            $cap = self::caption( $label );
            if ( in_array( self::norm( $cap ), self::EXCLUDE, true ) ) {
                continue; // Données non envoyées (minimisation RGPD).
            }
            $c[ '@' . $cap ] = $val;
        }
        if ( empty( $c['email'] ) && empty( $c['phone'] ) ) {
            return null;
        }

        $c['@Formulaire']    = (string) $title;
        $c['@ID formulaire'] = 'NF-' . $form_id;
        $c['@Campagne']      = self::campagne( $title );

        $out = [];
        foreach ( $c as $k => $v ) {
            if ( '@' !== $k[0] ) {
                $out[ $k ] = $v;
                continue;
            }
            $id = SarbacaneApi::field_id( (string) $list_id, substr( $k, 1 ) );
            if ( $id ) {
                $out[ $id ] = sanitize_textarea_field( $v );
            }
        }
        $iso = gmdate( 'Y-m-d\TH:i:s.000\Z', $ts );
        $did = SarbacaneApi::field_id( (string) $list_id, 'Date de la demande', 'DATE' );
        if ( $did ) {
            $out[ $did ] = $iso;
        }
        if ( $pixel ) {
            $out['pixelOptin']   = 'true';
            $out['pixelOptinAt'] = $iso;
        }
        return $out;
    }
}
