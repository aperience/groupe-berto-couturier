<?php
/**
 * Retrait des compositions de WordPress et du Pattern Directory
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blocks;

use Deefuse\ThemeCore\Contracts\FeatureInterface;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Retire de l'inserteur les compositions qui ne viennent pas du projet :
 *
 * - celles du cœur (`core/query-*`, `core/navigation-overlay*`…), par le retrait
 *   du support `core-block-patterns` sur `after_setup_theme`, avant leur
 *   enregistrement sur `init` ;
 * - celles du Pattern Directory de wordpress.org, chargées à distance, par le
 *   filtre `should_load_remote_block_patterns` (compositions du cœur, mises en
 *   avant et déclarées par `theme.json`).
 *
 * La liste blanche de blocs (`DisableBlocks`) en masquait déjà presque toutes ;
 * ne passaient que des compositions réduites à un titre, en double et en
 * anglais. Restent les compositions du thème (`patterns/`) et celles créées
 * dans l'éditeur.
 */
final class DisableCorePatterns implements FeatureInterface {

    /** Enregistre le retrait du support et coupe le chargement distant. */
    public function register(): void {
        add_action( 'after_setup_theme', [ $this, 'remove_core_patterns' ] );
        add_filter( 'should_load_remote_block_patterns', '__return_false' );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Retire de l\'éditeur les compositions de WordPress et du répertoire de wordpress.org.', 'couturier' );
    }

    /** Retire le support des compositions du cœur. */
    public function remove_core_patterns(): void {
        remove_theme_support( 'core-block-patterns' );
    }
}
