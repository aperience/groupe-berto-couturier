/**
 * Bloc « Réassurance » (`couturier/reassurance`) : liste (`<ul>`) d'atouts
 * (`couturier/reassurance-item`) — pictogramme, titre H3, court texte.
 *
 * Inséré avec quatre atouts ; les atouts s'ajoutent (bouton « Ajouter un
 * atout »), se retirent et se déplacent librement, sans limite de nombre.
 * Quatre par ligne en desktop ; une ligne incomplète répartit ses atouts
 * (`block/_reassurance.scss`).
 *
 * Sans atout titré, le bloc n'est pas rendu (`render.php`) : il reçoit
 * `is-incomplete` dans le canvas.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { textOf } from '../_shared/locked-content.js';
import { TITLE } from '../reassurance-item/title.js';
import metadata from './block.json';

const ITEM = 'couturier/reassurance-item';

const ATOUT = [ ITEM, {}, [ TITLE ] ];

const TEMPLATE = [ ATOUT, ATOUT, ATOUT, ATOUT ];

/** Atout affiché sur le site : titre saisi. */
const hasTitle = ( block ) => !! textOf( block.innerBlocks[ 0 ] );

function Edit( { clientId, isSelected } ) {
	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );
	// Bloc ou l'un de ses atouts sélectionné. Sinon, le canvas montre le rendu du
	// site : pas de bouton d'ajout.
	const { isEditing, items } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );

			return {
				isEditing: isSelected || editor.hasSelectedInnerBlock( clientId, true ),
				items: editor.getBlocks( clientId ),
			};
		},
		[ clientId, isSelected ]
	);

	// Atout créé avec son titre, curseur placé dans le titre : sans titre, il
	// n'arriverait qu'ensuite, par le modèle de l'atout, et le curseur irait
	// dans le texte.
	const addItem = () => {
		const [ item ] = createBlocksFromInnerBlocksTemplate( [ ATOUT ] );
		insertBlock( item, items.length, clientId, false );
		selectBlock( item.innerBlocks[ 0 ].clientId, 0 );
	};

	const innerBlocksProps = useInnerBlocksProps(
		useBlockProps( { className: items.length && ! items.some( hasTitle ) ? 'is-incomplete' : undefined } ),
		{
			allowedBlocks: [ ITEM ],
			// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
			template: items.length ? undefined : TEMPLATE,
			templateLock: false,
			orientation: 'horizontal',
			renderAppender: () =>
				isEditing && (
					<li className="wp-block-couturier-reassurance__add">
						<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
							{ __( 'Ajouter un atout', 'couturier' ) }
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
