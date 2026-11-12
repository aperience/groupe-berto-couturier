<?php
/**
 * Sessions de formation : taxonomie des secteurs
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\TrainingSessions;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Theme\Features\Admin\HelpScreen;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Déclare la taxonomie `couturier_sector` (menu « Secteurs ») : les libellés du
 * filtre du bloc « Sessions de formation ».
 *
 * **Rattachée à aucun type de contenu** : les sessions sont saisies dans le bloc,
 * qui n'enregistre que l'ID du secteur. WordPress n'ajoute donc l'écran à aucun
 * menu : il est ajouté ici en premier niveau, sous « Contacts ».
 *
 * **Droits des pages** (éditeurs et administrateurs). **Non publique** : ni
 * archive, ni plan du site, ni API REST. Nom et slug seulement : description et
 * compteur (toujours nul, aucun contenu rattaché) sont retirés de l'écran.
 */
final class SectorTaxonomy implements FeatureInterface {

    /** Position dans le menu : sous les Contacts (22). */
    private const MENU_POSITION = 23;

    /** Enregistre la taxonomie, son menu, l'écran et l'onglet d'aide. */
    public function register(): void {
        add_action( 'init', [ $this, 'register_taxonomy' ] );
        add_action( 'admin_menu', [ $this, 'add_menu' ] );
        add_filter( 'parent_file', [ $this, 'parent_file' ] );
        add_filter( 'manage_edit-' . Sector::TAXONOMY . '_columns', [ $this, 'columns' ] );
        add_action( 'admin_head-edit-tags.php', [ $this, 'hide_description_field' ] );
        add_action( 'admin_head-term.php', [ $this, 'hide_description_field' ] );
        add_filter( HelpScreen::TABS_FILTER, [ $this, 'help_tab' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Déclare les secteurs (menu « Secteurs ») : les boutons du filtre du bloc « Sessions de formation » ; ils n\'ont pas de page sur le site.', 'couturier' );
    }

    /** Taxonomie non publique, gérée avec les droits des pages. */
    public function register_taxonomy(): void {
        register_taxonomy(
            Sector::TAXONOMY,
            [],
            [
                'labels'             => [
                    'name'                       => __( 'Secteurs de formation', 'couturier' ),
                    'singular_name'              => __( 'Secteur', 'couturier' ),
                    'menu_name'                  => __( 'Secteurs', 'couturier' ),
                    'all_items'                  => __( 'Tous les secteurs', 'couturier' ),
                    'edit_item'                  => __( 'Modifier le secteur', 'couturier' ),
                    'view_item'                  => __( 'Voir le secteur', 'couturier' ),
                    'update_item'                => __( 'Mettre à jour le secteur', 'couturier' ),
                    'add_new_item'               => __( 'Ajouter un secteur', 'couturier' ),
                    'new_item_name'              => __( 'Nom du nouveau secteur', 'couturier' ),
                    'search_items'               => __( 'Rechercher des secteurs', 'couturier' ),
                    'not_found'                  => __( 'Aucun secteur.', 'couturier' ),
                    'no_terms'                   => __( 'Aucun secteur', 'couturier' ),
                    'back_to_items'              => __( '← Retour aux secteurs', 'couturier' ),
                    'item_link'                  => __( 'Lien du secteur', 'couturier' ),
                    'name_field_description'     => __( 'Libellé du bouton du filtre (ex. « Dreux »).', 'couturier' ),
                    'slug_field_description'     => __( 'Identifiant technique, sans effet sur le site.', 'couturier' ),
                ],
                'public'             => false,
                'publicly_queryable' => false,
                'show_ui'            => true,
                'show_in_menu'       => false,
                'show_in_nav_menus'  => false,
                'show_tagcloud'      => false,
                'show_in_quick_edit' => false,
                'show_admin_column'  => false,
                'show_in_rest'       => false,
                'hierarchical'       => false,
                'rewrite'            => false,
                'query_var'          => false,
                // Droits des pages : les secteurs servent dans des pages.
                'capabilities'       => [
                    'manage_terms' => 'edit_pages',
                    'edit_terms'   => 'edit_pages',
                    'delete_terms' => 'edit_pages',
                    'assign_terms' => 'edit_pages',
                ],
            ]
        );
    }

    /** Menu de premier niveau « Secteurs », vers l'écran de la taxonomie. */
    public function add_menu(): void {
        add_menu_page(
            __( 'Secteurs de formation', 'couturier' ),
            __( 'Secteurs', 'couturier' ),
            'edit_pages',
            Sector::SCREEN_URL,
            '',
            'dashicons-location',
            self::MENU_POSITION
        );
    }

    /**
     * Garde le menu « Secteurs » ouvert sur l'écran de la taxonomie et sur la
     * modification d'un secteur (sinon WordPress surligne « Articles »).
     */
    public function parent_file( string $parent_file ): string {
        $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

        return $screen && Sector::TAXONOMY === $screen->taxonomy ? Sector::SCREEN_URL : $parent_file;
    }

    /**
     * Colonnes de la liste : ni description, ni compteur.
     *
     * @param array<string, string> $columns Colonnes par défaut.
     * @return array<string, string>
     */
    public function columns( array $columns ): array {
        unset( $columns['description'], $columns['posts'] );

        return $columns;
    }

    /** Masque le champ « Description », sans usage sur le site. */
    public function hide_description_field(): void {
        $screen = get_current_screen();

        if ( ! $screen || Sector::TAXONOMY !== $screen->taxonomy ) {
            return;
        }

        echo '<style>.term-description-wrap{display:none}</style>';
    }

    /**
     * Déclare l'onglet « Secteurs » de la page d'aide
     * (gabarit `resources/views/admin/help/sectors.twig`).
     *
     * @param array<string, array<string, mixed>> $tabs Onglets déjà déclarés.
     * @return array<string, array<string, mixed>>
     */
    public function help_tab( array $tabs ): array {
        $tabs['sectors'] = [
            'label'    => __( 'Secteurs', 'couturier' ),
            'priority' => 30,
            'context'  => [
                'sectors_url' => admin_url( Sector::SCREEN_URL ),
            ],
        ];

        return $tabs;
    }
}
