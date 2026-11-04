<?php
/**
 * Préchargement des polices affichées en haut de chaque page
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Fonts;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Support\ViteDevServer;
use Deefuse\ThemeCore\Support\ViteManifest;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute en tête du `<head>` un `<link rel="preload" as="font">` pour chaque police
 * passée au constructeur : le navigateur la télécharge sans attendre d'avoir lu la
 * feuille de style, ce qui réduit le changement de police au chargement
 * (`font-display: swap`, cf. `resources/scss/_fonts.scss`).
 *
 * **Peu de polices** : seulement celles visibles en haut de toutes les pages. Une
 * police préchargée mais inutilisée gaspille de la bande passante, et le navigateur
 * le signale en console.
 *
 * **URL hachées** résolues par le manifest Vite (`resources/fonts/…` → `dist/assets/fonts/…`).
 * Police absente du manifest (pas de build) : ignorée. **Rien en mode dev** : le dev
 * server sert les polices à une autre adresse, que la feuille injectée par Vite
 * référence ; un préchargement de `dist/` ne servirait à rien.
 *
 * `crossorigin` est obligatoire, même en même origine : les polices sont toujours
 * chargées en mode CORS, et un préchargement sans lui serait téléchargé deux fois.
 */
final class FontPreload implements FeatureInterface {

    /**
     * @param list<string>  $fonts      Sources des polices, relatives au thème (`resources/fonts/…woff2`).
     * @param ViteManifest  $manifest   Résolution des fichiers buildés.
     * @param ViteDevServer $dev_server Détection du serveur de dev.
     */
    public function __construct(
        private readonly array $fonts,
        private readonly ViteManifest $manifest = new ViteManifest(),
        private readonly ViteDevServer $dev_server = new ViteDevServer(),
    ) {}

    /** Enregistre l'ajout au `<head>`, avant les feuilles de style. */
    public function register(): void {
        add_action( 'wp_head', [ $this, 'print_links' ], 1 );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Précharge les polices affichées en haut de chaque page, pour limiter le changement de police au chargement.', 'couturier' );
    }

    /** Affiche les balises de préchargement. */
    public function print_links(): void {
        if ( $this->dev_server->is_active() ) {
            return;
        }

        foreach ( $this->fonts as $font ) {
            $url = $this->manifest->entry_url( $font );

            if ( '' === $url ) {
                continue;
            }

            printf( '<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n", esc_url( $url ) );
        }
    }
}
