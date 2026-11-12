/**
 * Session de formation (`couturier/session`) : dates, ville, secteur, places,
 * lien de réservation.
 *
 * - la ville est un attribut écrit dans le HTML enregistré (compteur de mots) ;
 * - dates, secteur et places se règlent dans la barre latérale, le lien par le
 *   `LinkControl` natif ouvert depuis le bouton « Réserver » du canvas ou le bouton
 *   « Lien » de la barre d'outils (commentaire du bloc) ; période, places et bouton sont rendus par `render.php`, et
 *   reproduits ici avec le même balisage ;
 * - 0 place : « Complet », sans bouton ; places vides : rien d'affiché.
 *
 * Sur le site, une session passée, sans date, sans ville ou sans lien (sauf
 * complète) n'est pas rendue : avertissement dans le canvas, session passée
 * grisée.
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
	ExternalLink,
	Notice,
	PanelBody,
	Popover,
	SelectControl,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';

import { link as linkIcon } from '../_shared/icons.js';
import { nonBreaking } from '../_shared/locked-content.js';
import { SECTORS_URL, findSector, sectors } from '../_shared/sectors.js';
import metadata from './block.json';

const ROOT = 'couturier/sessions';

/** Date `Y-m-d` valide ? */
const isDate = ( value ) => /^\d{4}-\d{2}-\d{2}$/.test( value ?? '' ) && ! Number.isNaN( Date.parse( value ) );

/** Aujourd'hui, `Y-m-d`, dans le fuseau du site. */
const today = () => dateI18n( 'Y-m-d', new Date() );

