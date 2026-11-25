<?php
/**
 * Onglet « Sarbacane » de la page d'aide
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Sarbacane;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Theme\Features\Admin\HelpScreen;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Explique la configuration (clés de wp-config.php, avec leur état ; liste
 * réglée sur la page « Sarbacane ») et
 * le fonctionnement de l'envoi des formulaires vers Sarbacane. Déclaré même
 * sans clés, pour expliquer comment les poser ; rien sans Ninja Forms.
 */
final class SarbacaneHelp implements FeatureInterface {

    /** Déclare l'onglet d'aide. */
    public function register(): void {
        add_filter( HelpScreen::TABS_FILTER, [ $this, 'help_tab' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Ajoute l\'onglet « Sarbacane » à la page d\'aide : configuration dans wp-config.php et fonctionnement de l\'envoi des formulaires.', 'couturier' );
    }

    /**
     * Ajoute l'onglet « Sarbacane », si Ninja Forms est actif.
     *
     * @param array<string, array<string, mixed>> $tabs Onglets déclarés.
     * @return array<string, array<string, mixed>>
     */
    public function help_tab( array $tabs ): array {
        if ( ! function_exists( 'Ninja_Forms' ) ) {
            return $tabs;
        }

        $tabs['sarbacane'] = [
            'label'    => __( 'Sarbacane', 'couturier' ),
            'priority' => 27,
            'context'  => [
                'constants'    => [
                    'SARBACANE_ACCOUNT_ID' => defined( 'SARBACANE_ACCOUNT_ID' ) && '' !== (string) SARBACANE_ACCOUNT_ID,
                    'SARBACANE_API_KEY'    => defined( 'SARBACANE_API_KEY' ) && '' !== (string) SARBACANE_API_KEY,
                ],
                'configured'   => SarbacaneApi::is_configured(),
                'list_name'    => SarbacaneApi::list_name(),
                'default_list' => SarbacaneApi::DEFAULT_LIST,
                'excluded'     => SarbacaneContact::EXCLUDE,
                'is_admin'     => current_user_can( 'manage_options' ),
                'page_url'     => admin_url( 'admin.php?page=couturier-' . SarbacaneAdminPage::MENU_SLUG ),
            ],
        ];

        return $tabs;
    }
}
