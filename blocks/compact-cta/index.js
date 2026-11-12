/**
 * Bloc « Appel à action compact » (`couturier/compact-cta`) : bandeau clair arrondi,
 * titre et texte à gauche, un ou deux boutons à droite sur une ligne
 * (Figma 301:6347, 301:6801).
 *
 * Même structure que le CTA (`blocks/cta/index.js`) : titre `core/heading` toujours
 * en H2, texte `core/paragraph`, tous deux verrouillés, et zéro à deux
 * `core/button` (panneau « Boutons ») : toujours pétrole foncé avec flèche en
 * premier, orange (style par défaut) en second.
 * Fond (`background`) dans une liste fermée (`_shared/backgrounds.js`), pétrole
 * clair par défaut → classe `is-bg-{fond}`. Anciens styles de bloc
 * (`is-style-peach` / `-pink` / `-default`, supprimés) : migrés à l'ouverture
 * dans l'éditeur (pêche/300, orange/100, défaut), puis classe retirée.
 *
 * Largeur (`width`) : compacte (1063 px, défaut) ou pleine (`wide` → classe
 * `is-wide`, tout le conteneur). Image facultative à gauche (`imageId`, Figma
 * 301:7148) → classe `has-media`. Texte facultatif, titre obligatoire.
 *
 * `save()` n'enregistre que les blocs imbriqués : l'enveloppe et l'image sont
 * produites par `render.php`, qui n'affiche rien si le titre est vide.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { ButtonsControl, useButtonCount } from '../_shared/buttons.js';
import {
	LOCKED,
	REMOVABLE,
	hideLockedControls,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import { BackgroundPanel, useBackground } from '../_shared/backgrounds.js';
import ImageField, { ImageInfoPanel } from '../_shared/image-field.js';
import metadata from './block.json';
import './formats.js';

const BUTTONS = [
	[ 'core/button', { className: 'is-style-deep', hasArrow: true, lock: REMOVABLE } ],
	[ 'core/button', { lock: REMOVABLE } ],
];

const TEMPLATE = [
	[ 'core/heading', { level: 2, lock: LOCKED, placeholder: __( 'Titre', 'couturier' ) } ],
	[ 'core/paragraph', { lock: LOCKED, placeholder: __( 'Texte', 'couturier' ) } ],
	[ 'core/buttons', { lock: REMOVABLE }, BUTTONS ],
];

/** Anciens styles de bloc → fond. */
const LEGACY_STYLES = { default: undefined, peach: 'peach-300', pink: 'orange-100' };
const LEGACY_PATTERN = /(^|\s)is-style-(default|peach|pink)(?=\s|$)/;

/** Le titre est toujours un `<h2>`. */
const LEVEL = 2;

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const { imageId, width } = attributes;
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
	// Colonne image : l'image, ou son emplacement en cours d'édition (pas pendant
	// le chargement d'une image déjà choisie).
	const isImageLoading = !! imageId && ! media && ! isMissing;
	const hasMediaColumn = !! media || ( isEditing && ! isImageLoading );

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const isIncomplete = blocks.length > 0 && ! textOf( heading );
	const [ buttonCount, setButtonCount ] = useButtonCount( clientId, blocks, BUTTONS );

	const background = useBackground( metadata, attributes.background );

	// Migration des anciens styles de bloc.
	const legacyClassName = attributes.className ?? '';
	useEffect( () => {
		const match = legacyClassName.match( LEGACY_PATTERN );
		if ( ! match ) {
			return;
		}
		setAttributes( {
			...( LEGACY_STYLES[ match[ 2 ] ] ? { background: LEGACY_STYLES[ match[ 2 ] ] } : {} ),
			className: legacyClassName.replace( LEGACY_PATTERN, '' ).trim() || undefined,
		} );
	}, [ legacyClassName, setAttributes ] );

	useLockedContent( blocks, { level: LEVEL } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (cf. `blocks/CLAUDE.md`).
	const className = [
		background.className,
		'wide' === width ? 'is-wide' : '',
		hasMediaColumn ? 'has-media' : '',
		// Image assez large : pleine largeur en mobile (même seuil que `render.php`).
		( media?.media_details?.width ?? 0 ) >= 640 ? 'is-media-wide' : '',
	].filter( Boolean ).join( ' ' );
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( { className: className || undefined } ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<BackgroundPanel
				{ ...background }
				title={ __( 'Fond du bandeau', 'couturier' ) }
				onChange={ ( slug ) => setAttributes( { background: slug } ) }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Largeur', 'couturier' ) }>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						hideLabelFromVision
						label={ __( 'Largeur', 'couturier' ) }
						value={ width }
						onChange={ ( value ) => setAttributes( { width: value } ) }
					>
						<ToggleGroupControlOption value="compact" label={ __( 'Compacte', 'couturier' ) } />
						<ToggleGroupControlOption value="wide" label={ __( 'Pleine largeur', 'couturier' ) } />
					</ToggleGroupControl>
				</PanelBody>
			</InspectorControls>
			<ButtonsControl count={ buttonCount } setCount={ setButtonCount } max={ 2 } />
			<ImageInfoPanel media={ media } isMissing={ isMissing } />
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-compact-cta__notice">
					{ __( 'Le titre est obligatoire : sans lui, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
				</Notice>
			) }
			<div { ...innerBlocksProps }>
				{ hasMediaColumn && (
					<ImageField
						compact
						className="wp-block-couturier-compact-cta__media"
						imageClassName="wp-block-couturier-compact-cta__image"
						media={ media }
						isEditing={ isEditing }
						onSelect={ ( selected ) => setAttributes( { imageId: selected?.id } ) }
						onRemove={ () => setAttributes( { imageId: undefined } ) }
						label={ __( 'Image (facultative)', 'couturier' ) }
					/>
				) }
				{ children }
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

hideLockedControls( metadata.name );
