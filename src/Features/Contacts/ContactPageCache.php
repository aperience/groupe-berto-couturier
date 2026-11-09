<?php
/**
 * Contacts prédéfinis : purge du cache de page
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Contacts;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Theme\Support\PageCache;
use WP_Post;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Vide le cache de page quand un contact change : il s'affiche dans les pages qui
 * le choisissent, que les plugins de cache ne savent pas retrouver (un contact n'a
 * pas d'URL). Tout le cache est vidé, cf. `Theme\Support\PageCache`.
 *
 * Déclencheurs : enregistrement d'un contact publié, changement de statut depuis ou
 * vers « publié » (corbeille comprise), suppression définitive.
 */
final class ContactPageCache implements FeatureInterface {

    /** Enregistre la purge sur les changements de contacts. */
    public function register(): void {
        add_action( 'save_post_' . Contact::POST_TYPE, [ $this, 'on_save' ], 20, 2 );
        add_action( 'transition_post_status', [ $this, 'on_transition' ], 10, 3 );
        add_action( 'deleted_post', [ $this, 'on_delete' ], 10, 2 );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Vide le cache de page (W3 Total Cache, WP Super Cache) quand un contact est modifié, publié, dépublié ou supprimé.', 'couturier' );
    }

    /** Contact publié enregistré (photo, coordonnées). */
    public function on_save( int $post_id, WP_Post $post ): void {
        if ( 'publish' === $post->post_status && ! wp_is_post_revision( $post_id ) && ! wp_is_post_autosave( $post_id ) ) {
            PageCache::purge();
        }
    }

    /** Contact qui entre ou sort de l'état « publié ». */
    public function on_transition( string $new_status, string $old_status, WP_Post $post ): void {
        if ( Contact::POST_TYPE === $post->post_type && $new_status !== $old_status && in_array( 'publish', [ $new_status, $old_status ], true ) ) {
            PageCache::purge();
        }
    }

    /** Contact supprimé définitivement. */
    public function on_delete( int $post_id, WP_Post $post ): void {
        if ( Contact::POST_TYPE === $post->post_type ) {
            PageCache::purge();
        }
    }
}
