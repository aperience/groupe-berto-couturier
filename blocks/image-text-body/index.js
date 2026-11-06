/**
 * Texte du bloc « Image et texte » (`couturier/image-text-body`).
 *
 * Simple conteneur de texte (`core/paragraph`, `core/list`), comme la colonne du
 * texte repliable. Le bloc parent fige son modèle (`templateLock: 'all'`) ; le
 * `templateLock: false` du texte l'emporte pour ses propres blocs imbriqués :
 * paragraphes et listes s'ajoutent, se retirent et se déplacent librement.
 *
 * Sans texte, il n'est pas rendu (`render.php`) : il reçoit `is-incomplete`,
 * masqué dans le canvas quand le bloc n'est pas en cours d'édition
 * (`editor/_front-preview.scss`).
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

import { TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
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

// Paragraphes : gras, italique, lien, barré, exposant, indice (cf. CTA).
restrictFormats( metadata.name, { 'core/paragraph': TEXT_FORMATS_OFF } );
