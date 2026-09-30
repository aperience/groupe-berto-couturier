<?php
/**
 * Provider des features de sécurité
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Providers;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Contracts\ServiceProviderInterface;
use Deefuse\ThemeCore\Features\Security\DisableApplicationPasswords;
use Deefuse\ThemeCore\Features\Security\DisableUserEnumeration;
use Deefuse\ThemeCore\Features\Security\DisableXmlRpc;
use Deefuse\ThemeCore\Features\Security\HideLoginErrors;
use Deefuse\ThemeCore\Features\Security\SecurityHeaders;
use Deefuse\ThemeCore\ThemeContext;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Regroupe le durcissement : réduction de la surface d'attaque et des informations
 * publiées sur l'installation — énumération des comptes, XML-RPC, erreurs de connexion,
 * accès à l'API REST.
 *
 * Domaine transverse, et non moment d'exécution : ces features touchent aussi bien le front
 * public que l'API REST, la page de connexion ou `xmlrpc.php`. Elles sont chargées juste
 * après `Setup`, avant que les autres providers n'ajoutent quoi que ce soit — ce qui suffit
 * pour désactiver un comportement du core, en place dès `default-filters.php`. Une feature
 * qui devrait retirer un hook posé par une autre feature du thème ferait exception : un
 * `remove_action()` sur un hook pas encore ajouté ne fait rien, et sans erreur.
 */
final class SecurityServiceProvider implements ServiceProviderInterface {

    /**
     * Features de durcissement
     *
     * @param ThemeContext $context Identité du thème.
     * @return FeatureInterface[]
     */
    public static function features( ThemeContext $context ): array {
        return [
            new DisableApplicationPasswords(),
            new DisableUserEnumeration(),
            new DisableXmlRpc(),
            new HideLoginErrors(),
            new SecurityHeaders(),
        ];
    }
}
