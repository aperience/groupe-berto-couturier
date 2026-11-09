<?php
/**
 * Rendu du bloc « Héros de page » (`couturier/page-hero`).
 *
 * Blocs imbriqués enregistrés : H1 (`core/heading`), texte (`core/paragraph`,
 * facultatif), boutons (`core/buttons`, facultatif). Rendu :
 *
 *   section.wp-block-couturier-page-hero.is-style-…
 *     div.__content
 *       nav.breadcrumb-trail      ← fil d'Ariane (Rank Math, `Theme\Support\Breadcrumb`)
 *       h1, p                     ← titre et texte
 *       p.__rating                ← avis (attributs), facultatif
 *       div.wp-block-buttons      ← boutons
 *
 * Le H1 est obligatoire : vide, rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des blocs imbriqués.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ─── Blocs imbriqués, rendus un par un pour placer les avis ───────────────────
$couturier_page_hero_title   = '';
$couturier_page_hero_text    = '';
$couturier_page_hero_buttons = '';

foreach ( $block->inner_blocks as $couturier_page_hero_inner ) {
    $couturier_page_hero_html = $couturier_page_hero_inner->render();

    if ( 'core/heading' === $couturier_page_hero_inner->name && '' === $couturier_page_hero_title ) {
        $couturier_page_hero_title = $couturier_page_hero_html;
    } elseif ( 'core/paragraph' === $couturier_page_hero_inner->name ) {
        $couturier_page_hero_text = $couturier_page_hero_html;
    } elseif ( 'core/buttons' === $couturier_page_hero_inner->name ) {
        $couturier_page_hero_buttons = $couturier_page_hero_html;
    }
}

if ( '' === trim( wp_strip_all_tags( $couturier_page_hero_title ) ) ) {
    return;
}

// Paragraphe vide : non rendu.
if ( '' === trim( wp_strip_all_tags( $couturier_page_hero_text ) ) ) {
    $couturier_page_hero_text = '';
}

// Espace avant une ponctuation haute rendue insécable (cf. `render.php` du CTA).
$couturier_page_hero_nbsp = static fn ( string $html ): string => preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $html ) ?? $html;

// ─── Avis ─────────────────────────────────────────────────────────────────────
// Note « 4,8 » (virgule ou point), bornée à 0–5 ; nombre d'avis facultatif.
// Visible : étoiles (décoratives), « 4,8 / 5 · 200 avis » ; lu : « Note : 4,8 sur
// 5, 200 avis » (« 4,8 / 5 » serait lu « barre oblique »).
$couturier_page_hero_rating = '';

if ( ! empty( $attributes['showRating'] )
    && preg_match( '/^\s*(\d+(?:[.,]\d+)?)\s*$/', (string) ( $attributes['rating'] ?? '' ), $couturier_page_hero_match )
) {
    $couturier_page_hero_value = min( 5.0, max( 0.0, (float) str_replace( ',', '.', $couturier_page_hero_match[1] ) ) );
    $couturier_page_hero_score = number_format_i18n( $couturier_page_hero_value, floor( $couturier_page_hero_value ) === $couturier_page_hero_value ? 0 : 1 );
    $couturier_page_hero_count = max( 0, (int) ( $attributes['reviewCount'] ?? 0 ) );

    $couturier_page_hero_label = $couturier_page_hero_count
        /* translators: 1: note, ex. « 4,8 » ; 2: nombre d'avis. */
        ? sprintf( _n( 'Note : %1$s sur 5, %2$s avis', 'Note : %1$s sur 5, %2$s avis', $couturier_page_hero_count, 'couturier' ), $couturier_page_hero_score, number_format_i18n( $couturier_page_hero_count ) )
        /* translators: %s: note, ex. « 4,8 ». */
        : sprintf( __( 'Note : %s sur 5', 'couturier' ), $couturier_page_hero_score );

    $couturier_page_hero_visible = sprintf(
        '<span class="wp-block-couturier-page-hero__stars" style="--rating: %1$s"></span> <span class="wp-block-couturier-page-hero__score">%2$s</span>%3$s',
        esc_attr( (string) round( $couturier_page_hero_value, 2 ) ),
        /* translators: %s: note, ex. « 4,8 ». */
        esc_html( sprintf( __( '%s / 5', 'couturier' ), $couturier_page_hero_score ) ),
        $couturier_page_hero_count
            /* translators: %s: nombre d'avis. */
            ? esc_html( ' · ' . sprintf( _n( '%s avis', '%s avis', $couturier_page_hero_count, 'couturier' ), number_format_i18n( $couturier_page_hero_count ) ) )
            : ''
    );

    $couturier_page_hero_inner_html = sprintf(
        '<span aria-hidden="true">%s</span><span class="visually-hidden">%s</span>',
        $couturier_page_hero_visible,
        esc_html( $couturier_page_hero_label )
    );

    // Lien facultatif. L'URL d'un contenu est recalculée à partir de son ID (suit un
    // changement de permalien) ; à défaut, l'URL enregistrée.
    $couturier_page_hero_link = is_array( $attributes['ratingLink'] ?? null ) ? $attributes['ratingLink'] : [];
    $couturier_page_hero_href = (string) ( $couturier_page_hero_link['url'] ?? '' );
    $couturier_page_hero_id   = (int) ( $couturier_page_hero_link['id'] ?? 0 );

    if ( $couturier_page_hero_id > 0 ) {
        $couturier_page_hero_kind = $couturier_page_hero_link['kind'] ?? '';

        if ( 'post-type' === $couturier_page_hero_kind && 'publish' === get_post_status( $couturier_page_hero_id ) ) {
            $couturier_page_hero_href = (string) get_permalink( $couturier_page_hero_id );
        } elseif ( 'taxonomy' === $couturier_page_hero_kind ) {
            $couturier_page_hero_term = get_term_link( $couturier_page_hero_id, (string) ( $couturier_page_hero_link['type'] ?? '' ) );
            $couturier_page_hero_href = is_wp_error( $couturier_page_hero_term ) ? $couturier_page_hero_href : $couturier_page_hero_term;
        }
    }

    $couturier_page_hero_href = esc_url( $couturier_page_hero_href );

    if ( $couturier_page_hero_href ) {
        $couturier_page_hero_new_tab    = ! empty( $couturier_page_hero_link['opensInNewTab'] );
        $couturier_page_hero_inner_html = sprintf(
            '<a class="wp-block-couturier-page-hero__rating-link" href="%s"%s>%s%s</a>',
            $couturier_page_hero_href,
            $couturier_page_hero_new_tab ? ' target="_blank" rel="noopener"' : '',
            $couturier_page_hero_inner_html,
            $couturier_page_hero_new_tab ? '<span class="visually-hidden"> ' . esc_html__( '(nouvel onglet)', 'couturier' ) . '</span>' : ''
        );
    }

    $couturier_page_hero_rating = '<p class="wp-block-couturier-page-hero__rating">' . $couturier_page_hero_inner_html . '</p>';
}

printf(
    '<section %1$s><div class="wp-block-couturier-page-hero__content">%2$s%3$s%4$s%5$s%6$s</div></section>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    \Theme\Support\Breadcrumb::render(), // phpcs:ignore WordPress.Security.EscapeOutput -- gabarit Twig, échappement automatique.
    $couturier_page_hero_nbsp( $couturier_page_hero_title ), // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des blocs imbriqués.
    $couturier_page_hero_nbsp( $couturier_page_hero_text ), // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des blocs imbriqués.
    $couturier_page_hero_rating, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé ci-dessus.
    $couturier_page_hero_buttons // phpcs:ignore WordPress.Security.EscapeOutput -- HTML des blocs imbriqués.
);
