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
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableLoginPrivacyPolicyLink;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableNativeBlockSupports;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisablePostByEmail;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableSiteIcon;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableUpdateServices;
use Deefuse\ThemeCore\Features\Admin\DisableFunctionalities\DisableUpdates;
use Deefuse\ThemeCore\ThemeContext;
use Theme\Features\Admin\NestedPagesLinks;
use Theme\Features\Blocks\BlockLoader;
use Theme\Features\Blocks\DisableDropCap;
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
                ]
            ),
            new DisableComment(),
            new DisableConnectors(),
            new DisableDefaultDashboardWidgets(),
            new NestedPagesLinks($context),
            new DisableLockAppearanceTools(),
            new DisableLoginLanguageDropdown(),
            new DisableLoginPrivacyPolicyLink(),
            new DisableNativeBlockSupports(),
            new DisableDropCap(),
            new DisablePostByEmail(),
            new RestrictHeadingLevels($context),
            new DisableSiteIcon(),
            new DisableUpdateServices(),
            new DisableUpdates(allow_minor_core: true),
            new AdminColorScheme(
                scheme: $context->slug,
                label: 'Couturier',
                // Doublent les variables de resources/scss/_brand.scss : Sass ne peut pas
                // les exposer à PHP. Les deux fichiers se modifient ensemble.
                palette: ['#004e63', '#003b4a', '#ba4e27', '#ff6b35'],
                icon_colors: [
                    'base'    => '#bfd3d8',
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
