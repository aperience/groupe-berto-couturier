<?php
/**
 * Retrait de la lettrine des paragraphes
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blocks;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use WP_Theme_JSON;
use WP_Theme_JSON_Data;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Retire l'interrupteur « Lettrine » du panneau Typographie de `core/paragraph`.
 *
 * **Ce n'est pas un support de bloc**, d'où son absence de
 * `DisableNativeBlockSupports` : le paragraphe lit le réglage global
 * `settings.typography.dropCap` de `theme.json`, activé par défaut dans celui du
 * core. Le thème n'ayant pas de `theme.json`, la valeur est surchargée dans la
 * couche « thème » des réglages, sur `wp_theme_json_data_theme` — appliqué aux
 * thèmes classiques comme aux thèmes à blocs.
 *
 * Un paragraphe déjà enregistré avec une lettrine garde sa classe
 * `has-drop-cap` : seule la saisie est coupée.
 */
final class DisableDropCap implements FeatureInterface {

    /** Enregistre la surcharge des réglages du thème. */
    public function register(): void {
        add_filter( 'wp_theme_json_data_theme', [ $this, 'disable_drop_cap' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Retire le réglage de lettrine des paragraphes dans l\'éditeur.', 'couturier' );
    }

    /**
     * Désactive `settings.typography.dropCap` dans les réglages du thème.
     *
     * @param WP_Theme_JSON_Data $theme_json Réglages de la couche thème.
     * @return WP_Theme_JSON_Data
     */
    public function disable_drop_cap( WP_Theme_JSON_Data $theme_json ): WP_Theme_JSON_Data {
        return $theme_json->update_with(
            [
                'version'  => WP_Theme_JSON::LATEST_SCHEMA,
                'settings' => [
                    'typography' => [ 'dropCap' => false ],
                ],
            ]
        );
    }
}
