/**
 * Encarts du bloc « Formules » (`couturier/formula-notes`).
 *
 * Simple conteneur des encarts (`couturier/formula-note`), verrouillé dans le
 * modèle du bloc parent ; son propre `templateLock: false` permet d'ajouter
 * (« Ajouter un encart »), de retirer et de déplacer les encarts, sans limite.
 * Un encart ajouté prend le fond pêche après un encart pétrole clair, et
 * inversement. Aucun encart : rien n'est rendu.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { ITEM, note } from '../formula-note/template.js';
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

	// Encart créé avec son contenu, au fond alterné, curseur placé dans le titre.
	const addItem = () => {
		const last = items[ items.length - 1 ];
		const background = 'peach-300' === last?.attributes.background ? undefined : last && 'peach-300';
		const [ item ] = createBlocksFromInnerBlocksTemplate( [ note( background ) ] );
		insertBlock( item, items.length, clientId, false );
		selectBlock( item.innerBlocks[ 0 ].clientId, 0 );
	};

	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		allowedBlocks: [ ITEM ],
		templateLock: false,
		orientation: 'horizontal',
		renderAppender: () =>
			isEditing && (
				<div className="wp-block-couturier-formula-notes__add">
					<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
						{ __( 'Ajouter un encart', 'couturier' ) }
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
