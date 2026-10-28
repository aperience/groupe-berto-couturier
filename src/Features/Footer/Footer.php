<?php
/**
 * Pied de page : lecture des réglages
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Footer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Logique partagée par l'écran d'admin (`FooterSettings`) et le contexte front
 * (`FooterContext`). Elle n'ajoute aucun hook et n'est donc pas une feature.
 *
 * **Une option autoloadée** : certifications (image de la médiathèque, lien
 * facultatif, dans l'ordre d'affichage), adresses des réseaux sociaux, texte du
 * copyright. La lire ne coûte rien ; seules les images restent à résoudre.
 */
final class Footer {

    /** Option stockant les réglages du pied de page. */
    public const OPTION = 'couturier_footer';

    /** Slug de l'écran de réglages, préfixé par `ThemeContext::handle()`. */
    public const MENU_SLUG = 'footer';

    /** Réseaux sociaux proposés, dans l'ordre d'affichage : clé => nom. */
    public const NETWORKS = [
        'facebook'  => 'Facebook',
        'instagram' => 'Instagram',
        'linkedin'  => 'LinkedIn',
        'youtube'   => 'YouTube',
    ];

    /** Valeurs par défaut des champs. */
    private const DEFAULTS = [
        'certifications' => [],
        'social'         => [],
        'copyright'      => '',
    ];

    /**
     * Réglages enregistrés, complétés par les valeurs par défaut.
     *
     * @return array{certifications: list<array{image_id: int, url: string}>, social: array<string, string>, copyright: string}
     */
    public static function settings(): array {
        $stored = get_option( self::OPTION, [] );

        return array_merge( self::DEFAULTS, is_array( $stored ) ? array_intersect_key( $stored, self::DEFAULTS ) : [] );
    }

    /** Texte du copyright, après l'année : celui saisi, ou celui par défaut. */
    public static function copyright(): string {
        $copyright = self::settings()['copyright'];

        return '' !== $copyright ? $copyright : self::default_copyright();
    }

    /** Texte du copyright par défaut, proposé en exemple dans l'écran. */
    public static function default_copyright(): string {
        return __( 'Groupe Couturier · Sainte-Gemme-Moronval (28)', 'couturier' );
    }

    /**
     * Certifications dont l'image existe encore dans la médiathèque.
     *
     * Une image supprimée après l'enregistrement est ignorée, sans erreur.
     *
     * @return list<array{image_id: int, url: string}>
     */
    public static function certifications(): array {
        $certifications = self::settings()['certifications'];

        // Une seule requête pour toutes les images, au lieu d'une par logo.
        _prime_post_caches( array_column( $certifications, 'image_id' ) );

        return array_values(
            array_filter(
                $certifications,
                static fn( array $certification ): bool => self::is_valid_image( (int) $certification['image_id'] )
            )
        );
    }

    /**
     * Vrai si l'identifiant désigne une image de la médiathèque.
     *
     * Par son type MIME, et non `wp_attachment_is_image()`, qui ne connaît que les
     * extensions bitmap : un logo est souvent un SVG (feature `Admin\SvgSupport`).
     */
    public static function is_valid_image( int $image_id ): bool {
        return $image_id > 0
            && 'attachment' === get_post_type( $image_id )
            && str_starts_with( (string) get_post_mime_type( $image_id ), 'image/' );
    }

    /**
     * Texte alternatif d'une image, à défaut son titre.
     *
     * Le logo est le seul contenu de son lien : sans texte, le lien n'aurait pas
     * d'intitulé (WCAG 2.4.4, 4.1.2).
     */
    public static function image_alt( int $image_id ): string {
        $alt = trim( (string) get_post_meta( $image_id, '_wp_attachment_image_alt', true ) );

        return '' !== $alt ? $alt : get_the_title( $image_id );
    }
}
