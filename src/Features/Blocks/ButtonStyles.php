<?php
/**
 * Boutons du design system sur les blocs core/buttons et core/button
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
 * Habille `core/button` aux couleurs du design system : cinq styles de bloc et une
 * flèche optionnelle. Le balisage reste celui du core, rendu par le CSS du thème
 * (`resources/scss/block/_button.scss`).
 *
 * **Tout se déclare côté serveur**, sur `register_block_type_args` : la définition du
 * bloc est transmise à l'éditeur, où elle l'emporte sur les métadonnées du core
 * (`ADD_BOOTSTRAPPED_BLOCK_TYPE` ignore une définition déjà présente). On y remplace :
 *
 * - les styles (`fill` / `outline` du core) par ceux du design system ;
 * - les supports de mise en forme libre (bordure, ombre, espacements, largeur) par
 *   rien : le bouton n'a que les variantes du thème. Couleur et typographie sont déjà
 *   retirées par `DisableNativeBlockSupports` (socle).
 *
 * **La flèche est un attribut** (`hasArrow`), stocké dans le commentaire du bloc et non
 * dans son HTML : la classe `has-arrow` est ajoutée au rendu (`render_block`) et, dans
 * l'éditeur, par `resources/js/editor/button.js`. Le `save()` du core est donc
 * inchangé — aucun bloc invalide si le script venait à manquer, ou si la feature
 * était retirée (la flèche disparaîtrait simplement).
 *
 * Le même script retire les formats « Gras » et « Italique » de la barre d'outils du
 * bouton, dont le texte suit le style « Button » du design system.
 */
final class ButtonStyles implements FeatureInterface {

    /** Script de l'éditeur (flèche, formats du texte), relatif à la racine du thème. */
    private const SCRIPT = 'resources/js/editor/button.js';

    /** Supports de `core/button` sans objet : mise en forme libre. */
    private const BUTTON_SUPPORTS_OFF = [ '__experimentalBorder', 'shadow', 'spacing', 'dimensions' ];

    /** Supports de `core/buttons` sans objet : seule la mise en page (alignement) est gardée. */
    private const BUTTONS_SUPPORTS_OFF = [ '__experimentalBorder', 'spacing' ];

    /**
     * @param ThemeContext $context Identité du thème, pour le handle du script.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre les définitions de blocs, le rendu de la flèche et le script de l'éditeur. */
    public function register(): void {
        add_filter( 'register_block_type_args', [ $this, 'customize_blocks' ], 10, 2 );
        add_filter( 'render_block_core/button', [ $this, 'render_arrow' ], 10, 2 );
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_editor_script' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Propose les boutons du design system (cinq styles, flèche optionnelle) à la place des réglages libres du bloc Bouton.', 'couturier' );
    }

    /**
     * Styles, attribut de la flèche et supports de `core/button` ; supports de `core/buttons`.
     *
     * @param array  $args       Arguments du type de bloc.
     * @param string $block_type Nom du bloc.
     * @return array
     */
    public function customize_blocks( array $args, string $block_type ): array {
        if ( 'core/buttons' === $block_type ) {
            foreach ( self::BUTTONS_SUPPORTS_OFF as $support ) {
                $args['supports'][ $support ] = false;
            }

            return $args;
        }

        if ( 'core/button' !== $block_type ) {
            return $args;
        }

        foreach ( self::BUTTON_SUPPORTS_OFF as $support ) {
            $args['supports'][ $support ] = false;
        }

        $args['styles'] = [
            [ 'name' => 'primary', 'label' => __( 'Orange', 'couturier' ), 'isDefault' => true ],
            [ 'name' => 'outline', 'label' => __( 'Contour', 'couturier' ) ],
            [ 'name' => 'secondary', 'label' => __( 'Pétrole', 'couturier' ) ],
            [ 'name' => 'deep', 'label' => __( 'Pétrole foncé', 'couturier' ) ],
            [ 'name' => 'ghost', 'label' => __( 'Transparent', 'couturier' ) ],
        ];

        $args['attributes']['hasArrow'] = [
            'type'    => 'boolean',
            'default' => false,
        ];

        return $args;
    }

    /**
     * Ajoute la classe `has-arrow` à l'enveloppe du bouton (`div.wp-block-button`).
     *
     * @param string $block_content HTML rendu du bloc.
     * @param array  $block         Bloc analysé (nom, attributs…).
     * @return string
     */
    public function render_arrow( string $block_content, array $block ): string {
        if ( empty( $block['attrs']['hasArrow'] ) ) {
            return $block_content;
        }

        $processor = new WP_HTML_Tag_Processor( $block_content );

        if ( $processor->next_tag( [ 'class_name' => 'wp-block-button' ] ) ) {
            $processor->add_class( 'has-arrow' );
        }

        return $processor->get_updated_html();
    }

    /** Injecte le script du bloc dans l'éditeur, sur un handle sans source. */
    public function enqueue_editor_script(): void {
        $path = get_theme_file_path( self::SCRIPT );

        if ( ! is_readable( $path ) ) {
            return;
        }

        $handle = $this->context->handle( 'button' );

        wp_register_script(
            $handle,
            false,
            [ 'wp-hooks', 'wp-compose', 'wp-element', 'wp-data', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-rich-text', 'wp-format-library' ],
            null,
            true
        );
        wp_enqueue_script( $handle );
        wp_add_inline_script( $handle, (string) file_get_contents( $path ) );
    }
}
