<?php
/**
 * Rendu d'un atout du bloc « Réassurance » (`couturier/reassurance-item`).
 *
 * `<li>` : pastille du pictogramme (masque CSS peint en `currentColor`,
 * décoratif), puis le contenu enregistré dans `__body` — titre
 * (`core/heading`, `<h3>`) et texte (`p.wp-block-couturier-reassurance-item__text`).
 *
 * Avec un lien, le texte du titre est placé dans un `<a>` dont le `::after`
 * couvre tout l'atout (`block/_reassurance.scss`) : une seule cible, nommée par
 * le titre. L'URL d'un contenu (page, article, catégorie…) est recalculée à
 * partir de son ID et suit ainsi un changement de permalien ; à défaut (contenu
 * supprimé, URL saisie), l'URL enregistrée. Nouvel onglet annoncé en texte masqué.
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

if ( ! preg_match( '#^\s*<h([2-6])\b[^>]*>(.*?)</h\1>#s', $content, $couturier_item_title )
    || '' === trim( wp_strip_all_tags( $couturier_item_title[2] ) )
) {
    return;
}

// ─── Lien ─────────────────────────────────────────────────────────────────────
$couturier_item_link = is_array( $attributes['link'] ?? null ) ? $attributes['link'] : [];
$couturier_item_href = (string) ( $couturier_item_link['url'] ?? '' );
$couturier_item_id   = (int) ( $couturier_item_link['id'] ?? 0 );

if ( $couturier_item_id > 0 ) {
    $couturier_item_kind = $couturier_item_link['kind'] ?? '';

    if ( 'post-type' === $couturier_item_kind && 'publish' === get_post_status( $couturier_item_id ) ) {
        $couturier_item_href = (string) get_permalink( $couturier_item_id );
    } elseif ( 'taxonomy' === $couturier_item_kind ) {
        $couturier_item_term = get_term_link( $couturier_item_id, (string) ( $couturier_item_link['type'] ?? '' ) );
        $couturier_item_href = is_wp_error( $couturier_item_term ) ? $couturier_item_href : $couturier_item_term;
    }
}

$couturier_item_href    = esc_url( $couturier_item_href );
$couturier_item_new_tab = $couturier_item_href && ! empty( $couturier_item_link['opensInNewTab'] );

if ( $couturier_item_href ) {
    // Texte du titre enveloppé dans le lien ; la balise du titre est conservée.
    $content = (string) preg_replace_callback(
        '#(<h([2-6])\b[^>]*>)(.*?)(</h\2>)#s',
        static fn( array $match ): string => sprintf(
            '%s<a class="wp-block-couturier-reassurance-item__link" href="%s"%s>%s%s</a>%s',
            $match[1],
            $couturier_item_href,
            $couturier_item_new_tab ? ' target="_blank" rel="noopener"' : '',
            $match[3],
            $couturier_item_new_tab ? '<span class="visually-hidden"> ' . esc_html__( '(nouvel onglet)', 'couturier' ) . '</span>' : '',
            $match[4]
        ),
        $content,
        1
    );
}

// ─── Pictogramme ──────────────────────────────────────────────────────────────
$couturier_item_icon = empty( $attributes['iconId'] ) ? false : wp_get_attachment_url( (int) $attributes['iconId'] );

printf(
    '<li %s>%s<div class="wp-block-couturier-reassurance-item__body">%s</div></li>',
    get_block_wrapper_attributes( [ 'class' => $couturier_item_href ? 'has-link' : '' ] ), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_item_icon
        ? sprintf(
            '<span class="wp-block-couturier-reassurance-item__badge" aria-hidden="true"><span class="wp-block-couturier-reassurance-item__icon" style="%s"></span></span>',
            esc_attr( '--icon: url("' . esc_url( $couturier_item_icon ) . '")' )
        )
        : '',
    trim( $content ) // phpcs:ignore WordPress.Security.EscapeOutput -- titre et texte enregistrés.
);
