<?php
/**
 * Image du héros des archives de catégorie
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blog;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Theme\Features\Admin\HelpScreen;
use WP_Term;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Champ « Image du héros » des catégories (méta de terme `couturier_hero_image`,
 * ID de la médiathèque), et `term_hero` dans le contexte Timber des archives de
 * catégorie : le HTML du bloc « Héros de page » (`couturier/page-hero`) construit
 * à la volée — H1 = nom, texte = description, visuel = l'image. Balisage, styles,
 * fil d'Ariane et rendu sans image restent ceux du bloc.
 *
 * Script de l'écran : `resources/js/editor/category-image.js`, en ligne, sans build.
 */
final class CategoryImage implements FeatureInterface {

    /** Méta de terme : ID de l'image. */
    public const META = 'couturier_hero_image';

    private const SCRIPT = 'resources/js/editor/category-image.js';
    private const NONCE  = 'couturier_category_image_nonce';

    public function register(): void {
        add_action( 'init', [ $this, 'register_meta' ] );
        add_action( 'category_add_form_fields', [ $this, 'render_add_field' ] );
        add_action( 'category_edit_form_fields', [ $this, 'render_edit_field' ] );
        add_action( 'created_category', [ $this, 'save' ] );
        add_action( 'edited_category', [ $this, 'save' ] );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue' ] );
        add_filter( 'timber/context', [ $this, 'add_to_context' ] );
        add_filter( HelpScreen::TABS_FILTER, [ $this, 'help_tab' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Image du héros des catégories du blog, affichée dans l\'en-tête de leur archive comme le héros des pages.', 'couturier' );
    }

    /** Déclare la méta. */
    public function register_meta(): void {
        register_term_meta(
            'category',
            self::META,
            [
                'type'              => 'integer',
                'single'            => true,
                'sanitize_callback' => 'absint',
                'auth_callback'     => static fn(): bool => current_user_can( 'manage_categories' ),
                'show_in_rest'      => true,
            ]
        );
    }

    /** Champ de l'écran « Ajouter une catégorie ». */
    public function render_add_field(): void {
        echo '<div class="form-field term-hero-image-wrap">';
        echo '<label>' . esc_html__( 'Image du héros', 'couturier' ) . '</label>';
        $this->render_control( 0 );
        echo '</div>';
    }

    /** Champ de l'écran « Modifier la catégorie ». */
    public function render_edit_field( WP_Term $term ): void {
        echo '<tr class="form-field term-hero-image-wrap"><th scope="row">' . esc_html__( 'Image du héros', 'couturier' ) . '</th><td>';
        $this->render_control( (int) get_term_meta( $term->term_id, self::META, true ) );
        echo '</td></tr>';
    }

    /** Aperçu, boutons et champ caché. */
    private function render_control( int $image_id ): void {
        $has_image = $image_id > 0 && wp_attachment_is_image( $image_id );

        wp_nonce_field( self::NONCE, self::NONCE );

        echo '<div class="couturier-category-image">';
        echo '<div class="couturier-category-image__preview">';
        echo $has_image ? wp_get_attachment_image( $image_id, 'medium', false, [ 'alt' => '' ] ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- HTML du core.
        echo '</div>';
        printf( '<input type="hidden" class="couturier-category-image__id" name="%1$s" value="%2$s">', esc_attr( self::META ), esc_attr( $has_image ? (string) $image_id : '' ) );
        printf( '<button type="button" class="button couturier-category-image__choose">%s</button> ', esc_html( $has_image ? __( 'Changer', 'couturier' ) : __( 'Choisir une image', 'couturier' ) ) );
        printf( '<button type="button" class="button-link button-link-delete couturier-category-image__remove"%2$s>%1$s</button>', esc_html__( 'Retirer', 'couturier' ), $has_image ? '' : ' hidden' );
        echo '<p class="description">' . esc_html__( 'Affichée à droite du titre dans l\'en-tête de l\'archive de la catégorie. Le texte alternatif est celui de la médiathèque.', 'couturier' ) . '</p>';
        echo '</div>';
    }

    /** Enregistre la méta. */
    public function save( int $term_id ): void {
        if ( ! isset( $_POST[ self::NONCE ] )
            || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST[ self::NONCE ] ) ), self::NONCE )
            || ! current_user_can( 'manage_categories' )
        ) {
            return;
        }

