<?php
/**
 * Temps de lecture des articles
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blog;

use Deefuse\ThemeCore\Contracts\FeatureInterface;
use Twig\Environment;
use Twig\TwigFilter;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Filtre Twig `reading_time` : minutes de lecture d'un contenu (au moins 1),
 * à 189 mots par minute (vitesse du panneau Structure de l’éditeur), balises et commentaires de blocs retirés.
 *
 *     {{ article.post_content|reading_time }}
 */
final class ReadingTime implements FeatureInterface {

    /**
     * Mots lus par minute : AVERAGE_READING_RATE du core (@wordpress/editor,
     * temps de lecture du panneau Structure), recopiée faute d’être exposée en PHP.
     */
    private const WORDS_PER_MINUTE = 189;

    public function register(): void {
        add_filter( 'timber/twig', [ $this, 'add_filter' ] );
    }

    /** Courte description affichée sur la page « Fonctionnalités du thème ». */
    public function description(): string {
        return __( 'Calcule le temps de lecture affiché sur les cartes des articles.', 'couturier' );
    }

    /**
     * Ajoute le filtre à Twig.
     *
     * @param Environment $twig Environnement Twig.
     */
    public function add_filter( Environment $twig ): Environment {
        $twig->addFilter( new TwigFilter( 'reading_time', [ self::class, 'minutes' ] ) );
        return $twig;
    }

    /**
     * Minutes de lecture d'un contenu.
     *
     * @param string|null $content Contenu enregistré.
     */
    public static function minutes( ?string $content ): int {
        $words = preg_split( '/\s+/u', trim( wp_strip_all_tags( (string) $content ) ), -1, PREG_SPLIT_NO_EMPTY );

        return max( 1, (int) round( count( $words ?: [] ) / self::WORDS_PER_MINUTE ) );
    }
}
