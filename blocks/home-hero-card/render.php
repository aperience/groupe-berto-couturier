<?php
/**
 * Rendu d'une carte du héros de l'accueil (`couturier/home-hero-card`).
 *
 * Contenu enregistré : sur-titre (`p.__eyebrow`), titre (`core/heading`, `<h3>`),
 * texte (`p.__text`), libellé du bouton (`p.__button`). Rendu : sur-titre, photo,
 * titre, texte, puis le bouton — le libellé devient un lien (`a.__button`) vers
 * l'URL choisie. L'URL d'un contenu (page, article, catégorie…) est recalculée à
 * partir de son ID et suit ainsi un changement de permalien ; à défaut (contenu
 * supprimé, URL saisie), l'URL enregistrée. Nouvel onglet annoncé en texte masqué.
 *
 * Sans titre : rien n'est rendu. Sans lien ou sans libellé : pas de bouton.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! preg_match( '#<h([2-6])\b[^>]*>(.*?)</h\1>#s', $content, $couturier_hero_card_title )
    || '' === trim( wp_strip_all_tags( $couturier_hero_card_title[2] ) )
) {
    return;
}

// Espace avant une ponctuation haute rendue insécable (cf. `render.php` du CTA).
$couturier_hero_card_content = preg_replace( '/ +((?:<[^>]*>)*)(?=[?!:;»])/u', "\u{00A0}$1", $content ) ?? $content;

// Sur-titre et libellé du bouton retirés du contenu, pour être replacés.
$couturier_hero_card_eyebrow = '';
$couturier_hero_card_label   = '';

$couturier_hero_card_content = (string) preg_replace_callback(
    '#<p class="wp-block-couturier-home-hero-card__(eyebrow|button)">(.*?)</p>#s',
    static function ( array $match ) use ( &$couturier_hero_card_eyebrow, &$couturier_hero_card_label ): string {
        if ( 'eyebrow' === $match[1] ) {
            $couturier_hero_card_eyebrow = $match[0];
        } else {
            $couturier_hero_card_label = trim( $match[2] );
        }

        return '';
    },
    $couturier_hero_card_content
);

// ─── Lien du bouton ───────────────────────────────────────────────────────────
$couturier_hero_card_link = is_array( $attributes['link'] ?? null ) ? $attributes['link'] : [];
$couturier_hero_card_href = (string) ( $couturier_hero_card_link['url'] ?? '' );
$couturier_hero_card_id   = (int) ( $couturier_hero_card_link['id'] ?? 0 );

if ( $couturier_hero_card_id > 0 ) {
    $couturier_hero_card_kind = $couturier_hero_card_link['kind'] ?? '';

    if ( 'post-type' === $couturier_hero_card_kind && 'publish' === get_post_status( $couturier_hero_card_id ) ) {
        $couturier_hero_card_href = (string) get_permalink( $couturier_hero_card_id );
    } elseif ( 'taxonomy' === $couturier_hero_card_kind ) {
        $couturier_hero_card_term = get_term_link( $couturier_hero_card_id, (string) ( $couturier_hero_card_link['type'] ?? '' ) );
        $couturier_hero_card_href = is_wp_error( $couturier_hero_card_term ) ? $couturier_hero_card_href : $couturier_hero_card_term;
    }
}

$couturier_hero_card_href   = esc_url( $couturier_hero_card_href );
$couturier_hero_card_button = '';

if ( $couturier_hero_card_href && '' !== trim( wp_strip_all_tags( $couturier_hero_card_label ) ) ) {
    $couturier_hero_card_button = sprintf(
        '<a class="wp-block-couturier-home-hero-card__button" href="%s"%s>%s%s</a>',
        $couturier_hero_card_href,
        empty( $couturier_hero_card_link['opensInNewTab'] ) ? '' : ' target="_blank" rel="noopener"',
        $couturier_hero_card_label,
        empty( $couturier_hero_card_link['opensInNewTab'] ) ? '' : '<span class="visually-hidden"> ' . esc_html__( '(nouvel onglet)', 'couturier' ) . '</span>'
    );
}

// ─── Photo ────────────────────────────────────────────────────────────────────
// Au-dessus de la ligne de flottaison (héros) : chargée sans délai. 506 px : largeur
// de la photo en desktop ; en mobile, une carte occupe la moitié de l'écran.
$couturier_hero_card_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'large',
    false,
    [
        'class'   => 'wp-block-couturier-home-hero-card__image',
        'sizes'   => '(min-width: 992px) 506px, 50vw',
        'loading' => 'eager',
    ]
);

printf(
    '<div %s>%s%s%s%s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_hero_card_eyebrow, // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
    $couturier_hero_card_image ? '<div class="wp-block-couturier-home-hero-card__media">' . $couturier_hero_card_image . '</div>' : '', // phpcs:ignore WordPress.Security.EscapeOutput -- produit par WordPress.
    trim( $couturier_hero_card_content ), // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
    $couturier_hero_card_button // phpcs:ignore WordPress.Security.EscapeOutput -- URL échappée, libellé enregistré.
);
