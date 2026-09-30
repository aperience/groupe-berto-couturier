<?php
/**
 * Enregistrement automatique des blocs Gutenberg du thème
 *
 * @package Couturier
 */

declare(strict_types=1);

namespace Theme\Features\Blocks;

use Deefuse\ThemeCore\Contracts\FeatureInterface;

/**
 * Enregistre chaque bloc compilé par `@wordpress/scripts` dans `dist/blocks/{nom}/` :
 * tout `block.json` trouvé est passé à `register_block_type()`, aucun enregistrement
 * manuel. Ajouter un bloc revient donc à créer `blocks/{nom}/` puis à lancer
 * `npm run build:blocks`.
 *
 * On lit `dist/` et non `blocks/` : c'est le `block.json` compilé qui référence les
 * scripts buildés (`index.js`, `index.asset.php`) et le `render.php` copié par wp-scripts.
 * Sans build, le dossier n'existe pas et rien n'est enregistré, sans erreur.
 *
 * **Pas de traductions JS.** L'interface des blocs dans l'éditeur reste en français (langue
 * des chaînes source) : aucun catalogue JSON n'est produit ni chargé pour leurs scripts.
 */
final class BlockLoader implements FeatureInterface {

    /**
     * @param string $blocks_path Dossier des blocs compilés, relatif à la racine du thème.
     */
    public function __construct(
        private readonly string $blocks_path = 'dist/blocks',
    ) {}

    /** Enregistre les blocs sur `init`, comme l'exige `register_block_type()`. */
    public function register(): void {
        add_action( 'init', [ $this, 'register_blocks' ] );
    }

    /** Enregistre chaque bloc compilé. */
    public function register_blocks(): void {
        $manifests = glob( get_theme_file_path( $this->blocks_path ) . '/*/block.json' );

        foreach ( $manifests ?: [] as $manifest ) {
            register_block_type( dirname( $manifest ) );
        }
    }
}
