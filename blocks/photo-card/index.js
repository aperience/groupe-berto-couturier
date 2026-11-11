/**
 * Carte du bloc « Cartes photo » (`couturier/photo-card`) : photo, badge
 * facultatif, sur-titre, titre et texte court. La carte n'est pas cliquable.
 *
 * - la photo (`imageId`) passe par `ImageField` (`blocks/_shared/image-field.js`) ;
 *   point focal (`focalPoint` → `--focal`, `object-position`) dans la barre latérale ;
 * - le titre est un `core/heading` imbriqué, toujours un `<h3>` : seul bloc que
 *   lit le panneau Structure. Verrouillé, sans format ;
 * - badge et sur-titre sont des attributs écrits avant le titre dans le HTML
 *   enregistré, le texte après lui : le compteur de mots les lit. Le badge
 *   s'affiche par l'interrupteur « Afficher un badge » (`hasBadge`), prérempli
 *   « Le + choisi ». Texte : gras, lien et saut de ligne permis (l'ancien lien de
 *   toute la carte, attribut `link`, est supprimé) ;
 *
 * - le fond (`background`) se choisit dans une liste fermée
 *   (`_shared/backgrounds.js`) : gris clair (défaut), blanc ou pétrole très clair,
 *   seuls fonds où le sur-titre tient 4,5:1 → classe `is-bg-{fond}`.
 *
 * Aperçu de l'inserteur : `imageId` négatif, cf. `example-images.js`.
 *
 * Sans titre, la carte n'est pas rendue sur le site (`is-incomplete`). Les autres
 * champs sont facultatifs.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { FocalPointPicker, Notice, PanelBody, ToggleControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import ImageField, { ImageInfoPanel, imageUrl } from '../_shared/image-field.js';
import {
	hideLockedControls,
	nonBreaking,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import { BackgroundPanel, useBackground } from '../_shared/backgrounds.js';
import metadata from './block.json';
import { exampleMedia } from './example-images.js';
import { LEVEL, TITLE } from './title.js';

const TEMPLATE = [ TITLE ];

const TITLE_BLOCKS = [ 'core/heading' ];

const ROOT = 'couturier/photo-cards';

const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };

/** `object-position` du point focal, en variable `--focal` (même calcul dans `render.php`). */
const objectPosition = ( { x, y } = DEFAULT_FOCAL_POINT ) =>
	`${ Math.round( x * 1000 ) / 10 }% ${ Math.round( y * 1000 ) / 10 }%`;

/** Libellé proposé quand on affiche le badge. */
const DEFAULT_BADGE = __( 'Le + choisi', 'couturier' );

