<?php
/**
 * Rendu d'un logo du bloc « Logos partenaires » (`couturier/logo-strip-item`).
 *
 * `<li>` : logo (image décorative, `alt=""` : la légende le nomme) ou, à
 * défaut, cercle coloré, puis légende ; dans un lien si le logo en a un. L'URL
 * d'un contenu est recalculée à partir de son ID (cf. `image-text-icon`).
 * Nouvel onglet annoncé en texte masqué. Sans légende : rien n'est rendu.
 *
 * @package Couturier
 *
 * @var array    $attributes Attributs du bloc.
 * @var string   $content    HTML enregistré : la légende.
 * @var WP_Block $block      Instance du bloc.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! preg_match( '#<span class="wp-block-couturier-logo-strip-item__caption">(.*?)</span>#s', $content, $couturier_logo_caption )
    || '' === trim( wp_strip_all_tags( $couturier_logo_caption[1] ) )
) {
    return;
}

$couturier_logo_link = is_array( $attributes['link'] ?? null ) ? $attributes['link'] : [];
$couturier_logo_href = (string) ( $couturier_logo_link['url'] ?? '' );
$couturier_logo_id   = (int) ( $couturier_logo_link['id'] ?? 0 );

if ( $couturier_logo_id > 0 ) {
    $couturier_logo_kind = $couturier_logo_link['kind'] ?? '';

    if ( 'post-type' === $couturier_logo_kind && 'publish' === get_post_status( $couturier_logo_id ) ) {
        $couturier_logo_href = (string) get_permalink( $couturier_logo_id );
    } elseif ( 'taxonomy' === $couturier_logo_kind ) {
        $couturier_logo_term = get_term_link( $couturier_logo_id, (string) ( $couturier_logo_link['type'] ?? '' ) );
        $couturier_logo_href = is_wp_error( $couturier_logo_term ) ? $couturier_logo_href : $couturier_logo_term;
    }
}

$couturier_logo_href    = esc_url( $couturier_logo_href );
$couturier_logo_new_tab = $couturier_logo_href && ! empty( $couturier_logo_link['opensInNewTab'] );

$couturier_logo_image = empty( $attributes['imageId'] ) ? '' : wp_get_attachment_image(
    (int) $attributes['imageId'],
    'medium',
    false,
    [
        'class'    => 'wp-block-couturier-logo-strip-item__image',
        'alt'      => '',
        'loading'  => 'lazy',
        'decoding' => 'async',
    ]
);

$couturier_logo_inner = sprintf(
    '%s<span class="wp-block-couturier-logo-strip-item__caption">%s</span>%s',
    $couturier_logo_image
        ? '<span class="wp-block-couturier-logo-strip-item__media">' . $couturier_logo_image . '</span>'
        : '<span class="wp-block-couturier-logo-strip-item__media is-empty"></span>',
    $couturier_logo_caption[1], // phpcs:ignore WordPress.Security.EscapeOutput -- légende enregistrée.
    $couturier_logo_new_tab ? '<span class="visually-hidden"> ' . esc_html__( '(nouvel onglet)', 'couturier' ) . '</span>' : ''
);

printf(
    '<li %s>%s</li>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_logo_href
        ? sprintf(
            '<a class="wp-block-couturier-logo-strip-item__link" href="%s"%s>%s</a>',
            $couturier_logo_href, // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par esc_url().
            $couturier_logo_new_tab ? ' target="_blank" rel="noopener"' : '',
            $couturier_logo_inner // phpcs:ignore WordPress.Security.EscapeOutput -- construit ci-dessus.
        )
        : '<span class="wp-block-couturier-logo-strip-item__link">' . $couturier_logo_inner . '</span>' // phpcs:ignore WordPress.Security.EscapeOutput -- construit ci-dessus.
);
