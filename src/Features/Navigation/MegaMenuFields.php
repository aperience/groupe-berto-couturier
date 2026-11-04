<?php
/**
 * Méga menu : champs des éléments du menu principal (Apparence › Menus)
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Navigation;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Theme\Support\PageCache;
use WP_Post;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute aux éléments du menu principal les champs du méga menu, sans extension :
 * affichage par `wp_nav_menu_item_custom_fields`, enregistrement par
 * `wp_update_nav_menu_item`, métas `_couturier_mega_*` (clés : `MegaMenu`).
 *
 * - **Niveau 1** : variante, surtitre, texte et deux boutons de l'encart ;
 * - **niveau 2** : case « Intertitre », libellé du lien « Tout voir ».
 *
 * **Affichage selon la profondeur, en CSS.** L'écran change la profondeur d'un
 * élément au glisser-déposer, sans recharger : les deux groupes de champs sont
 * toujours rendus, et seule la classe `menu-item-depth-{n}` que WordPress tient à
 * jour sur l'élément décide lequel est visible. Les valeurs d'un groupe masqué sont
 * conservées, et ignorées à la lecture.
 *
 * **Menu principal seulement** : les autres menus (pied de page, accès rapides)
 * n'ont pas ces champs. Le menu doit donc être affecté à l'emplacement « Menu
 * principal » pour qu'ils apparaissent.
 *
 * **Enregistrement** : l'écran sérialise tout le formulaire dans `nav-menu-data`,
 * que WordPress redéploie dans `$_POST` avant de vérifier son nonce
 * (`update-nav_menu`) puis d'enregistrer chaque élément. Les champs sont nommés
 * `couturier-mega[{id}][…]` ; une case décochée n'étant pas envoyée, chacune est
 * doublée d'un champ caché à `0`.
 *
 * **Cache de page** : la navigation est sur toutes les pages, donc tout le cache
 * est vidé (`Support\PageCache`) à l'enregistrement ou à la suppression d'un menu,
 * et quand les emplacements changent (affectation d'un menu, stockée dans les
 * `theme_mods` du thème). Les menus du pied de page en profitent aussi.
 */
final class MegaMenuFields implements FeatureInterface {

    /** Racine des noms de champs. */
    private const FIELD = 'couturier-mega';

