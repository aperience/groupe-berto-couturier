<?php
/**
 * Fond d'une carte de bloc, choisi dans une liste fermée (`blocks/_shared/backgrounds.js`).
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Support;

use WP_Block;

/**
 * Classe `is-bg-{slug}` d'une carte, d'après l'attribut `background` et son `enum`
 * dans le `block.json` du bloc : une seule liste par bloc, côté éditeur comme côté
 * serveur. Fond par défaut du bloc, absent ou hors liste : aucune classe.
 */
final class CardBackground {

    /** Classe du fond, ou chaîne vide. */
    public static function class_name( array $attributes, WP_Block $block ): string {
        $definition = $block->block_type->attributes['background'] ?? [];
        $slug       = (string) ( $attributes['background'] ?? '' );

        if ( '' === $slug
            || $slug === ( $definition['default'] ?? null )
            || ! in_array( $slug, (array) ( $definition['enum'] ?? [] ), true )
        ) {
            return '';
        }

        return 'is-bg-' . $slug;
    }
}
