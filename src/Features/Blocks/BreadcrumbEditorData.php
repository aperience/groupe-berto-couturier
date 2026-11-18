<?php
/**
 * Fil d'Ariane : données de l'aperçu dans l'éditeur de blocs
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blocks;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Transmet à l'éditeur le titre de la page des articles, que l'aperçu du fil
 * d'Ariane du héros de page (`blocks/page-hero/index.js`) place dans le fil des
 * billets, comme Rank Math sur le front.
 *
 * Les réglages du site (`page_for_posts`) ne sont lisibles par l'API REST que par
 * les administrateurs : le titre part en script en ligne,
 * `window.couturierBreadcrumb`, au chargement de l'éditeur.
 */
final class BreadcrumbEditorData implements FeatureInterface {

    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre l'injection des données dans l'éditeur. */
    public function register(): void {
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Transmet à l\'éditeur de blocs le titre de la page des articles, pour l\'aperçu du fil d\'Ariane des billets.', 'couturier' );
    }

    /** Script en ligne, sans fichier, qui pose `window.couturierBreadcrumb`. */
    public function enqueue(): void {
        $blog_id = (int) get_option( 'page_for_posts' );
        $data    = [
            'blogTitle' => $blog_id && 'publish' === get_post_status( $blog_id ) ? get_the_title( $blog_id ) : '',
        ];

        $handle = $this->context->handle( 'breadcrumb' );

        wp_register_script( $handle, false, [], false, false ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters -- script en ligne, sans fichier.
        wp_enqueue_script( $handle );
        wp_add_inline_script( $handle, 'window.couturierBreadcrumb = ' . wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG ) . ';' );
    }
}
