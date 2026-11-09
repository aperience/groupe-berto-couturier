/**
 * Tag du visuel du héros de page (`couturier/page-hero-tag`) : étiquette posée sur
 * l'image, deux au plus par visuel (`couturier/page-hero-media`).
 *
 * - libellé : attribut écrit dans le HTML enregistré (compteur de mots), sans
 *   format ;
 * - pictogramme (liste fixe : aucun, point orange ou pétrole, repère, lecture,
 *   calendrier),
 *   position, masquage en mobile et lien : réglages de la barre latérale (panneau
 *   « Tag ») ; lien aussi par le bouton « Lien » de la barre d'outils ;
 * - position : x et y de 0 à 1 (`position`), choisis sur l'image par un sélecteur
 *   de point (`FocalPointPicker`) ; même placement au front et dans le canvas
 *   (`--tag-x`, `--tag-y`, cf. `block/_page-hero-media.scss`).
 *
 * Non déplaçable (`lock.move` par défaut dans `block.json`) : ni poignée de
 * glisser-déposer ni flèches dans la barre d'outils ; la position se règle dans la
 * barre latérale seulement. Le tag reste supprimable. Cadenas masqué
 * (`hideLockedControls`, `page-hero-media/index.js`) ; le verrou levé par
 * « Déverrouiller » (menu « Options ») est aussitôt rétabli.
 *
 * Sans libellé, le tag n'est pas rendu (`render.php`).
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	BlockControls,
	InspectorControls,
	LinkControl,
	RichText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	FocalPointPicker,
	PanelBody,
	Popover,
	RangeControl,
	SelectControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { link as linkIcon } from '../_shared/icons.js';
import { imageUrl } from '../_shared/image-field.js';
import { textOf } from '../_shared/locked-content.js';
import metadata from './block.json';

const DEFAULT_POSITION = metadata.attributes.position.default;

const ICONS = [
	{ value: 'none', label: __( 'Aucun', 'couturier' ) },
	{ value: 'dot', label: __( 'Point orange', 'couturier' ) },
	{ value: 'dot-petrol', label: __( 'Point pétrole', 'couturier' ) },
	{ value: 'pin', label: __( 'Repère (lieu)', 'couturier' ) },
	{ value: 'play', label: __( 'Lecture (vidéo)', 'couturier' ) },
	{ value: 'calendar', label: __( 'Calendrier', 'couturier' ) },
];

/** Valeur du `LinkControl` réduite à ce que `render.php` utilise. */
const toLink = ( value ) =>
	value?.url
		? { url: value.url, id: value.id, kind: value.kind, type: value.type, opensInNewTab: !! value.opensInNewTab }
		: undefined;

/** Pourcentage (0–100, une décimale) d'une coordonnée de 0 à 1. */
const percent = ( value ) => Math.round( Math.min( Math.max( Number( value ) || 0, 0 ), 1 ) * 1000 ) / 10;

