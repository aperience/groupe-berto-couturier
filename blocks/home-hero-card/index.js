/**
 * Carte du héros de l'accueil (`couturier/home-hero-card`) : sur-titre, photo,
 * titre H3, texte et bouton vers la rubrique (auto-école, formation pro).
 *
 * Deux cartes fixes dans le héros, verrouillées ; couleurs par le style de bloc
 * « Pêche » (défaut) ou « Pétrole » (`is-style-petrol`).
 *
 * - la photo (`imageId`) passe par `ImageField` ;
 * - le titre est un `core/heading` imbriqué, toujours un `<h3>`, verrouillé, sans
 *   format ;
 * - sur-titre (avant le titre), texte et libellé du bouton (après lui) sont des
 *   attributs écrits dans le HTML enregistré : le compteur de mots les lit ;
 * - le lien du bouton (`link`) est la valeur du `LinkControl` natif (bouton « Lien »
 *   de la barre d'outils de la carte et de son titre, panneau « Lien » de la barre
 *   latérale) ; `render.php` change le libellé enregistré en lien.
 *
 * Ordre du balisage : sur-titre, photo, titre, texte, bouton (ordre de lecture). En
 * desktop, le bouton est affiché à cheval sur le bas de la photo (`order`, CSS).
 *
 * Encart contact (desktop seulement) : photo ronde (`contactImageId`), texte,
 * téléphone et e-mail, en attributs écrits après le bouton. `render.php` sépare la
 * carte (`div.__body`, fond coloré) de l'encart (`div.__contact`), placé dessous ;
 * le canvas reproduit la même enveloppe.
 *
 * Sans titre, la carte n'est pas rendue ; sans lien ou sans libellé, le bouton non
 * plus ; sans texte de contact, l'encart non plus. Les autres champs sont
 * facultatifs.
 */
