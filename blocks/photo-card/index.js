/**
 * Carte du bloc « Cartes photo » (`couturier/photo-card`) : photo, badge
 * facultatif, sur-titre, titre, texte court et lien.
 *
 * - la photo (`imageId`) passe par `ImageField` (`blocks/_shared/image-field.js`) ;
 * - le titre est un `core/heading` imbriqué, toujours un `<h3>` : seul bloc que
 *   lit le panneau Structure. Verrouillé, sans format ;
 * - badge et sur-titre sont des attributs écrits avant le titre dans le HTML
 *   enregistré, le texte après lui : le compteur de mots les lit. Le badge
 *   s'affiche par l'interrupteur « Afficher un badge » (`hasBadge`), prérempli
 *   « Le + choisi ». Texte : gras et saut de ligne permis ;
 * - le lien (`link`) est la valeur du `LinkControl` natif ; `render.php` en fait
 *   un lien sur le titre, étendu à toute la carte. Bouton « Lien » dans la barre
 *   d'outils de la carte et de son titre, et panneau « Lien » de la barre latérale.
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
	BlockControls,
	InnerBlocks,
	InspectorControls,
	LinkControl,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Notice, PanelBody, Popover, ToggleControl, ToolbarButton, ToolbarGroup } from '@wordpress/components';
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

/** Libellé proposé quand on affiche le badge. */
const DEFAULT_BADGE = __( 'Le + choisi', 'couturier' );

/** Formats du texte : gras seulement (saut de ligne par Maj+Entrée). */
const TEXT_FORMATS = [ 'core/bold' ];

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

/**
 * Lien de la carte `cardId` : choix d'un contenu ou d'une URL, nouvel onglet,
 * retrait. Partagé par le bouton de la barre d'outils et la barre latérale.
 */
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
						label={ hasLink ? __( 'Modifier le lien de la carte', 'couturier' ) : __( 'Ajouter un lien à la carte', 'couturier' ) }
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
	const { imageId, hasBadge, badge, eyebrow, text, link } = attributes;
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
		} ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<li { ...innerBlocksProps }>
			<BackgroundPanel { ...background } onChange={ ( slug ) => setAttributes( { background: slug } ) } />
			<InspectorControls>
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
				<PanelBody title={ __( 'Lien', 'couturier' ) }>
					<p>
						{ __( 'Toute la carte mène à cette page. Sans lien, la carte s\'affiche mais n\'est pas cliquable.', 'couturier' ) }
					</p>
					<CardLinkControl cardId={ clientId } />
				</PanelBody>
			</InspectorControls>
			<ImageInfoPanel media={ media } isMissing={ isMissing } />
			{ isSelected && <CardLinkToolbar cardId={ clientId } /> }
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
					onSelect={ ( selected ) => setAttributes( { imageId: selected?.id } ) }
					onRemove={ () => setAttributes( { imageId: undefined } ) }
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
			{ isEditing && ! link?.url && ! isIncomplete && (
				<p className="wp-block-couturier-photo-card__hint">{ __( 'Pas de lien : carte non cliquable.', 'couturier' ) }</p>
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

// Aucun format dans le titre (il devient le lien de la carte).
restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
} );

// Titre sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, TITLE_BLOCKS );

// Titre d'une carte sélectionné : bouton « Lien » de la carte dans sa barre
// d'outils (c'est lui que l'on sélectionne le plus souvent).
addFilter(
	'editor.BlockEdit',
	'couturier/photo-card/title-link',
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
		'withPhotoCardTitleLink'
	)
);
