/**
 * Panneaux du bloc « Objectifs et programme » (`couturier/training-overview-panels`).
 *
 * Simple conteneur des panneaux (`couturier/training-overview-panel`), verrouillé
 * dans le modèle du bloc parent ; son propre `templateLock: false` permet
 * d'ajouter (« Ajouter un panneau »), de retirer et de déplacer les panneaux,
 * sans limite. Un panneau ajouté prend le fond blanc cassé après un panneau
 * orange clair, et inversement. Repris de `formula-notes`.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { ITEM, panel } from '../training-overview-panel/template.js';
import metadata from './block.json';

function Edit( { clientId } ) {
	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );
	const { isEditing, items } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const rootId = editor.getBlockRootClientId( clientId );

			return {
				isEditing: editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ),
				items: editor.getBlocks( clientId ),
			};
		},
		[ clientId ]
	);

	// Panneau créé avec son contenu, au fond alterné, curseur placé dans le titre.
	const addItem = () => {
		const last = items[ items.length - 1 ];
		const background = last && 'neutral-50' !== last.attributes.background ? 'neutral-50' : undefined;
		const [ item ] = createBlocksFromInnerBlocksTemplate( [ panel( background ) ] );
		insertBlock( item, items.length, clientId, false );
		selectBlock( item.innerBlocks[ 0 ].clientId, 0 );
	};

	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		allowedBlocks: [ ITEM ],
		templateLock: false,
		orientation: 'horizontal',
		renderAppender: () =>
			isEditing && (
				<div className="wp-block-couturier-training-overview-panels__add">
					<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
						{ __( 'Ajouter un panneau', 'couturier' ) }
					</Button>
				</div>
			),
	} );

	return <div { ...innerBlocksProps } />;
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
