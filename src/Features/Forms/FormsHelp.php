<?php
/**
 * Onglet « Formulaires » de la page d'aide
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Forms;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Theme\Features\Admin\HelpScreen;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Explique aux éditeurs la mise en page des formulaires Ninja Forms propre au
 * thème : champs côte à côte sur deux colonnes (classe `one-half`, cf.
 * `resources/scss/partials/_ninja-forms.scss`). Rien n'est déclaré si
 * l'extension n'est pas active.
 */
final class FormsHelp implements FeatureInterface {

    /** Déclare l'onglet d'aide. */
    public function register(): void {
        add_filter( HelpScreen::TABS_FILTER, [ $this, 'help_tab' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Ajoute l\'onglet « Formulaires » à la page d\'aide : mise en page des formulaires Ninja Forms sur deux colonnes.', 'couturier' );
    }

    /**
     * Ajoute l'onglet « Formulaires », si Ninja Forms est actif.
     *
     * @param array<string, array<string, mixed>> $tabs Onglets déclarés.
     * @return array<string, array<string, mixed>>
     */
    public function help_tab( array $tabs ): array {
        if ( ! function_exists( 'Ninja_Forms' ) ) {
            return $tabs;
        }

        $tabs['forms'] = [
            'label'    => __( 'Formulaires', 'couturier' ),
            'priority' => 25,
            'context'  => [
                'forms_url' => admin_url( 'admin.php?page=ninja-forms' ),
            ],
        ];

        return $tabs;
    }
}
