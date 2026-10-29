/**
 * Colonne du bloc « Texte repliable » (`couturier/collapsible-text-column`).
 *
 * Simple conteneur de texte (`core/paragraph`, `core/list`). Le bloc parent fige
 * son modèle (titre et deux colonnes, `templateLock: 'all'`) ; le
 * `templateLock: false` de la colonne l'emporte pour ses propres blocs
 * imbriqués : paragraphes et listes s'ajoutent, se retirent et se déplacent
 * librement.
 *
 * Une colonne sans texte n'est pas rendue (`render.php`) : elle reçoit
 * `is-incomplete`, masqué dans le canvas quand le bloc n'est pas en cours
 * d'édition (`editor/_front-preview.scss`).
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

import metadata from './block.json';
import { hasContent } from './content.js';

function Edit( { clientId } ) {
	const isEmpty = useSelect(
		( select ) => ! select( blockEditorStore ).getBlocks( clientId ).some( hasContent ),
		[ clientId ]
	);

	const innerBlocksProps = useInnerBlocksProps( useBlockProps( { className: isEmpty ? 'is-incomplete' : undefined } ), {
		allowedBlocks: metadata.allowedBlocks,
		templateLock: false,
	} );

	return <div { ...innerBlocksProps } />;
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
