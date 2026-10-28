<?php
/**
 * Offre du moment dans le contexte Timber
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
 * Expose l'offre du moment aux templates sous `current_offer` :
 * `{ title, text, url, link_label }`, ou `null` si l'offre n'est pas en ligne.
 *
 * **Sur toutes les pages.** La variable est disponible partout, et chaque template
 * décide s'il l'affiche. Le coût par page est celui du cache (voir ci-dessous).
 *
 * **Mise en cache dans le cache objet (`wp_cache`), pas dans un transient.**
 * L'option est autoloadée, donc sa lecture est gratuite. Le seul coût est la
 * résolution de la page cible (statut, permalien). Un transient à expiration n'est
 * pas autoloadé et coûterait plus de requêtes qu'il n'en épargne. `wp_cache` reste
 * limité à la requête tant qu'aucun cache objet persistant (Redis…) n'est installé,
 * puis devient persistant sans changer le code.
 *
 * L'entrée expire au prochain changement d'état dû aux dates (début ou fin), et au
 * plus tard au bout d'un jour. Elle est vidée à chaque enregistrement de l'offre ou
 * de sa page (`CurrentOfferSettings`). L'absence d'offre est elle aussi mise en cache,
 * enveloppée dans un tableau, parce que `wp_cache_get()` renvoie `false` en cas d'absence.
 */
final class CurrentOfferContext implements FeatureInterface {

    /** Enregistre l'ajout au contexte. */
    public function register(): void {
        add_filter( 'timber/context', [ $this, 'add_to_context' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Expose l\'offre du moment aux templates, quand elle est active et dans ses dates (mise en cache).', 'couturier' );
    }

    /**
     * Ajoute `current_offer` au contexte.
     *
     * @param array<string, mixed> $context Contexte Timber.
     * @return array<string, mixed>
     */
    public function add_to_context( array $context ): array {
        $context['current_offer'] = $this->resolve();

        return $context;
    }

    /**
     * Offre en ligne, lue dans le cache ou résolue puis mise en cache.
     *
     * @return array{title: string, text: string, url: string, link_label: string}|null
     */
    private function resolve(): ?array {
        $cached = wp_cache_get( CurrentOffer::CACHE_KEY, CurrentOffer::CACHE_GROUP );

        if ( is_array( $cached ) && array_key_exists( 'offer', $cached ) ) {
            return $cached['offer'];
        }

        $offer    = CurrentOffer::current();
        $boundary = CurrentOffer::next_boundary();
        $ttl      = null === $boundary ? DAY_IN_SECONDS : min( DAY_IN_SECONDS, max( 1, $boundary - time() ) );

        wp_cache_set( CurrentOffer::CACHE_KEY, [ 'offer' => $offer ], CurrentOffer::CACHE_GROUP, $ttl );

        return $offer;
    }
}
