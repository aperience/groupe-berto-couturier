/**
 * Encart des logos du bloc « Logos partenaires » (`couturier/logo-strip-items`).
 *
 * Simple conteneur (`<ul>`) des logos (`couturier/logo-strip-item`). Son
 * `templateLock: false` l'emporte sur le verrou du parent : les logos
 * s'ajoutent (bouton « Ajouter un logo »), se retirent et se déplacent
 * librement, sans limite de nombre.
 *
 * Sans logo complet (légende saisie), l'encart n'est pas rendu : `is-incomplete`.
 */
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { isComplete } from '../logo-strip-item/content.js';
import metadata from './block.json';

const ITEM = 'couturier/logo-strip-item';

function Edit( { clientId } ) {
	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );
	// Bloc « Logos partenaires » ou l'un de ses blocs imbriqués sélectionné.
	// Sinon, le canvas montre le rendu du site : pas de bouton d'ajout.
	const { isEditing, count, isEmpty } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const rootId = editor.getBlockRootClientId( clientId );
			const items = editor.getBlocks( clientId );

			return {
				isEditing: editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ),
				count: items.length,
				isEmpty: ! items.some( isComplete ),
			};
		},
		[ clientId ]
	);

	const addItem = () => {
		const item = createBlock( ITEM );
		insertBlock( item, count, clientId, false );
		selectBlock( item.clientId, 0 );
	};

	const innerBlocksProps = useInnerBlocksProps(
		useBlockProps( { className: [ isEmpty ? 'is-incomplete' : '', isEditing ? 'is-editing' : '' ].filter( Boolean ).join( ' ' ) || undefined } ),
		{
			allowedBlocks: [ ITEM ],
			templateLock: false,
			orientation: 'horizontal',
			renderAppender: () =>
				isEditing && (
					<li className="wp-block-couturier-logo-strip-items__add">
						<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
							{ __( 'Ajouter un logo', 'couturier' ) }
						</Button>
					</li>
				),
		}
	);

	return <ul { ...innerBlocksProps } />;
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
