<?php
/**
 * Rendu d'une carte du bloc « Cartes photo » (`couturier/photo-card`).
 *
 * `<li>` : photo, puis le contenu enregistré — badge, sur-titre
 * (`p.wp-block-couturier-photo-card__badge` / `__eyebrow`), titre
 * (`core/heading`, `<h3>`) et texte (`p.wp-block-couturier-photo-card__text`).
 *
 * La carte n'est pas cliquable : les liens éventuels sont dans le texte court.
 * L'ancien attribut `link` (lien de toute la carte, supprimé) est ignoré.
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

// ─── Photo ────────────────────────────────────────────────────────────────────
// Point focal → `--focal` (même calcul que `objectPosition()` dans `index.js`), omis au centre.
$couturier_card_focal = is_array( $attributes['focalPoint'] ?? null ) ? $attributes['focalPoint'] : [];
$couturier_card_x     = round( min( max( (float) ( $couturier_card_focal['x'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );
$couturier_card_y     = round( min( max( (float) ( $couturier_card_focal['y'] ?? 0.5 ), 0.0 ), 1.0 ) * 100, 1 );
$couturier_card_style = ( 50.0 === $couturier_card_x && 50.0 === $couturier_card_y ) ? '' : sprintf( ' style="--focal: %s%% %s%%"', $couturier_card_x, $couturier_card_y );

// Largeur maximale d'une carte : 280 px (mobile, moyennes en desktop), ~370 px
// pour les grandes en desktop (3 par ligne).
$couturier_card_sizes = 'xlarge' === ( $block->context['couturier/photoCardsSize'] ?? '' ) ? '(min-width: 992px) 370px, 280px' : '280px';
$couturier_card_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'medium_large',
    false,
    [
        'class'   => 'wp-block-couturier-photo-card__image',
        'sizes'   => $couturier_card_sizes,
        'loading' => 'lazy',
    ]
);

// Fond de la carte : liste fermée du `block.json`, gris clair par défaut (aucune classe).
$couturier_card_class = \Theme\Support\CardBackground::class_name( $attributes, $block );

printf(
    '<li %s>%s%s</li>',
    get_block_wrapper_attributes( [ 'class' => $couturier_card_class ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_card_image ? '<div class="wp-block-couturier-photo-card__media"' . $couturier_card_style . '>' . $couturier_card_image . '</div>' : '<div class="wp-block-couturier-photo-card__media" aria-hidden="true"></div>', // phpcs:ignore WordPress.Security.EscapeOutput -- produit par WordPress.
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
);
