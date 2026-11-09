/**
 * Visuel du héros de page (`couturier/page-hero-media`) : bloc imbriqué fixe du
 * héros (`couturier/page-hero`), colonne de droite en desktop, sous les boutons en
 * mobile.
 *
 * - l'image (`imageId`, facultative) passe par `ImageField` ; point focal réglé
 *   dans la barre latérale (`object-position`) ; `alt` de la médiathèque ;
 * - surtitre, titre (gras et saut de ligne) et libellé du bouton, posés sur
 *   l'image, sont des attributs écrits dans le HTML enregistré (compteur de mots) ;
 *   le titre est un paragraphe, pas un titre : accroche vers une offre, hors du plan
 *   de la page ;
 * - le lien du bouton (`buttonLink`) est la valeur du `LinkControl` natif (bouton
 *   « Lien » de la barre d'outils, panneau « Bouton » de la barre latérale) ;
 * - 0 à 2 tags (`couturier/page-hero-tag`), blocs imbriqués libres
 *   (`templateLock: false`), ajoutés par le bouton « Ajouter un tag » du canvas,
 *   posés sur l'image à la position choisie dans leurs réglages.
 *
 * Sans image, rien n'est rendu sur le site, surimpression comprise : les champs ne
 * sont proposés qu'une image choisie. La forme inclinée derrière l'image prend la
 * couleur du style du héros (CSS).
 */
import { createBlock, registerBlockType } from '@wordpress/blocks';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	LinkControl,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Button, FocalPointPicker, PanelBody, Popover, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { link as linkIcon, plus } from '../_shared/icons.js';
import ImageField, { ImageInfoPanel, imageUrl } from '../_shared/image-field.js';
import { hideLockedControls, nonBreaking, textOf } from '../_shared/locked-content.js';
import metadata from './block.json';
import exampleImage from './example.webp';

const ROOT = 'couturier/page-hero';

const TAG = 'couturier/page-hero-tag';

/** Tags par visuel, au plus. */
const MAX_TAGS = 2;

const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };

/**
 * `imageId` réservé à l'aperçu de l'inserteur (`example` du héros de page) : la
 * photo de la maquette (Figma 301:6161), fournie avec le bloc. Jamais enregistré ;
 * `render.php` n'en trouverait pas de pièce jointe.
 */
const EXAMPLE_IMAGE_ID = -1;
const EXAMPLE_MEDIA = { source_url: exampleImage, alt_text: '', media_details: { width: 520, height: 596 } };

/** `object-position` du point focal, en variable `--focal` (même calcul dans `render.php`). */
const objectPosition = ( { x, y } = DEFAULT_FOCAL_POINT ) =>
	`${ Math.round( x * 1000 ) / 10 }% ${ Math.round( y * 1000 ) / 10 }%`;

/** Valeur du `LinkControl` réduite à ce que `render.php` utilise. */
const toLink = ( value ) =>
	value?.url
		? { url: value.url, id: value.id, kind: value.kind, type: value.type, opensInNewTab: !! value.opensInNewTab }
		: undefined;

