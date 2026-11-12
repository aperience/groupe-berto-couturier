<?php
/**
 * Rendu d'une session de formation (`couturier/session`).
 *
 * Contenu enregistré : la ville (`p.wp-block-couturier-session__city`, comptée
 * par le compteur de mots). Le reste vient des attributs : période (`<time>`),
 * places, bouton « Réserver » (balisage du bloc Bouton, style `deep` fléché :
 * mêmes styles que `core/button`), dont l'intitulé est complété pour un lecteur
 * d'écran (« Réserver la session du 20–22 oct. 2026 à Dreux »).
 *
 * Une session commencée (premier jour arrivé) reste affichée jusqu'à son dernier
 * jour, sans places ni bouton « Réserver ».
 *
 * Rien n'est rendu pour une session passée, sans date de début valide, sans
 * ville, sans secteur existant (obligatoire), ou sans lien de réservation (sauf commencée, ou complète : 0 place, « Complet », pas
 * de bouton). Le secteur (`data-sector`) sert au filtre du bloc parent, qui trie
 * les sessions par date.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : la ville.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

use Theme\Features\TrainingSessions\Sector;
use Theme\Features\TrainingSessions\SessionDate;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$couturier_session_start = SessionDate::parse( (string) ( $attributes['startDate'] ?? '' ) );
$couturier_session_city  = trim( $content );

$couturier_session_sector = max( 0, (int) ( $attributes['sectorId'] ?? 0 ) );

// Secteur obligatoire : sans lui (ou supprimé), la session échapperait au filtre.
if ( ! $couturier_session_start || '' === trim( wp_strip_all_tags( $couturier_session_city ) ) || '' === Sector::name( $couturier_session_sector ) ) {
    return;
}

$couturier_session_end = SessionDate::end( $couturier_session_start, (string) ( $attributes['endDate'] ?? '' ) );

if ( SessionDate::is_past( $couturier_session_end ) ) {
    return;
}

$couturier_session_places = isset( $attributes['places'] ) && is_numeric( $attributes['places'] ) ? max( 0, (int) $attributes['places'] ) : null;
$couturier_session_full   = 0 === $couturier_session_places;

// Session commencée : toujours affichée jusqu'à son dernier jour, mais plus
// réservable (ni places ni bouton, lien facultatif).
$couturier_session_started  = SessionDate::has_started( $couturier_session_start );
$couturier_session_bookable = ! $couturier_session_full && ! $couturier_session_started;

// Lien : URL d'un contenu recalculée par son ID (permalien changé).
$couturier_session_link = is_array( $attributes['link'] ?? null ) ? $attributes['link'] : [];
$couturier_session_href = (string) ( $couturier_session_link['url'] ?? '' );
$couturier_session_id   = (int) ( $couturier_session_link['id'] ?? 0 );

if ( $couturier_session_id > 0 && 'post-type' === ( $couturier_session_link['kind'] ?? '' ) ) {
    $couturier_session_href = (string) ( get_permalink( $couturier_session_id ) ?: $couturier_session_href );
}

if ( $couturier_session_bookable && '' === $couturier_session_href ) {
    return;
}

$couturier_session_period = SessionDate::period( $couturier_session_start, $couturier_session_end );

if ( $couturier_session_started ) {
    $couturier_session_places_html = '';
} elseif ( $couturier_session_full ) {
    $couturier_session_places_html = esc_html__( 'Complet', 'couturier' );
} elseif ( null !== $couturier_session_places ) {
    $couturier_session_places_html = sprintf(
        /* translators: %s : nombre de places restantes, mis en forme. */
        esc_html( _n( '%s place', '%s places', $couturier_session_places, 'couturier' ) ),
        '<span class="wp-block-couturier-session__count">' . esc_html( number_format_i18n( $couturier_session_places ) ) . '</span>'
    );
} else {
    $couturier_session_places_html = '';
}

$couturier_session_button = '';

if ( $couturier_session_bookable ) {
    $couturier_session_blank  = ! empty( $couturier_session_link['opensInNewTab'] );
    $couturier_session_button = sprintf(
        '<div class="wp-block-buttons wp-block-couturier-session__booking"><div class="wp-block-button is-style-deep has-arrow"><a class="wp-block-button__link wp-element-button" href="%1$s"%2$s>%3$s<span class="visually-hidden"> %4$s%5$s</span></a></div></div>',
        esc_url( $couturier_session_href ),
        $couturier_session_blank ? ' target="_blank" rel="noopener"' : '',
        esc_html__( 'Réserver', 'couturier' ),
        esc_html(
            sprintf(
                /* translators: complément du bouton « Réserver » pour un lecteur d'écran : 1 : période, 2 : ville. */
                __( 'la session du %1$s à %2$s', 'couturier' ),
                $couturier_session_period,
                wp_strip_all_tags( $couturier_session_city )
            )
        ),
        $couturier_session_blank ? ' ' . esc_html__( '(nouvel onglet)', 'couturier' ) : ''
    );
}

printf(
    '<li %1$s><p class="wp-block-couturier-session__date"><time datetime="%2$s">%3$s</time></p>%4$s%5$s%6$s</li>',
    get_block_wrapper_attributes( // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
        [
            'class'       => $couturier_session_full ? 'is-full' : '',
            'data-sector' => (string) $couturier_session_sector,
        ]
    ),
    esc_attr( $couturier_session_start->format( 'Y-m-d' ) ),
    esc_html( $couturier_session_period ),
    $couturier_session_city, // phpcs:ignore WordPress.Security.EscapeOutput -- ville enregistrée.
    '' !== $couturier_session_places_html ? '<p class="wp-block-couturier-session__places">' . $couturier_session_places_html . '</p>' : '', // phpcs:ignore WordPress.Security.EscapeOutput -- échappé ci-dessus.
    $couturier_session_button // phpcs:ignore WordPress.Security.EscapeOutput -- échappé ci-dessus.
);
