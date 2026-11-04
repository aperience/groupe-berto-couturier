<?php
/**
 * Écran d'admin du header
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Navigation;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;
use Theme\Support\PageCache;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute au menu « Apparence » un écran « En-tête » : les deux actions de la barre,
 * hors menu WordPress — « Se connecter » (adresse de l'espace élève externe,
 * libellés desktop et mobile) et « Être rappelé » (page du site, libellé).
 *
 * **Settings API, ouverte aux éditeurs**, comme les écrans « Pied de page » et
 * « Offre du moment » : le filtre `option_page_capability_{groupe}` abaisse
 * l'exigence de `options.php` à `CAPABILITY` pour ce seul groupe de réglages.
 * Option autoloadée `couturier_header`, lue par `Header`.
 */
final class HeaderSettings implements FeatureInterface {

    /** Capability requise (éditeurs et administrateurs). */
    public const CAPABILITY = 'edit_others_pages';

    /** Groupe de réglages, transmis par le formulaire à `options.php`. */
    private const GROUP = 'couturier_header';

    /**
     * Réglages déjà nettoyés pendant la requête : à la première sauvegarde,
     * WordPress appelle le nettoyage deux fois (`update_option()` puis
     * `add_option()`), et chaque erreur s'afficherait en double.
     */
    private ?array $sanitized = null;

    /**
     * @param ThemeContext $context Identité du thème, pour le slug de l'écran.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre l'écran, le réglage et la purge du cache de page. */
    public function register(): void {
        add_action( 'admin_menu', [ $this, 'add_page' ] );
        add_action( 'admin_init', [ $this, 'register_setting' ] );

        // Le header est sur toutes les pages : son enregistrement vide le cache de page.
        add_action( 'add_option_' . Header::OPTION, [ PageCache::class, 'purge' ], 10, 0 );
        add_action( 'update_option_' . Header::OPTION, [ PageCache::class, 'purge' ], 10, 0 );
        add_filter( 'option_page_capability_' . self::GROUP, static fn(): string => self::CAPABILITY );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Écran « En-tête » : boutons « Se connecter » (espace élève) et « Être rappelé » (page du formulaire) de la barre du header.', 'couturier' );
    }

    /**
     * Ajoute l'écran au menu « Apparence » (visible des éditeurs, cf.
     * `FooterSettings::add_page()`).
     */
    public function add_page(): void {
        add_theme_page(
            __( 'En-tête', 'couturier' ),
            __( 'En-tête', 'couturier' ),
            self::CAPABILITY,
            $this->context->handle( Header::MENU_SLUG ),
            [ $this, 'render' ]
        );
    }

    /** Déclare l'option, autoloadée, et son nettoyage. */
    public function register_setting(): void {
        register_setting(
            self::GROUP,
            Header::OPTION,
            [
                'type'              => 'object',
                'sanitize_callback' => [ $this, 'sanitize' ],
                'show_in_rest'      => false,
                'autoload'          => true,
            ]
        );
    }

    /**
     * Nettoie les valeurs postées. Une adresse invalide ou une page non publiée est
     * retirée, et signalée par une erreur qui nomme le champ (WCAG 3.3.1).
     *
     * @param mixed $input Valeurs postées.
     * @return array{login_label: string, login_mobile_label: string, login_url: string, callback_label: string, callback_page_id: int}
     */
    public function sanitize( mixed $input ): array {
        if ( null !== $this->sanitized ) {
            return $this->sanitized;
        }

        $input   = is_array( $input ) ? $input : [];
        $raw_url = trim( (string) ( $input['login_url'] ?? '' ) );
        $url     = '' === $raw_url ? '' : esc_url_raw( $raw_url, [ 'http', 'https' ] );

        if ( '' !== $url && false === filter_var( $url, FILTER_VALIDATE_URL ) ) {
            $url = '';
        }

        if ( '' !== $raw_url && '' === $url ) {
            add_settings_error(
                Header::OPTION,
                'login_url',
                __( 'Se connecter : l\'adresse n\'est pas une adresse web valide (https://…), elle a été retirée.', 'couturier' )
            );
        }

        $page_id = absint( $input['callback_page_id'] ?? 0 );

        if ( 0 !== $page_id && ! Header::is_valid_page( $page_id ) ) {
            $page_id = 0;
            add_settings_error(
                Header::OPTION,
                'callback_page_id',
                __( 'Être rappelé : la page choisie n\'est pas publiée, elle a été retirée.', 'couturier' )
            );
        }

        return $this->sanitized = [
            'login_label'        => sanitize_text_field( (string) ( $input['login_label'] ?? '' ) ),
            'login_mobile_label' => sanitize_text_field( (string) ( $input['login_mobile_label'] ?? '' ) ),
            'login_url'          => $url,
            'callback_label'     => sanitize_text_field( (string) ( $input['callback_label'] ?? '' ) ),
            'callback_page_id'   => $page_id,
        ];
    }

