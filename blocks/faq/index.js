/**
 * Bloc « Questions fréquentes » (`couturier/faq`) : titre, texte et bouton à
 * gauche, questions / réponses en accordéon à droite.
 *
 * Tout le contenu est en blocs imbriqués (cf. `blocks/CLAUDE.md`), dans un modèle
 * figé par `templateLock: 'all'` :
 * - le titre est un `core/heading`, toujours un `<h2>`, avec mise en avant ;
 * - le texte est un `core/paragraph`, facultatif : vide, il n'est pas rendu ;
 * - le bouton (0 ou 1) est un `core/button` au style `deep`, avec flèche ;
 * - la liste des questions est un `couturier/faq-list`, dont le propre
 *   `templateLock: false` permet d'ajouter, de retirer et de déplacer les
 *   questions (`couturier/faq-item`).
 *
 * Titre, texte et liste sont verrouillés (ni supprimables ni déplaçables) ; le
 * groupe de boutons et le bouton portent `lock.remove: false` et restent
 * supprimables. Panneau « Bouton » et bouton « Ajouter un bouton » du canvas :
 * cf. `blocks/_shared/buttons.js`.
 *
 * `save()` n'enregistre que les blocs imbriqués : l'enveloppe est produite par
 * `render.php`, qui n'affiche rien sans titre ni question complète.
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button, Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { ButtonsControl, useButtonCount } from '../_shared/buttons.js';
import { plus } from '../_shared/icons.js';
import {
	LOCKED,
	REMOVABLE,
	hideLockedControls,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import { QUESTION } from '../faq-item/question.js';
import metadata from './block.json';
import './formats.js';

/** Le bouton du modèle : pétrole foncé avec flèche. */
const BUTTONS = [ [ 'core/button', { className: 'is-style-deep', hasArrow: true, lock: REMOVABLE } ] ];

/** Première question, préremplie à l'insertion (les suivantes sont vides). */
const FIRST_ITEM = [
	'couturier/faq-item',
	{ answer: __( 'Ceci est la réponse', 'couturier' ) },
	[ [ QUESTION[ 0 ], { ...QUESTION[ 1 ], content: __( 'Ceci est une première question ?', 'couturier' ) } ] ],
];

// Titre et première question préremplis à l'insertion : le modèle n'est passé
// qu'à un bloc vide (cf. `Edit`), il ne réécrit jamais un contenu saisi.
const TEMPLATE = [
	[ 'core/heading', { level: 2, lock: LOCKED, content: __( 'Questions fréquentes', 'couturier' ), placeholder: __( 'Titre', 'couturier' ) } ],
	[ 'core/paragraph', { lock: LOCKED, placeholder: __( 'Texte (facultatif)', 'couturier' ) } ],
	[ 'core/buttons', { lock: REMOVABLE }, BUTTONS ],
	[ 'couturier/faq-list', { lock: LOCKED }, [ FIRST_ITEM ] ],
];

/** Blocs imbriqués verrouillés. */
const LOCKED_BLOCKS = [ 'core/heading', 'core/paragraph', 'couturier/faq-list' ];

/** Le titre de la FAQ est toujours un `<h2>`. */
const LEVEL = 2;

/** Question complète : question et réponse saisies (sinon non rendue). */
const isComplete = ( item ) =>
	!! textOf( item.innerBlocks.find( ( block ) => block.name === 'core/heading' ) ) && !! textOf( item.attributes.answer );

function Edit( { clientId, isSelected } ) {
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	// Bloc ou l'un de ses blocs imbriqués sélectionné. Sinon, le canvas montre le
	// rendu du site : ni avertissement, ni bouton d'ajout.
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const list = blocks.find( ( block ) => block.name === 'couturier/faq-list' );
	const isIncomplete = blocks.length > 0 && ( ! textOf( heading ) || ! list?.innerBlocks.some( isComplete ) );
	const [ buttonCount, setButtonCount ] = useButtonCount( clientId, blocks, BUTTONS );

	// Titre, texte et liste toujours verrouillés, titre toujours en H2 ; espace
	// insécable avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide). Sous `templateLock: 'all'`,
	// WordPress resynchronise sinon les blocs imbriqués avec lui à chaque ouverture
	// de l'éditeur, en profondeur : un bouton retiré reviendrait.
	const { children, ...innerBlocksProps } = useInnerBlocksProps( useBlockProps(), {
		template: blocks.length ? undefined : TEMPLATE,
		templateLock: 'all',
	} );

	return (
		<>
			<ButtonsControl
				count={ buttonCount }
				setCount={ setButtonCount }
				max={ 1 }
				help={ __( 'Bouton pétrole foncé avec une flèche.', 'couturier' ) }
			/>
			<div { ...innerBlocksProps }>
				{ isEditing && isIncomplete && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-faq__notice">
						{ __( 'Le titre et au moins une question avec sa réponse sont obligatoires : sans eux, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
					</Notice>
				) }
				{ children }
				{ /* Sans bouton, rien d'autre ne signale qu'on peut en remettre un. */ }
				{ isEditing && 0 === buttonCount && (
					<Button
						__next40pxDefaultSize
						variant="secondary"
						icon={ plus }
						className="wp-block-couturier-faq__add-button"
						onClick={ () => setButtonCount( 1 ) }
					>
						{ __( 'Ajouter un bouton', 'couturier' ) }
					</Button>
				) }
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre, texte ou liste de la FAQ sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );
