<?php
/**
 * Provider des features d'administration
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Providers;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Contracts\ServiceProviderInterface;
use Deefuse\ThemeCore\Features\Admin\AdminColorScheme;
use Deefuse\ThemeCore\Features\Admin\AdminFooter;
use Deefuse\ThemeCore\Features\Admin\ConvertUploadsToWebp;
use Deefuse\ThemeCore\Features\Admin\EditorStyles;
use Deefuse\ThemeCore\Features\Admin\LoginBranding;
use Deefuse\ThemeCore\Features\Admin\ShowHidePageTitle;
use Deefuse\ThemeCore\Features\Admin\SvgSupport;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableAdminBar;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableBlocks;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableComment;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableConnectors;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableDefaultDashboardWidgets;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableLockAppearanceTools;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableLoginLanguageDropdown;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableNativeBlockSupports;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableSiteIcon;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableUpdates;
use Deefuse\ThemeCore\ThemeContext;
use Theme\Features\Blocks\BlockLoader;
use Theme\Features\Blocks\RestrictHeadingLevels;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Regroupe les features du back-office : réglages admin, éditeur Gutenberg,
 * enregistrement des blocs et des CPT, désactivation des fonctionnalités inutiles.
 */
final class AdminServiceProvider implements ServiceProviderInterface
{

    /**
     * Features d'administration
     *
     * @param ThemeContext $context Identité du thème.
     * @return FeatureInterface[]
     */
    public static function features(ThemeContext $context): array
    {
        return [
            new DisableAdminBar(),
            new BlockLoader(),
            new DisableBlocks(
                block_namespace: $context->block_namespace,
                allowed_blocks: [
                    'core/paragraph',
                    'core/heading',
                    'core/list',
                    'core/list-item',
                    'core/embed',
                ]
            ),
            new DisableComment(),
            new DisableConnectors(),
            new DisableDefaultDashboardWidgets(),
            new DisableLockAppearanceTools(),
            new DisableLoginLanguageDropdown(),
            new DisableNativeBlockSupports(),
            new RestrictHeadingLevels($context),
            new DisableSiteIcon(),
            new DisableUpdates(allow_minor_core: true),
            new AdminColorScheme(
                scheme: $context->slug,
                label: 'Couturier',
                // Doublent les variables de resources/scss/_brand.scss : Sass ne peut pas
                // les exposer à PHP. Les deux fichiers se modifient ensemble, à l'étape charte.
                palette: ['#212529', '#343a40', '#0d6efd', '#dc3545'],
                icon_colors: [
                    'base'    => '#adb5bd',
                    'focus'   => '#fff',
                    'current' => '#fff',
                ],
            ),
            new AdminFooter(
                agency_name: 'Aperience',
                agency_url: 'https://www.aperience.com',
                agency_desc: '',
            ),
            new EditorStyles(),
            new LoginBranding($context),
            new ShowHidePageTitle($context),
            new SvgSupport(),
            new ConvertUploadsToWebp(),
        ];
    }
}