    /** Affiche l'écran. */
    public function render(): void {
        if ( ! current_user_can( self::CAPABILITY ) ) {
            return;
        }

        $settings = Header::settings();
        $defaults = Header::default_labels();
        $name     = static fn( string $field ): string => Header::OPTION . '[' . $field . ']';

        echo '<div class="wrap">';
        echo '<h1>' . esc_html( get_admin_page_title() ) . '</h1>';

        // Notice verte après l'enregistrement : WordPress ne l'ajoute que sous Réglages.
        if ( isset( $_GET['settings-updated'] ) && 'true' === $_GET['settings-updated'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- simple affichage, posé par options.php.
            add_settings_error( Header::OPTION, 'settings_updated', __( 'Réglages enregistrés.', 'couturier' ), 'success' );
        }

        settings_errors( Header::OPTION );

        echo '<p>' . esc_html__( 'Boutons affichés à droite de la barre du header, sur toutes les pages. Un bouton sans adresse (ou sans page) n\'est pas affiché ; un libellé vide prend le texte grisé.', 'couturier' ) . '</p>';
        echo '<form method="post" action="options.php" novalidate="novalidate">';
        settings_fields( self::GROUP );

        // Se connecter.
        echo '<h2>' . esc_html__( 'Se connecter', 'couturier' ) . '</h2>';
        echo '<table class="form-table" role="presentation"><tbody>';
        $this->text_row( 'login_url', __( 'Adresse de l\'espace élève', 'couturier' ), $name( 'login_url' ), $settings['login_url'], 'https://…', __( 'Adresse complète de la plateforme (https://…).', 'couturier' ), 'url' );
        $this->text_row( 'login_label', __( 'Libellé (ordinateur)', 'couturier' ), $name( 'login_label' ), $settings['login_label'], $defaults['login_label'], __( 'Bouton de la barre du header, sur ordinateur.', 'couturier' ) );
        $this->text_row( 'login_mobile_label', __( 'Libellé (mobile)', 'couturier' ), $name( 'login_mobile_label' ), $settings['login_mobile_label'], $defaults['login_mobile_label'], __( 'Bouton en bas du menu mobile.', 'couturier' ) );
        echo '</tbody></table>';

        // Être rappelé.
        echo '<h2>' . esc_html__( 'Être rappelé', 'couturier' ) . '</h2>';
        echo '<table class="form-table" role="presentation"><tbody>';
        printf(
            '<tr><th scope="row"><label for="couturier-header-callback_page_id">%1$s</label></th><td>%2$s<p class="description" id="couturier-header-callback_page_id-description">%3$s</p></td></tr>',
            esc_html__( 'Page du formulaire de rappel', 'couturier' ),
            wp_dropdown_pages( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTML échappé par WordPress.
                [
                    'name'              => esc_attr( $name( 'callback_page_id' ) ),
                    'id'                => 'couturier-header-callback_page_id',
                    'selected'          => (int) $settings['callback_page_id'],
                    'show_option_none'  => esc_html__( '— Aucune —', 'couturier' ),
                    'option_none_value' => '0',
                    'post_status'       => 'publish',
                    'echo'              => 0,
                ]
            ),
            esc_html__( 'Page publiée qui contient le formulaire de rappel.', 'couturier' )
        );
        $this->text_row( 'callback_label', __( 'Libellé', 'couturier' ), $name( 'callback_label' ), $settings['callback_label'], $defaults['callback_label'], __( 'Bouton de la barre du header, sur ordinateur et mobile.', 'couturier' ) );
        echo '</tbody></table>';

        submit_button();
        echo '</form></div>';
    }

    /**
     * Ligne de formulaire à champ texte.
     *
     * @param string $type `text` ou `url` (champ texte, clavier d'adresse).
     */
    private function text_row( string $key, string $label, string $name, string $value, string $placeholder, string $help, string $type = 'text' ): void {
        $id = 'couturier-header-' . $key;

        printf(
            '<tr><th scope="row"><label for="%1$s">%2$s</label></th><td><input type="text" class="regular-text" id="%1$s" name="%3$s" value="%4$s" placeholder="%5$s" aria-describedby="%1$s-description"%6$s><p class="description" id="%1$s-description">%7$s</p></td></tr>',
            esc_attr( $id ),
            esc_html( $label ),
            esc_attr( $name ),
            esc_attr( $value ),
            esc_attr( $placeholder ),
            'url' === $type ? ' inputmode="url" spellcheck="false"' : '',
            esc_html( $help )
        );
    }
}
