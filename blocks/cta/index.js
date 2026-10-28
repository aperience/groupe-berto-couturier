/**
 * Bloc « Appel à l'action » (`couturier/cta`) : panneau sombre avec titre, texte,
 * boutons et image.
 *
 * Titre, texte et boutons sont des blocs imbriqués (cf. `blocks/CLAUDE.md`) :
 * - le titre est un `core/heading`, seul bloc que lit le panneau Structure, et
 *   toujours un `<h2>` : aucun choix de niveau n'est proposé ;
 * - le texte est un `core/paragraph`, et non un attribut : le bloc n'a qu'une zone
 *   d'imbrication, un attribut ne pourrait pas s'intercaler entre le titre et les
 *   boutons ;
 * - les boutons sont des `core/button`, habillés par `Blocks\ButtonStyles`.
 *
 * `templateLock: 'all'` fige le modèle. Le groupe de boutons et chaque bouton portent
 * `lock.remove: false`, qui l'emporte sur le verrou du modèle : ils restent
 * supprimables, le titre et le texte non. Le verrou interdisant tout ajout, le
 * panneau « Boutons » (0, 1 ou 2) et le bouton « Ajouter des boutons » du canvas
 * (affiché, bloc sélectionné, quand il n'y en a plus aucun) passent par
 * `replaceInnerBlocks`, qu'il ne filtre pas.
 *
 * `save()` n'enregistre que les blocs imbriqués : l'enveloppe et l'image sont
 * produites par `render.php`, qui n'affiche rien si le titre ou le texte est vide.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	Button,
	Notice,
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import ImageField, { ImageInfoPanel } from '../_shared/image-field.js';
import { plus } from '../_shared/icons.js';
import metadata from './block.json';
import './formats.js';

/** Verrou propre au bloc : supprimable malgré `templateLock: 'all'`, non déplaçable. */
const REMOVABLE = { remove: false, move: true };

/** Verrou du titre et du texte : ni supprimables ni déplaçables, rétabli s'il est levé. */
const LOCKED = { remove: true, move: true };

const GHOST = 'is-style-ghost';

/** Les deux boutons du modèle : orange avec flèche, puis transparent. */
const BUTTONS = [
	[ 'core/button', { hasArrow: true, lock: REMOVABLE } ],
	[ 'core/button', { className: GHOST, lock: REMOVABLE } ],
];

const TEMPLATE = [
	[ 'core/heading', { level: 2, lock: LOCKED, placeholder: __( 'Titre', 'couturier' ) } ],
	[ 'core/paragraph', { lock: LOCKED, placeholder: __( 'Texte', 'couturier' ) } ],
	[ 'core/buttons', { lock: REMOVABLE }, BUTTONS ],
];

/** Le titre du CTA est toujours un `<h2>`. */
const LEVEL = 2;

/** Texte d'un champ RichText, balises retirées. */
const textOf = ( block ) => String( block?.attributes?.content ?? '' ).replace( /<[^>]*>/g, '' ).trim();

const isGhost = ( button ) => ( button.attributes.className ?? '' ).split( ' ' ).includes( GHOST );

/**
 * Nombre de boutons (0, 1 ou 2) et son réglage. Les boutons existants sont
 * conservés ; un bouton ajouté reprend le style manquant du modèle (orange en
 * tête, transparent ensuite).
 *
 * @return {[number, Function]} Nombre actuel, fonction qui le change.
 */
function useButtonCount( clientId, blocks ) {
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const group = blocks.find( ( block ) => block.name === 'core/buttons' );
	const count = group?.innerBlocks.length ?? 0;

	const setCount = ( value ) => {
		const target = Number( value );
		const others = blocks.filter( ( block ) => block !== group );

		if ( 0 === target ) {
			replaceInnerBlocks( clientId, others, false );
			return;
		}

		let buttons = ( group?.innerBlocks ?? [] ).slice( 0, target );

		if ( buttons.length < target && ! buttons.some( ( button ) => ! isGhost( button ) ) ) {
			buttons = [ ...createBlocksFromInnerBlocksTemplate( [ BUTTONS[ 0 ] ] ), ...buttons ];
		}

		if ( buttons.length < target ) {
			buttons = [ ...buttons, ...createBlocksFromInnerBlocksTemplate( [ BUTTONS[ 1 ] ] ) ];
		}

		if ( group ) {
			replaceInnerBlocks( group.clientId, buttons, false );
			return;
		}

		const [ newGroup ] = createBlocksFromInnerBlocksTemplate( [ [ 'core/buttons', { lock: REMOVABLE } ] ] );
		newGroup.innerBlocks = buttons;
		replaceInnerBlocks( clientId, [ ...others, newGroup ], false );
	};

	return [ count, setCount ];
}

