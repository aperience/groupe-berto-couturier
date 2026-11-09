/**
 * Bloc « Étapes » (`couturier/steps`) : liste ordonnée (`<ol>`) d'étapes
 * (`couturier/step`) — pastille numérotée, titre H3, texte.
 *
 * Le numéro et la couleur de la pastille sont calculés en CSS (compteur et
 * `:nth-child(4n+…)`, `block/_steps.scss`) : rien n'est enregistré, une étape
 * ajoutée, retirée ou déplacée renumérote la liste d'elle-même.
 *
 * Inséré avec trois étapes, sans limite de nombre. Sans étape titrée, le bloc
 * n'est pas rendu (`render.php`) : il reçoit `is-incomplete` dans le canvas.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { textOf } from '../_shared/locked-content.js';
import { TITLE } from '../step/title.js';
import metadata from './block.json';

const ITEM = 'couturier/step';

const STEP = [ ITEM, {}, [ TITLE ] ];

const TEMPLATE = [ STEP, STEP, STEP ];

/** Étape affichée sur le site : titre saisi. */
const hasTitle = ( block ) => !! textOf( block.innerBlocks[ 0 ] );

function Edit( { clientId, isSelected } ) {
	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );
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

	// Étape créée avec son titre, curseur placé dans le titre.
	const addItem = () => {
		const [ item ] = createBlocksFromInnerBlocksTemplate( [ STEP ] );
		insertBlock( item, items.length, clientId, false );
		selectBlock( item.innerBlocks[ 0 ].clientId, 0 );
	};

	const innerBlocksProps = useInnerBlocksProps(
		useBlockProps( {
			role: 'list',
			className: items.length && ! items.some( hasTitle ) ? 'is-incomplete' : undefined,
		} ),
		{
			allowedBlocks: [ ITEM ],
			// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
			template: items.length ? undefined : TEMPLATE,
			templateLock: false,
			orientation: 'horizontal',
			renderAppender: () =>
				isEditing && (
					<li className="wp-block-couturier-steps__add">
						<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
							{ __( 'Ajouter une étape', 'couturier' ) }
						</Button>
					</li>
				),
		}
	);

	return <ol { ...innerBlocksProps } />;
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
