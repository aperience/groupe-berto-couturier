<?php
/**
 * Rendu d'une carte du bloc « Cartes photo » (`couturier/photo-card`).
 *
 * `<li>` : photo, puis le contenu enregistré — badge, sur-titre
 * (`p.wp-block-couturier-photo-card__badge` / `__eyebrow`), titre
 * (`core/heading`, `<h3>`) et texte (`p.wp-block-couturier-photo-card__text`).
 *
 * Avec un lien, le texte du titre est placé dans un `<a>` dont le `::after`
 * couvre toute la carte (`block/_photo-cards.scss`) : une seule cible, nommée par
 * le titre. L'URL d'un contenu (page, article, catégorie…) est recalculée à
 * partir de son ID et suit ainsi un changement de permalien ; à défaut (contenu
 * supprimé, URL saisie), l'URL enregistrée. Nouvel onglet annoncé en texte masqué.
 *
 * Fond (`background`) autre que gris clair : classe `is-bg-{fond}`.
 *
 * Sans titre : rien n'est rendu. Sans photo (ou pièce jointe supprimée) : pas
 * d'image, le haut de la carte reste vide.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : badge, sur-titre, titre, texte.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! preg_match( '#<h([2-6])\b[^>]*>(.*?)</h\1>#s', $content, $couturier_card_title )
    || '' === trim( wp_strip_all_tags( $couturier_card_title[2] ) )
) {
    return;
}

// ─── Lien ─────────────────────────────────────────────────────────────────────
$couturier_card_link = is_array( $attributes['link'] ?? null ) ? $attributes['link'] : [];
$couturier_card_href = (string) ( $couturier_card_link['url'] ?? '' );
$couturier_card_id   = (int) ( $couturier_card_link['id'] ?? 0 );

if ( $couturier_card_id > 0 ) {
    $couturier_card_kind = $couturier_card_link['kind'] ?? '';

    if ( 'post-type' === $couturier_card_kind && 'publish' === get_post_status( $couturier_card_id ) ) {
        $couturier_card_href = (string) get_permalink( $couturier_card_id );
    } elseif ( 'taxonomy' === $couturier_card_kind ) {
        $couturier_card_term = get_term_link( $couturier_card_id, (string) ( $couturier_card_link['type'] ?? '' ) );
        $couturier_card_href = is_wp_error( $couturier_card_term ) ? $couturier_card_href : $couturier_card_term;
    }
}

$couturier_card_href    = esc_url( $couturier_card_href );
$couturier_card_new_tab = $couturier_card_href && ! empty( $couturier_card_link['opensInNewTab'] );

if ( $couturier_card_href ) {
    // Texte du titre enveloppé dans le lien ; la balise du titre est conservée.
    $content = (string) preg_replace_callback(
        '#(<h([2-6])\b[^>]*>)(.*?)(</h\2>)#s',
        static fn( array $match ): string => sprintf(
            '%s<a class="wp-block-couturier-photo-card__link" href="%s"%s>%s%s</a>%s',
            $match[1],
            $couturier_card_href,
            $couturier_card_new_tab ? ' target="_blank" rel="noopener"' : '',
            $match[3],
            $couturier_card_new_tab ? '<span class="visually-hidden"> ' . esc_html__( '(nouvel onglet)', 'couturier' ) . '</span>' : '',
            $match[4]
        ),
        $content,
        1
    );
}

// ─── Photo ────────────────────────────────────────────────────────────────────
// Point focal → `--focal` (même calcul que `objectPosition()` dans `index.js`), omis au centre.
$couturier_card_focal = is_array( $attributes['focalPoint'] ?? null ) ? $attributes['focalPoint'] : [];
$couturier_card_x     = round( min( max( (float) ( $couturier_card_focal['x'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );
$couturier_card_y     = round( min( max( (float) ( $couturier_card_focal['y'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );
$couturier_card_style = ( 50.0 === $couturier_card_x && 50.0 === $couturier_card_y ) ? '' : sprintf( ' style="--focal: %s%% %s%%"', $couturier_card_x, $couturier_card_y );

// 280 px : largeur maximale d'une carte (grandes cartes en desktop).
$couturier_card_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'medium_large',
    false,
    [
        'class'   => 'wp-block-couturier-photo-card__image',
        'sizes'   => '280px',
        'loading' => 'lazy',
    ]
);

// Fond de la carte : liste fermée du `block.json`, gris clair par défaut (aucune classe).
$couturier_card_class = trim( ( $couturier_card_href ? 'has-link ' : '' ) . \Theme\Support\CardBackground::class_name( $attributes, $block ) );

printf(
    '<li %s>%s%s</li>',
    get_block_wrapper_attributes( [ 'class' => $couturier_card_class ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_card_image ? '<div class="wp-block-couturier-photo-card__media"' . $couturier_card_style . '>' . $couturier_card_image . '</div>' : '<div class="wp-block-couturier-photo-card__media" aria-hidden="true"></div>', // phpcs:ignore WordPress.Security.EscapeOutput -- produit par WordPress.
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
);