    /** Enregistre les hooks de l'écran des menus. */
    public function register(): void {
        add_action( 'wp_nav_menu_item_custom_fields', [ $this, 'render' ], 10, 2 );
        add_action( 'wp_update_nav_menu_item', [ $this, 'save' ], 10, 2 );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue' ] );

        add_action( 'wp_update_nav_menu', [ PageCache::class, 'purge' ], 10, 0 );
        add_action( 'wp_delete_nav_menu', [ PageCache::class, 'purge' ], 10, 0 );
        add_action( 'update_option_theme_mods_' . get_stylesheet(), [ PageCache::class, 'purge' ], 10, 0 );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Ajoute aux éléments du menu principal les réglages du méga menu (encart, intertitres, lien « Tout voir ») et vide le cache de page à l\'enregistrement des menus.', 'couturier' );
    }

    /**
     * Affiche les champs d'un élément, si le menu édité est le menu principal.
     *
     * @param string  $item_id   Identifiant de l'élément.
     * @param WP_Post $menu_item Élément de menu.
     */
    public function render( string $item_id, WP_Post $menu_item ): void {
        if ( ! $this->is_primary_menu( $this->edited_menu_id() ) ) {
            return;
        }

        $id = (int) $item_id;

        echo '<fieldset class="couturier-mega couturier-mega--level-1">';
        printf( '<legend>%s</legend>', esc_html__( 'Méga menu — encart', 'couturier' ) );
        printf(
            '<p class="couturier-mega__help">%s</p>',
            esc_html__( 'Affiché si cet élément a des sous-éléments. Le titre de l’encart est le libellé de l’élément.', 'couturier' )
        );
        $this->select(
            $id,
            'variant',
            __( 'Couleur', 'couturier' ),
            MegaMenu::variants(),
            (string) get_post_meta( $id, MegaMenu::META_VARIANT, true ) ?: MegaMenu::DEFAULT_VARIANT
        );
        $this->text( $id, 'eyebrow', __( 'Surtitre (ordinateur seulement)', 'couturier' ), (string) get_post_meta( $id, MegaMenu::META_EYEBROW, true ) );
        $this->textarea( $id, 'description', __( 'Texte', 'couturier' ), (string) get_post_meta( $id, MegaMenu::META_DESCRIPTION, true ) );

        $buttons = get_post_meta( $id, MegaMenu::META_BUTTONS, true );

        for ( $index = 0; $index < MegaMenu::BUTTONS; $index++ ) {
            $button = is_array( $buttons ) && is_array( $buttons[ $index ] ?? null ) ? $buttons[ $index ] : [];

            echo '<fieldset class="couturier-mega__button">';
            /* translators: %d : numéro du bouton. */
            printf( '<legend>%s</legend>', esc_html( sprintf( __( 'Bouton %d', 'couturier' ), $index + 1 ) ) );
            $this->text( $id, "buttons][{$index}][label", __( 'Libellé', 'couturier' ), (string) ( $button['label'] ?? '' ) );
            $this->text( $id, "buttons][{$index}][url", __( 'Adresse', 'couturier' ), (string) ( $button['url'] ?? '' ), 'url' );
            $this->checkbox( $id, "buttons][{$index}][new_tab", __( 'Ouvrir dans un nouvel onglet', 'couturier' ), ! empty( $button['new_tab'] ) );
            echo '</fieldset>';
        }

        echo '</fieldset>';

        echo '<fieldset class="couturier-mega couturier-mega--level-2">';
        printf( '<legend>%s</legend>', esc_html__( 'Méga menu', 'couturier' ) );
        $this->checkbox(
            $id,
            'heading',
            __( 'Intertitre : texte non cliquable qui ouvre un groupe (utiliser un lien personnalisé « # »)', 'couturier' ),
            (bool) get_post_meta( $id, MegaMenu::META_HEADING, true )
        );
        $this->text( $id, 'all_label', __( 'Libellé du lien « Tout voir » (vide : pas de lien)', 'couturier' ), (string) get_post_meta( $id, MegaMenu::META_ALL_LABEL, true ) );
        printf(
            '<p class="couturier-mega__help">%s</p>',
            esc_html__( 'Le sous-titre du panneau est le champ « Description » de l’élément (à activer dans les Options de l’écran).', 'couturier' )
        );
        echo '</fieldset>';
    }

    /**
     * Enregistre les champs d'un élément du menu principal.
     *
     * N'agit que sur une soumission de l'écran des menus qui contient les champs de
     * l'élément : l'ajout d'un élément (AJAX), le personnaliseur ou un import
     * appellent aussi `wp_update_nav_menu_item`, sans eux.
     *
     * @param int $menu_id Identifiant du menu.
     * @param int $item_id Identifiant de l'élément.
     */
    public function save( int $menu_id, int $item_id ): void {
        // phpcs:disable WordPress.Security.NonceVerification.Missing -- vérifié ci-dessous.
        if ( ! isset( $_POST[ self::FIELD ][ $item_id ] ) || ! is_array( $_POST[ self::FIELD ][ $item_id ] ) ) {
            return;
        }

        if (
            ! $this->is_primary_menu( $menu_id )
            || ! current_user_can( 'edit_theme_options' )
            || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['update-nav-menu-nonce'] ?? '' ) ), 'update-nav_menu' )
        ) {
            return;
        }

        $data = wp_unslash( $_POST[ self::FIELD ][ $item_id ] );
        // phpcs:enable

        $variant = sanitize_key( (string) ( $data['variant'] ?? '' ) );

        $this->update( $item_id, MegaMenu::META_VARIANT, array_key_exists( $variant, MegaMenu::variants() ) && MegaMenu::DEFAULT_VARIANT !== $variant ? $variant : '' );
        $this->update( $item_id, MegaMenu::META_EYEBROW, sanitize_text_field( (string) ( $data['eyebrow'] ?? '' ) ) );
        $this->update( $item_id, MegaMenu::META_DESCRIPTION, sanitize_textarea_field( (string) ( $data['description'] ?? '' ) ) );
        $this->update( $item_id, MegaMenu::META_BUTTONS, $this->sanitize_buttons( $data['buttons'] ?? [] ) );
        $this->update( $item_id, MegaMenu::META_HEADING, ! empty( $data['heading'] ) ? '1' : '' );
        $this->update( $item_id, MegaMenu::META_ALL_LABEL, sanitize_text_field( (string) ( $data['all_label'] ?? '' ) ) );
    }

    /**
     * Mise en forme des champs, sur l'écran des menus seulement.
     */
    public function enqueue( string $hook_suffix ): void {
        if ( 'nav-menus.php' !== $hook_suffix ) {
            return;
        }

        wp_add_inline_style( 'common', '
            .couturier-mega { display: none; clear: both; margin: 0 10px 10px 0; padding: 0 12px 4px; border: 1px solid #dcdcde; }
            .menu-item-depth-0 .couturier-mega--level-1,
            .menu-item-depth-1 .couturier-mega--level-2 { display: block; }
            .couturier-mega > legend { padding: 0 4px; font-weight: 600; }
            .couturier-mega p { margin: 8px 0; }
            .couturier-mega p.couturier-mega__help { color: #646970; font-style: italic; }
            .couturier-mega__button { margin: 12px 0 0; padding-top: 4px; border-top: 1px solid #f0f0f1; }
            .couturier-mega__button > legend { padding-top: 8px; font-weight: 600; }
            .couturier-mega textarea { min-height: 4.5em; }
        ' );
    }

    /**
     * Boutons assainis, sans les lignes entièrement vides ; chaîne vide s'il n'en
     * reste aucun (la méta est alors supprimée).
     *
     * @return list<array{label: string, url: string, new_tab: bool}>|string
     */
    private function sanitize_buttons( mixed $buttons ): array|string {
        if ( ! is_array( $buttons ) ) {
            return '';
        }

        $clean = [];

        for ( $index = 0; $index < MegaMenu::BUTTONS; $index++ ) {
            $button = is_array( $buttons[ $index ] ?? null ) ? $buttons[ $index ] : [];
            $label  = sanitize_text_field( (string) ( $button['label'] ?? '' ) );
            $url    = esc_url_raw( trim( (string) ( $button['url'] ?? '' ) ) );

            // L'emplacement est conservé (bouton 2 seul possible) : on ne retire que la fin.
            $clean[ $index ] = [
                'label'   => $label,
                'url'     => $url,
                'new_tab' => ! empty( $button['new_tab'] ),
            ];
        }

        while ( [] !== $clean && '' === end( $clean )['label'] && '' === end( $clean )['url'] ) {
            array_pop( $clean );
        }

        return [] === $clean ? '' : $clean;
    }

    /**
     * Met à jour une méta, ou la supprime si la valeur est vide.
     *
     * @param array<mixed>|string $value Valeur assainie.
     */
    private function update( int $item_id, string $key, array|string $value ): void {
        if ( '' === $value || [] === $value ) {
            delete_post_meta( $item_id, $key );

            return;
        }

        update_post_meta( $item_id, $key, $value );
    }

    /**
     * Menu en cours d'édition : celui de l'écran des menus, ou celui auquel l'ajout
     * d'un élément (AJAX, nonce vérifié par WordPress) est destiné.
     */
    private function edited_menu_id(): int {
        global $nav_menu_selected_id;

        if ( isset( $nav_menu_selected_id ) ) {
            return (int) $nav_menu_selected_id;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- lecture seule, nonce vérifié par wp_ajax_add_menu_item().
        return wp_doing_ajax() ? absint( $_POST['menu'] ?? 0 ) : 0;
    }

    /** Le menu est celui affecté à l'emplacement « Menu principal ». */
    private function is_primary_menu( int $menu_id ): bool {
        return 0 !== $menu_id && MegaMenu::menu_id() === $menu_id;
    }

    /** Nom du champ d'un élément ; `$key` peut descendre dans un tableau (`a][b`). */
    private function name( int $id, string $key ): string {
        return sprintf( '%s[%d][%s]', self::FIELD, $id, $key );
    }

    /** Identifiant HTML du champ d'un élément. */
    private function field_id( int $id, string $key ): string {
        return sprintf( 'edit-%s-%s-%d', self::FIELD, trim( (string) preg_replace( '/[^a-z0-9]+/', '-', $key ), '-' ), $id );
    }

    /** Champ texte d'une ligne. */
    private function text( int $id, string $key, string $label, string $value, string $type = 'text' ): void {
        printf(
            '<p class="description description-wide"><label for="%1$s">%2$s<br><input type="text" id="%1$s" class="widefat" name="%3$s" value="%4$s"%5$s></label></p>',
            esc_attr( $this->field_id( $id, $key ) ),
            esc_html( $label ),
            esc_attr( $this->name( $id, $key ) ),
            esc_attr( $value ),
            // Pas de type="url" : il refuserait les adresses relatives (« /contact/ ») et bloquerait l'enregistrement.
            'url' === $type ? ' inputmode="url" spellcheck="false"' : ''
        );
    }

    /** Zone de texte, sans mise en forme. */
    private function textarea( int $id, string $key, string $label, string $value ): void {
        printf(
            '<p class="description description-wide"><label for="%1$s">%2$s<br><textarea id="%1$s" class="widefat" rows="3" name="%3$s">%4$s</textarea></label></p>',
            esc_attr( $this->field_id( $id, $key ) ),
            esc_html( $label ),
            esc_attr( $this->name( $id, $key ) ),
            esc_textarea( $value )
        );
    }

    /**
     * Liste déroulante.
     *
     * @param array<string, string> $options Valeur => libellé.
     */
    private function select( int $id, string $key, string $label, array $options, string $selected ): void {
        printf(
            '<p class="description description-wide"><label for="%1$s">%2$s<br><select id="%1$s" class="widefat" name="%3$s">',
            esc_attr( $this->field_id( $id, $key ) ),
            esc_html( $label ),
            esc_attr( $this->name( $id, $key ) )
        );

        foreach ( $options as $value => $text ) {
            printf( '<option value="%1$s"%2$s>%3$s</option>', esc_attr( $value ), selected( $selected, $value, false ), esc_html( $text ) );
        }

        echo '</select></label></p>';
    }

    /** Case à cocher, doublée d'un champ caché pour envoyer aussi l'état décoché. */
    private function checkbox( int $id, string $key, string $label, bool $checked ): void {
        printf(
            '<p class="description description-wide"><input type="hidden" name="%1$s" value="0"><label for="%2$s"><input type="checkbox" id="%2$s" name="%1$s" value="1"%3$s> %4$s</label></p>',
            esc_attr( $this->name( $id, $key ) ),
            esc_attr( $this->field_id( $id, $key ) ),
            checked( $checked, true, false ),
            esc_html( $label )
        );
    }
}
