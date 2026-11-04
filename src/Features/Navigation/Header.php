<?php
/**
 * Header : lecture des réglages des actions
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Navigation;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Logique sans hook des réglages du header (écran Apparence › En-tête,
 * `HeaderSettings`) : option, valeurs par défaut, actions prêtes à afficher.
 *
 * - « Se connecter » : lien vers l'espace élève externe (adresse saisie) ;
 *   libellé desktop et libellé mobile (« Se connecter à son espace »).
 * - « Être rappelé » : lien vers une page publiée du site (formulaire de rappel).
 *
 * Une action sans adresse (ou sans page publiée) n'est pas affichée ; un libellé
 * vide prend sa valeur par défaut.
 */
final class Header {

    /** Option stockant les réglages du header. */
    public const OPTION = 'couturier_header';

    /** Slug de l'écran de réglages, préfixé par `ThemeContext::handle()`. */
    public const MENU_SLUG = 'header';

    /** Valeurs par défaut des champs. */
    private const DEFAULTS = [
        'login_label'        => '',
        'login_mobile_label' => '',
        'login_url'          => '',
        'callback_label'     => '',
        'callback_page_id'   => 0,
    ];

    /**
     * Réglages enregistrés, complétés des valeurs par défaut.
     *
     * @return array{login_label: string, login_mobile_label: string, login_url: string, callback_label: string, callback_page_id: int}
     */
    public static function settings(): array {
        $stored = get_option( self::OPTION, [] );

        return array_merge( self::DEFAULTS, is_array( $stored ) ? array_intersect_key( $stored, self::DEFAULTS ) : [] );
    }

    /**
     * Libellés par défaut, affichés en grisé dans les champs vides.
     *
     * @return array{login_label: string, login_mobile_label: string, callback_label: string}
     */
    public static function default_labels(): array {
        return [
            'login_label'        => __( 'Se connecter', 'couturier' ),
            'login_mobile_label' => __( 'Se connecter à son espace', 'couturier' ),
            'callback_label'     => __( 'Être rappelé', 'couturier' ),
        ];
    }

    /**
     * Actions à afficher, `null` pour celles qui ne sont pas réglées :
     * `{ login: { label, mobile_label, url }, callback: { label, url, current } }`.
     *
     * @return array{login: ?array{label: string, mobile_label: string, url: string}, callback: ?array{label: string, url: string, current: bool}}
     */
    public static function actions(): array {
        $settings = self::settings();
        $defaults = self::default_labels();
        $label    = static fn( string $key ): string => '' !== $settings[ $key ] ? (string) $settings[ $key ] : $defaults[ $key ];
        $page_id  = (int) $settings['callback_page_id'];

        return [
            'login'    => '' === $settings['login_url'] ? null : [
                'label'        => $label( 'login_label' ),
                'mobile_label' => $label( 'login_mobile_label' ),
                'url'          => (string) $settings['login_url'],
            ],
            'callback' => ! self::is_valid_page( $page_id ) ? null : [
                'label'   => $label( 'callback_label' ),
                'url'     => (string) get_permalink( $page_id ),
                'current' => is_page( $page_id ),
            ],
        ];
    }

    /** La page existe et est publiée. */
    public static function is_valid_page( int $page_id ): bool {
        return $page_id > 0 && 'page' === get_post_type( $page_id ) && 'publish' === get_post_status( $page_id );
    }
}
