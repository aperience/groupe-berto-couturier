<?php
/**
 * Attribut `sizes` des images des blocs custom
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blocks;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use WP_HTML_Tag_Processor;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Retire le `auto` que WordPress ajoute à l'attribut `sizes` des images en chargement
 * différé, pour les seules images des blocs custom (classe
 * `wp-block-couturier-{nom}__image`, posée par leur `render.php`).
 *
 * `sizes="auto, …"` demande au navigateur de choisir la source d'après la largeur
 * affichée de l'image. Une image dont la largeur dépend de ses propres dimensions
 * (`width: auto`, cf. l'image du CTA sur grand écran) n'en a pas avant d'être
 * chargée : le navigateur retient alors sa largeur par défaut, 300 px, et l'image
 * s'affiche en 300 px de large. Le `sizes` écrit par le bloc, qui donne la largeur
 * réelle, suffit.
 *
 * Le `auto` est ajouté par `wp_filter_content_tags()`, après le rendu des blocs :
 * seul le filtre `wp_content_img_tag`, appelé ensuite, peut le retirer.
 */
final class BlockImageSizes implements FeatureInterface {

    /** Classe des images des blocs custom : `wp-block-couturier-{nom}__image`. */
    private const CLASS_PATTERN = '/(?:^|\s)wp-block-couturier-[a-z0-9-]+__image(?:\s|$)/';

    /** Enregistre le filtre des balises `<img>` du contenu. */
    public function register(): void {
        add_filter( 'wp_content_img_tag', [ $this, 'remove_auto_sizes' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Affiche les images des blocs sur mesure à leur taille prévue, même en chargement différé.', 'couturier' );
    }

    /**
     * Retire `auto` de l'attribut `sizes` d'une image de bloc custom.
     *
     * @param string $image Balise `<img>`.
     * @return string
     */
    public function remove_auto_sizes( string $image ): string {
        $processor = new WP_HTML_Tag_Processor( $image );

        if ( ! $processor->next_tag( 'img' ) ) {
            return $image;
        }

        $class = $processor->get_attribute( 'class' );
        $sizes = $processor->get_attribute( 'sizes' );

        if ( ! is_string( $class ) || ! is_string( $sizes ) || ! preg_match( self::CLASS_PATTERN, $class ) ) {
            return $image;
        }

        $without_auto = preg_replace( '/^\s*auto\s*(,\s*)?/i', '', $sizes );

        if ( $without_auto === $sizes ) {
            return $image;
        }

        $processor->set_attribute( 'sizes', $without_auto );

        return $processor->get_updated_html();
    }
}
