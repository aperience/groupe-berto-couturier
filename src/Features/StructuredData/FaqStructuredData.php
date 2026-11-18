<?php
/**
 * Données structurées FAQ ajoutées au graphe de Rank Math
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\StructuredData;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Theme\Features\Admin\HelpScreen;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute un nœud `FAQPage` au JSON-LD de Rank Math (filtre `rank_math/json_ld`)
 * sur les pages et articles qui contiennent des blocs « Questions fréquentes ».
 * Rank Math ne lit que son propre bloc FAQ : ceux du thème lui sont invisibles.
 *
 * **Rank Math reste maître** : tout ce qui se règle dans son admin relève de
 * l'experte SEO. Si le graphe contient déjà un `FAQPage` (schéma ajouté à la
 * main dans Rank Math), le thème n'en ajoute pas un second.
 *
 * Rank Math fusionne ensuite ce nœud dans celui de la page : `@type` devient
 * `["WebPage", "FAQPage"]` sur `#webpage`, avec les questions en `mainEntity`
 * (même sortie que pour son propre bloc FAQ). L'`@id` posé ici disparaît alors.
 *
 * Sans Rank Math, le filtre n'est jamais appelé : rien n'est produit.
 */
final class FaqStructuredData implements FeatureInterface {

    /** Clé du nœud dans le graphe de Rank Math. */
    private const KEY = 'couturier_faq';

    public function register(): void {
        add_filter( 'rank_math/json_ld', [ $this, 'add' ], 99 );
        add_filter( HelpScreen::TABS_FILTER, [ $this, 'help_tab' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Reprend les blocs « Questions fréquentes » dans les données structurées (FAQPage) produites par Rank Math.', 'couturier' );
    }

    /**
     * Ajoute le nœud FAQ.
     *
     * @param mixed $data Graphe de Rank Math.
     * @return mixed
     */
    public function add( mixed $data ): mixed {
        if ( ! is_array( $data ) || ! is_singular() || $this->has_faq( $data ) ) {
            return $data;
        }

        $post = get_queried_object();
        // Filtre rapide ; has_block() ne voit pas dans les blocs réutilisables, d'où core/block.
        if ( ! $post instanceof \WP_Post
            || ( ! has_block( 'couturier/faq-item', $post ) && ! has_block( 'core/block', $post ) ) ) {
            return $data;
        }

        $url = get_permalink( $post );
        if ( ! $url ) {
            return $data;
        }

        $node = FaqSchema::build( $post->post_content, $url );
        if ( null !== $node ) {
            $data[ self::KEY ] = $node;
        }

        return $data;
    }

    /**
     * Le graphe contient-il déjà un `FAQPage` ?
     *
     * @param array<mixed> $data Graphe de Rank Math.
     */
    private function has_faq( array $data ): bool {
        foreach ( $data as $node ) {
            $type = is_array( $node ) ? ( $node['@type'] ?? null ) : null;
            if ( 'FAQPage' === $type || ( is_array( $type ) && in_array( 'FAQPage', $type, true ) ) ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Onglet « Données structurées » de la page d'aide.
     *
     * @param array<string, array<string, mixed>> $tabs Onglets déclarés.
     * @return array<string, array<string, mixed>>
     */
    public function help_tab( array $tabs ): array {
        $tabs['structured-data'] = [
            'label'    => __( 'Données structurées', 'couturier' ),
            'priority' => 40,
            'context'  => [
                'rich_results_url' => 'https://search.google.com/test/rich-results',
                'validator_url'    => 'https://validator.schema.org/',
            ],
        ];

        return $tabs;
    }
}
