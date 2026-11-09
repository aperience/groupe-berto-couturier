<?php
/**
 * Fil d'Ariane
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Support;

use Timber\Timber;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Fil d'Ariane de la page courante : **données de Rank Math, balisage du thème**.
 *
 * Rank Math calcule le fil (accueil, ancêtres des pages, page des articles et
 * catégorie principale des billets…) et émet son schéma `BreadcrumbList` (module
 * Schema). Son propre HTML (`rank_math_the_breadcrumbs()`) n'est pas utilisé :
 * `aria-label` en anglais, pas de liste, pas d'`aria-current`, séparateur lu par
 * les lecteurs d'écran. Le thème rend les éléments dans
 * `resources/views/partials/breadcrumb.twig` (`<nav>` + `<ol>`).
 *
 * **Seul point de contact avec le plugin** : pour en changer, ne réécrire que
 * `items()`. Plugin absent ou fil désactivé (Rank Math › Réglages généraux ›
 * Fil d'Ariane) : aucun élément, rien n'est rendu.
 *
 * Pas une feature : aucun hook, appelée par les blocs qui affichent le fil
 * (héros des pages).
 */
final class Breadcrumb {

    /** Gabarit Twig du fil. */
    private const VIEW = 'partials/breadcrumb.twig';

    /**
     * Éléments du fil, de l'accueil à la page courante. Le dernier élément n'a pas
     * d'URL.
     *
     * @return list<array{label: string, url: string}>
     */
    public static function items(): array {
        if ( ! class_exists( \RankMath\Frontend\Breadcrumbs::class ) ) {
            return [];
        }

        $breadcrumbs = \RankMath\Frontend\Breadcrumbs::get();

        if ( ! $breadcrumbs ) {
            return [];
        }

        $items = [];

        foreach ( (array) $breadcrumbs->get_crumbs() as $crumb ) {
            $label = trim( (string) ( $crumb[0] ?? '' ) );

            if ( '' !== $label ) {
                $items[] = [
                    'label' => $label,
                    'url'   => (string) ( $crumb[1] ?? '' ),
                ];
            }
        }

        // Dernier élément = page courante, jamais un lien : Rank Math lui donne une
        // URL, que son propre HTML n'utilise pas non plus.
        if ( $items ) {
            $items[ array_key_last( $items ) ]['url'] = '';
        }

        return $items;
    }

    /** HTML du fil, chaîne vide sans élément ou avec le seul accueil. */
    public static function render(): string {
        $items = self::items();

        if ( count( $items ) < 2 ) {
            return '';
        }

        return Timber::compile( self::VIEW, [ 'items' => $items ] ) ?: '';
    }
}
