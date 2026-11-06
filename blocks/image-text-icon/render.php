<?php
/**
 * Rendu d'une icône du bloc « Image et texte » (`couturier/image-text-icon`).
 *
 * `<li>` : pictogramme (masque CSS peint en `currentColor`, décoratif) et
 * libellé, dans un lien si l'icône en a un. L'URL d'un contenu (page, article,
 * catégorie…) est recalculée à partir de son ID, et suit ainsi un changement de
 * permalien ; à défaut (contenu supprimé, URL saisie), l'URL enregistrée.
 * Nouvel onglet annoncé en texte masqué.
 *
 * Sans pictogramme (ou pièce jointe supprimée) ou sans libellé : rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : le libellé.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$couturier_icon_url = empty( $attributes['iconId'] ) ? false : wp_get_attachment_url( (int) $attributes['iconId'] );

if ( ! $couturier_icon_url
    || ! preg_match( '#<span class="wp-block-couturier-image-text-icon__label">(.*?)</span>#s', $content, $couturier_icon_label )
    || '' === trim( wp_strip_all_tags( $couturier_icon_label[1] ) )
) {
    return;
}

$couturier_icon_link = is_array( $attributes['link'] ?? null ) ? $attributes['link'] : [];
$couturier_icon_href = (string) ( $couturier_icon_link['url'] ?? '' );
$couturier_icon_id   = (int) ( $couturier_icon_link['id'] ?? 0 );

if ( $couturier_icon_id > 0 ) {
    $couturier_icon_kind = $couturier_icon_link['kind'] ?? '';

    if ( 'post-type' === $couturier_icon_kind && 'publish' === get_post_status( $couturier_icon_id ) ) {
        $couturier_icon_href = (string) get_permalink( $couturier_icon_id );
    } elseif ( 'taxonomy' === $couturier_icon_kind ) {
        $couturier_icon_term = get_term_link( $couturier_icon_id, (string) ( $couturier_icon_link['type'] ?? '' ) );
        $couturier_icon_href = is_wp_error( $couturier_icon_term ) ? $couturier_icon_href : $couturier_icon_term;
    }
}

$couturier_icon_href    = esc_url( $couturier_icon_href );
$couturier_icon_new_tab = $couturier_icon_href && ! empty( $couturier_icon_link['opensInNewTab'] );

$couturier_icon_inner = sprintf(
    '<span class="wp-block-couturier-image-text-icon__icon" aria-hidden="true" style="%s"></span><span class="wp-block-couturier-image-text-icon__label">%s</span>%s',
    esc_attr( '--icon: url("' . esc_url( $couturier_icon_url ) . '")' ),
    $couturier_icon_label[1], // phpcs:ignore WordPress.Security.EscapeOutput -- libellé enregistré.
    $couturier_icon_new_tab ? '<span class="visually-hidden"> ' . esc_html__( '(nouvel onglet)', 'couturier' ) . '</span>' : ''
);

printf(
    '<li %s>%s</li>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_icon_href
        ? sprintf(
            '<a class="wp-block-couturier-image-text-icon__link" href="%s"%s>%s</a>',
            $couturier_icon_href, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par esc_url().
            $couturier_icon_new_tab ? ' target="_blank" rel="noopener"' : '',
            $couturier_icon_inner // phpcs:ignore WordPress.Security.EscapeOutput -- construit ci-dessus.
        )
        : '<span class="wp-block-couturier-image-text-icon__link">' . $couturier_icon_inner . '</span>' // phpcs:ignore WordPress.Security.EscapeOutput -- construit ci-dessus.
);
