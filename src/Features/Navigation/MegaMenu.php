<?php
/**
 * Méga menu : lecture du menu principal et des accès rapides
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Navigation;

use WP_Post;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Logique sans hook du méga menu : clés des métas des éléments de menu, liste des
 * variantes, lecture de l'arbre du menu principal et de la liste des accès rapides.
 *
 * **Trois niveaux au plus.** Les éléments plus profonds sont ignorés, sans erreur.
 *
 * **Structure de `tree()`** — une liste d'éléments de niveau 1 :
 *
 * ```
 * {
 *     id, title, url, new_tab, current, active,
 *     has_mega,                 // a des enfants : ouvre un méga menu
 *     variant, eyebrow, description, buttons: [{ label, url, new_tab }],
 *     has_panels,               // au moins un niveau 2 a des enfants
 *     open_id,                  // niveau 2 dont le panneau est affiché à l'ouverture
 *     groups: [{ heading, items: [niveau 2] }],
 * }
 * ```
 *
 * Niveau 2 : `{ id, title, url, new_tab, current, active, description, all_label,
 * children: [niveau 3] }` ; niveau 3 : `{ id, title, url, new_tab, current }`.
 *
 * `current` : l'élément pointe sur la page affichée ; `active` : lui ou l'un de ses
 * descendants (classes de contexte de WordPress, cf. `_wp_menu_item_classes_by_context()`).
 *
 * Les niveaux 2 cochés « Intertitre » ne sont pas des liens : chacun ouvre un groupe
 * (`heading`) qui réunit les niveaux 2 suivants. Le premier groupe n'a pas d'intertitre.
 */
final class MegaMenu {

    /** Emplacement du menu principal. */
    public const LOCATION = 'primary';

    /** Emplacement du menu « Accès rapides » (mobile seulement). */
    public const QUICK_ACCESS = 'quick_access';

    /** Niveau 1 : variante de couleur de l'encart. */
    public const META_VARIANT = '_couturier_mega_variant';

    /** Niveau 1 : surtitre de l'encart. */
    public const META_EYEBROW = '_couturier_mega_eyebrow';

    /** Niveau 1 : texte de l'encart. */
    public const META_DESCRIPTION = '_couturier_mega_description';

    /** Niveau 1 : boutons de l'encart, liste de `{ label, url, new_tab }`. */
    public const META_BUTTONS = '_couturier_mega_buttons';

    /** Niveau 2 : l'élément est un intertitre. */
    public const META_HEADING = '_couturier_mega_heading';

    /** Niveau 2 : libellé du lien « Tout voir » du panneau de niveau 3. */
    public const META_ALL_LABEL = '_couturier_mega_all_label';

    /** Variante par défaut. */
    public const DEFAULT_VARIANT = 'orange';

    /** Nombre de boutons de l'encart. */
    public const BUTTONS = 2;

    /** @var array<string, list<array<string, mixed>>> Arbres déjà lus, par emplacement. */
    private static array $trees = [];

    /**
     * Variantes de l'encart : valeur => libellé.
     *
     * @return array<string, string>
     */
    public static function variants(): array {
        return [
            'orange' => __( 'Orange', 'couturier' ),
            'petrol' => __( 'Pétrole', 'couturier' ),
        ];
    }

    /**
     * Identifiant du menu affecté à un emplacement, 0 s'il n'y en a pas.
     */
    public static function menu_id( string $location = self::LOCATION ): int {
        return (int) ( get_nav_menu_locations()[ $location ] ?? 0 );
    }

    /**
     * Arbre du menu principal (cf. docblock de la classe), liste vide sans menu affecté.
     *
     * @return list<array<string, mixed>>
     */
    public static function tree( string $location = self::LOCATION ): array {
        if ( isset( self::$trees[ $location ] ) ) {
            return self::$trees[ $location ];
        }

        $children = self::children_by_parent( self::items( $location ) );
        $tree     = [];

        foreach ( $children[0] ?? [] as $item ) {
            $tree[] = self::level_one( $item, $children );
        }

        return self::$trees[ $location ] = $tree;
    }

    /**
     * Liens de premier niveau d'un menu à plat (accès rapides) : `{ id, title, url,
     * new_tab, current }`. Les sous-éléments sont ignorés.
     *
     * @return list<array<string, mixed>>
     */
    public static function links( string $location = self::QUICK_ACCESS ): array {
        $children = self::children_by_parent( self::items( $location ) );

        return array_map( self::link( ... ), $children[0] ?? [] );
    }

    /**
     * Éléments valides du menu affecté à l'emplacement, marqués selon la page courante.
     *
     * @return list<WP_Post>
     */
    private static function items( string $location ): array {
        $menu_id = self::menu_id( $location );

        if ( 0 === $menu_id ) {
            return [];
        }

        $items = wp_get_nav_menu_items( $menu_id );

        if ( ! is_array( $items ) || [] === $items ) {
            return [];
        }

        // Pose `current`, `current_item_ancestor`… comme le fait wp_nav_menu().
        _wp_menu_item_classes_by_context( $items );

        return array_values( $items );
    }

