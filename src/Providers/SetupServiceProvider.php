<?php
/**
 * Provider des features d'initialisation du thème
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Providers;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Contracts\ServiceProviderInterface;
use Deefuse\ThemeCore\Features\Setup\Menus;
use Deefuse\ThemeCore\Features\Setup\ThemeSupport;
use Deefuse\ThemeCore\Features\Setup\TwigDump;
use Deefuse\ThemeCore\ThemeContext;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Regroupe les features d'initialisation du thème
 * (supports de thème, menus, extensions Twig).
 *
 * Aucune feature d'internationalisation : WordPress enregistre lui-même le répertoire
 * des traductions du thème, depuis les en-têtes `Text Domain:` et `Domain Path:` de
 * style.css et avant même l'inclusion de functions.php
 * (cf. WP_Theme::load_textdomain(), appelé en wp-settings.php).
 */
final class SetupServiceProvider implements ServiceProviderInterface {

    /**
     * Features d'initialisation, chargées en premier
     *
     * @param ThemeContext $context Identité du thème.
     * @return FeatureInterface[]
     */
    public static function features( ThemeContext $context ): array {
        return [
            new ThemeSupport(
                extra_supports: [ 'responsive-embeds' ],
            ),
            new Menus(
                locations: static fn(): array => [
                    'primary'      => __( 'Menu principal', 'couturier' ),
                    'footer'       => __( 'Menu pied de page', 'couturier' ),
                    'legal'        => __( 'Liens légaux du pied de page', 'couturier' ),
                    // Mobile seulement, cf. Navigation\MegaMenu::QUICK_ACCESS.
                    'quick_access' => __( 'Accès rapides (menu mobile)', 'couturier' ),
                ],
            ),
            new TwigDump(),
        ];
    }
}
