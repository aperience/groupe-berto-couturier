<?php
/**
 * Provider des features SEO
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Providers;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Contracts\ServiceProviderInterface;
use Deefuse\ThemeCore\Features\Seo\DocumentTitle;
use Deefuse\ThemeCore\Features\Seo\MetaDescription;
use Deefuse\ThemeCore\Features\Seo\OpenGraph;
use Deefuse\ThemeCore\Features\Seo\SeoPanel;
use Deefuse\ThemeCore\Features\Seo\SitemapExclusion;
use Deefuse\ThemeCore\ThemeContext;
use Theme\Features\StructuredData\FaqStructuredData;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Regroupe les features SEO : balises meta, Open Graph,
 * données structurées Schema.org, sitemap, analytics.
 */
final class SeoServiceProvider implements ServiceProviderInterface {

    /**
     * Features SEO
     *
     * @param ThemeContext $context Identité du thème.
     * @return FeatureInterface[]
     */
    public static function features( ThemeContext $context ): array {
        return [
            new DocumentTitle(
                separator: '-'
            ),
            new MetaDescription(),
            new SitemapExclusion(),
            new SeoPanel( $context ),
            new OpenGraph(),
            // Blocs « Questions fréquentes » → FAQPage dans le JSON-LD de Rank Math.
            new FaqStructuredData(),
        ];
    }
}
