<?php
/**
 * Blocs réservés à la page d'accueil, ou exclus de celle-ci
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
 * Restreint l'insertion de certains blocs selon la page éditée, par rapport à la
 * page d'accueil (la page choisie dans Réglages › Lecture, « Une page statique ») :
 *
 * - `front_page_only` : proposés dans l'éditeur de la seule page d'accueil (héros de
 *   l'accueil) ; sans page d'accueil statique, nulle part ;
 * - `not_on_front_page` : proposés partout sauf dans la page d'accueil (héros des
 *   pages intérieures), billets et autres contenus compris.
 *
 * Filtre `allowed_block_types_all`, après la liste blanche du socle
 * (`DisableBlocks`, priorité 10). Les éditeurs sans contenu (widgets, éditeur de
 * site) ne proposent aucun de ces blocs.
 *
 * Seule l'insertion est concernée : un bloc déjà présent (page d'accueil changée
 * depuis, contenu collé) reste affiché et modifiable dans l'éditeur, et rendu sur
 * le site.
 */
final class PageScopedBlocks implements FeatureInterface {

    /**
     * @param string[] $front_page_only   Blocs réservés à la page d'accueil.
     * @param string[] $not_on_front_page Blocs exclus de la page d'accueil.
     */
    public function __construct(
        private readonly array $front_page_only = [],
        private readonly array $not_on_front_page = [],
    ) {}

    /** Enregistre le filtre des blocs autorisés, après celui du socle. */
    public function register(): void {
        add_filter( 'allowed_block_types_all', [ $this, 'filter_blocks' ], 20, 2 );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Réserve le héros de l\'accueil à la page d\'accueil, et propose le héros de page partout ailleurs.', 'couturier' );
    }

    /**
     * Retire les blocs qui n'ont pas leur place dans le contenu édité.
     *
     * @param bool|string[]           $allowed        Blocs autorisés (`true` = tous).
     * @param WP_Block_Editor_Context $editor_context Contexte de l'éditeur.
     * @return bool|string[]
     */
    public function filter_blocks( bool|array $allowed, WP_Block_Editor_Context $editor_context ): bool|array {
        if ( false === $allowed ) {
            return $allowed;
        }

        $removed = match ( true ) {
            null === $editor_context->post         => [ ...$this->front_page_only, ...$this->not_on_front_page ],
            $this->is_front_page( $editor_context ) => $this->not_on_front_page,
            default                                 => $this->front_page_only,
        };

        if ( ! $removed ) {
            return $allowed;
        }

        // `true` : tous les blocs enregistrés, moins les blocs retirés.
        if ( true === $allowed ) {
            $allowed = array_keys( WP_Block_Type_Registry::get_instance()->get_all_registered() );
        }

        return array_values( array_diff( $allowed, $removed ) );
    }

    /** L'éditeur ouvert est-il celui de la page d'accueil statique ? */
    private function is_front_page( WP_Block_Editor_Context $editor_context ): bool {
        $front_page_id = 'page' === get_option( 'show_on_front' ) ? (int) get_option( 'page_on_front' ) : 0;

        return $front_page_id > 0 && null !== $editor_context->post && $front_page_id === $editor_context->post->ID;
    }
}
