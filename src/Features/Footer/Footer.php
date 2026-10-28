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

    /**
     * Réseaux sociaux proposés : clé => nom. Ordre par défaut ; l'ordre affiché est
     * celui de l'écran. Chaque clé a son icône dans `resources/views/partials/footer/icons/`.
     */
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
     * @return array{certifications: list<array{image_id: int, url: string, enabled: bool}>, social: array<mixed>, copyright: string}
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
     * Certifications dont l'image existe encore dans la médiathèque, actives ou non
     * (écran d'admin).
     *
     * Une image supprimée après l'enregistrement est ignorée, sans erreur. Une
     * certification enregistrée avant l'interrupteur « Activer » est active.
     *
     * @return list<array{image_id: int, url: string, enabled: bool}>
     */
    public static function certifications(): array {
        $certifications = self::settings()['certifications'];

        // Une seule requête pour toutes les images, au lieu d'une par logo.
        _prime_post_caches( array_column( $certifications, 'image_id' ) );

        return array_values(
            array_map(
                static fn( array $certification ): array => $certification + [ 'enabled' => true ],
                array_filter(
                    $certifications,
                    static fn( array $certification ): bool => self::is_valid_image( (int) $certification['image_id'] )
                )
            )
        );
    }

    /**
     * Certifications affichées sur le site : celles qui sont actives.
     *
     * @return list<array{image_id: int, url: string, enabled: bool}>
     */
    public static function active_certifications(): array {
        return array_values(
            array_filter(
                self::certifications(),
                static fn( array $certification ): bool => $certification['enabled']
            )
        );
    }

    /**
     * Tous les réseaux de `NETWORKS`, dans l'ordre enregistré (écran d'admin).
     *
     * Les réseaux absents de l'enregistrement (nouveau réseau, premier passage) sont
     * ajoutés à la fin, sans adresse. Un enregistrement antérieur à l'ordre et à
     * l'interrupteur (`{ réseau: adresse }`) est relu dans l'ordre de `NETWORKS`,
     * réseaux actifs.
     *
     * @return list<array{network: string, name: string, url: string, enabled: bool}>
     */
    public static function networks(): array {
        $stored = self::settings()['social'];

        if ( ! array_is_list( $stored ) ) {
            $stored = array_map(
                static fn( string $network, mixed $url ): array => [ 'network' => $network, 'url' => (string) $url ],
                array_keys( $stored ),
                $stored
            );
        }

        $networks = [];

        foreach ( $stored as $item ) {
            $network = (string) ( $item['network'] ?? '' );

            if ( isset( self::NETWORKS[ $network ] ) && ! isset( $networks[ $network ] ) ) {
                $networks[ $network ] = [
                    'network' => $network,
                    'name'    => self::NETWORKS[ $network ],
                    'url'     => (string) ( $item['url'] ?? '' ),
                    'enabled' => (bool) ( $item['enabled'] ?? true ),
                ];
            }
        }

        foreach ( self::NETWORKS as $network => $name ) {
            $networks[ $network ] ??= [
                'network' => $network,
                'name'    => $name,
                'url'     => '',
                'enabled' => true,
            ];
        }

        return array_values( $networks );
    }

    /**
     * Réseaux affichés sur le site : actifs et dont l'adresse est renseignée, dans
     * l'ordre enregistré.
     *
     * @return list<array{network: string, name: string, url: string, enabled: bool}>
     */
    public static function social(): array {
        return array_values(
            array_filter(
                self::networks(),
                static fn( array $item ): bool => $item['enabled'] && '' !== $item['url']
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
