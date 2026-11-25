<?php
/**
 * Envoi en direct des formulaires vers Sarbacane
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
 * Envoie chaque soumission Ninja Forms (tous les formulaires) à la liste
 * Sarbacane. Inactive sans Ninja Forms ou sans les clés de wp-config.php.
 */
final class SarbacaneSubmission implements FeatureInterface {

    /** Pose le hook d'après soumission. */
    public function register(): void {
        if ( ! function_exists( 'Ninja_Forms' ) || ! SarbacaneApi::is_configured() ) {
            return;
        }
        add_action( 'ninja_forms_after_submission', [ $this, 'send' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Envoie chaque formulaire Ninja Forms soumis à la liste Sarbacane (contact créé ou mis à jour).', 'couturier' );
    }

    /**
     * Construit le contact et l'envoie ; toute erreur est journalisée.
     *
     * @param array<string, mixed> $data Données de soumission de Ninja Forms.
     */
    public function send( $data ): void {
        try {
            $list_id = SarbacaneApi::list_id();
            if ( ! $list_id ) {
                return;
            }
            $fid   = (int) ( $data['form_id'] ?? 0 );
            $title = $data['settings']['title'] ?? ( 'Formulaire ' . $fid );
            $c     = SarbacaneContact::build( $list_id, $fid, $title, (array) ( $data['fields'] ?? [] ), time() );
            if ( ! $c ) {
                SarbacaneApi::log( "NF-$fid : ni e-mail ni mobile, non envoye" );
                return;
            }
            SarbacaneApi::request( 'POST', '/lists/' . rawurlencode( $list_id ) . '/contacts/upsert', $c, $ok );
        } catch ( \Throwable $e ) {
            SarbacaneApi::log( 'Erreur PHP : ' . $e->getMessage() );
        }
    }
}
