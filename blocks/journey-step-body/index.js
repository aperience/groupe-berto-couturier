/**
 * Texte d'une étape du bloc « Parcours en étapes » (`couturier/journey-step-body`).
 *
 * Simple conteneur de texte (`core/paragraph`, `core/list`), comme la colonne du
 * texte repliable : l'étape fige son modèle (titre et texte, `templateLock:
 * 'all'`) ; le `templateLock: false` du texte l'emporte pour ses propres blocs
 * imbriqués. Affiché dans le canvas pour l'étape dépliée seulement (CSS, classe
 * `is-open` de l'étape).
 *
 * Sans texte : `is-incomplete` (l'étape n'est pas rendue sur le site).
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

import { hasContent } from '../collapsible-text-column/content.js';
import metadata from './block.json';

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