    /**
     * Regroupe les éléments par parent, dans l'ordre du menu.
     *
     * @param list<WP_Post> $items Éléments du menu.
     * @return array<int, list<WP_Post>>
     */
    private static function children_by_parent( array $items ): array {
        $ids      = array_map( static fn( WP_Post $item ): int => (int) $item->ID, $items );
        $children = [];

        foreach ( $items as $item ) {
            $parent = (int) $item->menu_item_parent;

            // Parent supprimé ou invalide : l'élément est ignoré plutôt que remonté.
            if ( 0 !== $parent && ! in_array( $parent, $ids, true ) ) {
                continue;
            }

            $children[ $parent ][] = $item;
        }

        return $children;
    }

    /**
     * Élément de niveau 1, avec son encart et ses niveaux 2 regroupés.
     *
     * @param array<int, list<WP_Post>> $children Éléments par parent.
     * @return array<string, mixed>
     */
    private static function level_one( WP_Post $item, array $children ): array {
        $groups  = [ [ 'heading' => null, 'items' => [] ] ];
        $open_id = null;
        $first   = null;

        foreach ( $children[ (int) $item->ID ] ?? [] as $child ) {
            if ( self::meta( $child, self::META_HEADING ) ) {
                $groups[] = [ 'heading' => self::title( $child ), 'items' => [] ];
                continue;
            }

            $level_two = self::level_two( $child, $children );

            $groups[ array_key_last( $groups ) ]['items'][] = $level_two;

            if ( [] !== $level_two['children'] ) {
                $first ??= $level_two['id'];

                if ( null === $open_id && $level_two['active'] ) {
                    $open_id = $level_two['id'];
                }
            }
        }

        // Pas de groupe vide : un intertitre sans élément après lui n'est pas affiché.
        $groups   = array_values( array_filter( $groups, static fn( array $group ): bool => [] !== $group['items'] ) );
        $has_mega = [] !== $groups;
        $variant  = (string) self::meta( $item, self::META_VARIANT );

        return self::link( $item ) + [
            'active'      => self::is_active( $item ),
            'has_mega'    => $has_mega,
            'variant'     => array_key_exists( $variant, self::variants() ) ? $variant : self::DEFAULT_VARIANT,
            'eyebrow'     => $has_mega ? (string) self::meta( $item, self::META_EYEBROW ) : '',
            'description' => $has_mega ? (string) self::meta( $item, self::META_DESCRIPTION ) : '',
            'buttons'     => $has_mega ? self::buttons( $item ) : [],
            'has_panels'  => null !== $first,
            'open_id'     => $open_id ?? $first,
            'groups'      => $groups,
        ];
    }

    /**
     * Élément de niveau 2, avec ses niveaux 3 (les niveaux plus profonds sont ignorés).
     *
     * @param array<int, list<WP_Post>> $children Éléments par parent.
     * @return array<string, mixed>
     */
    private static function level_two( WP_Post $item, array $children ): array {
        return self::link( $item ) + [
            'active'      => self::is_active( $item ),
            'description' => trim( wp_strip_all_tags( (string) $item->description ) ),
            'all_label'   => (string) self::meta( $item, self::META_ALL_LABEL ),
            'children'    => array_map( self::link( ... ), $children[ (int) $item->ID ] ?? [] ),
        ];
    }

    /**
     * Données communes à tous les liens.
     *
     * @return array{id: int, title: string, url: string, new_tab: bool, current: bool}
     */
    private static function link( WP_Post $item ): array {
        return [
            'id'      => (int) $item->ID,
            'title'   => self::title( $item ),
            'url'     => (string) $item->url,
            'new_tab' => '_blank' === $item->target,
            'current' => ! empty( $item->current ),
        ];
    }

    /**
     * Libellé en texte brut : filtré comme par wp_nav_menu(), puis débarrassé des
     * balises et des entités (`&#8211;` de wptexturize) — Twig se charge d'échapper.
     */
    private static function title( WP_Post $item ): string {
        /** This filter is documented in wp-includes/post-template.php */
        $title = (string) apply_filters( 'the_title', (string) $item->title, (int) $item->ID );

        return trim( html_entity_decode( wp_strip_all_tags( $title ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
    }

    /** L'élément pointe sur la page courante ou sur l'un de ses ancêtres. */
    private static function is_active( WP_Post $item ): bool {
        return ! empty( $item->current ) || ! empty( $item->current_item_ancestor );
    }

    /**
     * Boutons de l'encart, sans ceux auxquels il manque un libellé ou une adresse.
     *
     * @return list<array{label: string, url: string, new_tab: bool}>
     */
    private static function buttons( WP_Post $item ): array {
        $buttons = self::meta( $item, self::META_BUTTONS );

        if ( ! is_array( $buttons ) ) {
            return [];
        }

        $valid = [];

        foreach ( $buttons as $button ) {
            if ( ! is_array( $button ) || '' === ( $button['label'] ?? '' ) || '' === ( $button['url'] ?? '' ) ) {
                continue;
            }

            $valid[] = [
                'label'   => (string) $button['label'],
                'url'     => (string) $button['url'],
                'new_tab' => ! empty( $button['new_tab'] ),
            ];
        }

        return $valid;
    }

    /**
     * Méta d'un élément de menu (les métas sont en cache : wp_get_nav_menu_items()
     * les charge en une requête).
     */
    private static function meta( WP_Post $item, string $key ): mixed {
        return get_post_meta( (int) $item->ID, $key, true );
    }
}
