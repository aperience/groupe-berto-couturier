<?php
/**
 * Alignement des titres libres (`core/heading`)
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blocks;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;
use WP_HTML_Tag_Processor;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Alignement « à gauche » ou « centré » (défaut) des titres libres.
 *
 * Le support natif `typography.textAlign` n'est pas utilisé : retiré par
 * `DisableNativeBlockSupports`, il proposerait aussi « à droite », et vaudrait pour
 * les titres imbriqués des blocs du thème, dont l'alignement relève du bloc.
 *
 * **Le réglage est un attribut** (`textAlignment` — pas `textAlign`, nom de
 * l'ancien attribut du core, que les `deprecated` de `core/heading` migreraient),
 * stocké dans le commentaire du bloc, jamais dans son HTML : la classe
 * `has-text-align-left` est ajoutée au rendu (`render_block`) et, dans l'éditeur,
 * par `resources/js/editor/heading-text-align.js`, qui n'affiche le réglage que
 * sur les titres de premier niveau. Styles : `resources/scss/block/_section-title.scss`.
 */
final class HeadingTextAlign implements FeatureInterface {

    /** Script de l'éditeur, relatif à la racine du thème. */
    private const SCRIPT = 'resources/js/editor/heading-text-align.js';

    /** Attribut du réglage. */
    private const ATTRIBUTE = 'textAlignment';

    /** Classe posée sur le titre aligné à gauche. */
    private const CLASS_NAME = 'has-text-align-left';

    /**
     * @param ThemeContext $context Identité du thème : handle du script.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre l'attribut, le rendu de la classe et le script de l'éditeur. */
    public function register(): void {
        add_filter( 'register_block_type_args', [ $this, 'add_attribute' ], 10, 2 );
        add_filter( 'render_block_core/heading', [ $this, 'render_class' ], 10, 2 );
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_editor_script' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Propose d\'aligner les titres libres à gauche ou au centre (par défaut).', 'couturier' );
    }

    /**
     * Attribut `textAlignment` sur `core/heading`.
     *
     * @param array  $args       Arguments du type de bloc.
     * @param string $block_type Nom du bloc.
     * @return array
     */
    public function add_attribute( array $args, string $block_type ): array {
        if ( 'core/heading' !== $block_type ) {
            return $args;
        }

        $args['attributes'][ self::ATTRIBUTE ] = [
            'type'    => 'string',
            'enum'    => [ 'left', 'center' ],
            'default' => 'center',
        ];

        return $args;
    }

    /**
     * Ajoute `has-text-align-left` au titre aligné à gauche.
     *
     * @param string $block_content HTML rendu du bloc.
     * @param array  $block         Bloc analysé.
     * @return string
     */
    public function render_class( string $block_content, array $block ): string {
        if ( 'left' !== ( $block['attrs'][ self::ATTRIBUTE ] ?? 'center' ) ) {
            return $block_content;
        }

        $processor = new WP_HTML_Tag_Processor( $block_content );

        if ( $processor->next_tag() ) {
            $processor->add_class( self::CLASS_NAME );
        }

        return $processor->get_updated_html();
    }

    /** Injecte le script dans l'éditeur, sur un handle sans source. */
    public function enqueue_editor_script(): void {
        $path = get_theme_file_path( self::SCRIPT );

        if ( ! is_readable( $path ) ) {
            return;
        }

        $handle = $this->context->handle( 'heading-text-align' );

        wp_register_script(
            $handle,
            false,
            [ 'wp-hooks', 'wp-compose', 'wp-element', 'wp-data', 'wp-block-editor', 'wp-i18n' ],
            null,
            true
        );
        wp_enqueue_script( $handle );
        wp_add_inline_script( $handle, (string) file_get_contents( $path ) );
    }
}
