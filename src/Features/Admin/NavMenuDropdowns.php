<?php
/**
 * Écran des menus : listes « Parent » / « Ordre » limitées aux éléments dépliés
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Admin;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\ThemeContext;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Évite le blocage de l'écran Apparence › Menus sur un grand menu.
 *
 * Depuis WordPress 6.7, `nav-menu.js` remplit pour chaque élément deux listes de
 * déplacement (« Parent », « Ordre ») d'une option par élément du menu : 120 éléments
 * (menu principal) donnent 15 000 `<option>`, et Chrome fige la page environ 6 s au
 * premier focus dans un champ, le temps d'analyser le formulaire.
 *
 * `resources/js/editor/nav-menu-dropdowns.js` enveloppe les deux méthodes du core pour
 * ne remplir que les listes des éléments dépliés (cf. son en-tête). Il est lu sur disque
 * et injecté en inline après `nav-menu`, sans build. Le blocage tombe à environ 2 s :
 * le reste tient au volume du formulaire du core (3 500 champs).
 */
final class NavMenuDropdowns implements FeatureInterface {

    /** Script de l'écran, relatif à la racine du thème. */
    private const SCRIPT = 'resources/js/editor/nav-menu-dropdowns.js';

    /**
     * @param ThemeContext $context Identité du thème, pour le handle du script.
     */
    public function __construct(
        private readonly ThemeContext $context,
    ) {}

    /** Enregistre le chargement du script sur l'écran des menus. */
    public function register(): void {
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Accélère l\'écran des menus : les listes « Parent » et « Ordre » ne sont remplies que pour les éléments dépliés.', 'couturier' );
    }

    /**
     * Charge le script après `nav-menu`, dans le pied de page.
     *
     * @param string $hook_suffix Écran courant.
     */
    public function enqueue( string $hook_suffix ): void {
        if ( 'nav-menus.php' !== $hook_suffix ) {
            return;
        }

        $path = get_theme_file_path( self::SCRIPT );

        if ( ! is_readable( $path ) ) {
            return;
        }

        $handle = $this->context->handle( 'nav-menu-dropdowns' );

        wp_register_script( $handle, false, [ 'nav-menu' ], null, true );
        wp_enqueue_script( $handle );
        wp_add_inline_script( $handle, (string) file_get_contents( $path ) );
    }
}
