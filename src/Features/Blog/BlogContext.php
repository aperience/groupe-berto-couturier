<?php
/**
 * Données du filtre par catégorie de la liste des articles
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blog;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use WP_Term;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute `blog` au contexte Timber de la page des articles et des archives de
 * catégorie : `{ url, categories: [ { name, url, current } ], all_current }`.
 *
 * Catégories non vides seulement, par nom (la catégorie par défaut comprise :
 * ici renommée « Actualités »). Lues par `partials/post-list.twig`.
 */
final class BlogContext implements FeatureInterface {

    public function register(): void {
        add_filter( 'timber/context', [ $this, 'add_to_context' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Expose aux templates les catégories du filtre de la liste des articles.', 'couturier' );
    }

    /**
     * Ajoute `blog` au contexte.
     *
     * @param array<string, mixed> $context Contexte Timber.
     * @return array<string, mixed>
     */
    public function add_to_context( array $context ): array {
        if ( ! is_home() && ! is_category() ) {
            return $context;
        }

        $current_id = is_category() ? (int) get_queried_object_id() : 0;
        $page_id    = (int) get_option( 'page_for_posts' );

        $terms = get_terms(
            [
                'taxonomy'   => 'category',
                'hide_empty' => true,
                'orderby'    => 'name',
            ]
        );

        $context['blog'] = [
            'url'         => $page_id ? get_permalink( $page_id ) : home_url( '/' ),
            'all_current' => is_home(),
            'categories'  => is_array( $terms ) ? array_map(
                static fn( WP_Term $term ): array => [
                    'name'    => $term->name,
                    'url'     => get_term_link( $term ),
                    'current' => $term->term_id === $current_id,
                ],
                $terms
            ) : [],
        ];

        return $context;
    }
}