/** Pièce jointe de l'image ; `isMissing` si elle a été supprimée de la médiathèque. */
function useMedia( imageId ) {
	return useSelect(
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
}

/** Lien du bouton : partagé par la barre d'outils et la barre latérale. */
function ButtonLink( { value, onChange, onClose } ) {
	return (
		<LinkControl
			value={ value }
			forceIsEditingLink={ ! value?.url }
			onChange={ ( next ) => onChange( toLink( next ) ) }
			onRemove={ () => {
				onChange( undefined );
				onClose?.();
			} }
		/>
	);
}

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { imageId, focalPoint, eyebrow, title, buttonLabel, buttonLink } = attributes;
	const [ isLinkOpen, setLinkOpen ] = useState( false );
	const [ linkAnchor, setLinkAnchor ] = useState( null );

	// Visuel ou héros (lui ou l'un de ses blocs imbriqués) en cours d'édition :
	// emplacement de l'image et champs vides ne s'affichent qu'alors.
	const isEditing = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return (
				isSelected ||
				editor.hasSelectedInnerBlock( clientId, true ) ||
				( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) )
			);
		},
		[ clientId, isSelected ]
	);

	const { media, isMissing } = useMedia( imageId );
	const tagCount = useSelect( ( select ) => select( blockEditorStore ).getBlockCount( clientId ), [ clientId ] );
	const { insertBlock } = useDispatch( blockEditorStore );

	// Tags : zone d'imbrication libre, sans bouton d'ajout du core (le nôtre est
	// borné à `MAX_TAGS`).
	const tagsProps = useInnerBlocksProps(
		{ className: 'wp-block-couturier-page-hero-media__tags' },
		{ allowedBlocks: [ TAG ], templateLock: false, renderAppender: false }
	);
	const isImageLoading = !! imageId && ! media && ! isMissing;
	const hasOverlay = !! ( textOf( eyebrow ) || textOf( title ) || ( textOf( buttonLabel ) && buttonLink?.url ) );

	const onSelectImage = ( selected ) => setAttributes( { imageId: selected?.id, focalPoint: undefined } );

	// Ni image ni emplacement : rien, comme sur le site.
	const blockProps = useBlockProps( {
		className: ! media && ! isImageLoading && ! isEditing ? 'is-incomplete' : undefined,
	} );

	return (
		<>
			<InspectorControls>
				{ media && (
					<PanelBody title={ __( 'Point focal', 'couturier' ) }>
						<FocalPointPicker
							__nextHasNoMarginBottom
							label={ __( 'Point focal', 'couturier' ) }
							help={ __( 'Partie de l\'image toujours visible, quel que soit le recadrage.', 'couturier' ) }
							url={ imageUrl( media ) }
							value={ focalPoint ?? DEFAULT_FOCAL_POINT }
							onChange={ ( value ) => setAttributes( { focalPoint: value } ) }
						/>
					</PanelBody>
				) }
				<PanelBody title={ __( 'Bouton sur l\'image', 'couturier' ) } initialOpen={ false }>
					<p>{ __( 'Page vers laquelle mène le bouton. Sans lien ou sans libellé, le bouton n\'est pas affiché.', 'couturier' ) }</p>
					<ButtonLink value={ buttonLink } onChange={ ( value ) => setAttributes( { buttonLink: value } ) } />
				</PanelBody>
			</InspectorControls>
			<ImageInfoPanel media={ media } isMissing={ isMissing } />
			{ isSelected && media && (
				<BlockControls group="block">
					<ToolbarGroup>
						<ToolbarButton
							ref={ setLinkAnchor }
							icon={ linkIcon }
							label={ buttonLink?.url ? __( 'Modifier le lien du bouton', 'couturier' ) : __( 'Ajouter un lien au bouton', 'couturier' ) }
							isPressed={ !! buttonLink?.url }
							onClick={ () => setLinkOpen( ! isLinkOpen ) }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			{ isLinkOpen && (
				<Popover anchor={ linkAnchor } placement="bottom" onClose={ () => setLinkOpen( false ) } focusOnMount="firstElement">
					<ButtonLink
						value={ buttonLink }
						onChange={ ( value ) => setAttributes( { buttonLink: value } ) }
						onClose={ () => setLinkOpen( false ) }
					/>
				</Popover>
			) }
			<div { ...blockProps }>
				<div className="wp-block-couturier-page-hero-media__frame" style={ { '--focal': objectPosition( focalPoint ) } }>
					{ ! isImageLoading && (
						<ImageField
							className="wp-block-couturier-page-hero-media__field"
							imageClassName="wp-block-couturier-page-hero-media__image"
							media={ media }
							isEditing={ isEditing }
							onSelect={ onSelectImage }
							onRemove={ () => setAttributes( { imageId: undefined, focalPoint: undefined } ) }
							label={ __( 'Image du héros (facultative)', 'couturier' ) }
						/>
					) }
				</div>
				{ media && <div { ...tagsProps } /> }
				{ media && isEditing && tagCount < MAX_TAGS && (
					<Button
						__next40pxDefaultSize
						variant="secondary"
						icon={ plus }
						className="wp-block-couturier-page-hero-media__add-tag"
						onClick={ () => insertBlock( createBlock( TAG ), tagCount, clientId ) }
					>
						{ __( 'Ajouter un tag', 'couturier' ) }
					</Button>
				) }
				{ media && ( hasOverlay || isEditing ) && (
					<div className="wp-block-couturier-page-hero-media__overlay">
						<RichText
							tagName="p"
							className="wp-block-couturier-page-hero-media__eyebrow"
							aria-label={ __( 'Surtitre sur l\'image', 'couturier' ) }
							placeholder={ __( 'Surtitre (facultatif)', 'couturier' ) }
							value={ eyebrow }
							onChange={ ( value ) => setAttributes( { eyebrow: nonBreaking( value ) } ) }
							allowedFormats={ [] }
							disableLineBreaks
						/>
						<RichText
							tagName="p"
							className="wp-block-couturier-page-hero-media__title"
							aria-label={ __( 'Titre sur l\'image', 'couturier' ) }
							placeholder={ __( 'Titre sur l\'image (facultatif, gras possible)', 'couturier' ) }
							value={ title }
							onChange={ ( value ) => setAttributes( { title: nonBreaking( value ) } ) }
							allowedFormats={ [ 'core/bold' ] }
						/>
						<div
							className={
								'wp-block-buttons wp-block-couturier-page-hero-media__buttons' +
								( buttonLink?.url && textOf( buttonLabel ) ? '' : ' is-incomplete' )
							}
						>
							<div className="wp-block-button is-style-outline has-arrow">
								<RichText
									tagName="span"
									className="wp-block-button__link wp-element-button"
									aria-label={ __( 'Libellé du bouton sur l\'image', 'couturier' ) }
									placeholder={ __( 'Libellé du bouton (facultatif)', 'couturier' ) }
									value={ buttonLabel }
									onChange={ ( value ) => setAttributes( { buttonLabel: nonBreaking( value ) } ) }
									allowedFormats={ [] }
									disableLineBreaks
								/>
							</div>
						</div>
					</div>
				) }
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			{ [ 'eyebrow', 'title', 'buttonLabel' ].map(
				( key ) =>
					! RichText.isEmpty( attributes[ key ] ) && (
						<RichText.Content
							key={ key }
							tagName="p"
							className={ `wp-block-couturier-page-hero-media__${ 'buttonLabel' === key ? 'button' : key }` }
							value={ attributes[ key ] }
						/>
					)
			) }
			<InnerBlocks.Content />
		</>
	),
} );

// Tag sélectionné : pas de cadenas (il lèverait le verrou de déplacement, cf.
// `page-hero-tag/index.js`).
hideLockedControls( metadata.name, [ TAG ] );
