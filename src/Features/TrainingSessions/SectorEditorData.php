<?php
/**
 * Sessions de formation : secteurs transmis à l'éditeur de blocs
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\TrainingSessions;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Transmet à l'éditeur de blocs la liste des secteurs, lue par
 * `blocks/_shared/sectors.js` (choix du secteur d'une session).
 *
 * La taxonomie n'est pas exposée à l'API REST (`SectorTaxonomy`) : la liste part
 * en script en ligne, `window.couturierSectors`, au chargement de l'éditeur. Un
 * secteur créé pendant l'édition d'une page n'y apparaît qu'au rechargement.
 */
final class SectorEditorData implements FeatureInterface {

    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre l'injection des données dans l'éditeur. */
    public function register(): void {
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Transmet la liste des secteurs à l\'éditeur de blocs, pour les choisir dans les sessions de formation.', 'couturier' );
    }

    /** Script en ligne, sans fichier, qui pose `window.couturierSectors`. */
    public function enqueue(): void {
        $handle = $this->context->handle( 'sectors' );

        wp_register_script( $handle, false, [], false, false ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters -- script en ligne, sans fichier.
        wp_enqueue_script( $handle );
        wp_add_inline_script( $handle, 'window.couturierSectors = ' . wp_json_encode( Sector::all(), JSON_UNESCAPED_UNICODE | JSON_HEX_TAG ) . ';' );
    }
}
