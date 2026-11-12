/**
 * Panneau du bloc « Objectifs et programme » (`couturier/training-overview-panel`) :
 * titre H3, paragraphes et listes libres, bouton facultatif. Repris de l'encart
 * des Formules (`formula-note`).
 *
 * - titre : `core/heading` verrouillé, toujours un `<h3>`, sans format ;
 *   facultatif (vide, il n'est pas rendu) ;
 * - contenu : `core/paragraph` et `core/list` (à puces ou numérotée) ajoutés,
 *   retirés et déplacés librement (`templateLock: false`) ;
 * - bouton : un `core/buttons` facultatif (un bouton, style « Contour » à la
 *   création), ajouté par le panneau « Bouton » ou par « Ajouter un bouton » du
 *   canvas, toujours ramené en fin de panneau ;
 * - fond (`background`) : liste fermée, `_shared/backgrounds.js`.
 *
 * Panneau rendu s'il a un titre ou du texte ; vide, il n'est pas rendu.
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Button, Notice } from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { BackgroundPanel, useBackground } from '../_shared/backgrounds.js';
import { ButtonsControl, useButtonCount } from '../_shared/buttons.js';
import { HEADING_FORMATS_OFF, TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import { plus } from '../_shared/icons.js';
import { REMOVABLE, hideLockedControls, textOf, useLockedContent, useNonBreakingPunctuation } from '../_shared/locked-content.js';
import metadata from './block.json';
import { LEVEL, TEMPLATE } from './template.js';

const ROOT = 'couturier/training-overview';

/** Blocs imbriqués verrouillés. */
const LOCKED_BLOCKS = [ 'core/heading' ];

/** Blocs de texte : le groupe de boutons recréé se place après le dernier. */
const TEXT_BLOCKS = [ 'core/heading', 'core/paragraph', 'core/list' ];

/** Le bouton du modèle : style « Contour ». */
const BUTTONS = [ [ 'core/button', { className: 'is-style-outline', lock: REMOVABLE } ] ];

/** Bloc contenant du texte saisi (titre, paragraphe, liste et ses éléments). */
const hasText = ( block ) => !! textOf( block ) || block.innerBlocks.some( hasText );

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const background = useBackground( metadata, attributes.background );
	const registry = useRegistry();
	const { moveBlockToPosition, selectBlock, __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );

	const { blocks, isEditing } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return {
				blocks: editor.getBlocks( clientId ),
				isEditing:
					isSelected ||
					editor.hasSelectedInnerBlock( clientId, true ) ||
					( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) ),
			};
		},
		[ clientId, isSelected ]
	);

	const isIncomplete = blocks.length > 0 && ! blocks.filter( ( block ) => 'core/buttons' !== block.name ).some( hasText );
	const [ buttonCount, setButtonCount ] = useButtonCount( clientId, blocks, BUTTONS, { after: TEXT_BLOCKS } );

	// Bouton ajouté depuis le canvas : curseur placé dans son libellé.
	const addButton = () => {
		setButtonCount( 1 );
		const group = registry.select( blockEditorStore ).getBlocks( clientId ).find( ( block ) => 'core/buttons' === block.name );
		if ( group?.innerBlocks[ 0 ] ) {
			selectBlock( group.innerBlocks[ 0 ].clientId, 0 );
		}
	};

	// Titre toujours verrouillé, toujours en H3.
	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Bouton toujours en dernier : un paragraphe ou une liste ajouté par « + »
	// arrive en fin de panneau, après lui. Même étape d'annulation que l'ajout.
	const buttonsIndex = blocks.findIndex( ( block ) => 'core/buttons' === block.name );
	useEffect( () => {
		if ( buttonsIndex >= 0 && buttonsIndex < blocks.length - 1 ) {
			__unstableMarkNextChangeAsNotPersistent();
			moveBlockToPosition( blocks[ buttonsIndex ].clientId, clientId, clientId, blocks.length - 1 );
		}
	}, [ blocks, buttonsIndex, clientId, moveBlockToPosition, __unstableMarkNextChangeAsNotPersistent ] );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	// `core/buttons` absent de `allowedBlocks` : l'inserteur ne le propose pas
	// (il serait créé au style par défaut) ; il s'ajoute par `useButtonCount`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( {
			className: [ background.className, isIncomplete && 'is-incomplete' ].filter( Boolean ).join( ' ' ) || undefined,
		} ),
		{
			allowedBlocks: [ 'core/paragraph', 'core/list' ],
			template: blocks.length ? undefined : TEMPLATE,
			templateLock: false,
			// Bouton « + » d'ajout d'un paragraphe ou d'une liste, en cours d'édition.
			renderAppender: isEditing ? InnerBlocks.ButtonBlockAppender : false,
		}
	);

	return (
		<div { ...innerBlocksProps }>
			<BackgroundPanel
				{ ...background }
				title={ __( 'Fond du panneau', 'couturier' ) }
				onChange={ ( slug ) => setAttributes( { background: slug } ) }
			/>
			<ButtonsControl
				count={ buttonCount }
				setCount={ setButtonCount }
				max={ 1 }
				help={ __( 'Bouton à contour par défaut, en bas du panneau.', 'couturier' ) }
			/>
			{ children }
			{ isEditing && 0 === buttonCount && (
				<Button
					__next40pxDefaultSize
					variant="secondary"
					icon={ plus }
					className="wp-block-couturier-training-overview-panel__add-button"
					onClick={ addButton }
				>
					{ __( 'Ajouter un bouton', 'couturier' ) }
				</Button>
			) }
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-training-overview-panel__notice">
					{ __( 'Panneau vide : sans titre ni texte, il n\'est pas affiché sur le site.', 'couturier' ) }
				</Notice>
			) }
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre sans format ; paragraphes : formats du texte.
restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
	'core/paragraph': TEXT_FORMATS_OFF,
} );

// Titre sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );
