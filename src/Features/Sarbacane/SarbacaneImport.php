<?php
/**
 * Import de l'historique des formulaires dans Sarbacane
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
 * `/wp-admin/?sb_import=1` (administrateurs) : compte les soumissions
 * enregistrées, sans rien envoyer ; `?sb_import=run` les envoie toutes, par
 * lots de 500, de la plus ancienne à la plus récente.
 */
final class SarbacaneImport implements FeatureInterface {

    /** Taille d'un lot d'import. */
    private const BATCH = 500;

    /** Pose le hook admin_init. */
    public function register(): void {
        if ( ! function_exists( 'Ninja_Forms' ) || ! SarbacaneApi::is_configured() ) {
            return;
        }
        add_action( 'admin_init', [ $this, 'run' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Import des soumissions Ninja Forms déjà enregistrées dans Sarbacane : /wp-admin/?sb_import=1 (simulation), puis ?sb_import=run.', 'couturier' );
    }

    /**
     * Envoie un lot de contacts.
     *
     * @param string                            $list_id ID de la liste.
     * @param array<int, array<string, mixed>>  $batch   Contacts.
     */
    private function import_batch( string $list_id, array $batch ): void {
        $res = SarbacaneApi::request( 'POST', '/lists/' . rawurlencode( $list_id ) . '/contacts/import?upsert=true', $batch, $ok );
        SarbacaneApi::log( 'Import lot de ' . count( $batch ) . ' : ' . ( $ok ? wp_json_encode( $res ) : 'ECHEC' ) );
    }

    /** Simulation ou import, si demandé. */
    public function run(): void {
        if ( ! isset( $_GET['sb_import'] ) || ! current_user_can( 'manage_options' ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- repris du script client.
            return;
        }
        @set_time_limit( 900 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
        header( 'Content-Type: text/plain; charset=utf-8' );
        $run     = ( 'run' === $_GET['sb_import'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $list_id = $run ? SarbacaneApi::list_id() : null;
        if ( $run && ! $list_id ) {
            echo 'Liste KO';
            exit;
        }
        $total   = 0;
        $skipped = 0;
        $batch   = [];
        $out     = '';
        foreach ( Ninja_Forms()->form()->get_forms() as $form ) {
            $fid   = (int) $form->get_id();
            $title = $form->get_setting( 'title' );
            $fobjs = Ninja_Forms()->form( $fid )->get_fields();
            $subs  = Ninja_Forms()->form( $fid )->get_subs();
            $out  .= "NF-$fid $title : " . count( $subs ) . " soumissions\n";
            if ( ! $run ) {
                $total += count( $subs );
                continue;
            }
            $dated = [];
            foreach ( $subs as $sub ) {
                $ts      = strtotime( get_post_field( 'post_date_gmt', $sub->get_id() ) . ' UTC' );
                $dated[] = [ $ts ?: time(), $sub ];
            }
            usort( $dated, static fn( array $a, array $b ): int => $a[0] <=> $b[0] );
            foreach ( $dated as [ $ts, $sub ] ) {
                $fields = [];
                foreach ( $fobjs as $fo ) {
                    $s          = $fo->get_settings();
                    $s['value'] = $sub->get_field_value( $fo->get_id() );
                    $fields[]   = $s;
                }
                $c = SarbacaneContact::build( $list_id, $fid, $title, $fields, (int) $ts );
                if ( ! $c ) {
                    ++$skipped;
                    continue;
                }
                $batch[] = $c;
                ++$total;
                if ( count( $batch ) >= self::BATCH ) {
                    $this->import_batch( (string) $list_id, $batch );
                    $batch = [];
                }
            }
        }
        if ( $run && $batch ) {
            $this->import_batch( (string) $list_id, $batch );
        }
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- texte brut.
        echo $out . "\nTotal : $total" . ( $run ? " contacts envoyes, $skipped ignores (ni e-mail ni mobile)\n\n" . implode( "\n", array_slice( (array) get_option( 'sb_last_log', [] ), -15 ) ) : " soumissions (simulation, rien n'a ete envoye)" );
        exit;
    }
}
