<?php
/**
 * Rendu d'une carte du bloc « Cartes à pictogramme » (`couturier/icon-card`).
 *
 * `<li>` : pastille du pictogramme (masque CSS peint en `currentColor`,
 * décoratif), puis le contenu enregistré — titre (`core/heading`, `<h3>`) et
 * texte (`p.wp-block-couturier-icon-card__text`).
 *
 * Présentation (`iconStyle`) : pastille (SVG en masque peint en pétrole, PNG /
 * WebP en `<img>` aux couleurs d'origine) ou
 * visuel décalé (`<img>` JPG / PNG / SVG sur un disque, carte `has-offset-visual`).
 *
 * Fond (`background`) autre que blanc : classe `is-bg-{fond}`.
 *
 * Sans titre : rien n'est rendu. Sans pictogramme (ou pièce jointe supprimée) :
 * pas de pastille.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : titre puis texte.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! preg_match( '#^\s*<h([2-6])\b[^>]*>(.*?)</h\1>#s', $content, $couturier_card_title )
    || '' === trim( wp_strip_all_tags( $couturier_card_title[2] ) )
) {
    return;
}

// Fond de la carte : liste fermée, blanc par défaut (aucune classe).
$couturier_card_bg    = (string) ( $attributes['background'] ?? 'white' );
$couturier_card_extra = in_array( $couturier_card_bg, [ 'petrol-100', 'peach-300', 'petrol-50', 'orange-100', 'neutral-50' ], true )
    ? [ 'class' => 'is-bg-' . $couturier_card_bg ]
    : [];

$couturier_card_icon_id = empty( $attributes['iconId'] ) ? 0 : (int) $attributes['iconId'];
$couturier_card_badge   = '';

if ( 'offset' === ( $attributes['iconStyle'] ?? 'badge' ) ) {
    // Visuel décalé : `<img>` aux couleurs d'origine (srcset fourni par WordPress), décoratif.
    $couturier_card_extra['class'] = trim( ( $couturier_card_extra['class'] ?? '' ) . ' has-offset-visual' );

    $couturier_card_image = $couturier_card_icon_id
        ? wp_get_attachment_image(
            $couturier_card_icon_id,
            'medium',
            false,
            [
                'class'   => 'wp-block-couturier-icon-card__image',
                'alt'     => '',
                'loading' => 'lazy',
                'sizes'   => '260px',
            ]
        )
        : '';

    if ( $couturier_card_image ) {
        $couturier_card_badge = '<span class="wp-block-couturier-icon-card__badge is-offset">' . $couturier_card_image . '</span>';
    }
} elseif ( $couturier_card_icon_id
    && in_array( get_post_mime_type( $couturier_card_icon_id ), [ 'image/svg+xml', 'image/png', 'image/webp' ], true )
) {
    // Pastille : SVG en masque peint en `currentColor` ; PNG (converti en WebP à
    // l'upload) en `<img>`, couleurs d'origine. Décoratif dans les deux cas.
    $couturier_card_badge = 'image/svg+xml' !== get_post_mime_type( $couturier_card_icon_id )
        ? '<span class="wp-block-couturier-icon-card__badge">' . wp_get_attachment_image(
            $couturier_card_icon_id,
            'thumbnail',
            false,
            [
                'class'   => 'wp-block-couturier-icon-card__picture',
                'alt'     => '',
                'loading' => 'lazy',
                'sizes'   => '24px',
            ]
        ) . '</span>'
        : sprintf(
        '<span class="wp-block-couturier-icon-card__badge" aria-hidden="true"><span class="wp-block-couturier-icon-card__icon" style="%s"></span></span>',
        esc_attr( '--icon: url("' . esc_url( (string) wp_get_attachment_url( $couturier_card_icon_id ) ) . '")' )
    );
}

printf(
    '<li %s>%s%s</li>',
    get_block_wrapper_attributes( $couturier_card_extra ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_card_badge, // phpcs:ignore WordPress.Security.EscapeOutput -- construit et échappé ci-dessus.
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- titre et texte enregistrés.
);
