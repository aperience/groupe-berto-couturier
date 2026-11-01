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
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Button, Notice } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { ButtonsControl, useButtonCount } from '../_shared/buttons.js';
import ImageField, { ImageInfoPanel } from '../_shared/image-field.js';
import { plus } from '../_shared/icons.js';
import {
	LOCKED,
	REMOVABLE,
	hideLockedControls,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import exampleImage from './example.webp';
import './formats.js';

const GHOST = 'is-style-ghost';

/**
 * `imageId` réservé à l'aperçu de l'inserteur (`example`) : une image fournie avec
 * le bloc, l'aperçu ne pouvant compter sur aucune pièce jointe de la médiathèque.
 * Jamais enregistré ; `render.php` n'afficherait d'ailleurs rien.
 */
const EXAMPLE_IMAGE_ID = -1;
const EXAMPLE_MEDIA = { source_url: exampleImage, alt_text: '', media_details: { width: 756, height: 504 } };

/**
 * Cadre de l'image, 432 × 260 (maquette), et format le moins allongé qu'on
 * recadre pour le remplir (3:2 : 10 % de la hauteur rognés au plus). Une image
 * moins allongée (4:3, carrée, portrait) n'est jamais recadrée. Mêmes valeurs
 * dans `render.php`.
 */
const FRAME_RATIO = 432 / 260;
const MIN_CROP_RATIO = 3 / 2;

/** Classe de l'image : `is-cropped` si elle remplit le cadre en étant recadrée. */
function imageClassName( media ) {
	const { width, height } = media?.media_details ?? {};
	const ratio = width && height ? width / height : 0;

	return 'wp-block-couturier-cta__image' + ( ratio >= MIN_CROP_RATIO && ratio < FRAME_RATIO ? ' is-cropped' : '' );
}

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

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { imageId } = attributes;
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	// Pièce jointe de l'image ; `isMissing` si elle a été supprimée de la médiathèque.
	const { media, isMissing } = useSelect(
		( select ) => {
			if ( ! imageId ) {
				return { media: null, isMissing: false };
			}

			if ( EXAMPLE_IMAGE_ID === imageId ) {
				return { media: EXAMPLE_MEDIA, isMissing: false };
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

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const paragraph = blocks.find( ( block ) => block.name === 'core/paragraph' );
	const isIncomplete = blocks.length > 0 && ( ! textOf( heading ) || ! textOf( paragraph ) );
	const [ buttonCount, setButtonCount ] = useButtonCount( clientId, blocks, BUTTONS );
	// Colonne image : l'image, ou son emplacement tant que le bloc est en cours
	// d'édition (pas pendant le chargement d'une image déjà choisie).
	const isImageLoading = !! imageId && ! media && ! isMissing;
	const hasMediaColumn = !! media || ( isEditing && ! isImageLoading );

	// Titre et texte toujours verrouillés, titre toujours en H2 ; espace insécable
	// avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide). Sous `templateLock: 'all'`,
	// WordPress resynchronise sinon les blocs imbriqués avec lui à chaque ouverture
	// de l'éditeur, en profondeur : un bouton ou un groupe retiré reviendrait.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{ className: 'wp-block-couturier-cta__content' },
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<ButtonsControl
				count={ buttonCount }
				setCount={ setButtonCount }
				max={ 2 }
				help={ __( 'Le premier bouton est orange avec une flèche, le second transparent.', 'couturier' ) }
			/>
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
						imageClassName={ imageClassName( media ) }
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
	example: { ...metadata.example, attributes: { imageId: EXAMPLE_IMAGE_ID } },
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre ou texte du CTA sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name );
