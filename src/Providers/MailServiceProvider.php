<?php
/**
 * Provider des features d'e-mail
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Providers;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Contracts\ServiceProviderInterface;
use Deefuse\ThemeCore\ThemeContext;
use Theme\Features\Mail\HtmlEmails;

/**
 * Regroupe les features d'e-mail : forme des messages envoyés par `wp_mail()`.
 *
 * Domaine transverse, et non moment d'exécution : un e-mail part aussi bien du front
 * que de l'admin, de wp-login.php, de WP-Cron ou de WP-CLI.
 */
final class MailServiceProvider implements ServiceProviderInterface {

    /**
     * Features d'e-mail
     *
     * @param ThemeContext $context Identité du thème.
     * @return FeatureInterface[]
     */
    public static function features( ThemeContext $context ): array {
        return [
            new HtmlEmails(),
        ];
    }
}
