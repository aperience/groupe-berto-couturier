<?php
/**
 * Provider des features front-end
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Providers;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Contracts\ServiceProviderInterface;
use Deefuse\ThemeCore\Features\Front\Assets;
use Deefuse\ThemeCore\Features\Front\CleanHead;
use Deefuse\ThemeCore\Features\Front\DisableFunctionalities\DisableBlockStyles;
use Deefuse\ThemeCore\Features\Front\DisableFunctionalities\DisableDashicons;
use Deefuse\ThemeCore\Features\Front\DisableFunctionalities\DisableEmojis;
use Deefuse\ThemeCore\Features\Front\DisableFunctionalities\DisableHeartbeat;
use Deefuse\ThemeCore\Features\Front\Favicons;
use Deefuse\ThemeCore\ThemeContext;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Regroupe les features front-end : assets, nettoyage du <head>,
 * optimisations et désactivations côté public.
 */
final class FrontServiceProvider implements ServiceProviderInterface {

    /**
     * Features front-end
     *
     * @param ThemeContext $context Identité du thème.
     * @return FeatureInterface[]
     */
    public static function features( ThemeContext $context ): array {
        return [
            new Assets( $context ),
            new CleanHead(),
            new DisableBlockStyles(),
            new DisableDashicons(),
            new DisableEmojis(),
            new DisableHeartbeat(),
            new Favicons(
                // Doublent resources/scss/_brand.scss et bin/favicons.config.mjs :
                // les trois se modifient ensemble à l'étape charte.
                theme_color_light: '#0a3c6e',
                theme_color_dark: '#0a3c6e',
            ),
        ];
    }
}