import { registerBlockType } from '@wordpress/blocks';
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
import { Notice, PanelBody, Popover, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import { link as linkIcon } from '../_shared/icons.js';
import ImageField, { ImageInfoPanel } from '../_shared/image-field.js';
import {
	LOCKED,
	hideLockedControls,
	nonBreaking,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import { exampleMedia } from './example-images.js';
import metadata from './block.json';

/** Le titre d'une carte est toujours un `<h3>`. */
const LEVEL = 3;

const TEMPLATE = [ [ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Titre de la carte', 'couturier' ) } ] ];

const TITLE_BLOCKS = [ 'core/heading' ];

const ROOT = 'couturier/home-hero';

/** Classe (suffixe) du `<p>` enregistré de chaque champ du contact. */
const CONTACT_CLASSES = { contactTitle: 'contact-title', contactPhone: 'contact-phone', contactEmail: 'contact-email' };

/** Formats du texte : gras, italique, lien (saut de ligne par Maj+Entrée). */
const TEXT_FORMATS = [ 'core/bold', 'core/italic', 'core/link' ];

/** Pièce jointe d'une image (`getMedia()`) ; `isMissing` si elle a été supprimée. */
function useMedia( imageId ) {
	return useSelect(
		( select ) => {
			if ( ! imageId ) {
				return { media: null, isMissing: false };
			}

			// `imageId` négatif : image de l'aperçu de l'inserteur (`example-images.js`).
			if ( imageId < 0 ) {
				return { media: exampleMedia( imageId ) ?? null, isMissing: false };
			}

			const attachment = select( coreStore ).getMedia( imageId, { context: 'view' } );
			const isResolved = select( coreStore ).hasFinishedResolution( 'getMedia', [ imageId, { context: 'view' } ] );

			return { media: attachment ?? null, isMissing: isResolved && ! attachment };
		},
		[ imageId ]
	);
}

/** Valeur du `LinkControl` réduite à ce que `render.php` utilise. */
const toLink = ( value ) =>
	value?.url
		? {
				url: value.url,
				id: value.id,
				kind: value.kind,
				type: value.type,
				opensInNewTab: !! value.opensInNewTab,
		  }
		: undefined;

/** Lien du bouton de la carte `cardId` : partagé par la barre d'outils et la barre latérale. */
function CardLinkControl( { cardId, onClose } ) {
	const link = useSelect( ( select ) => select( blockEditorStore ).getBlockAttributes( cardId )?.link, [ cardId ] );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	return (
		<LinkControl
			value={ link }
			forceIsEditingLink={ ! link?.url }
			onChange={ ( value ) => updateBlockAttributes( cardId, { link: toLink( value ) } ) }
			onRemove={ () => {
				updateBlockAttributes( cardId, { link: undefined } );
				onClose?.();
			} }
		/>
	);
}

/** Bouton « Lien » de la barre d'outils (carte ou titre), avec sa fenêtre. */
function CardLinkToolbar( { cardId } ) {
	const hasLink = useSelect( ( select ) => !! select( blockEditorStore ).getBlockAttributes( cardId )?.link?.url, [ cardId ] );
	const [ isOpen, setOpen ] = useState( false );
	const [ anchor, setAnchor ] = useState( null );

	return (
		<>
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarButton
						ref={ setAnchor }
						icon={ linkIcon }
						label={ hasLink ? __( 'Modifier le lien du bouton', 'couturier' ) : __( 'Ajouter un lien au bouton', 'couturier' ) }
						isPressed={ hasLink }
						onClick={ () => setOpen( ! isOpen ) }
					/>
				</ToolbarGroup>
			</BlockControls>
			{ isOpen && (
				<Popover anchor={ anchor } placement="bottom" onClose={ () => setOpen( false ) } focusOnMount="firstElement">
					<CardLinkControl cardId={ cardId } onClose={ () => setOpen( false ) } />
				</Popover>
			) }
		</>
	);
}

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { imageId, eyebrow, text, buttonLabel, link, contactImageId, contactTitle, contactPhone, contactEmail } = attributes;

	const { blocks, isEditing } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return {
				blocks: editor.getBlocks( clientId ),
				// Héros ou l'un de ses blocs imbriqués en cours d'édition : emplacements
				// vides et avertissements ne s'affichent qu'alors (bloc désélectionné =
				// rendu du site).
				isEditing:
					isSelected ||
					editor.hasSelectedInnerBlock( clientId, true ) ||
					( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) ),
			};
		},
		[ clientId, isSelected ]
	);

	const { media, isMissing } = useMedia( imageId );
	const { media: contactMedia, isMissing: isContactMissing } = useMedia( contactImageId );

	const isImageLoading = !! imageId && ! media && ! isMissing;
	const isContactImageLoading = !! contactImageId && ! contactMedia && ! isContactMissing;
	// Contact rendu sur le site : un texte.
	const hasContact = !! textOf( contactTitle );
	const isIncomplete = blocks.length > 0 && ! textOf( blocks[ 0 ] );
	// Bouton rendu sur le site : un lien et un libellé.
	const hasButton = !! link?.url && !! textOf( buttonLabel );

	// Titre toujours verrouillé, toujours en H3 ; espace insécable avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: TITLE_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( { className: isIncomplete ? 'is-incomplete' : undefined } ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<div { ...innerBlocksProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Lien du bouton', 'couturier' ) }>
					<p>
						{ __( 'Page vers laquelle mène le bouton. Sans lien ou sans libellé, le bouton n\'est pas affiché.', 'couturier' ) }
					</p>
					<CardLinkControl cardId={ clientId } />
				</PanelBody>
			</InspectorControls>
			<ImageInfoPanel media={ media } isMissing={ isMissing } />
			{ isSelected && <CardLinkToolbar cardId={ clientId } /> }
			<div className="wp-block-couturier-home-hero-card__body">
				<RichText
					tagName="p"
					className="wp-block-couturier-home-hero-card__eyebrow"
					aria-label={ __( 'Sur-titre de la carte', 'couturier' ) }
					placeholder={ __( 'Sur-titre', 'couturier' ) }
					value={ eyebrow }
					onChange={ ( value ) => setAttributes( { eyebrow: nonBreaking( value ) } ) }
					allowedFormats={ [] }
					disableLineBreaks
				/>
				{ ! isImageLoading && ( media || isEditing ) && (
					<ImageField
						className="wp-block-couturier-home-hero-card__media"
						imageClassName="wp-block-couturier-home-hero-card__image"
						media={ media }
						isEditing={ isEditing }
						onSelect={ ( selected ) => setAttributes( { imageId: selected?.id } ) }
						onRemove={ () => setAttributes( { imageId: undefined } ) }
						label={ __( 'Photo', 'couturier' ) }
					/>
				) }
				{ children }
				<RichText
					tagName="p"
					className="wp-block-couturier-home-hero-card__text"
					aria-label={ __( 'Texte de la carte', 'couturier' ) }
					placeholder={ __( 'Texte', 'couturier' ) }
					value={ text }
					onChange={ ( value ) => setAttributes( { text: nonBreaking( value ) } ) }
					allowedFormats={ TEXT_FORMATS }
				/>
				<RichText
					tagName="p"
					className={ 'wp-block-couturier-home-hero-card__button' + ( hasButton ? '' : ' is-incomplete' ) }
					aria-label={ __( 'Libellé du bouton', 'couturier' ) }
					placeholder={ __( 'Libellé du bouton', 'couturier' ) }
					value={ buttonLabel }
					onChange={ ( value ) => setAttributes( { buttonLabel: nonBreaking( value ) } ) }
					allowedFormats={ [] }
					disableLineBreaks
				/>
				{ isEditing && isIncomplete && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-home-hero-card__notice">
						{ __( 'Titre obligatoire : sans lui, cette carte n\'est pas affichée sur le site.', 'couturier' ) }
					</Notice>
				) }
				{ isEditing && ! isIncomplete && ! link?.url && (
					<p className="wp-block-couturier-home-hero-card__hint">
						{ __( 'Pas de lien : le bouton n\'est pas affiché (bouton « Lien » de la barre d\'outils).', 'couturier' ) }
					</p>
				) }
			</div>
			<div className={ 'wp-block-couturier-home-hero-card__contact' + ( hasContact ? '' : ' is-incomplete' ) }>
				{ ! isContactImageLoading && ( contactMedia || isEditing ) && (
					<ImageField
						className="wp-block-couturier-home-hero-card__contact-photo"
						imageClassName="wp-block-couturier-home-hero-card__contact-image"
						media={ contactMedia }
						isEditing={ isEditing }
						onSelect={ ( selected ) => setAttributes( { contactImageId: selected?.id } ) }
						onRemove={ () => setAttributes( { contactImageId: undefined } ) }
						label={ __( 'Photo', 'couturier' ) }
					/>
				) }
				<div className="wp-block-couturier-home-hero-card__contact-body">
					<RichText
						tagName="p"
						className="wp-block-couturier-home-hero-card__contact-title"
						aria-label={ __( 'Texte du contact', 'couturier' ) }
						placeholder={ __( 'Une question ? Prénom vous aide… (contact facultatif, affiché en desktop)', 'couturier' ) }
						value={ contactTitle }
						onChange={ ( value ) => setAttributes( { contactTitle: nonBreaking( value ) } ) }
						allowedFormats={ [] }
					/>
					<div className="wp-block-couturier-home-hero-card__contact-details">
						<RichText
							tagName="p"
							className="wp-block-couturier-home-hero-card__contact-phone"
							aria-label={ __( 'Téléphone du contact', 'couturier' ) }
							placeholder={ __( 'Téléphone', 'couturier' ) }
							value={ contactPhone }
							onChange={ ( value ) => setAttributes( { contactPhone: value } ) }
							allowedFormats={ [] }
							disableLineBreaks
						/>
						<RichText
							tagName="p"
							className="wp-block-couturier-home-hero-card__contact-email"
							aria-label={ __( 'E-mail du contact', 'couturier' ) }
							placeholder={ __( 'E-mail', 'couturier' ) }
							value={ contactEmail }
							onChange={ ( value ) => setAttributes( { contactEmail: value } ) }
							allowedFormats={ [] }
							disableLineBreaks
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			{ ! RichText.isEmpty( attributes.eyebrow ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-home-hero-card__eyebrow" value={ attributes.eyebrow } />
			) }
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( attributes.text ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-home-hero-card__text" value={ attributes.text } />
			) }
			{ ! RichText.isEmpty( attributes.buttonLabel ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-home-hero-card__button" value={ attributes.buttonLabel } />
			) }
			{ [ 'contactTitle', 'contactPhone', 'contactEmail' ].map(
				( key ) =>
					! RichText.isEmpty( attributes[ key ] ) && (
						<RichText.Content
							key={ key }
							tagName="p"
							className={ `wp-block-couturier-home-hero-card__${ CONTACT_CLASSES[ key ] }` }
							value={ attributes[ key ] }
						/>
					)
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

// Titre d'une carte sélectionné : bouton « Lien » de la carte dans sa barre d'outils.
addFilter(
	'editor.BlockEdit',
	'couturier/home-hero-card/title-link',
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const cardId = useSelect(
				( select ) => {
					if ( props.name !== 'core/heading' || ! props.isSelected ) {
						return undefined;
					}

					const editor = select( blockEditorStore );
					const parentId = editor.getBlockRootClientId( props.clientId );

					return editor.getBlockName( parentId ) === metadata.name ? parentId : undefined;
				},
				[ props.name, props.clientId, props.isSelected ]
			);

			return (
				<>
					{ cardId && <CardLinkToolbar cardId={ cardId } /> }
					<BlockEdit { ...props } />
				</>
			);
		},
		'withHomeHeroCardTitleLink'
	)
);
