<?php
/**
 * Rendu d'une carte du héros de l'accueil (`couturier/home-hero-card`).
 *
 * Contenu enregistré : sur-titre (`p.__eyebrow`), titre (`core/heading`, `<h3>`),
 * texte (`p.__text`), libellé du bouton (`p.__button`), puis le contact : texte
 * (`p.__contact-title`), téléphone (`p.__contact-phone`), e-mail
 * (`p.__contact-email`).
 *
 * Rendu : `div.__body` (fond de la carte) — sur-titre, photo, titre, texte, puis le
 * bouton : le libellé devient un lien (`a.__button`) vers l'URL choisie ; puis
 * `div.__contact` (desktop seulement, CSS) — photo ronde (`contactImageId`), texte,
 * téléphone et e-mail en liens `tel:` / `mailto:`. L'URL d'un contenu (page, article, catégorie…) est recalculée à
 * partir de son ID et suit ainsi un changement de permalien ; à défaut (contenu
 * supprimé, URL saisie), l'URL enregistrée. Nouvel onglet annoncé en texte masqué.
 *
 * Sans titre : rien n'est rendu. Sans lien ou sans libellé : pas de bouton. Sans
 * texte de contact : pas de contact ; téléphone, e-mail et photo sont facultatifs
 * (un e-mail invalide n'est pas rendu).
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

// Sur-titre, libellé du bouton et champs du contact retirés du contenu, pour être
// replacés : `$couturier_hero_card_parts[ champ ]` = HTML intérieur du `<p>`.
$couturier_hero_card_eyebrow = '';
$couturier_hero_card_parts   = [];

$couturier_hero_card_content = (string) preg_replace_callback(
    '#<p class="wp-block-couturier-home-hero-card__(eyebrow|button|contact-title|contact-phone|contact-email)">(.*?)</p>#s',
    static function ( array $match ) use ( &$couturier_hero_card_eyebrow, &$couturier_hero_card_parts ): string {
        if ( 'eyebrow' === $match[1] ) {
            $couturier_hero_card_eyebrow = $match[0];
        } else {
            $couturier_hero_card_parts[ $match[1] ] = trim( $match[2] );
        }

        return '';
    },
    $couturier_hero_card_content
);

$couturier_hero_card_label = $couturier_hero_card_parts['button'] ?? '';

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

// ─── Contact ──────────────────────────────────────────────────────────────────
$couturier_hero_card_contact = '';
$couturier_hero_card_ctitle  = $couturier_hero_card_parts['contact-title'] ?? '';

if ( '' !== trim( wp_strip_all_tags( $couturier_hero_card_ctitle ) ) ) {
    $couturier_hero_card_details = [];

    // Téléphone : lien `tel:` sur les chiffres, numéro français (0X…) au format
    // international ; texte affiché tel que saisi.
    $couturier_hero_card_phone  = trim( wp_strip_all_tags( $couturier_hero_card_parts['contact-phone'] ?? '' ) );
    $couturier_hero_card_digits = preg_replace( '/[^\d+]/', '', $couturier_hero_card_phone ) ?? '';

    if ( '' !== $couturier_hero_card_digits ) {
        $couturier_hero_card_digits    = preg_match( '/^0\d{9}$/', $couturier_hero_card_digits ) ? '+33' . substr( $couturier_hero_card_digits, 1 ) : $couturier_hero_card_digits;
        $couturier_hero_card_details[] = sprintf(
            '<a class="wp-block-couturier-home-hero-card__contact-phone" href="%s">%s</a>',
            esc_url( 'tel:' . $couturier_hero_card_digits, [ 'tel' ] ),
            esc_html( $couturier_hero_card_phone )
        );
    }

    $couturier_hero_card_email = trim( wp_strip_all_tags( html_entity_decode( $couturier_hero_card_parts['contact-email'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) );

    if ( is_email( $couturier_hero_card_email ) ) {
        $couturier_hero_card_details[] = sprintf(
            '<a class="wp-block-couturier-home-hero-card__contact-email" href="%s">%s</a>',
            esc_url( 'mailto:' . $couturier_hero_card_email, [ 'mailto' ] ),
            esc_html( $couturier_hero_card_email )
        );
    }

    // Photo ronde (66 px), `alt` de la médiathèque. Masquée en mobile avec le
    // contact : chargement différé, elle n'y est pas téléchargée.
    $couturier_hero_card_cphoto = empty( $attributes['contactImageId'] ) ? '' : wp_get_attachment_image(
        (int) $attributes['contactImageId'],
        'thumbnail',
        false,
        [
            'class'   => 'wp-block-couturier-home-hero-card__contact-image',
            'sizes'   => '66px',
            'loading' => 'lazy',
        ]
    );

    $couturier_hero_card_contact = sprintf(
        '<div class="wp-block-couturier-home-hero-card__contact">%s<div class="wp-block-couturier-home-hero-card__contact-body"><p class="wp-block-couturier-home-hero-card__contact-title">%s</p>%s</div></div>',
        $couturier_hero_card_cphoto ? '<div class="wp-block-couturier-home-hero-card__contact-photo">' . $couturier_hero_card_cphoto . '</div>' : '',
        $couturier_hero_card_ctitle,
        $couturier_hero_card_details
            ? '<p class="wp-block-couturier-home-hero-card__contact-details">' . implode( '<span aria-hidden="true"> - </span>', $couturier_hero_card_details ) . '</p>'
            : ''
    );
}

printf(
    '<div %s><div class="wp-block-couturier-home-hero-card__body">%s%s%s%s</div>%s</div>',
    get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput -- échappé par WordPress.
    $couturier_hero_card_eyebrow, // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
    $couturier_hero_card_image ? '<div class="wp-block-couturier-home-hero-card__media">' . $couturier_hero_card_image . '</div>' : '', // phpcs:ignore WordPress.Security.EscapeOutput -- produit par WordPress.
    trim( $couturier_hero_card_content ), // phpcs:ignore WordPress.Security.EscapeOutput -- contenu enregistré.
    $couturier_hero_card_button, // phpcs:ignore WordPress.Security.EscapeOutput -- URL échappée, libellé enregistré.
    $couturier_hero_card_contact // phpcs:ignore WordPress.Security.EscapeOutput -- échappé ci-dessus, texte enregistré.
);
