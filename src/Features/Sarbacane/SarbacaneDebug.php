<?php
/**
 * Diagnostic Sarbacane
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Sarbacane;

use Deefuse\ThemeCore\Contracts\FeatureInterface;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * `/wp-admin/?sb_debug=1` (administrateurs) : journal, liste et champs, en
 * texte brut. N'affiche jamais les clés.
 */
final class SarbacaneDebug implements FeatureInterface {

    /** Pose le hook admin_init. */
    public function register(): void {
        if ( ! function_exists( 'Ninja_Forms' ) || ! SarbacaneApi::is_configured() ) {
            return;
        }
        add_action( 'admin_init', [ $this, 'render' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Diagnostic Sarbacane sur /wp-admin/?sb_debug=1 : journal des envois, liste et champs.', 'couturier' );
    }

    /** Affiche le diagnostic si demandé. */
    public function render(): void {
        if ( ! isset( $_GET['sb_debug'] ) || ! current_user_can( 'manage_options' ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- lecture seule, repris du script client.
            return;
        }
        header( 'Content-Type: text/plain; charset=utf-8' );
        $lid = get_option( 'sb_main_list_id' );
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- texte brut.
        echo "JOURNAL :\n" . implode( "\n", (array) get_option( 'sb_last_log', [] ) ) . "\n\nLISTE : " . ( $lid ?: '(pas encore creee)' ) . "\nCHAMPS :\n" . ( $lid ? print_r( SarbacaneApi::fields( (string) $lid, true ), true ) : '' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
        exit;
    }
}
