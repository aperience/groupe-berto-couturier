<?php
/**
 * Méga menu : données exposées aux templates
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Navigation;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Deefuse\ThemeCore\Support\ViteManifest;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Ajoute `navigation` au contexte Timber de toutes les pages :
 * `{ primary: [arbre du menu principal], quick_access: [liens], logo_url }` —
 * structure détaillée dans `MegaMenu`. Listes vides si aucun menu n'est affecté.
 *
 * `logo_url` : logo du header, émis par Vite (importé par `resources/js/app.js`) et
 * résolu par le manifest — chaîne vide sans build.
 *
 * Calculé une seule fois par requête (`MegaMenu` mémorise l'arbre), même si le
 * contexte est construit plusieurs fois.
 */
final class NavigationContext implements FeatureInterface {

    /** Source du logo, telle que référencée dans le manifest Vite. */
    private const LOGO = 'resources/images/logo-couturier-permis.svg';

    /**
     * @param ViteManifest $manifest Résolution des fichiers buildés.
     */
    public function __construct(
        private readonly ViteManifest $manifest = new ViteManifest(),
    ) {}

    /** Enregistre l'ajout au contexte. */
    public function register(): void {
        add_filter( 'timber/context', [ $this, 'add_to_context' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Expose aux templates le menu principal (méga menu) et les accès rapides.', 'couturier' );
    }

    /**
     * Ajoute `navigation` au contexte.
     *
     * @param array<string, mixed> $context Contexte Timber.
     * @return array<string, mixed>
     */
    public function add_to_context( array $context ): array {
        $context['navigation'] = [
            'primary'      => MegaMenu::tree(),
            'quick_access' => MegaMenu::links(),
            'logo_url'     => $this->manifest->entry_url( self::LOGO ),
        ];

        return $context;
    }
}
