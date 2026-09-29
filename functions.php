<?php
/**
 * Fonctions du thème Couturier
 *
 * @package Couturier
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Autoloader Composer — vendor/ est gitignoré, il est généré au déploiement.
$theme_autoload = __DIR__ . '/vendor/autoload.php';

if ( ! is_readable( $theme_autoload ) ) {
    wp_die(
        wp_kses_post(
            sprintf(
                /* translators: %s : commande à exécuter. */
                __( 'Les dépendances du thème Couturier sont absentes. Exécuter %s à la racine du thème.', 'couturier' ),
                '<code>composer install</code>'
            )
        ),
        esc_html__( 'Thème Couturier — dépendances manquantes', 'couturier' )
    );
}

require_once $theme_autoload;

/*
 * Composition du thème : son identité, puis les providers dans leur ordre de
 * chargement. Setup initialise, Security durcit, Front et Admin couvrent les deux
 * faces du site, Seo termine. Retirer un provider de cette liste éteint toutes ses
 * features d'un coup.
 */
\Deefuse\ThemeCore\Kernel::boot(
    new \Deefuse\ThemeCore\ThemeContext( slug: 'couturier' ),
    [
        \Theme\Providers\SetupServiceProvider::class,
        \Theme\Providers\SecurityServiceProvider::class,
        \Theme\Providers\FrontServiceProvider::class,
        \Theme\Providers\AdminServiceProvider::class,
        \Theme\Providers\SeoServiceProvider::class,
    ]
);