/** URL de l'image du visuel parent, pour le sélecteur de position. */
function useParentImageUrl( clientId ) {
	return useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const imageId = editor.getBlockAttributes( editor.getBlockRootClientId( clientId ) )?.imageId;
			const media = imageId ? select( coreStore ).getMedia( imageId, { context: 'view' } ) : null;

			return media ? imageUrl( media ) : null;
		},
		[ clientId ]
	);
}

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { label, icon, position, hideOnMobile, link } = attributes;
	const [ isLinkOpen, setLinkOpen ] = useState( false );
	const [ linkAnchor, setLinkAnchor ] = useState( null );
	const imageSrc = useParentImageUrl( clientId );
	const { x, y } = { ...DEFAULT_POSITION, ...position };
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );

	// Verrou de déplacement rétabli s'il a été levé (hors historique).
	useEffect( () => {
		if ( ! attributes.lock?.move ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { lock: { move: true } } );
		}
	}, [ attributes.lock, setAttributes, __unstableMarkNextChangeAsNotPersistent ] );

	const blockProps = useBlockProps( {
		className: [
			'none' !== icon ? `has-icon-${ icon }` : '',
			// Sans libellé, rien sur le site : masqué dans le canvas hors édition.
			! textOf( label ) && ! isSelected ? 'is-incomplete' : '',
		]
			.filter( Boolean )
			.join( ' ' ),
		style: { '--tag-x': percent( x ), '--tag-y': percent( y ) },
	} );

	const linkControl = ( onClose ) => (
		<LinkControl
			value={ link }
			forceIsEditingLink={ ! link?.url }
			onChange={ ( value ) => setAttributes( { link: toLink( value ) } ) }
			onRemove={ () => {
				setAttributes( { link: undefined } );
				onClose?.();
			} }
		/>
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Tag', 'couturier' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Pictogramme', 'couturier' ) }
						value={ icon }
						options={ ICONS }
						onChange={ ( value ) => setAttributes( { icon: value } ) }
					/>
					{ imageSrc ? (
						<FocalPointPicker
							__nextHasNoMarginBottom
							label={ __( 'Position sur l\'image', 'couturier' ) }
							help={ __( 'Cliquez ou glissez sur l\'image. Le tag reste dans le visuel ; près d\'un bord, il déborde un peu de l\'image, comme sur la maquette.', 'couturier' ) }
							url={ imageSrc }
							value={ { x, y } }
							onChange={ ( value ) => setAttributes( { position: value } ) }
						/>
					) : (
						<>
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Position horizontale (%)', 'couturier' ) }
								value={ percent( x ) }
								min={ 0 }
								max={ 100 }
								onChange={ ( value ) => setAttributes( { position: { x: ( value ?? 0 ) / 100, y } } ) }
							/>
							<RangeControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Position verticale (%)', 'couturier' ) }
								value={ percent( y ) }
								min={ 0 }
								max={ 100 }
								onChange={ ( value ) => setAttributes( { position: { x, y: ( value ?? 0 ) / 100 } } ) }
							/>
						</>
					) }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Masquer en mobile', 'couturier' ) }
						checked={ hideOnMobile }
						onChange={ ( value ) => setAttributes( { hideOnMobile: value } ) }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Lien', 'couturier' ) } initialOpen={ !! link?.url }>
					<p>{ __( 'Facultatif : avec un lien, le tag est cliquable.', 'couturier' ) }</p>
					{ linkControl() }
				</PanelBody>
			</InspectorControls>
			{ isSelected && (
				<BlockControls group="block">
					<ToolbarGroup>
						<ToolbarButton
							ref={ setLinkAnchor }
							icon={ linkIcon }
							label={ link?.url ? __( 'Modifier le lien du tag', 'couturier' ) : __( 'Ajouter un lien au tag', 'couturier' ) }
							isPressed={ !! link?.url }
							onClick={ () => setLinkOpen( ! isLinkOpen ) }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			{ isLinkOpen && (
				<Popover anchor={ linkAnchor } placement="bottom" onClose={ () => setLinkOpen( false ) } focusOnMount="firstElement">
					{ linkControl( () => setLinkOpen( false ) ) }
				</Popover>
			) }
			<div { ...blockProps }>
				{ 'none' !== icon && <span className="wp-block-couturier-page-hero-tag__icon" aria-hidden="true" /> }
				<RichText
					tagName="span"
					className="wp-block-couturier-page-hero-tag__label"
					aria-label={ __( 'Libellé du tag', 'couturier' ) }
					placeholder={ __( 'Libellé du tag', 'couturier' ) }
					value={ label }
					onChange={ ( value ) => setAttributes( { label: value } ) }
					allowedFormats={ [] }
					disableLineBreaks
				/>
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) =>
		RichText.isEmpty( attributes.label ) ? null : (
			<RichText.Content tagName="p" className="wp-block-couturier-page-hero-tag__label" value={ attributes.label } />
		),
} );
