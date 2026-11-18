<?php
/**
 * Contacts prédéfinis : lecture et rendu
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Contacts;

use Timber\Timber;
use WP_Post;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Logique partagée par le CPT, sa boîte méta, les données de l'éditeur et le rendu
 * des blocs (héros de l'accueil, héros des pages). Elle n'ajoute aucun hook et n'est
 * donc pas une feature.
 *
 * Un contact est un contenu `couturier_contact` : titre = nom interne (sert à le
 * choisir dans les blocs, jamais affiché), image mise en avant = photo, métas =
 * texte affiché, téléphone, e-mail. Seuls les contacts **publiés** sont utilisés.
 */
final class Contact {

    /** Type de contenu des contacts. */
    public const POST_TYPE = 'couturier_contact';

    /** Métas des coordonnées. */
    public const META_TEXT  = '_couturier_contact_text';
    public const META_PHONE = '_couturier_contact_phone';
    public const META_EMAIL = '_couturier_contact_email';

    /** Métas de la carte du bloc « Équipe ». */
    public const META_DISPLAY_NAME = '_couturier_contact_display_name';
    public const META_ROLE         = '_couturier_contact_role';

    /** Gabarit Twig de l'encart, partagé par les blocs. */
    private const VIEW = 'partials/hero-contact.twig';

    /** Gabarit Twig d'une carte du bloc « Équipe ». */
    private const TEAM_CARD_VIEW = 'partials/team-card.twig';

    /**
     * Contact publié, ou `null` (ID inconnu, autre type de contenu, brouillon,
     * corbeille).
     *
     * @return array{id: int, name: string, text: string, phone: string, email: string, display_name: string, role: string, image_id: int}|null
     */
    public static function find( int $id ): ?array {
        $post = $id > 0 ? get_post( $id ) : null;

        if ( ! $post instanceof WP_Post || self::POST_TYPE !== $post->post_type || 'publish' !== $post->post_status ) {
            return null;
        }

        return self::data( $post );
    }

    /**
     * Contacts publiés, par nom (liste de choix des blocs).
     *
     * @return list<array{id: int, name: string, text: string, phone: string, email: string, display_name: string, role: string, image_id: int}>
     */
    public static function all(): array {
        $posts = get_posts(
            [
                'post_type'      => self::POST_TYPE,
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'orderby'        => 'title',
                'order'          => 'ASC',
                'no_found_rows'  => true,
            ]
        );

        return array_map( [ self::class, 'data' ], $posts );
    }

    /**
     * Lien `tel:` d'un numéro saisi : chiffres seuls, numéro français (0X…) au
     * format international ; chaîne vide sans chiffre.
     */
    public static function tel_href( string $phone ): string {
        $digits = preg_replace( '/[^\d+]/', '', $phone ) ?? '';

        if ( '' === $digits ) {
            return '';
        }

        return 'tel:' . ( preg_match( '/^0\d{9}$/', $digits ) ? '+33' . substr( $digits, 1 ) : $digits );
    }

    /**
     * Encart d'un contact (photo ronde avec pastille enveloppe, texte, téléphone et
     * e-mail en liens), enveloppé par l'appelant. Chaîne vide si le contact n'est pas
     * publié ou n'a pas de texte.
     *
     * @param int $id ID du contact.
     */
    public static function render( int $id ): string {
        $contact = self::find( $id );

        if ( null === $contact || '' === trim( $contact['text'] ) ) {
            return '';
        }

        // Photo ronde (66 px), `alt` de la médiathèque. L'encart n'est affiché qu'en
        // desktop : chargement différé, elle n'est pas téléchargée en mobile.
        $image = $contact['image_id'] ? wp_get_attachment_image(
            $contact['image_id'],
            'thumbnail',
            false,
            [
                'class'   => 'hero-contact__image',
                'sizes'   => '66px',
                'loading' => 'lazy',
            ]
        ) : '';

        return Timber::compile(
            self::VIEW,
            [
                'image' => $image,
                // Espace avant « ? ! : ; » rendue insécable, comme dans les blocs.
                'lines' => array_map(
                    static fn ( string $line ): string => preg_replace( '/ +(?=[?!:;»])/u', "\u{00A0}", $line ) ?? $line,
                    preg_split( '/\R/', trim( $contact['text'] ) ) ?: []
                ),
                'phone' => $contact['phone'],
                'tel'   => self::tel_href( $contact['phone'] ),
                'email' => is_email( $contact['email'] ) ? $contact['email'] : '',
            ]
        ) ?: '';
    }

    /**
     * Carte d'un membre du bloc « Équipe » (`<li>`) : photo plein cadre, sinon fond
     * de couleur ; nom affiché et fonction. Chaîne vide si le contact n'est pas
     * publié ou n'a pas de nom affiché.
     *
     * @param int    $id         ID du contact.
     * @param string $background Slug du fond (validé par l'appelant), sans photo.
     * @param string $style      Attribut `style` de la photo (point focal `--focal`), ou vide.
     */
    public static function render_card( int $id, string $background, string $style = '' ): string {
        $contact = self::find( $id );

        if ( null === $contact || '' === trim( $contact['display_name'] ) ) {
            return '';
        }

        // Photo ronde de 104 px. Taille `medium` (300 px, non recadrée) plutôt que
        // `thumbnail` (recadrée au centre) : le point focal garde tout le cadre,
        // et l'écran haute densité (208 px) reste net.
        $image = $contact['image_id'] ? wp_get_attachment_image(
            $contact['image_id'],
            'medium',
            false,
            array_filter(
                [
                    'class'   => 'wp-block-couturier-team__image',
                    'sizes'   => '104px',
                    'loading' => 'lazy',
                    'style'   => $style,
                ]
            )
        ) : '';

        return Timber::compile(
            self::TEAM_CARD_VIEW,
            [
                'image'      => $image,
                'background' => $background,
                'name'       => trim( $contact['display_name'] ),
                'role'       => trim( $contact['role'] ),
            ]
        ) ?: '';
    }

    /**
     * Données d'un contact.
     *
     * @return array{id: int, name: string, text: string, phone: string, email: string, display_name: string, role: string, image_id: int}
     */
    private static function data( WP_Post $post ): array {
        return [
            'id'           => $post->ID,
            'name'         => get_the_title( $post ),
            'text'         => (string) get_post_meta( $post->ID, self::META_TEXT, true ),
            'phone'        => (string) get_post_meta( $post->ID, self::META_PHONE, true ),
            'email'        => (string) get_post_meta( $post->ID, self::META_EMAIL, true ),
            'display_name' => (string) get_post_meta( $post->ID, self::META_DISPLAY_NAME, true ),
            'role'         => (string) get_post_meta( $post->ID, self::META_ROLE, true ),
            'image_id'     => (int) get_post_thumbnail_id( $post ),
        ];
    }
}
