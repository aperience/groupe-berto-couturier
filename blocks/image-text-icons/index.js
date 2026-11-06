/**
 * Rangée d'icônes du bloc « Image et texte » (`couturier/image-text-icons`).
 *
 * Simple conteneur (`<ul>`) des icônes (`couturier/image-text-icon`). Le bloc
 * parent fige son modèle (`templateLock: 'all'`) ; le `templateLock: false` de la
 * rangée l'emporte pour ses propres blocs imbriqués : les icônes s'ajoutent
 * (bouton « Ajouter une icône »), se retirent et se déplacent librement, sans
 * limite de nombre.
 *
 * Sans icône complète (pictogramme et libellé), la rangée n'est pas rendue
 * (`render.php`) : elle reçoit `is-incomplete`, masqué dans le canvas quand le
 * bloc n'est pas en cours d'édition (`editor/_front-preview.scss`).
 */
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { textOf } from '../_shared/locked-content.js';
import metadata from './block.json';

const ITEM = 'couturier/image-text-icon';

/** Icône affichée sur le site : pictogramme et libellé saisis. */
const isComplete = ( block ) => !! block.attributes.iconId && !! textOf( block.attributes.label );

function Edit( { clientId } ) {
	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );
	// Bloc « Image et texte » ou l'un de ses blocs imbriqués sélectionné. Sinon,
	// le canvas montre le rendu du site : pas de bouton d'ajout.
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
		selectBlock( item.clientId );
	};

	const innerBlocksProps = useInnerBlocksProps(
		useBlockProps( { className: isEmpty ? 'is-incomplete' : undefined } ),
		{
			allowedBlocks: [ ITEM ],
			templateLock: false,
			orientation: 'horizontal',
			renderAppender: () =>
				isEditing && (
					<li className="wp-block-couturier-image-text-icons__add">
						<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
							{ __( 'Ajouter une icône', 'couturier' ) }
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
