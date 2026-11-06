<?php
/**
 * Blocs réservés à la page d'accueil
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blocks;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use WP_Block_Editor_Context;
use WP_Block_Type_Registry;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ne propose certains blocs (le héros de l'accueil) que dans l'éditeur de la page
 * d'accueil : la page choisie dans Réglages › Lecture (« Une page statique »).
 *
 * Filtre `allowed_block_types_all`, après la liste blanche du socle
 * (`DisableBlocks`, priorité 10) : les blocs listés en sont retirés pour tout autre
 * contenu, et pour les éditeurs sans contenu (widgets, éditeur de site). Sans page
 * d'accueil statique, ils ne sont proposés nulle part.
 *
 * Seule l'insertion est concernée : un bloc déjà présent dans un autre contenu (page
 * d'accueil changée depuis, contenu collé) reste affiché et modifiable dans
 * l'éditeur, et rendu sur le site.
 */
final class FrontPageOnlyBlocks implements FeatureInterface {

    /**
     * @param string[] $blocks Blocs réservés à la page d'accueil.
     */
    public function __construct(
        private readonly array $blocks,
    ) {}

    /** Enregistre le filtre des blocs autorisés, après celui du socle. */
    public function register(): void {
        add_filter( 'allowed_block_types_all', [ $this, 'filter_blocks' ], 20, 2 );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Réserve le héros de l\'accueil à la page d\'accueil : il n\'est proposé dans l\'éditeur d\'aucun autre contenu.', 'couturier' );
    }

    /**
     * Retire les blocs réservés hors de la page d'accueil.
     *
     * @param bool|string[]           $allowed        Blocs autorisés (`true` = tous).
     * @param WP_Block_Editor_Context $editor_context Contexte de l'éditeur.
     * @return bool|string[]
     */
    public function filter_blocks( bool|array $allowed, WP_Block_Editor_Context $editor_context ): bool|array {
        if ( false === $allowed || $this->is_front_page( $editor_context ) ) {
            return $allowed;
        }

        // `true` : tous les blocs enregistrés, moins les blocs réservés.
        if ( true === $allowed ) {
            $allowed = array_keys( WP_Block_Type_Registry::get_instance()->get_all_registered() );
        }

        return array_values( array_diff( $allowed, $this->blocks ) );
    }

    /** L'éditeur ouvert est-il celui de la page d'accueil statique ? */
    private function is_front_page( WP_Block_Editor_Context $editor_context ): bool {
        $front_page_id = 'page' === get_option( 'show_on_front' ) ? (int) get_option( 'page_on_front' ) : 0;

        return $front_page_id > 0 && null !== $editor_context->post && $front_page_id === $editor_context->post->ID;
    }
}
