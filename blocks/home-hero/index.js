/**
 * Bloc « Héros de l'accueil » (`couturier/home-hero`) : image de fond, titre
 * principal de la page (H1), accroche (H2) et texte.
 *
 * Seul bloc du thème à porter un `<h1>` : un seul par page (`supports.multiple:
 * false`). Les deux titres sont des `core/heading` imbriqués (panneau Structure),
 * le texte un `core/paragraph` imbriqué (il se place entre les titres et les
 * cartes), suivis des deux cartes `couturier/home-hero-card` (auto-école en
 * « Pêche », formation pro en « Pétrole »), tous verrouillés (`templateLock: 'all'`). Niveaux fixes : le premier
 * titre en H1, le second en H2 — le garde-fou de `Blocks\RestrictHeadingLevels`
 * ignore les titres de ce bloc (`exempt_parents`).
 *
 * L'image de fond est un attribut (`imageId`), décorative (`alt` vide au front), avec
 * un point focal réglé dans la barre latérale (`object-position`). `save()`
 * n'enregistre que les blocs imbriqués ; l'enveloppe, l'image et ses calques sont
 * produits par `render.php`, qui n'affiche rien sans H1.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { FocalPointPicker, Notice, PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import ImageField, { imageUrl } from '../_shared/image-field.js';
import {
	LOCKED,
	TEXT_BLOCKS,
	hideLockedControls,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import metadata from './block.json';
import './formats.js';

const CARD = 'couturier/home-hero-card';

const TEMPLATE = [
	[ 'core/heading', { level: 1, lock: LOCKED, placeholder: __( 'Titre principal de la page (H1)', 'couturier' ) } ],
	[ 'core/heading', { level: 2, lock: LOCKED, placeholder: __( 'Accroche', 'couturier' ) } ],
	[ 'core/paragraph', { lock: LOCKED, placeholder: __( 'Texte', 'couturier' ) } ],
	[ CARD, { lock: LOCKED } ],
	[ CARD, { lock: LOCKED, className: 'is-style-petrol' } ],
];

/** Blocs imbriqués verrouillés : titres, texte et les deux cartes. */
const LOCKED_BLOCKS = [ ...TEXT_BLOCKS, CARD ];

/** Premier titre en H1, le suivant en H2. */
const headingLevel = ( heading, index ) => ( 0 === index ? 1 : 2 );

const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };

/** `object-position` du point focal, en variable `--focal` (même calcul dans `render.php`). */
const objectPosition = ( { x, y } = DEFAULT_FOCAL_POINT ) =>
	`${ Math.round( x * 1000 ) / 10 }% ${ Math.round( y * 1000 ) / 10 }%`;

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { imageId, focalPoint } = attributes;
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	// Pièce jointe de l'image ; `isMissing` si elle a été supprimée de la médiathèque.
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
	// Bloc ou l'un de ses blocs imbriqués sélectionné. Sinon, le canvas montre le
	// rendu du site : ni avertissement, ni emplacement d'image.
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const title = blocks.find( ( block ) => block.name === 'core/heading' );
	const isIncomplete = blocks.length > 0 && ! textOf( title );
	const isImageLoading = !! imageId && ! media && ! isMissing;

	useLockedContent( blocks, { level: headingLevel, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (cf. `blocks/CLAUDE.md`).
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{ className: 'wp-block-couturier-home-hero__content' },
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	const onSelectImage = ( selected ) => setAttributes( { imageId: selected?.id, focalPoint: undefined } );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Image de fond', 'couturier' ) }>
					{ isMissing && (
						<Notice status="warning" isDismissible={ false }>
							{ __( 'L\'image choisie n\'existe plus dans la médiathèque.', 'couturier' ) }
						</Notice>
					) }
					{ media ? (
						<FocalPointPicker
							__nextHasNoMarginBottom
							label={ __( 'Point focal', 'couturier' ) }
							help={ __( 'Partie de l\'image toujours visible, quel que soit le recadrage (mobile, desktop). Image décorative : son texte alternatif n\'est pas lu.', 'couturier' ) }
							url={ imageUrl( media ) }
							value={ focalPoint ?? DEFAULT_FOCAL_POINT }
							onChange={ ( value ) => setAttributes( { focalPoint: value } ) }
						/>
					) : (
						! isMissing && <p>{ __( 'Choisissez l\'image dans le bloc.', 'couturier' ) }</p>
					) }
				</PanelBody>
			</InspectorControls>
			<section { ...useBlockProps() }>
				<div className="wp-block-couturier-home-hero__background" style={ { '--focal': objectPosition( focalPoint ) } }>
					{ media && (
						<ImageField
							className="wp-block-couturier-home-hero__media"
							imageClassName="wp-block-couturier-home-hero__image"
							media={ { ...media, alt_text: '' } }
							isEditing={ isEditing }
							onSelect={ onSelectImage }
							onRemove={ () => setAttributes( { imageId: undefined, focalPoint: undefined } ) }
						/>
					) }
				</div>
				{ /* Sans image : emplacement dans le flux, au-dessus du contenu (un calque de fond serait recouvert). */ }
				{ ! media && ! isImageLoading && isEditing && (
					<ImageField
						className="wp-block-couturier-home-hero__placeholder"
						media={ null }
						isEditing
						onSelect={ onSelectImage }
						label={ __( 'Image de fond', 'couturier' ) }
					/>
				) }
				<div { ...innerBlocksProps }>
					{ isEditing && isIncomplete && (
						<Notice status="warning" isDismissible={ false } className="wp-block-couturier-home-hero__notice">
							{ __( 'Le titre principal (H1) est obligatoire : sans lui, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
						</Notice>
					) }
					{ children }
				</div>
			</section>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Titre, texte ou carte du héros sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );
