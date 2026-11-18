<?php
/**
 * Image à la une des articles reprise du visuel du héros
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blog;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use WP_Post;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Renseigne l'image à la une d'un article avec l'image du premier bloc
 * « Visuel du héros » (`couturier/page-hero-media`, attribut `imageId`) : les
 * cartes de la page des articles s'en servent comme vignette.
 *
 * **Image choisie à la main jamais écrasée** : l'identifiant posé automatiquement
 * est mémorisé (méta `_couturier_hero_thumbnail`). Tant que l'image à la une est
 * celle-là (ou qu'il n'y en a pas), elle suit le héros — image changée, mise à
 * jour ; image retirée, vignette retirée. Si l'éditeur en choisit une autre, la
 * mémoire est effacée et l'article n'est plus synchronisé.
 *
 * `wp_after_insert_post` et non `save_post` : dans l'éditeur de blocs, l'API REST
 * enregistre l'image à la une après `save_post` ; ce hook vient après tout.
 *
 * Articles existants : `wp couturier blog sync-thumbnails`.
 */
final class HeroThumbnail implements FeatureInterface {

    /** Méta mémorisant l'image à la une posée automatiquement. */
    private const META = '_couturier_hero_thumbnail';

    /** Bloc portant l'image du héros. */
    private const BLOCK = 'couturier/page-hero-media';

    public function register(): void {
        add_action( 'wp_after_insert_post', [ $this, 'on_save' ], 10, 2 );

        if ( defined( 'WP_CLI' ) && WP_CLI ) {
            \WP_CLI::add_command( 'couturier blog sync-thumbnails', [ $this, 'cli_sync' ] );
        }
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Reprend l\'image du héros d\'un article comme image à la une, sauf si une autre a été choisie à la main.', 'couturier' );
    }

    /**
     * Synchronise à l'enregistrement d'un article.
     *
     * @param int     $post_id Identifiant.
     * @param WP_Post $post    Article.
     */
    public function on_save( int $post_id, WP_Post $post ): void {
        if ( 'post' !== $post->post_type || wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
            return;
        }

        $this->sync( $post );
    }

    /**
     * Synchronise l'image à la une des articles existants.
     *
     * ## EXAMPLES
     *
     *     wp couturier blog sync-thumbnails
     */
    public function cli_sync(): void {
        $ids = get_posts(
            [
                'post_type'      => 'post',
                'post_status'    => 'any',
                'posts_per_page' => -1,
                'fields'         => 'ids',
            ]
        );

        $updated = 0;
        foreach ( $ids as $id ) {
            $post = get_post( $id );
            if ( $post instanceof WP_Post && $this->sync( $post ) ) {
                ++$updated;
            }
        }

        \WP_CLI::success( sprintf( '%d article(s) mis à jour sur %d.', $updated, count( $ids ) ) );
    }

    /**
     * Aligne l'image à la une sur le héros, si elle n'a pas été choisie à la main.
     *
     * @param WP_Post $post Article.
     * @return bool Image à la une modifiée.
     */
    private function sync( WP_Post $post ): bool {
        $current = (int) get_post_thumbnail_id( $post );
        $auto    = (int) get_post_meta( $post->ID, self::META, true );

        // Image choisie à la main : plus de synchronisation.
        if ( $current && $current !== $auto ) {
            if ( $auto ) {
                delete_post_meta( $post->ID, self::META );
            }
            return false;
        }

        $hero = $this->hero_image_id( parse_blocks( $post->post_content ) );

        if ( $hero === $current ) {
            return false;
        }

        if ( $hero ) {
            set_post_thumbnail( $post, $hero );
            update_post_meta( $post->ID, self::META, $hero );
        } else {
            delete_post_thumbnail( $post );
            delete_post_meta( $post->ID, self::META );
        }

        return true;
    }

    /**
     * Image du premier visuel de héros, blocs imbriqués compris.
     *
     * @param array<int, array<string, mixed>> $blocks Blocs analysés.
     * @return int Identifiant de l'image, 0 sans image valide.
     */
    private function hero_image_id( array $blocks ): int {
        foreach ( $blocks as $block ) {
            if ( self::BLOCK === ( $block['blockName'] ?? null ) ) {
                $id = (int) ( $block['attrs']['imageId'] ?? 0 );
                return ( $id && wp_attachment_is_image( $id ) ) ? $id : 0;
            }

            $id = $this->hero_image_id( $block['innerBlocks'] ?? [] );
            if ( $id ) {
                return $id;
            }
        }

        return 0;
    }
}
