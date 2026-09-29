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
 * **Traductions JS.** Pour un `block.json` qui déclare un `textdomain`, le core appelle
 * `wp_set_script_translations()` sans chemin : il cherche alors les JSON dans
 * `wp-content/languages/themes/`, où ceux du thème ne sont jamais. L'appel est donc
 * refait ici pour chaque script du bloc, pointé sur `languages/` du thème — là où
 * `npm run i18n:compile` écrit `{domaine}-{locale}-{md5}.json`.
 */
final class BlockLoader implements FeatureInterface {

    /**
     * @param string $text_domain Domaine de traduction des blocs (`textdomain` de leurs block.json).
     * @param string $blocks_path Dossier des blocs compilés, relatif à la racine du thème.
     */
    public function __construct(
        private readonly string $text_domain,
        private readonly string $blocks_path = 'dist/blocks',
    ) {}

    /** Enregistre les blocs sur `init`, comme l'exige `register_block_type()`. */
    public function register(): void {
        add_action( 'init', [ $this, 'register_blocks' ] );
    }

    /** Enregistre chaque bloc compilé et rattache ses scripts aux traductions du thème. */
    public function register_blocks(): void {
        $manifests = glob( get_theme_file_path( $this->blocks_path ) . '/*/block.json' );
        $languages = get_theme_file_path( 'languages' );

        foreach ( $manifests ?: [] as $manifest ) {
            $block = register_block_type( dirname( $manifest ) );

            if ( false === $block ) {
                continue;
            }

            foreach ( [ ...$block->editor_script_handles, ...$block->view_script_handles ] as $handle ) {
                wp_set_script_translations( $handle, $this->text_domain, $languages );
            }
        }
    }
}
