/**
 * Bloc « Héros de page » (`couturier/page-hero`) : en-tête d'une page intérieure.
 *
 * Porte le `<h1>` de la page : un seul par page (`supports.multiple: false`),
 * proposé partout sauf dans la page d'accueil (feature `Blocks\PageScopedBlocks`).
 *
 * Blocs imbriqués, verrouillés (`templateLock: 'all'`) :
 * - le titre, un `core/heading` toujours en H1 (le garde-fou de
 *   `Blocks\RestrictHeadingLevels` ignore ce bloc : `exempt_parents`), avec la
 *   « Mise en avant » orange ;
 * - le texte, un `core/paragraph` (facultatif) ;
 * - 0 à 2 boutons (`core/buttons`, supprimables, panneau « Boutons ») ;
 * - le visuel, `couturier/page-hero-media` (image facultative et surimpression),
 *   colonne de droite en desktop (`has-media`), sous les boutons en mobile.
 *
 * Avis (étoiles, note, nombre d'avis, lien facultatif) : attributs réglés dans la
 * barre latérale, rendus par `render.php` entre le texte et les boutons ; dans le
 * canvas, un aperçu placé au même endroit par `order` (CSS).
 *
 * Fil d'Ariane : calculé au rendu (Rank Math, `Theme\Support\Breadcrumb`) ; dans
 * le canvas, un aperçu tiré du titre de la page et de ses parents.
 *
 * `save()` n'enregistre que les blocs imbriqués ; l'enveloppe, le fil et les avis
 * sont produits par `render.php`, qui n'affiche rien sans H1.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	LinkControl,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	Button,
	Notice,
	PanelBody,
	TextControl,
	ToggleControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';

import { ButtonsControl, useButtonCount } from '../_shared/buttons.js';
import { plus } from '../_shared/icons.js';
import {
	LOCKED,
	REMOVABLE,
	TEXT_BLOCKS,
	hideLockedControls,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import './formats.js';

/** Les deux boutons du modèle : orange avec flèche, puis contour. */
const BUTTONS = [
	[ 'core/button', { hasArrow: true, lock: REMOVABLE } ],
	[ 'core/button', { className: 'is-style-outline', lock: REMOVABLE } ],
];

const MEDIA = 'couturier/page-hero-media';

const TEMPLATE = [
	[ 'core/heading', { level: 1, lock: LOCKED, placeholder: __( 'Titre principal de la page (H1)', 'couturier' ) } ],
	[ 'core/paragraph', { lock: LOCKED, placeholder: __( 'Texte (facultatif)', 'couturier' ) } ],
	[ 'core/buttons', { lock: REMOVABLE }, BUTTONS ],
	[ MEDIA, { lock: LOCKED } ],
];

/** Blocs imbriqués verrouillés : titre, texte et visuel. */
const LOCKED_BLOCKS = [ ...TEXT_BLOCKS, MEDIA ];

/** Le titre est toujours le `<h1>` de la page. */
const LEVEL = 1;

/** Note saisie (« 4,8 » ou « 4.8 »), bornée à 0–5 ; `null` si illisible. Même règle que `render.php`. */
function parseRating( rating ) {
	const match = String( rating ?? '' ).trim().match( /^(\d+(?:[.,]\d+)?)$/ );

	return match ? Math.min( 5, Math.max( 0, parseFloat( match[ 1 ].replace( ',', '.' ) ) ) ) : null;
}

/** Valeur du `LinkControl` réduite à ce que `render.php` utilise. */
const toLink = ( value ) =>
	value?.url
		? { url: value.url, id: value.id, kind: value.kind, type: value.type, opensInNewTab: !! value.opensInNewTab }
		: undefined;

/**
 * Aperçu du fil d'Ariane : « Accueil », les pages parentes, le titre de la page.
 * Le fil réel (Rank Math) peut différer (billets : page des articles, catégorie).
 */
function useBreadcrumbPreview() {
	return useSelect( ( select ) => {
		const editor = select( 'core/editor' );

		if ( ! editor ) {
			return [];
		}

		const postType = editor.getCurrentPostType();
		const items = [ __( 'Accueil', 'couturier' ) ];
		const parents = [];
		let parentId = editor.getEditedPostAttribute( 'parent' );

		for ( let depth = 0; parentId && depth < 5; depth++ ) {
			const parent = select( coreStore ).getEntityRecord( 'postType', postType, parentId );

			if ( ! parent ) {
				break;
			}

			parents.unshift( decodeEntities( parent.title?.rendered ?? '' ) );
			parentId = parent.parent;
		}

		return [ ...items, ...parents, editor.getEditedPostAttribute( 'title' ) || __( 'Titre de la page', 'couturier' ) ];
	}, [] );
}