/** Mois abrégés, comme `SessionDate::month()`. */
const MONTHS = [ 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.' ];

/** Période affichée, comme `SessionDate::period()` (dates `Y-m-d`). */
function period( start, end ) {
	const [ y1, m1, d1 ] = start.split( '-' ).map( Number );
	const [ y2, m2, d2 ] = end.split( '-' ).map( Number );
	const full = ( y, m, d ) => `${ d } ${ MONTHS[ m - 1 ] } ${ y }`;

	if ( start === end ) {
		return full( y1, m1, d1 );
	}

	let first = full( y1, m1, d1 );
	if ( y1 === y2 && m1 === m2 ) {
		first = String( d1 );
	} else if ( y1 === y2 ) {
		first = `${ d1 } ${ MONTHS[ m1 - 1 ] }`;
	}

	return `${ first }–${ full( y2, m2, d2 ) }`;
}

/** Valeur du `LinkControl` réduite à ce que `render.php` utilise. */
const toLink = ( value ) =>
	value?.url
		? { url: value.url, id: value.id, kind: value.kind, type: value.type, opensInNewTab: !! value.opensInNewTab }
		: undefined;

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { startDate, endDate, city, sectorId, places, link } = attributes;

	const isEditing = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return isSelected || ( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) );
		},
		[ clientId, isSelected ]
	);

	const hasStart = isDate( startDate );
	const end = isDate( endDate ) && endDate > startDate ? endDate : startDate;
	const isPast = hasStart && end < today();
	const isFull = places === 0;
	// Commencée : affichée jusqu'au dernier jour, sans bouton (comme `render.php`).
	const isStarted = hasStart && startDate <= today();
	const isBookable = ! isFull && ! isStarted;
	const sector = findSector( sectorId );
	const hasPlaces = Number.isInteger( places );
	const warnings = [];
	if ( ! hasStart ) {
		warnings.push( __( 'Date de début obligatoire (barre latérale).', 'couturier' ) );
	}
	if ( RichText.isEmpty( city ?? '' ) ) {
		warnings.push( __( 'Ville obligatoire.', 'couturier' ) );
	}
	if ( ! sector ) {
		warnings.push(
			sectorId > 0
				? __( 'Secteur supprimé : choisissez-en un autre (barre latérale).', 'couturier' )
				: __( 'Secteur obligatoire (barre latérale).', 'couturier' )
		);
	}
	if ( isBookable && ! link?.url ) {
		warnings.push( __( 'Lien de réservation obligatoire (cliquer sur « Réserver »), sauf session complète (0 place).', 'couturier' ) );
	}
	const isIncomplete = warnings.length > 0;

	const blockProps = useBlockProps( {
		className: [ isFull && 'is-full', isPast && 'is-past', isIncomplete && 'is-incomplete' ].filter( Boolean ).join( ' ' ) || undefined,
	} );

	// Fenêtre du lien, ancrée au bouton « Réserver » (à la barre d'outils s'il est absent).
	const [ isLinkOpen, setLinkOpen ] = useState( false );
	const [ buttonAnchor, setButtonAnchor ] = useState( null );
	const [ toolbarAnchor, setToolbarAnchor ] = useState( null );

	const sectorOptions = [
		{ value: 0, label: __( '— Choisir un secteur —', 'couturier' ), disabled: true },
		...sectors().map( ( item ) => ( { value: item.id, label: item.name } ) ),
	];

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Dates', 'couturier' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="date"
						label={ __( 'Premier jour', 'couturier' ) }
						value={ startDate }
						onChange={ ( value ) => setAttributes( { startDate: value } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="date"
						label={ __( 'Dernier jour', 'couturier' ) }
						help={ __( 'Vide pour une session d\'un jour.', 'couturier' ) }
						min={ startDate || undefined }
						value={ endDate }
						onChange={ ( value ) => setAttributes( { endDate: value } ) }
					/>
					<p className="components-base-control__help">
						{ __( 'Dès le premier jour, la session reste affichée sur le site mais le nombre de places et le bouton « Réserver » sont retirés : elle n\'est plus réservable. Elle disparaît du site le lendemain du dernier jour.', 'couturier' ) }
					</p>
				</PanelBody>
				<PanelBody title={ __( 'Secteur et places', 'couturier' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Secteur (bouton du filtre, obligatoire)', 'couturier' ) }
						value={ sector ? sectorId : 0 }
						options={ sectorOptions }
						onChange={ ( value ) => setAttributes( { sectorId: Number( value ) } ) }
					/>
					<p>
						<ExternalLink href={ SECTORS_URL }>{ __( 'Gérer les secteurs', 'couturier' ) }</ExternalLink>
					</p>
					<NumberControl
						__next40pxDefaultSize
						label={ __( 'Places disponibles', 'couturier' ) }
						help={ __( '0 : « Complet », sans bouton. Vide : nombre non affiché.', 'couturier' ) }
						min={ 0 }
						value={ hasPlaces ? places : '' }
						onChange={ ( value ) =>
							setAttributes( { places: value === '' || value === undefined ? undefined : Math.max( 0, parseInt( value, 10 ) || 0 ) } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			{ isBookable && (
				<BlockControls group="block">
					<ToolbarGroup>
						<ToolbarButton
							ref={ setToolbarAnchor }
							icon={ linkIcon }
							label={ link?.url ? __( 'Modifier le lien de réservation', 'couturier' ) : __( 'Ajouter le lien de réservation', 'couturier' ) }
							isPressed={ !! link?.url }
							onClick={ () => setLinkOpen( ! isLinkOpen ) }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			{ isLinkOpen && isBookable && (
				<Popover
					anchor={ buttonAnchor ?? toolbarAnchor }
					placement="bottom"
					onClose={ () => setLinkOpen( false ) }
					focusOnMount="firstElement"
				>
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
			<li { ...blockProps }>
				<p className="wp-block-couturier-session__date">
					{ hasStart ? period( startDate, end ) : __( 'Dates à saisir', 'couturier' ) }
				</p>
				<RichText
					tagName="p"
					className="wp-block-couturier-session__city"
					aria-label={ __( 'Ville', 'couturier' ) }
					placeholder={ __( 'Ville', 'couturier' ) }
					value={ city }
					onChange={ ( value ) => setAttributes( { city: nonBreaking( value ) } ) }
					allowedFormats={ [] }
					disableLineBreaks
				/>
				{ ! isStarted && ( isFull || hasPlaces ) && (
					<p className="wp-block-couturier-session__places">
						{ isFull ? (
							__( 'Complet', 'couturier' )
						) : (
							<>
								<span className="wp-block-couturier-session__count">{ places }</span>
								{ ' ' + _n( 'place', 'places', places, 'couturier' ) }
							</>
						) }
					</p>
				) }
				{ isBookable && (
					<div className="wp-block-buttons wp-block-couturier-session__booking">
						<div className="wp-block-button is-style-deep has-arrow">
							<button
								type="button"
								ref={ setButtonAnchor }
								className="wp-block-button__link wp-element-button"
								aria-expanded={ isLinkOpen }
								title={ link?.url ? link.url : __( 'Ajouter le lien de réservation', 'couturier' ) }
								onClick={ () => setLinkOpen( ! isLinkOpen ) }
							>
								{ __( 'Réserver', 'couturier' ) }
							</button>
						</div>
					</div>
				) }
				{ isEditing && ( isIncomplete || isPast ) && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-session__notice">
						{ isIncomplete && (
							<>
								{ __( 'Session non affichée sur le site :', 'couturier' ) } { warnings.join( ' ' ) }
							</>
						) }
						{ ! isIncomplete && isPast && __( 'Session passée : elle n\'est plus affichée sur le site.', 'couturier' ) }
					</Notice>
				) }
			</li>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) =>
		! RichText.isEmpty( attributes.city ?? '' ) && (
			<RichText.Content tagName="p" className="wp-block-couturier-session__city" value={ attributes.city } />
		),
} );
