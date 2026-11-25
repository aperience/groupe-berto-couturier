<?php
/**
 * Provider des features marketing
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Providers;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Contracts\ServiceProviderInterface;
use Deefuse\ThemeCore\ThemeContext;
use Theme\Features\CurrentOffer\CurrentOfferContext;
use Theme\Features\CurrentOffer\CurrentOfferDashboard;
use Theme\Features\CurrentOffer\CurrentOfferPageCache;
use Theme\Features\CurrentOffer\CurrentOfferSettings;
use Theme\Features\Sarbacane\SarbacaneAdminPage;
use Theme\Features\Sarbacane\SarbacaneHelp;
use Theme\Features\Sarbacane\SarbacaneSubmission;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Regroupe les features de mise en avant commerciale : l'offre du moment, et l'envoi des formulaires vers Sarbacane.
 *
 * C'est un domaine transverse, et non un moment d'exécution. Une même mise en avant
 * se gère dans l'admin, s'affiche sur le front et se purge depuis WP-Cron : ses
 * classes restent donc ensemble ici, plutôt que réparties entre Admin et Front.
 */
final class MarketingServiceProvider implements ServiceProviderInterface {

    /**
     * Features marketing
     *
     * @param ThemeContext $context Identité du thème.
     * @return FeatureInterface[]
     */
    public static function features( ThemeContext $context ): array {
        return [
            new CurrentOfferSettings( $context ),
            new CurrentOfferDashboard( $context ),
            new CurrentOfferContext(),
            new CurrentOfferPageCache(),
            new SarbacaneSubmission(),
            new SarbacaneAdminPage( $context ),
            new SarbacaneHelp(),
        ];
    }
}
