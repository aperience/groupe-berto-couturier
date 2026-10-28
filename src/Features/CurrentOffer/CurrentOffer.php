<?php
/**
 * Offre du moment : lecture, état et invalidation
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\CurrentOffer;

use DateTimeImmutable;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Logique partagée par l'écran d'admin (`CurrentOfferSettings`) et le contexte
 * front (`CurrentOfferContext`). Elle n'ajoute aucun hook et n'est donc pas une feature.
 *
 * **Une seule offre, dans une option autoloadée.** WordPress la charge avec
 * toutes les options autoloadées, en une seule requête au démarrage : la lire ne
 * coûte rien. Sur le front, le seul coût est la résolution de la page cible, et
 * `CurrentOfferContext` le met en cache.
 *
 * **Dates à la journée, dans le fuseau du site.** L'offre démarre à 00:00 le jour
 * de début et s'arrête à 23:59:59 le jour de fin, ce qui revient à 00:00 le
 * lendemain. Une date vide veut dire « pas de borne ».
 */
final class CurrentOffer {

    /** Option stockant l'offre. */
    public const OPTION = 'couturier_current_offer';

    /** Clé et groupe du cache objet de l'offre résolue. */
    public const CACHE_KEY   = 'current_offer';
    public const CACHE_GROUP = 'couturier';

    /** Action émise quand l'offre affichée peut avoir changé (purge d'un cache de page). */
    public const CHANGED_ACTION = 'couturier_current_offer_changed';

    /** Format de stockage des dates. */
    public const DATE_FORMAT = 'Y-m-d';

    /** États possibles de l'offre. */
    public const STATUS_DISABLED  = 'disabled';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_EXPIRED   = 'expired';
    public const STATUS_INVALID   = 'invalid';
    public const STATUS_LIVE      = 'live';

    /** Valeurs par défaut des champs. */
    private const DEFAULTS = [
        'enabled'    => false,
        'title'      => '',
        'text'       => '',
        'page_id'    => 0,
        'link_label' => '',
        'start'      => '',
        'end'        => '',
    ];

    /**
     * Réglages enregistrés, complétés par les valeurs par défaut.
     *
     * @return array{enabled: bool, title: string, text: string, page_id: int, link_label: string, start: string, end: string}
     */
    public static function settings(): array {
        $stored = get_option( self::OPTION, [] );

        return array_merge( self::DEFAULTS, is_array( $stored ) ? array_intersect_key( $stored, self::DEFAULTS ) : [] );
    }

    /**
     * État de l'offre à un instant donné, maintenant par défaut.
     *
     * @return self::STATUS_* L'état.
     */
    public static function status( ?DateTimeImmutable $now = null ): string {
        $settings = self::settings();
        $now    ??= new DateTimeImmutable( 'now', wp_timezone() );
        $start    = self::parse_date( $settings['start'] );
        $end      = self::end_of( $settings['end'] );

        if ( ! $settings['enabled'] ) {
            return self::STATUS_DISABLED;
        }

        if ( $start && $now < $start ) {
            return self::STATUS_SCHEDULED;
        }

        if ( $end && $now >= $end ) {
            return self::STATUS_EXPIRED;
        }

        if ( ! self::is_valid_page( (int) $settings['page_id'] ) ) {
            return self::STATUS_INVALID;
        }

        return self::STATUS_LIVE;
    }

    /**
     * Offre à afficher, ou `null` si elle n'est pas en ligne.
     *
     * L'intitulé du lien peut être vide : le template prévoit alors un libellé par défaut.
     *
     * @return array{title: string, text: string, url: string, link_label: string}|null
     */
    public static function current(): ?array {
        if ( self::STATUS_LIVE !== self::status() ) {
            return null;
        }

        $settings = self::settings();

        return [
            'title'      => $settings['title'],
            'text'       => $settings['text'],
            'url'        => (string) get_permalink( (int) $settings['page_id'] ),
            'link_label' => $settings['link_label'],
        ];
    }

    /**
     * Timestamps à venir des changements d'état dus aux dates : début, puis fin.
     *
     * L'interrupteur et la page n'en produisent pas : ils ne changent qu'à
     * l'enregistrement, qui invalide de toute façon le cache.
     *
     * @return int[]
     */
    public static function boundaries(): array {
        $settings = self::settings();
        $now      = new DateTimeImmutable( 'now', wp_timezone() );
        $upcoming = [];

        foreach ( [ self::parse_date( $settings['start'] ), self::end_of( $settings['end'] ) ] as $boundary ) {
            if ( $boundary && $now < $boundary ) {
                $upcoming[] = $boundary->getTimestamp();
            }
        }

        return $upcoming;
    }

    /** Timestamp du prochain changement d'état dû aux dates, ou `null`. */
    public static function next_boundary(): ?int {
        return self::boundaries()[0] ?? null;
    }

    /** Vide le cache de l'offre résolue et signale le changement. */
    public static function flush(): void {
        wp_cache_delete( self::CACHE_KEY, self::CACHE_GROUP );

        do_action( self::CHANGED_ACTION );
    }

    /** Date `Y-m-d` stricte, à 00:00 dans le fuseau du site, ou `null`. */
    public static function parse_date( string $value ): ?DateTimeImmutable {
        $date = DateTimeImmutable::createFromFormat( '!' . self::DATE_FORMAT, $value, wp_timezone() );

        // Rejette les dates débordantes (2026-02-31), que createFromFormat() reporte au mois suivant.
        return $date && $date->format( self::DATE_FORMAT ) === $value ? $date : null;
    }

    /** Vrai si l'ID désigne une page publiée. */
    public static function is_valid_page( int $page_id ): bool {
        return $page_id > 0 && 'page' === get_post_type( $page_id ) && 'publish' === get_post_status( $page_id );
    }

    /** Fin exclusive d'une date de fin : 00:00 le lendemain, ou `null`. */
    private static function end_of( string $value ): ?DateTimeImmutable {
        return self::parse_date( $value )?->modify( '+1 day' );
    }
}