/** Panneau « Boutons » de la barre latérale. */
function ButtonsControl( { count, setCount } ) {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Boutons', 'couturier' ) }>
				<ToggleGroupControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					isBlock
					label={ __( 'Nombre de boutons', 'couturier' ) }
					help={ __( 'Le premier bouton est orange avec une flèche, le second transparent.', 'couturier' ) }
					value={ String( count ) }
					onChange={ setCount }
				>
					<ToggleGroupControlOption value="0" label={ __( 'Aucun', 'couturier' ) } />
					<ToggleGroupControlOption value="1" label="1" />
					<ToggleGroupControlOption value="2" label="2" />
				</ToggleGroupControl>
			</PanelBody>
		</InspectorControls>
	);
}

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { imageId } = attributes;
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	// Pièce jointe de l'image ; `isMissing` si elle a été supprimée de la médiathèque.
	const { media, isMissing } = useSelect(
		( select ) => {
			if ( ! imageId ) {
				return { media: null, isMissing: false };
			}

			const attachment = select( coreStore ).getMedia( imageId, { context: 'view' } );
			const isResolved = select( coreStore ).hasFinishedResolution( 'getMedia', [ imageId, { context: 'view' } ] );

			return { media: attachment ?? null, isMissing: isResolved && ! attachment };
		},
		[ imageId ]
	);
	// Bloc ou l'un de ses blocs imbriqués sélectionné. Sinon, le canvas montre le
	// rendu du site : ni avertissement, ni bouton d'ajout.
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);
	const { replaceInnerBlocks, updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const paragraph = blocks.find( ( block ) => block.name === 'core/paragraph' );
	const group = blocks.find( ( block ) => block.name === 'core/buttons' );
	const isIncomplete = blocks.length > 0 && ( ! textOf( heading ) || ! textOf( paragraph ) );
	const [ buttonCount, setButtonCount ] = useButtonCount( clientId, blocks );
	// Colonne image : l'image, ou son emplacement tant que le bloc est en cours
	// d'édition (pas pendant le chargement d'une image déjà choisie).
	const isImageLoading = !! imageId && ! media && ! isMissing;
	const hasMediaColumn = !! media || ( isEditing && ! isImageLoading );

	// Groupe vidé bouton par bouton : on le retire, dans la même étape d'annulation.
	useEffect( () => {
		if ( group && 0 === group.innerBlocks.length ) {
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( clientId, blocks.filter( ( block ) => block !== group ), false );
		}
	}, [ group, blocks, clientId, replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent ] );

	// Titre et texte toujours verrouillés, titre toujours en H2 : un déverrouillage
	// (cadenas, menu « Options ») ou un changement de niveau (collage, éditeur de
	// code) est annulé aussitôt.
	useEffect( () => {
		[ heading, paragraph ].filter( Boolean ).forEach( ( block ) => {
			const changes = {};

			if ( ! block.attributes.lock?.remove || ! block.attributes.lock?.move ) {
				changes.lock = LOCKED;
			}

			if ( block === heading && LEVEL !== block.attributes.level ) {
				changes.level = LEVEL;
			}

			if ( Object.keys( changes ).length ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( block.clientId, changes );
			}
		} );
	}, [ heading, paragraph, updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent ] );

	// Modèle passé à l'insertion seulement (bloc vide). Sous `templateLock: 'all'`,
	// WordPress resynchronise sinon les blocs imbriqués avec lui à chaque ouverture
	// de l'éditeur, en profondeur : un bouton ou un groupe retiré reviendrait.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{ className: 'wp-block-couturier-cta__content' },
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<ButtonsControl count={ buttonCount } setCount={ setButtonCount } />
			<ImageInfoPanel media={ media } isMissing={ isMissing } />
			<div { ...useBlockProps( { className: hasMediaColumn ? 'has-image' : undefined } ) }>
				{ isEditing && isIncomplete && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-cta__notice">
						{ __( 'Le titre et le texte sont obligatoires : sans eux, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
					</Notice>
				) }
				<div { ...innerBlocksProps }>
					{ children }
					{ /* Sans bouton, rien d'autre ne signale qu'on peut en remettre. */ }
					{ isEditing && 0 === buttonCount && (
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ plus }
							className="wp-block-couturier-cta__add-buttons"
							onClick={ () => setButtonCount( 2 ) }
						>
							{ __( 'Ajouter des boutons', 'couturier' ) }
						</Button>
					) }
				</div>
				{ hasMediaColumn && (
					<ImageField
						className="wp-block-couturier-cta__media"
						imageClassName="wp-block-couturier-cta__image"
						media={ media }
						isEditing={ isEditing }
						onSelect={ ( selected ) => setAttributes( { imageId: selected?.id } ) }
						onRemove={ () => setAttributes( { imageId: undefined } ) }
						label={ __( 'Image (facultative)', 'couturier' ) }
					/>
				) }
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre ou texte du CTA sélectionné : on masque le cadenas de la barre d'outils
// (`block-editor-block-lock-toolbar`) et les variations H2 / H3 de la barre
// latérale (`block-editor-block-variation-transforms`). Les règles ne sont
// montées que le temps de la sélection, et ne touchent donc aucun autre bloc.
// L'entrée « Déverrouiller » du menu « Options », sans classe, reste affichée :
// son effet est annulé par `Edit`.
const HIDDEN_CONTROLS = [
	'.block-editor-block-toolbar .block-editor-block-lock-toolbar',
	'.block-editor-block-inspector .block-editor-block-variation-transforms',
].join( ',' );

addFilter(
	'editor.BlockEdit',
	'couturier/cta/locked-content',
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const isInBlock = useSelect(
				( select ) =>
					[ 'core/heading', 'core/paragraph' ].includes( props.name ) &&
					select( blockEditorStore ).getBlockParentsByBlockName( props.clientId, metadata.name ).length > 0,
				[ props.name, props.clientId ]
			);

			return (
				<>
					{ isInBlock && props.isSelected && (
						<InspectorControls>
							<style>{ `${ HIDDEN_CONTROLS } { display: none; }` }</style>
						</InspectorControls>
					) }
					<BlockEdit { ...props } />
				</>
			);
		},
		'withCtaLockedContent'
	)
);
