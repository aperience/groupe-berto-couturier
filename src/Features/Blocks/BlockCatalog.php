<?php
/**
 * Catalogue des blocs, dans la page d'aide
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blocks;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Support\ViteManifest;
use Theme\Features\Admin\HelpScreen;
use WP_Block_Type_Registry;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute à la page d'aide un onglet « Catalogue des blocs » qui présente chacun des blocs
 * du thème de premier niveau. Pour chaque bloc, il montre une capture, sa description, ses
 * réglages et un lien vers une page où le voir.
 *
 * - **Titre et description** viennent du `block.json` du bloc, lus dans le registre
 *   de WordPress (déjà traduits). Ils sont donc toujours à jour.
 * - **Réglages** : rédigés dans le gabarit `resources/views/admin/help/blocks.twig`,
 *   pour le client (aucun nom d'attribut).
 * - **Captures** : `resources/images/help/blocks/{nom}.webp`, émises par l'entrée Vite
 *   `resources/js/help-blocks.js` et résolues par le manifest. Sans build ou sans
 *   capture, la fiche s'affiche sans image.
 * - **Ordre et familles** : `GROUPS`. Un bloc absent du registre (non buildé) est ignoré.
 *   Un nouveau bloc ne figure dans le catalogue qu'une fois ajouté ici.
 */
final class BlockCatalog implements FeatureInterface {

    /** Dossier source des captures, tel que référencé dans le manifest Vite. */
    private const IMAGES = 'resources/images/help/blocks/';

    /** Priorité de l'onglet : en premier. */
    private const PRIORITY = 5;

    /**
     * Familles de blocs, dans l'ordre d'affichage. Pour chaque bloc (nom sans préfixe),
     * le chemin de la page de démonstration (`''` = page d'accueil).
     *
     * @var array<string, array<string, string>>
     */
    private const GROUPS = [
        'heroes'   => [
            'home-hero' => '',
            'page-hero' => 'auto-ecole',
        ],
        'text'     => [
            'section-title'    => 'auto-ecole',
            'image-text'       => '',
            'collapsible-text' => 'le-centre',
            'faq'              => '',
        ],
        'cards'    => [
            'icon-cards'  => '',
            'image-cards' => 'auto-ecole',
            'photo-cards' => '',
            'reassurance' => '',
            'team'        => 'le-centre',
            'logo-strip'  => 'formation-pro',
        ],
        'training' => [
            'formulas'          => 'auto-ecole/permis-b/permis-accelere',
            'training-overview' => 'formation-pro/caces/caces-r489',
            'sessions'          => 'auto-ecole/permis-b/permis-accelere',
            'journey'           => 'auto-ecole/permis-b/permis-accelere',
            'steps'             => 'auto-ecole',
            'pickup-map'        => 'le-centre',
        ],
        'action'   => [
            'cta'         => '',
            'compact-cta' => 'auto-ecole',
            'reviews'     => '',
        ],
    ];

    /**
     * @param ViteManifest $manifest Résolution des captures buildées.
     */
    public function __construct(
        private readonly ViteManifest $manifest = new ViteManifest(),
    ) {}

    /** Enregistre l'onglet. */
    public function register(): void {
        add_filter( HelpScreen::TABS_FILTER, [ $this, 'help_tab' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Onglet « Catalogue des blocs » de la page d\'aide : aperçu, description et réglages de chaque bloc du thème.', 'couturier' );
    }

    /**
     * Déclare l'onglet.
     *
     * @param array<string, mixed> $tabs Onglets déjà déclarés.
     * @return array<string, mixed>
     */
    public function help_tab( array $tabs ): array {
        $tabs['blocks'] = [
            'label'    => __( 'Catalogue des blocs', 'couturier' ),
            'priority' => self::PRIORITY,
            'context'  => [ 'groups' => $this->groups() ],
        ];

        return $tabs;
    }

    /**
     * Blocs par famille, prêts pour le gabarit.
     *
     * @return array<string, list<array{slug: string, title: string, description: string, demo_url: string, image_url: string}>>
     */
    private function groups(): array {
        $registry = WP_Block_Type_Registry::get_instance();
        $groups   = [];

        foreach ( self::GROUPS as $group => $blocks ) {
            foreach ( $blocks as $slug => $path ) {
                $type = $registry->get_registered( 'couturier/' . $slug );
                if ( null === $type ) {
                    continue;
                }

                $groups[ $group ][] = [
                    'slug'        => $slug,
                    'title'       => (string) $type->title,
                    'description' => (string) $type->description,
                    'demo_url'    => $this->demo_url( $path ),
                    'image_url'   => $this->manifest->entry_url( self::IMAGES . $slug . '.webp' ),
                ];
            }
        }

        return $groups;
    }

    /** URL de la page de démonstration publiée, chaîne vide sinon. */
    private function demo_url( string $path ): string {
        if ( '' === $path ) {
            $id = (int) get_option( 'page_on_front' );
            return $id > 0 ? (string) get_permalink( $id ) : home_url( '/' );
        }

        $page = get_page_by_path( $path );

        return null !== $page && 'publish' === $page->post_status ? (string) get_permalink( $page ) : '';
    }
}
