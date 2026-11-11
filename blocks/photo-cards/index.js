/**
 * Bloc « Cartes photo » (`couturier/photo-cards`) : rangée de cartes
 * (`couturier/photo-card`) — photo, badge, sur-titre, titre H3, texte, lien.
 *
 * Inséré avec cinq cartes ; les cartes s'ajoutent (bouton « Ajouter une
 * carte »), se retirent et se déplacent librement, sans limite de nombre.
 * Réglage « Taille des cartes » (`size`) : petites (5 par ligne en desktop) ou
 * grandes (4 par ligne). Au-delà, les cartes défilent (`block/_photo-cards.scss`,
 * `resources/js/photo-cards.js`).
 *
 * Canvas : bloc non sélectionné, rendu du front, flèches comprises (`useNav`,
 * affichage seulement, même règle que `resources/js/photo-cards.js`) ; en cours d'édition, les
 * cartes passent à la ligne (`editor/_photo-cards.scss`) et les flèches, sans
 * objet, disparaissent.
 *
 * Fond réglé carte par carte (`photo-card`). Ancien style « Pétrole clair »
 * (`is-style-petrol`, supprimé) : migré à l'ouverture dans l'éditeur, cartes
 * encore en gris clair passées en pétrole très clair, puis classe retirée.
 *
 * Sans carte titrée, le bloc n'est pas rendu (`render.php`) : il reçoit
 * `is-incomplete` dans le canvas.
 */
