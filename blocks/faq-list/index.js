/**
 * Liste des questions du bloc « Questions fréquentes » (`couturier/faq-list`).
 *
 * Simple conteneur des questions (`couturier/faq-item`). Le bloc parent fige son
 * modèle (`templateLock: 'all'`) ; le `templateLock: false` de la liste l'emporte
 * pour ses propres blocs imbriqués : les questions s'ajoutent (bouton « Ajouter
 * une question »), se retirent et se déplacent librement.
 *
 * Le câblage de l'accordéon (identifiants, première question ouverte) est fait
 * au rendu, par `render.php`.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { QUESTION } from '../faq-item/question.js';
import metadata from './block.json';

const ITEM = 'couturier/faq-item';

function Edit( { clientId } ) {
	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );
	// FAQ ou l'un de ses blocs imbriqués sélectionné. Sinon, le canvas montre le
	// rendu du site : pas de bouton d'ajout.
	const { isEditing, count } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const faqId = editor.getBlockRootClientId( clientId );

			return {
				isEditing: editor.isBlockSelected( faqId ) || editor.hasSelectedInnerBlock( faqId, true ),
				count: editor.getBlockCount( clientId ),
			};
		},
		[ clientId ]
	);

	// Question créée avec son titre, curseur placé dans le titre : sans titre, il
	// n'arriverait qu'ensuite, par le modèle de la question, et le curseur irait
	// dans la réponse, seul champ alors présent.
	const addItem = () => {
		const [ item ] = createBlocksFromInnerBlocksTemplate( [ [ ITEM, {}, [ QUESTION ] ] ] );
		insertBlock( item, count, clientId, false );
		selectBlock( item.innerBlocks[ 0 ].clientId, 0 );
	};

	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		allowedBlocks: [ ITEM ],
		templateLock: false,
		renderAppender: () =>
			isEditing && (
				<Button
					__next40pxDefaultSize
					variant="secondary"
					icon={ plus }
					className="wp-block-couturier-faq-list__add"
					onClick={ addItem }
				>
					{ __( 'Ajouter une question', 'couturier' ) }
				</Button>
			),
	} );

	return <div { ...innerBlocksProps } />;
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
