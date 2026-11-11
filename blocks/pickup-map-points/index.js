/**
 * Liste des points de ramassage (`couturier/pickup-map-points`).
 *
 * Conteneur verrouillé du bloc « Centre et points de ramassage », dont le propre
 * `templateLock: false` permet d'ajouter, de retirer et de déplacer les points
 * (`couturier/pickup-point`), sans limite. Vide, la liste n'est pas rendue et le
 * bloc n'affiche que la carte du centre, sans onglets.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { NAME } from '../pickup-point/name.js';
import metadata from './block.json';

const ITEM = 'couturier/pickup-point';

function Edit( { clientId } ) {
	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );
	const { isEditing, count } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const rootId = editor.getBlockRootClientId( clientId );

			return {
				isEditing: editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ),
				count: editor.getBlockCount( clientId ),
			};
		},
		[ clientId ]
	);

	// Point créé avec son nom, curseur placé dans le nom.
	const addItem = () => {
		const [ item ] = createBlocksFromInnerBlocksTemplate( [ [ ITEM, {}, [ NAME ] ] ] );
		insertBlock( item, count, clientId, false );
		selectBlock( item.innerBlocks[ 0 ].clientId, 0 );
	};

	const innerBlocksProps = useInnerBlocksProps( useBlockProps( { role: 'list' } ), {
		allowedBlocks: [ ITEM ],
		templateLock: false,
		renderAppender: () =>
			isEditing && (
				<li className="wp-block-couturier-pickup-map-points__add">
					<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
						{ __( 'Ajouter un point de ramassage', 'couturier' ) }
					</Button>
				</li>
			),
	} );

	return <ol { ...innerBlocksProps } />;
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