/** Formats du texte : gras et lien (saut de ligne par Maj+Entrée). */
const TEXT_FORMATS = [ 'core/bold', 'core/link' ];

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { imageId, focalPoint, hasBadge, badge, eyebrow, text } = attributes;
	const background = useBackground( metadata, attributes.background );

	const { blocks, isEditing } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return {
				blocks: editor.getBlocks( clientId ),
				// Liste ou l'une de ses cartes en cours d'édition : emplacements vides et
				// avertissements ne s'affichent qu'alors (bloc désélectionné = rendu du site).
				isEditing:
					isSelected ||
					editor.hasSelectedInnerBlock( clientId, true ) ||
					( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) ),
			};
		},
		[ clientId, isSelected ]
	);

	// Pièce jointe de la photo ; `isMissing` si elle a été supprimée de la médiathèque.
	const { media, isMissing } = useSelect(
		( select ) => {
			if ( ! imageId ) {
				return { media: null, isMissing: false };
			}

			// `imageId` négatif : photo de l'aperçu de l'inserteur (`example-images.js`).
			if ( imageId < 0 ) {
				return { media: exampleMedia( imageId ) ?? null, isMissing: false };
			}

			const attachment = select( coreStore ).getMedia( imageId, { context: 'view' } );
			const isResolved = select( coreStore ).hasFinishedResolution( 'getMedia', [ imageId, { context: 'view' } ] );

			return { media: attachment ?? null, isMissing: isResolved && ! attachment };
		},
		[ imageId ]
	);

	// Photo choisie, en cours de chargement : pas d'emplacement (il clignoterait).
	const isImageLoading = !! imageId && ! media && ! isMissing;

	const isIncomplete = blocks.length > 0 && ! textOf( blocks[ 0 ] );

	// Titre toujours verrouillé, toujours en H3 ; espace insécable avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: TITLE_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( {
			className: [ background.className, isIncomplete && 'is-incomplete' ].filter( Boolean ).join( ' ' ) || undefined,
			style: focalPoint ? { '--focal': objectPosition( focalPoint ) } : undefined,
		} ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<li { ...innerBlocksProps }>
			<BackgroundPanel { ...background } onChange={ ( slug ) => setAttributes( { background: slug } ) } />
			<InspectorControls>
				<PanelBody title={ __( 'Photo', 'couturier' ) }>
					{ media ? (
						<FocalPointPicker
							__nextHasNoMarginBottom
							label={ __( 'Point focal', 'couturier' ) }
							help={ __( 'Partie de la photo toujours visible, quel que soit le recadrage.', 'couturier' ) }
							url={ imageUrl( media ) }
							value={ focalPoint ?? DEFAULT_FOCAL_POINT }
							onChange={ ( value ) => setAttributes( { focalPoint: value } ) }
						/>
					) : (
						! isMissing && <p>{ __( 'Choisissez la photo dans la carte.', 'couturier' ) }</p>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Badge', 'couturier' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Afficher un badge', 'couturier' ) }
						help={ __( 'Pastille orange posée en haut de la carte, au-dessus de la photo. Son libellé se modifie sur la carte.', 'couturier' ) }
						checked={ !! hasBadge }
						onChange={ ( checked ) =>
							setAttributes( checked ? { hasBadge: true, badge: textOf( badge ) ? badge : DEFAULT_BADGE } : { hasBadge: false } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<ImageInfoPanel media={ media } isMissing={ isMissing } />
			{ /* Zone photo vide, comme sur le front (`render.php`), quand il n'y a pas
			     d'emplacement à montrer : photo en cours de chargement, ou carte sans
			     photo hors édition. Sans elle, le texte remonterait sous le badge. */ }
			{ ( isImageLoading || ( ! media && ! isEditing ) ) && (
				<div className="wp-block-couturier-photo-card__media" aria-hidden="true" />
			) }
			{ ! isImageLoading && ( media || isEditing ) && (
				<ImageField
					className="wp-block-couturier-photo-card__media"
					imageClassName="wp-block-couturier-photo-card__image"
					media={ media }
					isEditing={ isEditing }
					onSelect={ ( selected ) => setAttributes( { imageId: selected?.id, focalPoint: undefined } ) }
					onRemove={ () => setAttributes( { imageId: undefined, focalPoint: undefined } ) }
					label={ __( 'Photo', 'couturier' ) }
				/>
			) }
			{ hasBadge && (
				<RichText
					tagName="p"
					className="wp-block-couturier-photo-card__badge"
					aria-label={ __( 'Libellé du badge', 'couturier' ) }
					placeholder={ DEFAULT_BADGE }
					value={ badge }
					onChange={ ( value ) => setAttributes( { badge: value } ) }
					allowedFormats={ [] }
					disableLineBreaks
				/>
			) }
			<RichText
				tagName="p"
				className="wp-block-couturier-photo-card__eyebrow"
				aria-label={ __( 'Sur-titre de la carte', 'couturier' ) }
				placeholder={ __( 'Sur-titre', 'couturier' ) }
				value={ eyebrow }
				onChange={ ( value ) => setAttributes( { eyebrow: nonBreaking( value ) } ) }
				allowedFormats={ [] }
				disableLineBreaks
			/>
			{ children }
			<RichText
				tagName="p"
				className="wp-block-couturier-photo-card__text"
				aria-label={ __( 'Texte de la carte', 'couturier' ) }
				placeholder={ __( 'Texte court', 'couturier' ) }
				value={ text }
				onChange={ ( value ) => setAttributes( { text: nonBreaking( value ) } ) }
				allowedFormats={ TEXT_FORMATS }
			/>
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-photo-card__notice">
					{ __( 'Titre obligatoire : sans lui, cette carte n\'est pas affichée sur le site.', 'couturier' ) }
				</Notice>
			) }
		</li>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			{ attributes.hasBadge && ! RichText.isEmpty( attributes.badge ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-photo-card__badge" value={ attributes.badge } />
			) }
			{ ! RichText.isEmpty( attributes.eyebrow ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-photo-card__eyebrow" value={ attributes.eyebrow } />
			) }
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( attributes.text ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-photo-card__text" value={ attributes.text } />
			) }
		</>
	),
} );

// Aucun format dans le titre.
restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
} );

// Titre sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, TITLE_BLOCKS );

