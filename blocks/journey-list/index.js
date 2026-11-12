/**
 * Liste des étapes du bloc « Parcours en étapes » (`couturier/journey-list`).
 *
 * Simple conteneur des étapes (`couturier/journey-step`). Le bloc parent fige son
 * modèle (`templateLock: 'all'`) ; le `templateLock: false` de la liste l'emporte
 * pour ses propres blocs imbriqués : les étapes s'ajoutent (bouton « Ajouter une
 * étape »), se retirent et se déplacent librement.
 *
 * Numérotation et câblage de l'accordéon : au rendu, par `render.php`.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { TEMPLATE } from '../journey-step/template.js';
import metadata from './block.json';

const STEP = 'couturier/journey-step';

function Edit( { clientId } ) {
	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );
	// Parcours ou l'un de ses blocs imbriqués sélectionné. Sinon, le canvas montre
	// le rendu du site : pas de bouton d'ajout.
	const { isEditing, count } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const journeyId = editor.getBlockRootClientId( clientId );

			return {
				isEditing: editor.isBlockSelected( journeyId ) || editor.hasSelectedInnerBlock( journeyId, true ),
				count: editor.getBlockCount( clientId ),
			};
		},
		[ clientId ]
	);

	// Étape créée avec son titre et son texte, curseur placé dans le titre.
	const addStep = () => {
		const [ step ] = createBlocksFromInnerBlocksTemplate( [ [ STEP, {}, TEMPLATE ] ] );
		insertBlock( step, count, clientId, false );
		selectBlock( step.innerBlocks[ 0 ].clientId, 0 );
	};

	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		allowedBlocks: [ STEP ],
		templateLock: false,
		renderAppender: () =>
			isEditing && (
				<Button
					__next40pxDefaultSize
					variant="secondary"
					icon={ plus }
					className="wp-block-couturier-journey-list__add"
					onClick={ addStep }
				>
					{ __( 'Ajouter une étape', 'couturier' ) }
				</Button>
			),
	} );

	return <div { ...innerBlocksProps } />;
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
