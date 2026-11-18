// Point d'entrée du catalogue des blocs (page d'aide de l'admin) : ne sert qu'à faire
// émettre par Vite les captures de resources/images/help/blocks/ dans dist/assets/,
// résolues ensuite par `Features\Blocks\BlockCatalog` via le manifest. Aucun JS
// n'est chargé nulle part.
import.meta.glob('../images/help/blocks/*.webp', { eager: true, query: '?url', import: 'default' });