import { createBlocksFromInnerBlocksTemplate, registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { plus } from '../_shared/icons.js';
import { textOf } from '../_shared/locked-content.js';
import { TITLE } from '../photo-card/title.js';
import metadata from './block.json';

const ITEM = 'couturier/photo-card';

const CARD = [ ITEM, {}, [ TITLE ] ];

const TEMPLATE = [ CARD, CARD, CARD, CARD, CARD ];

/** Carte affichée sur le site : titre saisi. */
const hasTitle = ( block ) => !! textOf( block.innerBlocks[ 0 ] );

/** Marge d'arrondi des positions de défilement (zoom, pixels fractionnaires). */
const EPSILON = 2;

/**
 * Flèches de la piste dans le canvas, pour l'affichage seulement (le rendu du
 * canvas est celui du front) : affichées à partir de `lg` quand les cartes
 * dépassent, grisées en début / fin de piste. Pas de clic : elles ne font pas
 * défiler la piste dans l'éditeur. Le canvas est une iframe : media query et observateur
 * sont ceux de sa fenêtre.
 *
 * @param {?HTMLElement} track Piste (`ul.__track`).
 * @param {Array}        deps  Valeurs qui changent le contenu de la piste.
 */
function useNav( track, deps ) {
	const [ nav, setNav ] = useState( { hasNav: false, atStart: true, atEnd: false } );

	useEffect( () => {
		if ( ! track ) {
			return undefined;
		}

		const view = track.ownerDocument.defaultView;
		const lg = view.getComputedStyle( track.ownerDocument.documentElement ).getPropertyValue( '--bs-breakpoint-lg' ).trim() || '992px';
		const desktop = view.matchMedia( `(min-width: ${ lg })` );

		const update = () => {
			const max = track.scrollWidth - track.clientWidth;

			setNav( {
				hasNav: desktop.matches && max > EPSILON,
				atStart: track.scrollLeft <= EPSILON,
				atEnd: track.scrollLeft >= max - EPSILON,
			} );
		};

		const observer = new view.ResizeObserver( update );
		observer.observe( track );
		track.addEventListener( 'scroll', update, { passive: true } );
		desktop.addEventListener( 'change', update );
		update();

		return () => {
			observer.disconnect();
			track.removeEventListener( 'scroll', update );
			desktop.removeEventListener( 'change', update );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ track, ...deps ] );

	return nav;
}

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const size = 'large' === attributes.size ? 'large' : 'small';
	const { insertBlock, selectBlock, updateBlockAttributes } = useDispatch( blockEditorStore );
	// Bloc ou l'une de ses cartes sélectionné. Sinon, le canvas montre le rendu du
	// site : pas de bouton d'ajout.
	const { isEditing, items } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );

			return {
				isEditing: isSelected || editor.hasSelectedInnerBlock( clientId, true ),
				items: editor.getBlocks( clientId ),
			};
		},
		[ clientId, isSelected ]
	);

	// Migration de l'ancien style « Pétrole clair ».
	const className = attributes.className ?? '';
	useEffect( () => {
		if ( ! /(^|\s)is-style-petrol(\s|$)/.test( className ) || ! items.length ) {
			return;
		}
		items.forEach( ( item ) => {
			if ( ( item.attributes.background ?? 'neutral-50' ) === 'neutral-50' ) {
				updateBlockAttributes( item.clientId, { background: 'petrol-50' } );
			}
		} );
		setAttributes( { className: className.replace( /(^|\s)is-style-petrol(?=\s|$)/, '' ).trim() || undefined } );
	}, [ className, items, setAttributes, updateBlockAttributes ] );

	// Carte créée avec son titre, curseur placé dans le titre : sans titre, il
	// n'arriverait qu'ensuite, par le modèle de la carte.
	const addItem = () => {
		const [ item ] = createBlocksFromInnerBlocksTemplate( [ CARD ] );
		insertBlock( item, items.length, clientId, false );
		selectBlock( item.innerBlocks[ 0 ].clientId, 0 );
	};

	const [ track, setTrack ] = useState( null );
	const nav = useNav( track, [ items.length, isEditing, size ] );

	// `has-nav` : barre de défilement masquée quand les flèches sont là, comme sur le front.
	const blockProps = useBlockProps( {
		className: [
			`is-size-${ size }`,
			nav.hasNav ? 'has-nav' : '',
			items.length && ! items.some( hasTitle ) ? 'is-incomplete' : '',
		]
			.filter( Boolean )
			.join( ' ' ),
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'wp-block-couturier-photo-cards__track', ref: setTrack },
		{
			allowedBlocks: [ ITEM ],
			// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
			template: items.length ? undefined : TEMPLATE,
			templateLock: false,
			orientation: 'horizontal',
			renderAppender: () =>
				isEditing && (
					<li className="wp-block-couturier-photo-cards__add">
						<Button __next40pxDefaultSize variant="secondary" icon={ plus } onClick={ addItem }>
							{ __( 'Ajouter une carte', 'couturier' ) }
						</Button>
					</li>
				),
		}
	);

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Cartes', 'couturier' ) }>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Taille des cartes', 'couturier' ) }
						help={
							'large' === size
								? __( 'Grandes cartes : 4 par ligne en desktop, flèches au-delà.', 'couturier' )
								: __( 'Petites cartes : 5 par ligne en desktop, flèches au-delà.', 'couturier' )
						}
						value={ size }
						onChange={ ( value ) => setAttributes( { size: value } ) }
					>
						<ToggleGroupControlOption value="small" label={ __( 'Petites', 'couturier' ) } />
						<ToggleGroupControlOption value="large" label={ __( 'Grandes', 'couturier' ) } />
					</ToggleGroupControl>
				</PanelBody>
			</InspectorControls>
			<ul { ...innerBlocksProps } />
			{ /* Flèches affichées comme sur le front, sans clic (aperçu). */ }
			{ nav.hasNav && (
				<div className="wp-block-couturier-photo-cards__nav">
					<span
						className="wp-block-couturier-photo-cards__arrow is-prev"
						aria-hidden="true"
						aria-disabled={ nav.atStart }
					/>
					<span
						className="wp-block-couturier-photo-cards__arrow is-next"
						aria-hidden="true"
						aria-disabled={ nav.atEnd }
					/>
				</div>
			) }
		</div>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
