<?php
/**
 * Rendu du bloc « Avis Google » (`couturier/reviews`).
 *
 * Le HTML enregistré (`save()`) ne contient que la note (`p.__score`) et la liste
 * des trois avis. Ce rendu :
 * - retire les avis incomplets (classe `is-incomplete` : texte ou nom vide) ; sans
 *   avis complet, rien n'est rendu ;
 * - place la note dans un en-tête, avec le logo Google et ses étoiles (remplies
 *   selon la note), et le lien « Lire tous les avis » si une URL est saisie ;
 * - ajoute à chaque avis ses étoiles (`data-stars`), lues aussi en texte masqué.
 *
 * Logo et étoiles sont des images CSS (`block/_reviews.scss`), décoratives : la
 * note est lue en texte (« Note moyenne des avis Google : 4,8 sur 5 »).
 *
 * WordPress ne lit pas côté serveur les attributs `source: html` : on travaille sur
 * `$content`, dont le balisage est celui, figé, de `save()`.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : note et liste des avis.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Espace avant « ? ! : ; » rendue insécable (même motif que les autres blocs).
$couturier_reviews_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $content ) ?? $content;

// Avis incomplets : balisage de `save()`, pas de `<li>` imbriqué.
$couturier_reviews_content = preg_replace(
    '#<li class="[^"]*\bis-incomplete\b[^"]*"[^>]*>.*?</li>#s',
    '',
    $couturier_reviews_content
) ?? $couturier_reviews_content;

if ( ! str_contains( $couturier_reviews_content, '<li' ) ) {
    return;
}

// Note : sortie du HTML enregistré, replacée dans l'en-tête.
$couturier_reviews_score = '';

if ( preg_match( '#<p class="wp-block-couturier-reviews__score">(.*?)</p>#s', $couturier_reviews_content, $couturier_reviews_match ) ) {
    $couturier_reviews_score   = trim( $couturier_reviews_match[1] );
    $couturier_reviews_content = str_replace( $couturier_reviews_match[0], '', $couturier_reviews_content );
}

// Étoiles de chaque avis, entier de 1 à 5 (5 à défaut) — même règle que `index.js`.
$couturier_reviews_content = preg_replace_callback(
    '#<li class="wp-block-couturier-reviews__item"(?: data-stars="(\d*)")?>#',
    static function ( array $match ): string {
        $stars = (int) ( $match[1] ?? 5 );
        $stars = $stars >= 1 && $stars <= 5 ? $stars : 5;

        return sprintf(
            '%s<p class="wp-block-couturier-reviews__stars" style="--stars: %d"><span class="visually-hidden">%s</span></p>',
            $match[0],
            $stars,
            /* translators: %d: nombre d'étoiles de l'avis, de 1 à 5. */
            esc_html( sprintf( __( 'Note : %d sur 5', 'couturier' ), $stars ) )
        );
    },
    $couturier_reviews_content
) ?? $couturier_reviews_content;

// Repli « Plus » / « Moins » de chaque avis (modèle Disclosure,
// `resources/js/reviews.js`) : le texte est enveloppé avec un bouton `hidden`,
// relié par `aria-controls`. Sans JS, texte entier et pas de bouton ; avec, le
// texte est coupé à quelques lignes et le bouton n'apparaît que s'il déborde.
// Le nom de l'auteur complète le libellé, en texte masqué.
$couturier_reviews_id = wp_unique_id( 'reviews-' );
$couturier_reviews_n  = 0;

$couturier_reviews_content = preg_replace_callback(
    '#<blockquote class="wp-block-couturier-reviews__text">(.*?)</blockquote>(<p class="wp-block-couturier-reviews__name">(.*?)</p>)#s',
    static function ( array $match ) use ( $couturier_reviews_id, &$couturier_reviews_n ): string {
        $text_id = sprintf( '%s-text-%d', $couturier_reviews_id, ++$couturier_reviews_n );

        return sprintf(
            '<div class="wp-block-couturier-reviews__body"><blockquote class="wp-block-couturier-reviews__text" id="%1$s">%2$s</blockquote><button type="button" class="wp-block-couturier-reviews__more" aria-expanded="false" aria-controls="%1$s" hidden><span class="wp-block-couturier-reviews__more-label">%3$s</span><span class="wp-block-couturier-reviews__less-label">%4$s</span><span class="visually-hidden"> %5$s</span></button></div>%6$s',
            esc_attr( $text_id ),
            $match[1],
            esc_html__( 'Plus', 'couturier' ),
            esc_html__( 'Moins', 'couturier' ),
            /* translators: %s: nom de l'auteur de l'avis. */
            esc_html( sprintf( __( '— avis rédigé par %s', 'couturier' ), trim( wp_strip_all_tags( $match[3] ) ) ) ),
            $match[2]
        );
    },
    $couturier_reviews_content
) ?? $couturier_reviews_content;

