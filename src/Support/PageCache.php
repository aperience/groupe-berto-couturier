<?php
/**
 * Purge du cache de page
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Support;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Vide tout le cache des plugins de cache de page installés.
 *
 * Ces plugins se purgent quand un contenu change (page, article), pas quand une
 * option change : les écrans de réglages du thème qui modifient ce qu'affichent
 * toutes les pages (offre du moment, pied de page, en-tête, menus) les purgent donc eux-mêmes.
 *
 * **Tout le cache est vidé, pas une seule URL** : ce que ces écrans règlent
 * s'affiche sur toutes les pages.
 *
 * **Plugins pris en charge : W3 Total Cache et WP Super Cache.** Chacun n'est appelé
 * que si sa fonction existe. Sans plugin (en local notamment), la purge ne fait
 * rien. Pour un autre plugin, ajouter ici sa fonction « tout vider » : toutes les
 * features qui purgent en profitent.
 *
 * Pas une feature : aucun hook, appelée par les features qui en ont besoin.
 */
final class PageCache {

    /** Vide tout le cache des plugins de cache de page installés. */
    public static function purge(): void {
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
