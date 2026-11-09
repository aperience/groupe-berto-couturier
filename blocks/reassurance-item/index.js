/**
 * Atout du bloc « Réassurance » (`couturier/reassurance-item`) : pictogramme,
 * titre et court texte.
 *
 * - le pictogramme (`iconId`) est un SVG (ou PNG) de la médiathèque, utilisé en
 *   **masque CSS** dans une pastille (pêche ou pétrole clair en alternance, par
 *   le CSS) : il est peint en pétrole foncé quelles que soient les couleurs du
 *   fichier, et reste décoratif ;
 * - le titre est un `core/heading` imbriqué, toujours un `<h3>` : seul bloc que
 *   lit le panneau Structure. Verrouillé, sans format ;
 * - le texte est un attribut (`text`), écrit après le titre dans le HTML
 *   enregistré : le compteur de mots le lit. Une ligne, sans format ;
 * - le lien facultatif (`link`) est la valeur du `LinkControl` natif (contenu
 *   cherché ou URL, nouvel onglet) ; `render.php` en fait un lien sur le titre,
 *   étendu à tout l'atout. Bouton « Lien » dans la barre d'outils de l'atout et
 *   de son titre, et panneau « Lien » de la barre latérale.
 *
 * Aperçu de l'inserteur : `iconId` négatif, cf. `example-icons.js`.
 *
 * Sans titre, l'atout n'est pas rendu sur le site (`is-incomplete`). Sans
 * pictogramme ou sans texte, il est rendu sans eux.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	LinkControl,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { Button, Flex, Notice, PanelBody, Popover, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import { link as linkIcon, plus, replace, trash } from '../_shared/icons.js';
import {
	hideLockedControls,
	nonBreaking,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import { exampleIconUrl } from './example-icons.js';
import { LEVEL, TITLE } from './title.js';

const TEMPLATE = [ TITLE ];

/** Pictogrammes acceptés : SVG de préférence, PNG à fond transparent sinon. */
const ICON_TYPES = [ 'image/svg+xml', 'image/png' ];

const TITLE_BLOCKS = [ 'core/heading' ];

const ROOT = 'couturier/reassurance';

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
 * Lien de l'atout `itemId` : choix d'un contenu ou d'une URL, nouvel onglet,
 * retrait. Partagé par le bouton de la barre d'outils et la barre latérale.
 */
function ItemLinkControl( { itemId, onClose } ) {
	const link = useSelect( ( select ) => select( blockEditorStore ).getBlockAttributes( itemId )?.link, [ itemId ] );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	return (
		<LinkControl
			value={ link }
			forceIsEditingLink={ ! link?.url }
			onChange={ ( value ) => updateBlockAttributes( itemId, { link: toLink( value ) } ) }
			onRemove={ () => {
				updateBlockAttributes( itemId, { link: undefined } );
				onClose?.();
			} }
		/>
	);
}

