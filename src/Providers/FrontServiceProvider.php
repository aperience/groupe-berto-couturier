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
use Theme\Features\Blog\BlogContext;
use Theme\Features\Blog\CategoryImage;
use Theme\Features\Blog\HeroThumbnail;
use Theme\Features\Blog\ReadingTime;
use Theme\Features\Footer\FooterContext;
use Theme\Features\Fonts\FontPreload;
use Theme\Features\Footer\FooterSettings;
use Theme\Features\Navigation\HeaderSettings;
use Theme\Features\Navigation\MegaMenuFields;
use Theme\Features\Navigation\NavigationContext;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Regroupe les features front-end : assets, nettoyage du <head>,
 * optimisations et désactivations côté public, pied de page et méga menu (leurs
 * réglages d'admin n'existent que pour eux : chaque feature reste entière ici).
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
                theme_color_light: '#004e63',
                theme_color_dark: '#004e63',
            ),
            // Polices du header, donc en haut de toutes les pages : texte (400), menu
            // (500), « Être rappelé » (700). À revoir si le haut des pages change
            // (titre du héros en Red Hat Display, par exemple).
            new FontPreload(
                fonts: [
                    'resources/fonts/space-grotesk-400.woff2',
                    'resources/fonts/space-grotesk-500.woff2',
                    'resources/fonts/space-grotesk-700.woff2',
                ],
            ),
            // Header avant pied de page : leurs écrans s'ajoutent à Apparence dans cet
            // ordre (« En-tête », puis « Pied de page »).
            new MegaMenuFields(),
            new HeaderSettings( $context ),
            new NavigationContext(),
            new FooterSettings( $context ),
            new FooterContext(),
            new HeroThumbnail(),
            new ReadingTime(),
            new BlogContext(),
            new CategoryImage(),
        ];
    }
}
