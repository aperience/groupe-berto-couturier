/**
 * Texte du bloc « Centre et points de ramassage » (`couturier/pickup-map-body`) : simple
 * conteneur de paragraphes et listes, comme `couturier/image-text-body`. Son
 * `templateLock: false` l'emporte sur le verrou du parent.
 *
 * Sans texte, il n'est pas rendu : `is-incomplete` (masqué hors édition).
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

import { TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import { hasContent } from '../image-text-body/content.js';
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

// Paragraphes : gras, italique, lien, barré, exposant, indice (cf. CTA).
restrictFormats( metadata.name, { 'core/paragraph': TEXT_FORMATS_OFF } );
