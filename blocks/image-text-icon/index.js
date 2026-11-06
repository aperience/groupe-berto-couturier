/**
 * Icône du bloc « Image et texte » (`couturier/image-text-icon`) : pictogramme,
 * libellé et lien facultatif.
 *
 * - le pictogramme (`iconId`) est un SVG (ou PNG) de la médiathèque, utilisé en
 *   **masque CSS** : il est peint en pétrole (`currentColor`) quelles que soient
 *   les couleurs du fichier ;
 * - le libellé est un attribut (`source: html`), écrit par `save()` : compté par
 *   le compteur de mots ;
 * - le lien (`link`) est la valeur du `LinkControl` natif (contenu cherché ou URL
 *   saisie, nouvel onglet) ; `render.php` recalcule l'URL d'un contenu, qui suit
 *   ainsi un changement de permalien.
 *
 * Sans pictogramme ou sans libellé, l'icône n'est pas rendue : `is-incomplete`.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	BlockControls,
	InspectorControls,
	LinkControl,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { Button, PanelBody, Popover, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { link as linkIcon, plus } from '../_shared/icons.js';
import { textOf } from '../_shared/locked-content.js';
import metadata from './block.json';

/** Pictogrammes acceptés : SVG de préférence, PNG à fond transparent sinon. */
const ICON_TYPES = [ 'image/svg+xml', 'image/png' ];

const ROOT = 'couturier/image-text';

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

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { iconId, link, label } = attributes;
	const [ isLinkOpen, setLinkOpen ] = useState( false );
	const [ anchor, setAnchor ] = useState( null );

	const iconUrl = useSelect(
		( select ) => ( iconId ? select( coreStore ).getMedia( iconId, { context: 'view' } )?.source_url : undefined ),
		[ iconId ]
	);
	// Bloc « Image et texte » ou l'un de ses blocs imbriqués sélectionné : les
	// emplacements vides ne s'affichent qu'en cours d'édition.
	const isEditing = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return isSelected || ( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) );
		},
		[ clientId, isSelected ]
	);

	const isIncomplete = ! iconId || ! textOf( label );
	const blockProps = useBlockProps( { className: isIncomplete ? 'is-incomplete' : undefined } );

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
		<span className="wp-block-couturier-image-text-icon__icon" aria-hidden="true" style={ { '--icon': `url("${ iconUrl }")` } } />
	) : null;

	return (
		<li { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Pictogramme', 'couturier' ) }>
					<p className="wp-block-couturier-image-text-icon__help">
						{ __( 'Le pictogramme est décoratif : son texte alternatif dans la médiathèque n\'est pas utilisé, c\'est le libellé qui est lu par les lecteurs d\'écran.', 'couturier' ) }
					</p>
				</PanelBody>
			</InspectorControls>
			<BlockControls group="block">
				<ToolbarGroup>
					<ToolbarButton
						ref={ setAnchor }
						icon={ linkIcon }
						label={ link?.url ? __( 'Modifier le lien', 'couturier' ) : __( 'Ajouter un lien', 'couturier' ) }
						isPressed={ !! link?.url }
						onClick={ () => setLinkOpen( ! isLinkOpen ) }
					/>
				</ToolbarGroup>
			</BlockControls>
			{ isSelected && isLinkOpen && (
				<Popover anchor={ anchor } placement="bottom" onClose={ () => setLinkOpen( false ) } focusOnMount="firstElement">
					<LinkControl
						value={ link }
						forceIsEditingLink={ ! link?.url }
						onChange={ ( value ) => setAttributes( { link: toLink( value ) } ) }
						onRemove={ () => {
							setAttributes( { link: undefined } );
							setLinkOpen( false );
						} }
					/>
				</Popover>
			) }
			<span className="wp-block-couturier-image-text-icon__link">
				{ icon && isSelected &&
					picker( ( open ) => (
						<Button className="wp-block-couturier-image-text-icon__replace" onClick={ open } label={ __( 'Remplacer l\'icône', 'couturier' ) } showTooltip>
							{ icon }
						</Button>
					) ) }
				{ icon && ! isSelected && icon }
				{ ! icon && isEditing &&
					picker( ( open ) => (
						<Button
							className="wp-block-couturier-image-text-icon__choose"
							icon={ plus }
							onClick={ open }
							label={ __( 'Choisir une icône (SVG de préférence)', 'couturier' ) }
							showTooltip
						/>
					) ) }
				<RichText
					tagName="span"
					className="wp-block-couturier-image-text-icon__label"
					aria-label={ __( 'Libellé de l\'icône', 'couturier' ) }
					placeholder={ __( 'Libellé', 'couturier' ) }
					value={ label }
					onChange={ ( value ) => setAttributes( { label: value } ) }
					allowedFormats={ [] }
					disableLineBreaks
				/>
			</span>
		</li>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<RichText.Content tagName="span" className="wp-block-couturier-image-text-icon__label" value={ attributes.label } />
	),
} );
