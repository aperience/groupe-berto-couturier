<?php
/**
 * Contacts prédéfinis : type de contenu
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Contacts;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Theme\Features\Admin\HelpScreen;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Déclare le type de contenu `couturier_contact` : les personnes à contacter
 * affichées dans les héros (accueil, pages), saisies une fois et choisies dans les
 * blocs.
 *
 * **Droits des pages** (`capability_type => 'page'`) : éditeurs et administrateurs.
 *
 * **Non public** : ni page, ni archive, ni recherche, ni plan du site, ni API REST
 * (aucune URL sur le site). Écran d'édition classique (pas d'éditeur de blocs : un
 * contact n'a pas de contenu) — titre (nom interne), image mise en avant (photo) et
 * boîte « Coordonnées » (`ContactMetaBox`). Menu de premier niveau « Contacts »,
 * sous « Pages » et « Offre du moment ».
 */
final class ContactPostType implements FeatureInterface {

    /** Position dans le menu : sous Pages (20) et l'Offre du moment (21). */
    private const MENU_POSITION = 22;

    /** Enregistre le type de contenu et les libellés de l'écran. */
    public function register(): void {
        add_action( 'init', [ $this, 'register_post_type' ] );
        add_filter( 'enter_title_here', [ $this, 'title_placeholder' ], 10, 2 );
        add_filter( 'admin_post_thumbnail_html', [ $this, 'thumbnail_help' ], 10, 2 );
        add_filter( HelpScreen::TABS_FILTER, [ $this, 'help_tab' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Déclare les contacts prédéfinis (menu « Contacts »), choisis dans les héros de l\'accueil et des pages ; ils n\'ont pas de page sur le site.', 'couturier' );
    }

    /** Type de contenu non public, édité dans l'écran classique. */
    public function register_post_type(): void {
        register_post_type(
            Contact::POST_TYPE,
            [
                'labels'              => [
                    'name'                  => __( 'Contacts', 'couturier' ),
                    'singular_name'         => __( 'Contact', 'couturier' ),
                    'menu_name'             => __( 'Contacts', 'couturier' ),
                    'all_items'             => __( 'Contacts', 'couturier' ),
                    'add_new'               => __( 'Ajouter un contact', 'couturier' ),
                    'add_new_item'          => __( 'Ajouter un contact', 'couturier' ),
                    'edit_item'             => __( 'Modifier le contact', 'couturier' ),
                    'new_item'              => __( 'Nouveau contact', 'couturier' ),
                    'search_items'          => __( 'Rechercher des contacts', 'couturier' ),
                    'not_found'             => __( 'Aucun contact.', 'couturier' ),
                    'not_found_in_trash'    => __( 'Aucun contact dans la corbeille.', 'couturier' ),
                    'featured_image'        => __( 'Photo', 'couturier' ),
                    'set_featured_image'    => __( 'Choisir la photo', 'couturier' ),
                    'remove_featured_image' => __( 'Retirer la photo', 'couturier' ),
                    'use_featured_image'    => __( 'Utiliser comme photo', 'couturier' ),
                    'item_published'        => __( 'Contact publié.', 'couturier' ),
                    'item_updated'          => __( 'Contact mis à jour.', 'couturier' ),
                ],
                'public'              => false,
                'publicly_queryable'  => false,
                'exclude_from_search' => true,
                'show_ui'             => true,
                'show_in_menu'        => true,
                'menu_position'       => self::MENU_POSITION,
                'menu_icon'           => 'dashicons-id-alt',
                'show_in_nav_menus'   => false,
                'show_in_admin_bar'   => false,
                'show_in_rest'        => false,
                'has_archive'         => false,
                'rewrite'             => false,
                'query_var'           => false,
                'hierarchical'        => false,
                // Droits des pages : un contact s'affiche dans des pages, qui les gère
                // gère les contacts (éditeurs, administrateurs ; ni auteurs ni contributeurs).
                'capability_type'     => 'page',
                'map_meta_cap'        => true,
                'supports'            => [ 'title', 'thumbnail' ],
            ]
        );
    }

    /** Indication du champ titre : c'est un nom interne. */
    public function title_placeholder( string $placeholder, \WP_Post $post ): string {
        return Contact::POST_TYPE === $post->post_type
            ? __( 'Nom interne (ex. « Eloim – Auto-école »), pour le choisir dans les blocs', 'couturier' )
            : $placeholder;
    }

    /** Aide sous la photo du contact. */
    public function thumbnail_help( string $html, int $post_id ): string {
        if ( Contact::POST_TYPE !== get_post_type( $post_id ) ) {
            return $html;
        }

        return $html . '<p class="description">' . esc_html__( 'Photo carrée, affichée ronde et en noir et blanc (66 px).', 'couturier' ) . '</p>';
    }

    /**
     * Déclare l'onglet « Contacts » de la page d'aide
     * (gabarit `resources/views/admin/help/contacts.twig`).
     *
     * @param array<string, array<string, mixed>> $tabs Onglets déjà déclarés.
     * @return array<string, array<string, mixed>>
     */
    public function help_tab( array $tabs ): array {
        $tabs['contacts'] = [
            'label'    => __( 'Contacts', 'couturier' ),
            'priority' => 25,
            'context'  => [
                'contacts_url' => admin_url( 'edit.php?post_type=' . Contact::POST_TYPE ),
                'new_url'      => admin_url( 'post-new.php?post_type=' . Contact::POST_TYPE ),
            ],
        ];

        return $tabs;
    }
}