// En-tête : note et logo, puis lien.
$couturier_reviews_summary = '';

if ( '' !== wp_strip_all_tags( $couturier_reviews_score ) ) {
    // Note sur 5 extraite du texte (« 4,8 / 5 » → 4.8), bornée à 0–5 — même règle que `index.js`.
    $couturier_reviews_value = null;

    if ( preg_match( '/\d+(?:[.,]\d+)?/', wp_strip_all_tags( $couturier_reviews_score ), $couturier_reviews_number ) ) {
        $couturier_reviews_value = min( 5.0, max( 0.0, (float) str_replace( ',', '.', $couturier_reviews_number[0] ) ) );
    }

    if ( null === $couturier_reviews_value ) {
        // Note illisible : texte saisi tel quel, sans étoiles.
        $couturier_reviews_score_html = sprintf(
            '<span class="visually-hidden">%s </span>%s',
            esc_html__( 'Note moyenne des avis Google :', 'couturier' ),
            $couturier_reviews_score
        );
        $couturier_reviews_stars = '';
    } else {
        // « 4,8 / 5 » serait lu « 4,8 barre oblique 5 » : texte visible masqué aux
        // lecteurs d'écran, remplacé par une phrase.
        $couturier_reviews_score_html = sprintf(
            '<span aria-hidden="true">%s</span><span class="visually-hidden">%s</span>',
            $couturier_reviews_score,
            esc_html(
                sprintf(
                    /* translators: %s: note moyenne, ex. « 4,8 ». */
                    __( 'Note moyenne des avis Google : %s sur 5', 'couturier' ),
                    number_format_i18n( $couturier_reviews_value, floor( $couturier_reviews_value ) === $couturier_reviews_value ? 0 : 1 )
                )
            )
        );
        $couturier_reviews_stars = sprintf(
            '<span class="wp-block-couturier-reviews__score-stars" style="--reviews-score: %s"></span>',
            esc_attr( (string) round( $couturier_reviews_value, 2 ) )
        );
    }

    $couturier_reviews_summary .= sprintf(
        '<div class="wp-block-couturier-reviews__rating"><p class="wp-block-couturier-reviews__score">%s</p><div class="wp-block-couturier-reviews__google" aria-hidden="true"><span class="wp-block-couturier-reviews__logo"></span>%s</div></div>',
        $couturier_reviews_score_html, // phpcs:ignore WordPress.Security.EscapeOutput -- HTML enregistré du bloc.
        $couturier_reviews_stars
    );
}

$couturier_reviews_url = esc_url( (string) ( $attributes['url'] ?? '' ) );

if ( '' !== $couturier_reviews_url ) {
    $couturier_reviews_summary .= sprintf(
        '<p class="wp-block-couturier-reviews__all"><a class="wp-block-couturier-reviews__all-link" href="%s" target="_blank" rel="noopener">%s<span class="visually-hidden"> %s</span><span class="wp-block-couturier-reviews__all-arrow" aria-hidden="true"></span></a></p>',
        $couturier_reviews_url,
        esc_html__( 'Lire tous les avis', 'couturier' ),
        esc_html__( 'sur Google (nouvel onglet)', 'couturier' )
    );
}

if ( '' !== $couturier_reviews_summary ) {
    $couturier_reviews_summary = '<div class="wp-block-couturier-reviews__summary">' . $couturier_reviews_summary . '</div>';
}

printf(
    '<div %s>%s%s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_reviews_summary, // phpcs:ignore WordPress.Security.EscapeOutput -- construit ci-dessus, valeurs échappées.
    $couturier_reviews_content // phpcs:ignore WordPress.Security.EscapeOutput -- HTML enregistré du bloc.
);
