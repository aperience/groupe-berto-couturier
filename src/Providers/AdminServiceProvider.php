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
use Theme\Features\Admin\HelpScreen;
use Theme\Features\Admin\NavMenuDropdowns;
use Theme\Features\Admin\NestedPagesLinks;
use Theme\Features\Blocks\BlockImageSizes;
use Theme\Features\Blocks\BlockLoader;
use Theme\Features\Blocks\AttachedBlocks;
use Theme\Features\Blocks\ButtonStyles;
use Theme\Features\Blocks\DisableCorePatterns;
use Theme\Features\Blocks\DisableDropCap;
use Theme\Features\Blocks\PageScopedBlocks;
use Theme\Features\Blocks\RestrictHeadingLevels;
use Theme\Features\Contacts\ContactEditorData;
use Theme\Features\Contacts\ContactMetaBox;
use Theme\Features\Contacts\ContactPageCache;
use Theme\Features\Contacts\ContactPostType;

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
                    'core/buttons',
                    'core/button',
                ]
            ),
            new DisableComment(),
            new DisableConnectors(),
            new DisableDefaultDashboardWidgets(),
            new NestedPagesLinks($context),
            new NavMenuDropdowns($context),
            new HelpScreen($context),
            new DisableLockAppearanceTools(),
            new DisableLoginLanguageDropdown(),
            new DisableLoginPrivacyPolicyLink(),
            new DisableNativeBlockSupports(),
            new DisableDropCap(),
            new DisableCorePatterns(),
            new DisablePostByEmail(),
            new RestrictHeadingLevels(
                $context,
                // Les héros (accueil, pages) portent le <h1> de la page (titre imbriqué niveau 1).
                exempt_parents: [
                    $context->block_namespace . '/home-hero',
                    $context->block_namespace . '/page-hero',
                ],
            ),
            // Héros (et leur <h1>) : celui de l'accueil dans la page d'accueil seule,
            // celui des pages partout ailleurs.
            new PageScopedBlocks(
                front_page_only: [ $context->block_namespace . '/home-hero' ],
                not_on_front_page: [ $context->block_namespace . '/page-hero' ],
            ),
            new ButtonStyles($context),
            new AttachedBlocks($context),
            new BlockImageSizes(),
            // Contacts prédéfinis, choisis dans les héros (menu « Contacts »).
            new ContactPostType(),
            new ContactMetaBox(),
            new ContactEditorData($context),
            new ContactPageCache(),
            new DisableSiteIcon(),
            new DisableUpdateServices(),
            new DisableUpdates(allow_minor_core: true),
            new AdminColorScheme(
                scheme: $context->slug,
                label: 'Couturier',
                // Doublent les variables de resources/scss/_brand.scss : Sass ne peut pas
                // les exposer à PHP. Les deux fichiers se modifient ensemble.
                // Pastilles : menu et barre d'admin, sous-menus, accent, survol des sous-menus.
                palette: ['#003b4a', '#004e63', '#ba4e27', '#f8c5a0'],
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