        $image_id = absint( wp_unslash( $_POST[ self::META ] ?? 0 ) );

        if ( $image_id > 0 && wp_attachment_is_image( $image_id ) ) {
            update_term_meta( $term_id, self::META, $image_id );
        } else {
            delete_term_meta( $term_id, self::META );
        }
    }

    /** Script de la médiathèque, sur les écrans des catégories seulement. */
    public function enqueue( string $hook_suffix ): void {
        $screen = get_current_screen();

        if ( ! in_array( $hook_suffix, [ 'edit-tags.php', 'term.php' ], true ) || 'category' !== ( $screen->taxonomy ?? '' ) ) {
            return;
        }

        $path = get_theme_file_path( self::SCRIPT );

        if ( ! is_readable( $path ) ) {
            return;
        }

        wp_enqueue_media();

        $handle = 'couturier-category-image';
        $l10n   = [
            'mediaTitle'  => __( 'Image du héros', 'couturier' ),
            'mediaButton' => __( 'Utiliser cette image', 'couturier' ),
            'change'      => __( 'Changer', 'couturier' ),
            'choose'      => __( 'Choisir une image', 'couturier' ),
        ];

        wp_register_script( $handle, false, [ 'media-editor' ], null, true );
        wp_enqueue_script( $handle );
        wp_add_inline_script( $handle, 'window.couturierCategoryImage = ' . wp_json_encode( $l10n ) . ';', 'before' );
        wp_add_inline_script( $handle, (string) file_get_contents( $path ) );
        wp_add_inline_style( 'common', '.couturier-category-image__preview img { display: block; max-width: 300px; height: auto; margin-bottom: 8px; }' );
    }

    /**
     * Ajoute `term_hero` (HTML du héros) au contexte des archives de catégorie.
     *
     * @param array<string, mixed> $context Contexte Timber.
     * @return array<string, mixed>
     */
    public function add_to_context( array $context ): array {
        if ( ! is_category() ) {
            return $context;
        }

        $term = get_queried_object();

        if ( ! $term instanceof WP_Term ) {
            return $context;
        }

        $image_id = (int) get_term_meta( $term->term_id, self::META, true );

        $inner = sprintf(
            '<!-- wp:heading {"level":1} --><h1 class="wp-block-heading">%s</h1><!-- /wp:heading -->',
            esc_html( $term->name )
        );

        $description = trim( wp_strip_all_tags( term_description( $term ) ) );
        if ( '' !== $description ) {
            $inner .= sprintf( '<!-- wp:paragraph --><p>%s</p><!-- /wp:paragraph -->', esc_html( $description ) );
        }

        if ( $image_id > 0 && wp_attachment_is_image( $image_id ) ) {
            $inner .= sprintf( '<!-- wp:couturier/page-hero-media {"imageId":%d} /-->', $image_id );
        }

        $context['term_hero'] = do_blocks( '<!-- wp:couturier/page-hero -->' . $inner . '<!-- /wp:couturier/page-hero -->' );

        return $context;
    }

    /**
     * Déclare l'onglet « Catégories du blog » de la page d'aide
     * (gabarit `resources/views/admin/help/categories.twig`).
     *
     * @param array<string, array<string, mixed>> $tabs Onglets déjà déclarés.
     * @return array<string, array<string, mixed>>
     */
    public function help_tab( array $tabs ): array {
        $tabs['categories'] = [
            'label'    => __( 'Catégories du blog', 'couturier' ),
            'priority' => 35,
            'context'  => [
                'categories_url' => admin_url( 'edit-tags.php?taxonomy=category' ),
            ],
        ];

        return $tabs;
    }
}
