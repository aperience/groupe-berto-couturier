<?php
/**
 * Page « Sarbacane » de l'administration
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Sarbacane;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;
use Timber\Timber;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Menu « Sarbacane » (administrateurs) : nom de la liste visée, état des clés,
 * diagnostic (journal, liste, champs), simulation de l'import et import réel
 * (POST protégé par un nonce, compte rendu affiché au retour). Sans clés ou
 * sans Ninja Forms, la page n'affiche que la configuration.
 */
final class SarbacaneAdminPage implements FeatureInterface {

    /** Capacité requise. */
    private const CAPABILITY = 'manage_options';

    /** Groupe de réglages. */
    private const GROUP = 'couturier_sarbacane';

    /** Slug de la page (préfixé par le thème). */
    public const MENU_SLUG = 'sarbacane';

    /** Action admin-post de l'import réel. */
    private const IMPORT_ACTION = 'couturier_sarbacane_import';

    /** Transient du compte rendu de l'import (suffixé par l'utilisateur). */
    private const IMPORT_RESULT = 'couturier_sarbacane_import_';

    /** Position dans le menu. */
    private const MENU_POSITION = 58;

    /**
     * @param ThemeContext $context Identité du thème, pour le slug de la page.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Pose les hooks de la page et du réglage. */
    public function register(): void {
        add_action( 'admin_menu', [ $this, 'add_page' ] );
        add_action( 'admin_init', [ $this, 'register_setting' ] );
        add_filter( 'option_page_capability_' . self::GROUP, static fn(): string => self::CAPABILITY );
        add_action( 'admin_post_' . self::IMPORT_ACTION, [ $this, 'handle_import' ] );
    }

    /** Import réel : droits, nonce, envoi, puis retour sur la page avec le compte rendu. */
    public function handle_import(): void {
        if ( ! current_user_can( self::CAPABILITY ) ) {
            wp_die( esc_html__( 'Accès refusé.', 'couturier' ), 403 );
        }
        check_admin_referer( self::IMPORT_ACTION );
        $result = function_exists( 'Ninja_Forms' ) && SarbacaneApi::is_configured()
            ? SarbacaneImport::run()
            : __( 'Import impossible : clés Sarbacane ou Ninja Forms absents.', 'couturier' );
        set_transient( self::IMPORT_RESULT . get_current_user_id(), $result, HOUR_IN_SECONDS );
        wp_safe_redirect( admin_url( 'admin.php?page=' . $this->context->handle( self::MENU_SLUG ) . '#sb-import' ) );
        exit;
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Ajoute la page « Sarbacane » : liste visée, diagnostic des envois, simulation et import de l\'historique.', 'couturier' );
    }

    /** Ajoute la page au menu principal. */
    public function add_page(): void {
        add_menu_page(
            __( 'Sarbacane', 'couturier' ),
            __( 'Sarbacane', 'couturier' ),
            self::CAPABILITY,
            $this->context->handle( self::MENU_SLUG ),
            [ $this, 'render' ],
            'dashicons-email-alt',
            self::MENU_POSITION
        );
    }

    /** Déclare l'option du nom de la liste. */
    public function register_setting(): void {
        register_setting(
            self::GROUP,
            SarbacaneApi::LIST_OPTION,
            [
                'type'              => 'string',
                'sanitize_callback' => static fn( mixed $v ): string => sanitize_text_field( (string) $v ),
                'show_in_rest'      => false,
                'default'           => '',
            ]
        );
    }

    /** Affiche la page. */
    public function render(): void {
        if ( ! current_user_can( self::CAPABILITY ) ) {
            return;
        }
        $active = function_exists( 'Ninja_Forms' ) && SarbacaneApi::is_configured();

        ob_start();
        settings_fields( self::GROUP );
        $settings_fields = (string) ob_get_clean();

        $context = [
            'settings_fields' => $settings_fields,
            'option'          => SarbacaneApi::LIST_OPTION,
            'list_value'      => (string) get_option( SarbacaneApi::LIST_OPTION, '' ),
            'list_name'       => SarbacaneApi::list_name(),
            'default_list'    => SarbacaneApi::DEFAULT_LIST,
            'keys'            => [
                'SARBACANE_ACCOUNT_ID' => defined( 'SARBACANE_ACCOUNT_ID' ) && '' !== (string) SARBACANE_ACCOUNT_ID,
                'SARBACANE_API_KEY'    => defined( 'SARBACANE_API_KEY' ) && '' !== (string) SARBACANE_API_KEY,
            ],
            'ninja_forms'     => function_exists( 'Ninja_Forms' ),
            'active'          => $active,
        ];

        if ( $active ) {
            $lid                   = (string) get_option( 'sb_main_list_id', '' );
            $context['log']        = (array) get_option( 'sb_last_log', [] );
            $context['list_id']    = get_option( 'sb_main_list_name' ) === SarbacaneApi::list_name() ? $lid : '';
            $context['fields']     = '' !== $context['list_id'] ? SarbacaneApi::fields( $lid, true ) : [];
            $context['simulation'] = SarbacaneImport::simulate();
            $context['import_url'] = admin_url( 'admin-post.php' );
            $context['import_action'] = self::IMPORT_ACTION;
            $context['import_nonce'] = wp_nonce_field( self::IMPORT_ACTION, '_wpnonce', true, false );
        }

        $key = self::IMPORT_RESULT . get_current_user_id();
        $context['import_result'] = get_transient( $key ) ?: '';
        delete_transient( $key );

        echo Timber::compile( 'admin/sarbacane.twig', $context ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- gabarit Twig, échappement automatique.
    }
}
