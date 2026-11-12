<?php
/**
 * Sessions de formation : purge du cache de page
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\TrainingSessions;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Theme\Support\PageCache;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Vide le cache de page quand l'affichage des sessions de formation change sans
 * qu'aucune page soit enregistrée. Tout le cache est vidé, cf. `Theme\Support\PageCache`.
 *
 * - **Chaque nuit, juste après minuit** (fuseau du site) : une session publiée
 *   qui commence ce jour-là perd ses places et son bouton « Réserver », une
 *   session terminée la veille disparaît. La tâche WP-Cron ne purge que si
 *   l'une ou l'autre existe, puis se reprogramme pour la nuit suivante (une
 *   tâche unique par nuit plutôt qu'un intervalle de 24 h, qui dériverait d'une
 *   heure aux changements d'heure).
 * - **À la création, au renommage ou à la suppression d'un secteur** : son nom
 *   est un bouton du filtre, lu au rendu, et une session dont le secteur est
 *   supprimé n'est plus affichée.
 *
 * ⚠️ **En production, un vrai cron est indispensable** (comme pour l'offre du
 * moment) : `DISABLE_WP_CRON` + `wp cron event run --due-now` chaque minute,
 * cf. `docs/mise-en-prod.md`. Sans lui, la tâche de minuit n'est lancée qu'à la
 * première visite non servie par le cache.
 */
final class SessionPageCache implements FeatureInterface {

    /** Tâche WP-Cron de minuit. */
    private const CRON_HOOK = 'couturier_sessions_daily';

    /** Une minute après minuit : laisse passer le changement de jour. */
    private const DELAY = MINUTE_IN_SECONDS;

    /** Enregistre la tâche de minuit et la purge sur les secteurs. */
    public function register(): void {
        add_action( 'init', [ $this, 'ensure_scheduled' ] );
        add_action( self::CRON_HOOK, [ $this, 'run' ] );
        add_action( 'switch_theme', [ $this, 'unschedule' ] );

        foreach ( [ 'created_', 'edited_', 'delete_' ] as $prefix ) {
            add_action( $prefix . Sector::TAXONOMY, [ PageCache::class, 'purge' ], 10, 0 );
        }
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Vide le cache de page (W3 Total Cache, WP Super Cache) chaque nuit où une session de formation commence ou s\'est terminée la veille, et quand un secteur est créé, renommé ou supprimé.', 'couturier' );
    }

    /** Programme la tâche de la nuit prochaine si elle ne l'est pas. */
    public function ensure_scheduled(): void {
        if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
            wp_schedule_single_event( self::next_midnight(), self::CRON_HOOK );
        }
    }

    /** Tâche de minuit : purge si une session change d'état aujourd'hui, puis reprogramme. */
    public function run(): void {
        if ( self::has_change_today() ) {
            PageCache::purge();
        }

        wp_schedule_single_event( self::next_midnight(), self::CRON_HOOK );
    }

    /** Thème désactivé : plus de tâche. */
    public function unschedule(): void {
        wp_unschedule_hook( self::CRON_HOOK );
    }

    /** Prochain minuit (fuseau du site), plus le délai. */
    private static function next_midnight(): int {
        return ( new \DateTimeImmutable( 'tomorrow', wp_timezone() ) )->getTimestamp() + self::DELAY;
    }

    /**
     * Une session d'un contenu publié commence aujourd'hui, ou s'est terminée
     * hier ?
     */
    private static function has_change_today(): bool {
        $today     = wp_date( 'Y-m-d' );
        $yesterday = wp_date( 'Y-m-d', time() - DAY_IN_SECONDS );

        $posts = get_posts(
            [
                'post_type'        => 'any',
                'post_status'      => 'publish',
                'posts_per_page'   => -1,
                's'                => '<!-- wp:couturier/session ',
                'search_columns'   => [ 'post_content' ],
                'suppress_filters' => false,
                'no_found_rows'    => true,
            ]
        );

        foreach ( $posts as $post ) {
            foreach ( self::sessions( parse_blocks( $post->post_content ) ) as $attributes ) {
                $start = SessionDate::parse( (string) ( $attributes['startDate'] ?? '' ) );

                if ( ! $start ) {
                    continue;
                }

                $end = SessionDate::end( $start, (string) ( $attributes['endDate'] ?? '' ) );

                if ( $start->format( 'Y-m-d' ) === $today || $end->format( 'Y-m-d' ) === $yesterday ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Attributs des blocs `couturier/session`, à toute profondeur.
     *
     * @param array<int, array<string, mixed>> $blocks Blocs analysés.
     * @return list<array<string, mixed>>
     */
    private static function sessions( array $blocks ): array {
        $found = [];

        foreach ( $blocks as $block ) {
            if ( 'couturier/session' === ( $block['blockName'] ?? '' ) ) {
                $found[] = (array) ( $block['attrs'] ?? [] );
            }

            if ( ! empty( $block['innerBlocks'] ) ) {
                array_push( $found, ...self::sessions( $block['innerBlocks'] ) );
            }
        }

        return $found;
    }
}
