/**
 * Logo du bloc « Logos partenaires » (`couturier/logo-strip-item`) : image
 * facultative, légende et lien facultatif.
 *
 * - l'image (`imageId`, `ImageField`) est décorative : la légende nomme le
 *   logo (et le lien) ; sans image, un cercle coloré la remplace ;
 * - la légende est un attribut (`source: html`), écrite par `save()` : comptée
 *   par le compteur de mots ;
 * - le lien (`link`) est la valeur du `LinkControl` natif (contenu cherché ou URL
 *   saisie, nouvel onglet), comme `couturier/image-text-icon`.
 *
 * Sans légende, le logo n'est pas rendu : `is-incomplete`.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	BlockControls,
	LinkControl,
	RichText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { Popover, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import ImageField, { ImageInfoPanel } from '../_shared/image-field.js';
import { link as linkIcon } from '../_shared/icons.js';
import { isComplete } from './content.js';
import metadata from './block.json';

const ROOT = 'couturier/logo-strip';

/** Valeur du `LinkControl` réduite à ce que `render.php` utilise. */
const toLink = ( value ) =>
	value?.url
		? { url: value.url, id: value.id, kind: value.kind, type: value.type, opensInNewTab: !! value.opensInNewTab }
		: undefined;

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { imageId, link, caption } = attributes;
	const [ isLinkOpen, setLinkOpen ] = useState( false );
	const [ anchor, setAnchor ] = useState( null );

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
	// Bloc « Logos partenaires » ou l'un de ses blocs imbriqués sélectionné.
	const isEditing = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return isSelected || ( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) );
		},
		[ clientId, isSelected ]
	);

	const isLoading = !! imageId && ! media && ! isMissing;
	const blockProps = useBlockProps( { className: isComplete( { attributes } ) ? undefined : 'is-incomplete' } );

	return (
		<li { ...blockProps }>
			<ImageInfoPanel media={ media } isMissing={ isMissing } />
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
			<span className="wp-block-couturier-logo-strip-item__link">
				{ media ? (
					<ImageField
						className="wp-block-couturier-logo-strip-item__media"
						imageClassName="wp-block-couturier-logo-strip-item__image"
						media={ media }
						isEditing={ isSelected }
						onSelect={ ( selected ) => setAttributes( { imageId: selected?.id } ) }
						onRemove={ () => setAttributes( { imageId: undefined } ) }
					/>
				) : (
					<span className="wp-block-couturier-logo-strip-item__media is-empty">
						{ isEditing && ! isLoading && (
							<ImageField
								compact
								className="wp-block-couturier-logo-strip-item__picker"
								media={ null }
								isEditing
								onSelect={ ( selected ) => setAttributes( { imageId: selected?.id } ) }
								onRemove={ () => setAttributes( { imageId: undefined } ) }
								label={ __( 'Choisir un logo', 'couturier' ) }
							/>
						) }
					</span>
				) }
				<RichText
					tagName="span"
					className="wp-block-couturier-logo-strip-item__caption"
					aria-label={ __( 'Légende du logo', 'couturier' ) }
					placeholder={ __( 'Légende', 'couturier' ) }
					value={ caption }
					onChange={ ( value ) => setAttributes( { caption: value } ) }
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
		<RichText.Content tagName="span" className="wp-block-couturier-logo-strip-item__caption" value={ attributes.caption } />
	),
} );