/** Bouton « Lien » de la barre d'outils (atout ou titre), avec sa fenêtre. */
function ItemLinkToolbar( { itemId } ) {
	const hasLink = useSelect( ( select ) => !! select( blockEditorStore ).getBlockAttributes( itemId )?.link?.url, [ itemId ] );
	const [ isOpen, setOpen ] = useState( false );
	const [ anchor, setAnchor ] = useState( null );

	return (
		<>
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarButton
						ref={ setAnchor }
						icon={ linkIcon }
						label={ hasLink ? __( 'Modifier le lien de l\'atout', 'couturier' ) : __( 'Ajouter un lien à l\'atout', 'couturier' ) }
						isPressed={ hasLink }
						onClick={ () => setOpen( ! isOpen ) }
					/>
				</ToolbarGroup>
			</BlockControls>
			{ isOpen && (
				<Popover anchor={ anchor } placement="bottom" onClose={ () => setOpen( false ) } focusOnMount="firstElement">
					<ItemLinkControl itemId={ itemId } onClose={ () => setOpen( false ) } />
				</Popover>
			) }
		</>
	);
}

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { iconId, text } = attributes;

	const { blocks, isEditing, isItemEditing, iconUrl } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return {
				blocks: editor.getBlocks( clientId ),
				// L'atout, son titre ou son texte sélectionné : contrôles du pictogramme.
				isItemEditing: isSelected || editor.hasSelectedInnerBlock( clientId, true ),
				// Bloc ou l'un de ses atouts en cours d'édition : les emplacements
				// vides ne s'affichent qu'alors (bloc désélectionné = rendu du site).
				isEditing:
					isSelected ||
					editor.hasSelectedInnerBlock( clientId, true ) ||
					( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) ),
				// `iconId` négatif : pictogramme de l'aperçu de l'inserteur (`example-icons.js`).
				iconUrl:
					exampleIconUrl( iconId ) ??
					( iconId > 0 ? select( coreStore ).getMedia( iconId, { context: 'view' } )?.source_url : undefined ),
			};
		},
		[ clientId, isSelected, iconId ]
	);

	const isIncomplete = blocks.length > 0 && ! textOf( blocks[ 0 ] );

	// Titre toujours verrouillé, toujours en H3 ; espace insécable avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: TITLE_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		useBlockProps( { className: isIncomplete ? 'is-incomplete' : undefined } ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	const picker = ( content ) => (
		<MediaUploadCheck>
			<MediaUpload
				value={ iconId }
				allowedTypes={ ICON_TYPES }
				onSelect={ ( media ) => setAttributes( { iconId: media?.id } ) }
				render={ ( { open } ) => content( open ) }
			/>
		</MediaUploadCheck>
	);

	const icon = iconUrl ? (
		<span className="wp-block-couturier-reassurance-item__icon" aria-hidden="true" style={ { '--icon': `url("${ iconUrl }")` } } />
	) : null;

	// Pastille : pictogramme, emplacement « + » en cours d'édition, rien sinon.
	// Atout en cours d'édition (lui, son titre ou son texte) : pastille cliquable
	// pour remplacer, boutons « Remplacer » et « Supprimer » dans la barre
	// latérale. Aucun contrôle hors édition : rendu du site.
	let badge = null;

	if ( icon && isItemEditing ) {
		badge = picker( ( open ) => (
			<span className="wp-block-couturier-reassurance-item__badge">
				<Button className="wp-block-couturier-reassurance-item__replace" onClick={ open } label={ __( 'Remplacer le pictogramme', 'couturier' ) } showTooltip>
					{ icon }
				</Button>
			</span>
		) );
	} else if ( icon ) {
		badge = <span className="wp-block-couturier-reassurance-item__badge">{ icon }</span>;
	} else if ( isEditing ) {
		badge = (
			<span className="wp-block-couturier-reassurance-item__badge">
				{ picker( ( open ) => (
					<Button
						className="wp-block-couturier-reassurance-item__choose"
						icon={ plus }
						onClick={ open }
						label={ __( 'Choisir un pictogramme (SVG de préférence)', 'couturier' ) }
						showTooltip
					/>
				) ) }
			</span>
		);
	}

	return (
		<li { ...innerBlocksProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Pictogramme', 'couturier' ) }>
					<p>
						{ __( 'Le pictogramme est peint en pétrole foncé quelles que soient ses couleurs d\'origine. Il est décoratif : son texte alternatif n\'est pas utilisé. La couleur de la pastille alterne d\'un atout à l\'autre.', 'couturier' ) }
					</p>
					{ picker( ( open ) => (
						<Flex justify="flex-start" wrap>
							<Button __next40pxDefaultSize variant="secondary" icon={ iconId ? replace : plus } onClick={ open }>
								{ iconId ? __( 'Remplacer', 'couturier' ) : __( 'Choisir', 'couturier' ) }
							</Button>
							{ !! iconId && (
								<Button __next40pxDefaultSize variant="secondary" icon={ trash } isDestructive onClick={ () => setAttributes( { iconId: undefined } ) }>
									{ __( 'Supprimer', 'couturier' ) }
								</Button>
							) }
						</Flex>
					) ) }
				</PanelBody>
				<PanelBody title={ __( 'Lien', 'couturier' ) }>
					<p>
						{ __( 'Facultatif : tout l\'atout mène alors à cette page. Sans lien, il n\'est pas cliquable.', 'couturier' ) }
					</p>
					<ItemLinkControl itemId={ clientId } />
				</PanelBody>
			</InspectorControls>
			{ isSelected && <ItemLinkToolbar itemId={ clientId } /> }
			{ badge }
			<div className="wp-block-couturier-reassurance-item__body">
				{ children }
				<RichText
					tagName="p"
					className="wp-block-couturier-reassurance-item__text"
					aria-label={ __( 'Texte de l\'atout', 'couturier' ) }
					placeholder={ __( 'Court texte', 'couturier' ) }
					value={ text }
					onChange={ ( value ) => setAttributes( { text: nonBreaking( value ) } ) }
					allowedFormats={ [] }
					disableLineBreaks
				/>
				{ isEditing && isIncomplete && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-reassurance-item__notice">
						{ __( 'Titre obligatoire : sans lui, cet atout n\'est pas affiché sur le site.', 'couturier' ) }
					</Notice>
				) }
			</div>
		</li>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( attributes.text ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-reassurance-item__text" value={ attributes.text } />
			) }
		</>
	),
} );

// Aucun format dans le titre (il devient le lien de l'atout).
restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
} );

// Titre sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, TITLE_BLOCKS );

// Titre d'un atout sélectionné : bouton « Lien » de l'atout dans sa barre
// d'outils (c'est lui que l'on sélectionne le plus souvent).
addFilter(
	'editor.BlockEdit',
	'couturier/reassurance-item/title-link',
	createHigherOrderComponent(
		( BlockEdit ) => ( props ) => {
			const itemId = useSelect(
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
					{ itemId && <ItemLinkToolbar itemId={ itemId } /> }
					<BlockEdit { ...props } />
				</>
			);
		},
		'withReassuranceItemTitleLink'
	)
);
