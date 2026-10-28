<?php
/**
 * Pied de page : données exposées aux templates
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Footer;

use Deefuse\ThemeCore\Contracts\FeatureInterface;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute `footer` au contexte Timber de toutes les pages :
 * `{ certifications: [{ image, url }], copyright }` — certifications actives seulement.
 *
 * `image` est le HTML de `wp_get_attachment_image()` (chargement différé), avec le
 * texte alternatif de la médiathèque, à défaut le titre de l'image : le logo est
 * souvent le seul contenu de son lien.
 *
 * **Taille `full`, et non `medium`** : le CSS ne fixe qu'une hauteur maximale, la
 * taille affichée est donc la taille intrinsèque de l'image, que le navigateur
 * déduit de l'attribut `sizes`. En `medium`, `sizes` annonce 300 px de large même
 * pour un fichier plus petit, qui serait alors agrandi ; en `full`, il annonce la
 * largeur du fichier : un logo n'est jamais affiché plus grand que lui.
 */
final class FooterContext implements FeatureInterface {

    /** Enregistre l'ajout au contexte. */
    public function register(): void {
        add_filter( 'timber/context', [ $this, 'add_to_context' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Expose aux templates les réglages du pied de page (certifications, copyright).', 'couturier' );
    }

    /**
     * Ajoute `footer` au contexte.
     *
     * @param array<string, mixed> $context Contexte Timber.
     * @return array<string, mixed>
     */
    public function add_to_context( array $context ): array {
        $context['footer'] = [
            'certifications' => array_map(
                static fn( array $certification ): array => [
                    'image' => wp_get_attachment_image(
                        $certification['image_id'],
                        'full',
                        false,
                        [
                            'alt'     => Footer::image_alt( $certification['image_id'] ),
                            'class'   => 'footer-certifications__logo',
                            'loading' => 'lazy',
                        ]
                    ),
                    'url'   => $certification['url'],
                ],
                Footer::active_certifications()
            ),
            'copyright'      => Footer::copyright(),
        ];

        return $context;
    }
}
