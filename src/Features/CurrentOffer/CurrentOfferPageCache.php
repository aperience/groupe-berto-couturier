<?php
/**
 * Offre du moment : purge du cache de page
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\CurrentOffer;

use Deefuse\ThemeCore\Contracts\FeatureInterface;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Vide le cache de page quand l'offre affichée change, pour qu'aucune page en cache
 * ne montre une offre périmée, ou n'omette une offre qui vient de commencer.
 *
 * **Deux moments déclenchent la purge, et un plugin de cache de page ne connaît
 * aucun des deux.**
 * - L'enregistrement de l'offre : ces plugins se purgent quand un contenu change,
 *   pas quand une option change. `CurrentOfferSettings` appelle alors
 *   `CurrentOffer::flush()`, qui émet `CurrentOffer::CHANGED_ACTION`.
 * - Le début et la fin de l'offre : personne n'enregistre rien à ces dates.
 *   Chaque enregistrement programme donc une tâche WP-Cron à chacune des dates à
 *   venir. La tâche appelle `CurrentOffer::flush()`.
 *
 * **Tout le cache est vidé, pas une seule URL** : l'offre s'affiche sur toutes les pages.
 *
 * **Plugins pris en charge : W3 Total Cache et WP Super Cache.** Chacun n'est appelé
 * que si sa fonction existe. Sans plugin, la purge ne fait rien. Pour un autre
 * plugin, ajouter sa fonction « tout vider » dans `purge()`.
 *
 * ⚠️ **En production, un vrai cron est indispensable.** WP-Cron ne se déclenche qu'à
 * une visite qui exécute WordPress, et un cache de page sert justement la plupart des
 * visites sans l'exécuter. La purge de fin d'offre partirait avec des heures de retard.
 * La parade : `define( 'DISABLE_WP_CRON', true );` dans `wp-config.php`, et
 * `wp cron event run --due-now` toutes les 5 minutes dans la crontab du serveur.
 */
final class CurrentOfferPageCache implements FeatureInterface {

    /** Tâche WP-Cron programmée aux dates de début et de fin. */
    private const CRON_HOOK = 'couturier_current_offer_boundary';

    /** Enregistre la programmation des tâches, leur exécution et la purge. */
    public function register(): void {
        add_action( 'add_option_' . CurrentOffer::OPTION, [ $this, 'schedule' ], 10, 0 );
        add_action( 'update_option_' . CurrentOffer::OPTION, [ $this, 'schedule' ], 10, 0 );
        add_action( self::CRON_HOOK, [ CurrentOffer::class, 'flush' ], 10, 0 );
        add_action( CurrentOffer::CHANGED_ACTION, [ $this, 'purge' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Vide le cache de page (W3 Total Cache, WP Super Cache) quand l\'offre du moment est enregistrée, commence ou se termine.', 'couturier' );
    }

    /**
     * Remplace les tâches programmées par celles des dates à venir de l'offre.
     *
     * Une offre désactivée n'en a pas : ses dates ne changent pas son état.
     * Chaque tâche reçoit sa date en argument. Deux tâches aux mêmes arguments à
     * moins de 10 minutes d'écart seraient fusionnées par WordPress.
     */
    public function schedule(): void {
        // Pas wp_clear_scheduled_hook() : il ne retire que les tâches sans argument.
        wp_unschedule_hook( self::CRON_HOOK );

        if ( ! CurrentOffer::settings()['enabled'] ) {
            return;
        }

        foreach ( CurrentOffer::boundaries() as $timestamp ) {
            wp_schedule_single_event( $timestamp, self::CRON_HOOK, [ $timestamp ] );
        }
    }

    /** Vide tout le cache des plugins de cache de page installés. */
    public function purge(): void {
        // W3 Total Cache : vide tous ses caches (pages, minification, objet…).
        if ( function_exists( 'w3tc_flush_all' ) ) {
            w3tc_flush_all();
        }

        // WP Super Cache : vide tous les fichiers en cache du site.
        if ( function_exists( 'wp_cache_clear_cache' ) ) {
            wp_cache_clear_cache();
        }
    }
}