/** Aperçu des avis, mêmes classes que `render.php`. */
function RatingPreview( { rating, reviewCount } ) {
	const value = parseRating( rating );

	if ( null === value ) {
		return null;
	}

	const score = String( Math.round( value * 10 ) / 10 ).replace( '.', ',' );

	return (
		<p className="wp-block-couturier-page-hero__rating">
			<span className="wp-block-couturier-page-hero__stars" style={ { '--rating': value } } />{ ' ' }
			<span className="wp-block-couturier-page-hero__score">{ sprintf( __( '%s / 5', 'couturier' ), score ) }</span>
			{ reviewCount > 0 && ` · ${ sprintf( _n( '%s avis', '%s avis', reviewCount, 'couturier' ), reviewCount ) }` }
		</p>
	);
}

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { showRating, rating, reviewCount, ratingLink } = attributes;
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	// Bloc ou l'un de ses blocs imbriqués sélectionné. Sinon, le canvas montre le
	// rendu du site : ni avertissement, ni bouton d'ajout.
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);
	const breadcrumb = useBreadcrumbPreview();

	const title = blocks.find( ( block ) => block.name === 'core/heading' );
	const isIncomplete = blocks.length > 0 && ! textOf( title );
	const [ buttonCount, setButtonCount ] = useButtonCount( clientId, blocks, BUTTONS );
	const isRatingInvalid = showRating && null === parseRating( rating );
	// Colonne du visuel : une image, ou son emplacement pendant l'édition (cf.
	// `render.php` : `has-media` si le visuel est rendu).
	const media = blocks.find( ( block ) => block.name === MEDIA );
	const hasMedia = !! media && ( !! media.attributes.imageId || isEditing );

	// Titre et texte toujours verrouillés, titre toujours en H1 ; espace insécable
	// avant « ? ! : ; ».
	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (cf. `blocks/CLAUDE.md`).
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{ className: 'wp-block-couturier-page-hero__content' },
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<ButtonsControl
				count={ buttonCount }
				setCount={ setButtonCount }
				max={ 2 }
				help={ __( 'Le premier bouton est orange avec une flèche, le second à contour.', 'couturier' ) }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Avis', 'couturier' ) } initialOpen={ showRating }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Afficher les avis', 'couturier' ) }
						help={ __( 'Étoiles, note et nombre d\'avis, sous le texte.', 'couturier' ) }
						checked={ showRating }
						onChange={ ( value ) => setAttributes( { showRating: value } ) }
					/>
					{ showRating && (
						<>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Note sur 5', 'couturier' ) }
								help={ isRatingInvalid ? __( 'Note illisible : saisir un nombre entre 0 et 5, ex. 4,8. Les avis ne sont pas affichés.', 'couturier' ) : __( 'Ex. 4,8', 'couturier' ) }
								value={ rating ?? '' }
								onChange={ ( value ) => setAttributes( { rating: value } ) }
							/>
							<NumberControl
								__next40pxDefaultSize
								label={ __( 'Nombre d\'avis', 'couturier' ) }
								help={ __( 'Facultatif.', 'couturier' ) }
								min={ 0 }
								value={ reviewCount ?? '' }
								onChange={ ( value ) => setAttributes( { reviewCount: value === '' || value === undefined ? undefined : Math.max( 0, parseInt( value, 10 ) || 0 ) } ) }
							/>
							<p className="components-base-control__label">{ __( 'Lien (facultatif)', 'couturier' ) }</p>
							<LinkControl
								value={ ratingLink }
								onChange={ ( value ) => setAttributes( { ratingLink: toLink( value ) } ) }
								onRemove={ () => setAttributes( { ratingLink: undefined } ) }
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<section { ...useBlockProps( { className: hasMedia ? 'has-media' : undefined } ) }>
				<div { ...innerBlocksProps }>
					{ isEditing && isIncomplete && (
						<Notice status="warning" isDismissible={ false } className="wp-block-couturier-page-hero__notice">
							{ __( 'Le titre principal (H1) est obligatoire : sans lui, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
						</Notice>
					) }
					{ /* Aperçu du fil : pas de navigation dans le canvas. */ }
					<div className="breadcrumb-trail" aria-hidden="true">
						<ol className="breadcrumb-trail__list">
							{ breadcrumb.map( ( label, index ) => (
								<li key={ index } className="breadcrumb-trail__item">
									<span className={ index === breadcrumb.length - 1 ? 'breadcrumb-trail__current' : 'breadcrumb-trail__link' }>
										{ label }
									</span>
								</li>
							) ) }
						</ol>
					</div>
					{ children }
					{ showRating && <RatingPreview rating={ rating } reviewCount={ reviewCount } /> }
					{ /* Sans bouton, rien d'autre ne signale qu'on peut en remettre. */ }
					{ isEditing && 0 === buttonCount && (
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ plus }
							className="wp-block-couturier-page-hero__add-buttons"
							onClick={ () => setButtonCount( 2 ) }
						>
							{ __( 'Ajouter des boutons', 'couturier' ) }
						</Button>
					) }
				</div>
			</section>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre, texte ou visuel du héros sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );
