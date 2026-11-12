/**
 * Cartes du bloc « Formules » (`couturier/formula-cards`).
 *
 * Simple conteneur (`<ul>`) des cartes (`couturier/formula-card`). Le bloc parent
 * fige son modèle (`templateLock: 'all'`) ; le `templateLock: false` de la liste
 * l'emporte pour ses propres blocs imbriqués : les cartes s'ajoutent (bouton
 * « Ajouter une formule »), se retirent et se déplacent librement.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { CARD, ITEM } from '../formula-card/template.js';
import metadata from './block.json';

function Edit( { clientId } ) {
	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );
	// Bloc « Formules » ou l'un de ses blocs imbriqués sélectionné. Sinon, le canvas
	// montre le rendu du site : pas de bouton d'ajout.
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

	// Carte créée avec son contenu, curseur placé dans le titre.
	const addItem = () => {
		const [ item ] = createBlocksFromInnerBlocksTemplate( [ CARD ] );
		insertBlock( item, count, clientId, false );
		selectBlock( item.innerBlocks[ 0 ].clientId, 0 );
	};

	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		allowedBlocks: [ ITEM ],
		templateLock: false,
		orientation: 'horizontal',
		renderAppender: () =>
			isEditing && (
				<div className="wp-block-couturier-formula-cards__add">
					<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
						{ __( 'Ajouter une formule', 'couturier' ) }
					</Button>
				</div>
			),
	} );

	return <ul { ...innerBlocksProps } />;
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
