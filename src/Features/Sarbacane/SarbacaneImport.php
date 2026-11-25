<?php
/**
 * Import de l'historique des formulaires dans Sarbacane
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Sarbacane;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Soumissions Ninja Forms déjà enregistrées : comptage (simulation) ou envoi
 * de toutes, par lots de 500, de la plus ancienne à la plus récente. Logique
 * reprise du script client ; appelée par la page « Sarbacane », sans hook.
 */
final class SarbacaneImport {

    /** Taille d'un lot d'import. */
    private const BATCH = 500;

    /**
     * Nombre de soumissions par formulaire. Rien n'est envoyé.
     *
     * @return array{forms: array<int, array{id: int, title: string, count: int}>, total: int}
     */
    public static function simulate(): array {
        $forms = [];
        $total = 0;
        foreach ( Ninja_Forms()->form()->get_forms() as $form ) {
            $fid     = (int) $form->get_id();
            $count   = count( Ninja_Forms()->form( $fid )->get_subs() );
            $forms[] = [ 'id' => $fid, 'title' => (string) $form->get_setting( 'title' ), 'count' => $count ];
            $total  += $count;
        }
        return [ 'forms' => $forms, 'total' => $total ];
    }

    /**
     * Envoie toutes les soumissions ; renvoie le compte rendu en texte brut.
     */
    public static function run(): string {
        @set_time_limit( 900 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
        $list_id = SarbacaneApi::list_id();
        if ( ! $list_id ) {
            return 'Liste KO';
        }
        $total   = 0;
        $skipped = 0;
        $batch   = [];
        $out     = '';
        foreach ( Ninja_Forms()->form()->get_forms() as $form ) {
            $fid   = (int) $form->get_id();
            $title = $form->get_setting( 'title' );
            $fobjs = Ninja_Forms()->form( $fid )->get_fields();
            $subs  = Ninja_Forms()->form( $fid )->get_subs();
            $out  .= "NF-$fid $title : " . count( $subs ) . " soumissions\n";
            $dated = [];
            foreach ( $subs as $sub ) {
                $ts      = strtotime( get_post_field( 'post_date_gmt', $sub->get_id() ) . ' UTC' );
                $dated[] = [ $ts ?: time(), $sub ];
            }
            usort( $dated, static fn( array $a, array $b ): int => $a[0] <=> $b[0] );
            foreach ( $dated as [ $ts, $sub ] ) {
                $fields = [];
                foreach ( $fobjs as $fo ) {
                    $s          = $fo->get_settings();
                    $s['value'] = $sub->get_field_value( $fo->get_id() );
                    $fields[]   = $s;
                }
                $c = SarbacaneContact::build( $list_id, $fid, $title, $fields, (int) $ts );
                if ( ! $c ) {
                    ++$skipped;
                    continue;
                }
                $batch[] = $c;
                ++$total;
                if ( count( $batch ) >= self::BATCH ) {
                    self::import_batch( $list_id, $batch );
                    $batch = [];
                }
            }
        }
        if ( $batch ) {
            self::import_batch( $list_id, $batch );
        }
        return $out . "\nTotal : $total contacts envoyes, $skipped ignores (ni e-mail ni mobile)\n\n" . implode( "\n", array_slice( (array) get_option( 'sb_last_log', [] ), -15 ) );
    }

    /**
     * Envoie un lot de contacts.
     *
     * @param string                           $list_id ID de la liste.
     * @param array<int, array<string, mixed>> $batch   Contacts.
     */
    private static function import_batch( string $list_id, array $batch ): void {
        $res = SarbacaneApi::request( 'POST', '/lists/' . rawurlencode( $list_id ) . '/contacts/import?upsert=true', $batch, $ok );
        SarbacaneApi::log( 'Import lot de ' . count( $batch ) . ' : ' . ( $ok ? wp_json_encode( $res ) : 'ECHEC' ) );
    }
}
