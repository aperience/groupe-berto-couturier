<?php
/**
 * Rendu du bloc « Cartes photo » (`couturier/photo-cards`) : piste défilante
 * (`<ul>`) des cartes rendues (`photo-card/render.php`), puis les flèches
 * « Cartes précédentes » / « Cartes suivantes ».
 *
 * Les flèches sont rendues `hidden` : `resources/js/photo-cards.js` les affiche
 * en desktop quand les cartes dépassent la ligne. Sans ce script, la piste garde
 * sa barre de défilement native.
 *
 * « Boutons de défilement » décochés (`scrollButtons`) : pas de flèches, classe
 * `is-wrapped` : en desktop, les cartes passent à la ligne.
 *
 * Aucune carte titrée : rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML des cartes rendues.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! str_contains( $content, '<li' ) ) {
    return;
}

$couturier_cards_size  = in_array( $attributes['size'] ?? '', [ 'large', 'xlarge', 'xxlarge' ], true ) ? $attributes['size'] : 'small';
$couturier_cards_track = wp_unique_id( 'photo-cards-' );
$couturier_cards_nav   = false !== ( $attributes['scrollButtons'] ?? true );

// « Précédent » rendu désactivé : au chargement, la piste est à son début. Le
// script n'a donc rien à griser, et la transition d'opacité ne montre pas la
// flèche orange avant de la griser.
$couturier_cards_arrow = static fn( string $direction, string $label, bool $disabled ): string => sprintf(
    '<button type="button" class="wp-block-couturier-photo-cards__arrow is-%1$s" aria-controls="%2$s" aria-disabled="%3$s" hidden><span class="visually-hidden">%4$s</span></button>',
    esc_attr( $direction ),
    esc_attr( $couturier_cards_track ),
    $disabled ? 'true' : 'false',
    esc_html( $label )
);

printf(
    '<div %s><ul class="wp-block-couturier-photo-cards__track" id="%s">%s</ul>%s</div>',
    get_block_wrapper_attributes( [ 'class' => 'is-size-' . $couturier_cards_size . ( $couturier_cards_nav ? '' : ' is-wrapped' ) ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    esc_attr( $couturier_cards_track ),
    trim( $content ), // phpcs:ignore WordPress.Security.EscapeOutput -- cartes rendues.
    $couturier_cards_nav ? '<div class="wp-block-couturier-photo-cards__nav">' . $couturier_cards_arrow( 'prev', __( 'Cartes précédentes', 'couturier' ), true ) . $couturier_cards_arrow( 'next', __( 'Cartes suivantes', 'couturier' ), false ) . '</div>' : '' // phpcs:ignore WordPress.Security.EscapeOutput -- échappé ci-dessus.
);
