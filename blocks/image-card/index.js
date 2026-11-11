/**
 * Carte du bloc « Cartes illustrées » (`couturier/image-card`) : image de fond,
 * pictogramme facultatif, titre et texte.
 *
 * - l'image de fond (`imageId`) passe par `ImageField`, décorative (`alt` vide),
 *   estompée sur l'aplat pêche ; point focal réglé dans la barre latérale
 *   (`focalPoint` → `--focal`, `object-position`) ;
 * - le pictogramme (`iconId`), facultatif, est un SVG (ou PNG) de la médiathèque
 *   utilisé en **masque CSS** dans une bulle blanche : peint en pétrole,
 *   décoratif. Sans pictogramme : pas de bulle ;
 * - le titre est un `core/heading` imbriqué, toujours un `<h3>` : seul bloc que
 *   lit le panneau Structure. Verrouillé, sans format ;
 * - le texte est un attribut (`text`), écrit après le titre dans le HTML
 *   enregistré : le compteur de mots le lit. Gras, italique et lien permis.
 *
 * Aperçu de l'inserteur : `imageId` / `iconId` négatifs, cf. `example-assets.js`.
 *
 * Sans titre, la carte n'est pas rendue sur le site (`is-incomplete`). Sans
 * image, pictogramme ou texte, elle est rendue sans eux.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Button, FocalPointPicker, Notice, PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import { plus, replace, trash } from '../_shared/icons.js';
import ImageField, { ImageInfoPanel, imageUrl } from '../_shared/image-field.js';
import {
	hideLockedControls,
	nonBreaking,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import { exampleIconUrl, exampleMedia } from './example-assets.js';
import { LEVEL, TITLE } from './title.js';

const TEMPLATE = [ TITLE ];

/** Pictogrammes acceptés : SVG de préférence, PNG à fond transparent sinon. */
const ICON_TYPES = [ 'image/svg+xml', 'image/png' ];

/** Formats du texte. */
const TEXT_FORMATS = [ 'core/bold', 'core/italic', 'core/link' ];

const TITLE_BLOCKS = [ 'core/heading' ];

const ROOT = 'couturier/image-cards';

const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };

