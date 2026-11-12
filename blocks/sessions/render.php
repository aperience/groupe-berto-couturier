<?php
/**
 * Rendu du bloc « Sessions de formation » (`couturier/sessions`).
 *
 * Rend chaque session (`session/render.php` : rien pour une session passée ou
 * incomplète), les trie par date de début, puis :
 * - filtre par secteur : groupe de boutons `aria-pressed` (« Toutes les villes »
 *   puis un bouton par secteur des sessions affichées, ordre alphabétique), rendu
 *   seulement s'il y a au moins deux secteurs ; `hidden` sans JS (toutes les
 *   sessions restent visibles), affiché par `resources/js/sessions.js` ;
 * - liste des sessions (`role="list"` : Safari retire la sémantique d'une liste
 *   sans puces) ;
 * - région `role="status"` où le script annonce le nombre de sessions affichées.
 *
 * Aucune session à venir : message « Aucune session programmée pour le moment ».
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des sessions rendues (non utilisé : rendu ici).
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

use Theme\Features\TrainingSessions\Sector;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$couturier_sessions = [];

foreach ( $block->inner_blocks as $couturier_sessions_index => $couturier_sessions_inner ) {
    $couturier_sessions_html = trim( $couturier_sessions_inner->render() );

    if ( '' === $couturier_sessions_html ) {
        continue;
    }

    $couturier_sessions[] = [
        'html'   => $couturier_sessions_html,
        'start'  => (string) ( $couturier_sessions_inner->attributes['startDate'] ?? '' ),
        'index'  => $couturier_sessions_index,
        'sector' => (int) ( $couturier_sessions_inner->attributes['sectorId'] ?? 0 ),
    ];
}

// Par date de début, puis dans l'ordre de l'éditeur.
usort(
    $couturier_sessions,
    static fn( array $a, array $b ): int => [ $a['start'], $a['index'] ] <=> [ $b['start'], $b['index'] ]
);

if ( [] === $couturier_sessions ) {
    printf(
        '<div %1$s><p class="wp-block-couturier-sessions__empty">%2$s</p></div>',
        get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
        esc_html__( 'Aucune session programmée pour le moment.', 'couturier' )
    );

    return;
}

// Secteurs des sessions affichées, dans l'ordre de l'écran « Secteurs » (alphabétique).
$couturier_sessions_used    = array_flip( array_column( $couturier_sessions, 'sector' ) );
$couturier_sessions_sectors = array_filter(
    Sector::all(),
    static fn( array $sector ): bool => isset( $couturier_sessions_used[ $sector['id'] ] )
);

$couturier_sessions_list_id = wp_unique_id( 'sessions-' );
$couturier_sessions_filter  = '';

if ( count( $couturier_sessions_sectors ) >= 2 ) {
    $couturier_sessions_button = static fn( string $sector, string $label, bool $pressed ): string => sprintf(
        '<button type="button" class="wp-block-couturier-sessions__filter" data-sector="%1$s" aria-pressed="%2$s" aria-controls="%3$s">%4$s</button>',
        esc_attr( $sector ),
        $pressed ? 'true' : 'false',
        esc_attr( $couturier_sessions_list_id ),
        esc_html( $label )
    );

    $couturier_sessions_filter = $couturier_sessions_button( '', __( 'Toutes les villes', 'couturier' ), true );

    foreach ( $couturier_sessions_sectors as $couturier_sessions_sector ) {
        $couturier_sessions_filter .= $couturier_sessions_button( (string) $couturier_sessions_sector['id'], $couturier_sessions_sector['name'], false );
    }

    $couturier_sessions_filter = sprintf(
        '<div class="wp-block-couturier-sessions__filters" role="group" aria-label="%1$s" hidden>%2$s</div>',
        esc_attr__( 'Filtrer les sessions par ville', 'couturier' ),
        $couturier_sessions_filter
    );
}

printf(
    '<div %1$s>%2$s<ul class="wp-block-couturier-sessions__list" id="%3$s" role="list">%4$s</ul>%5$s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_sessions_filter, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé ci-dessus.
    esc_attr( $couturier_sessions_list_id ),
    implode( '', array_column( $couturier_sessions, 'html' ) ), // phpcs:ignore WordPress.Security.EscapeOutput -- sessions rendues.
    '' !== $couturier_sessions_filter
        ? sprintf(
            '<p class="wp-block-couturier-sessions__status visually-hidden" role="status" data-one="%1$s" data-many="%2$s"></p>',
            /* translators: annoncé au lecteur d'écran après un filtrage, une seule session. */
            esc_attr__( '1 session affichée', 'couturier' ),
            /* translators: annoncé au lecteur d'écran après un filtrage ; %d : nombre de sessions. */
            esc_attr__( '%d sessions affichées', 'couturier' )
        )
        : ''
);
