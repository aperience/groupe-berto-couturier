<?php
/**
 * Réglage « Rapprocher du bloc précédent » des blocs du thème
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
 * Écart réduit entre deux blocs d'une même section.
 *
 * Chaque bloc du thème est séparé de ses voisins par l'espace entre sections
 * (`--layout-section-gap` : 48 px en mobile, 96 px en desktop). Coché, le réglage
 * « Rapprocher du bloc précédent » le réduit à 32 px au-dessus du bloc, pour deux
 * blocs que la maquette présente comme un seul ensemble (ex. « Image et texte »
 * suivi des « Cartes à pictogramme »). Styles : `resources/scss/block/_attached.scss`.
 *
 * **Le réglage est un attribut** (`isAttached`), déclaré ici sur les blocs
 * `couturier/*` de premier niveau (sans `parent`) et stocké dans le commentaire du
 * bloc, jamais dans son HTML : la classe `is-attached` est ajoutée au rendu
 * (`render_block`) et, dans l'éditeur, par `resources/js/editor/attached-blocks.js`.
 * Aucun `save()` n'est concerné — aucun bloc invalide si le script venait à manquer,
 * ou si la feature était retirée (l'écart redeviendrait celui des sections).
 */
final class AttachedBlocks implements FeatureInterface {

    /** Script de l'éditeur (interrupteur, classe dans le canvas), relatif à la racine du thème. */
    private const SCRIPT = 'resources/js/editor/attached-blocks.js';

    /** Attribut du réglage. */
    private const ATTRIBUTE = 'isAttached';

    /** Classe posée sur le bloc quand le réglage est coché. */
    private const CLASS_NAME = 'is-attached';

    /**
     * @param ThemeContext $context Identité du thème : espace de noms des blocs, handle du script.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre l'attribut, le rendu de la classe et le script de l'éditeur. */
    public function register(): void {
        add_filter( 'register_block_type_args', [ $this, 'add_attribute' ], 10, 2 );
        add_filter( 'render_block', [ $this, 'render_class' ], 10, 2 );
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_editor_script' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Ajoute aux blocs du thème le réglage « Rapprocher du bloc précédent » : écart réduit entre deux blocs d\'une même section.', 'couturier' );
    }

    /**
     * Attribut `isAttached` sur les blocs du thème de premier niveau.
     *
     * @param array  $args       Arguments du type de bloc.
     * @param string $block_type Nom du bloc.
     * @return array
     */
    public function add_attribute( array $args, string $block_type ): array {
        if ( ! $this->is_root_block( $block_type, $args ) ) {
            return $args;
        }

        $args['attributes'][ self::ATTRIBUTE ] = [
            'type'    => 'boolean',
            'default' => false,
        ];

        return $args;
    }

    /**
     * Ajoute la classe `is-attached` à l'élément racine du bloc rendu.
     *
     * @param string $block_content HTML rendu du bloc.
     * @param array  $block         Bloc analysé (nom, attributs…).
     * @return string
     */
    public function render_class( string $block_content, array $block ): string {
        if ( empty( $block['attrs'][ self::ATTRIBUTE ] ) || '' === trim( $block_content )
            || ! str_starts_with( (string) ( $block['blockName'] ?? '' ), $this->context->block_namespace . '/' )
        ) {
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

        $handle = $this->context->handle( 'attached-blocks' );

        wp_register_script(
            $handle,
            false,
            [ 'wp-hooks', 'wp-compose', 'wp-element', 'wp-blocks', 'wp-block-editor', 'wp-components', 'wp-i18n' ],
            null,
            true
        );
        wp_enqueue_script( $handle );
        wp_add_inline_script( $handle, (string) file_get_contents( $path ) );
    }

    /**
     * Bloc du thème sans parent imposé (enfants : carte, question, colonne… exclus).
     *
     * @param string $block_type Nom du bloc.
     * @param array  $args       Arguments du type de bloc.
     */
    private function is_root_block( string $block_type, array $args ): bool {
        return str_starts_with( $block_type, $this->context->block_namespace . '/' ) && empty( $args['parent'] );
    }
}