/** `object-position` du point focal (même calcul dans `render.php`). */
const objectPosition = ( { x, y } = DEFAULT_FOCAL_POINT ) =>
	`${ Math.round( x * 1000 ) / 10 }% ${ Math.round( y * 1000 ) / 10 }%`;

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { imageId, focalPoint, iconId, text } = attributes;

	const { blocks, isEditing, isCardEditing, iconUrl, media, isMissing } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const core = select( coreStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			let attachment = null;
			let missing = false;

			if ( imageId < 0 ) {
				attachment = exampleMedia( imageId ) ?? null;
			} else if ( imageId ) {
				attachment = core.getMedia( imageId, { context: 'view' } ) ?? null;
				missing = ! attachment && core.hasFinishedResolution( 'getMedia', [ imageId, { context: 'view' } ] );
			}

			return {
				blocks: editor.getBlocks( clientId ),
				// La carte, son titre ou son texte sélectionné : contrôles de l'image et du pictogramme.
				isCardEditing: isSelected || editor.hasSelectedInnerBlock( clientId, true ),
				// Liste ou l'une de ses cartes en cours d'édition : les emplacements
				// vides ne s'affichent qu'alors (bloc désélectionné = rendu du site).
				isEditing:
					isSelected ||
					editor.hasSelectedInnerBlock( clientId, true ) ||
					( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) ),
				iconUrl:
					exampleIconUrl( iconId ) ??
					( iconId > 0 ? core.getMedia( iconId, { context: 'view' } )?.source_url : undefined ),
				media: attachment,
				isMissing: missing,
			};
		},
		[ clientId, isSelected, imageId, iconId ]
	);

	const isIncomplete = blocks.length > 0 && ! textOf( blocks[ 0 ] );
	const isImageLoading = !! imageId && ! media && ! isMissing;

	// Titre toujours verrouillé, toujours en H3 ; espace insécable avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: TITLE_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( {
			className: [ isIncomplete && 'is-incomplete', iconUrl && 'has-icon' ].filter( Boolean ).join( ' ' ) || undefined,
		} ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	const onSelectImage = ( selected ) => setAttributes( { imageId: selected?.id, focalPoint: undefined } );

	const picker = ( content ) => (
		<MediaUploadCheck>
			<MediaUpload
				value={ iconId }
				allowedTypes={ ICON_TYPES }
				onSelect={ ( selected ) => setAttributes( { iconId: selected?.id } ) }
				render={ ( { open } ) => content( open ) }
			/>
		</MediaUploadCheck>
	);

	const icon = iconUrl ? (
		<span className="wp-block-couturier-image-card__icon" aria-hidden="true" style={ { '--icon': `url("${ iconUrl }")` } } />
	) : null;

	// Bulle : pictogramme, emplacement « + » en cours d'édition, rien sinon.
	let badge = null;

	if ( icon && isCardEditing ) {
		badge = picker( ( open ) => (
			<>
				<span className="wp-block-couturier-image-card__badge">
					<Button className="wp-block-couturier-image-card__replace" onClick={ open } label={ __( 'Remplacer le pictogramme', 'couturier' ) } showTooltip>
						{ icon }
					</Button>
				</span>
				<span className="wp-block-couturier-image-card__icon-actions">
					<Button size="compact" icon={ replace } onClick={ open } label={ __( 'Remplacer le pictogramme', 'couturier' ) } showTooltip />
					<Button
						size="compact"
						icon={ trash }
						isDestructive
						onClick={ () => setAttributes( { iconId: undefined } ) }
						label={ __( 'Supprimer le pictogramme', 'couturier' ) }
						showTooltip
					/>
				</span>
			</>
		) );
	} else if ( icon ) {
		badge = <span className="wp-block-couturier-image-card__badge">{ icon }</span>;
	} else if ( isEditing ) {
		badge = (
			<span className="wp-block-couturier-image-card__badge is-placeholder">
				{ picker( ( open ) => (
					<Button
						className="wp-block-couturier-image-card__choose"
						icon={ plus }
						onClick={ open }
						label={ __( 'Choisir un pictogramme (facultatif, SVG de préférence)', 'couturier' ) }
						showTooltip
					/>
				) ) }
			</span>
		);
	}

	return (
		<li { ...innerBlocksProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Image de fond', 'couturier' ) }>
					{ media ? (
						<FocalPointPicker
							__nextHasNoMarginBottom
							label={ __( 'Point focal', 'couturier' ) }
							help={ __( 'Partie de l\'image toujours visible, quel que soit le recadrage. Image décorative : son texte alternatif n\'est pas lu.', 'couturier' ) }
							url={ imageUrl( media ) }
							value={ focalPoint ?? DEFAULT_FOCAL_POINT }
							onChange={ ( value ) => setAttributes( { focalPoint: value } ) }
						/>
					) : (
						! isMissing && <p>{ __( 'Choisissez l\'image dans la carte (bouton en haut à droite).', 'couturier' ) }</p>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Pictogramme', 'couturier' ) } initialOpen={ false }>
					<p>
						{ __( 'Facultatif. Peint en pétrole quelles que soient ses couleurs d\'origine, dans une bulle blanche. Il est décoratif : son texte alternatif n\'est pas utilisé.', 'couturier' ) }
					</p>
				</PanelBody>
			</InspectorControls>
			<ImageInfoPanel media={ null } isMissing={ isMissing } />
			{ media && (
				<div className="wp-block-couturier-image-card__background" style={ { '--focal': objectPosition( focalPoint ) } }>
					<ImageField
						className="wp-block-couturier-image-card__media"
						imageClassName="wp-block-couturier-image-card__image"
						media={ { ...media, alt_text: '' } }
						isEditing={ isCardEditing }
						onSelect={ onSelectImage }
						onRemove={ () => setAttributes( { imageId: undefined, focalPoint: undefined } ) }
					/>
				</div>
			) }
			{ ! media && ! isImageLoading && isCardEditing && (
				<ImageField
					className="wp-block-couturier-image-card__choose-image"
					media={ null }
					isEditing
					compact
					onSelect={ onSelectImage }
					label={ __( 'Choisir l\'image de fond', 'couturier' ) }
				/>
			) }
			{ badge }
			{ children }
			<RichText
				tagName="p"
				className="wp-block-couturier-image-card__text"
				aria-label={ __( 'Texte de la carte', 'couturier' ) }
				placeholder={ __( 'Texte', 'couturier' ) }
				value={ text }
				onChange={ ( value ) => setAttributes( { text: nonBreaking( value ) } ) }
				allowedFormats={ TEXT_FORMATS }
			/>
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-image-card__notice">
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
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( attributes.text ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-image-card__text" value={ attributes.text } />
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
