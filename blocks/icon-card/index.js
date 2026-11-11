/**
 * Carte du bloc « Cartes à pictogramme » (`couturier/icon-card`) : pictogramme,
 * titre et texte.
 *
 * - le pictogramme (`iconId`) est un SVG (ou PNG) de la médiathèque, utilisé en
 *   **masque CSS** dans une pastille : il est peint en pétrole quelles que soient
 *   les couleurs du fichier, et reste décoratif ;
 * - le titre est un `core/heading` imbriqué, toujours un `<h3>` : seul bloc que
 *   lit le panneau Structure. Verrouillé, sans format ;
 * - le texte est un attribut (`text`), écrit après le titre dans le HTML
 *   enregistré : le compteur de mots le lit. Gras, italique et lien permis.
 *
 * - le fond (`background`) se choisit dans une liste fermée (`BACKGROUNDS`) ;
 *   autre que blanc : classe `is-bg-{fond}`, sans bordure, pastille blanche.
 *
 * - présentation (`iconStyle`) : « Pastille » (défaut, ci-dessus) ou « Visuel
 *   décalé » : disque rond, visuel en `<img>` aux couleurs d'origine (JPG, PNG
 *   ou SVG), 80 px de haut, décalé en haut à droite du disque et le débordant
 *   (Figma 301:6225, 301:6812). Carte : classe `has-offset-visual` ;
 *
 * Aperçu de l'inserteur : `iconId` négatif, cf. `example-icons.js`.
 *
 * Sans titre, la carte n'est pas rendue sur le site (`is-incomplete`). Sans
 * pictogramme ou sans texte, elle est rendue sans eux.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	Button,
	ColorPalette,
	Notice,
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import { plus, replace, trash } from '../_shared/icons.js';
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

/**
 * Pictogrammes acceptés en pastille : SVG de préférence, PNG à fond transparent
 * sinon — converti en WebP à l'upload (`ConvertUploadsToWebp`), d'où `image/webp`.
 */
const ICON_TYPES = [ 'image/svg+xml', 'image/png', 'image/webp' ];

/** Visuels acceptés en mode décalé : affichés tels quels, une photo est permise. */
const OFFSET_TYPES = [ 'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml' ];

/** Formats du texte. */
const TEXT_FORMATS = [ 'core/bold', 'core/italic', 'core/link' ];

const TITLE_BLOCKS = [ 'core/heading' ];

const ROOT = 'couturier/icon-cards';

/**
 * Fonds proposés, liste fermée (`block.json` → `background.enum`). Hexa pour
 * les pastilles de l'inspecteur seulement : le rendu passe par la classe
 * `is-bg-{slug}` et les couleurs sémantiques (`block/_icon-cards.scss`).
 */
const BACKGROUNDS = [
	{ slug: 'white', name: __( 'Blanc', 'couturier' ), color: '#ffffff' },
	{ slug: 'petrol-100', name: __( 'Pétrole clair', 'couturier' ), color: '#e0eaec' },
	{ slug: 'peach-300', name: __( 'Pêche', 'couturier' ), color: '#fbdfcb' },
	{ slug: 'petrol-50', name: __( 'Pétrole très clair', 'couturier' ), color: '#f0f4f6' },
	{ slug: 'orange-100', name: __( 'Orange clair', 'couturier' ), color: '#ffeae3' },
	{ slug: 'neutral-50', name: __( 'Blanc cassé', 'couturier' ), color: '#f6f6f6' },
];

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { iconId, text } = attributes;
	const isOffset = 'offset' === attributes.iconStyle;
	const background = BACKGROUNDS.find( ( item ) => item.slug === attributes.background ) ?? BACKGROUNDS[ 0 ];

	const { blocks, isEditing, isCardEditing, iconUrl, iconMime } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const [ rootId ] = editor.getBlockParentsByBlockName( clientId, ROOT, true );

			return {
				blocks: editor.getBlocks( clientId ),
				// La carte, son titre ou son texte sélectionné : contrôles du pictogramme.
				isCardEditing: isSelected || editor.hasSelectedInnerBlock( clientId, true ),
				// Liste ou l'une de ses cartes en cours d'édition : les emplacements
				// vides ne s'affichent qu'alors (bloc désélectionné = rendu du site).
				isEditing:
					isSelected ||
					editor.hasSelectedInnerBlock( clientId, true ) ||
					( !! rootId && ( editor.isBlockSelected( rootId ) || editor.hasSelectedInnerBlock( rootId, true ) ) ),
				// `iconId` négatif : pictogramme de l'aperçu de l'inserteur (`example-icons.js`).
				iconUrl:
					exampleIconUrl( iconId ) ??
					( iconId > 0 ? select( coreStore ).getMedia( iconId, { context: 'view' } )?.source_url : undefined ),
				iconMime: iconId > 0 ? select( coreStore ).getMedia( iconId, { context: 'view' } )?.mime_type : undefined,
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
		useBlockProps( {
			className:
				[
					'white' !== background.slug && `is-bg-${ background.slug }`,
					isOffset && 'has-offset-visual',
					isIncomplete && 'is-incomplete',
				]
					.filter( Boolean )
					.join( ' ' ) || undefined,
		} ),
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	const picker = ( content ) => (
		<MediaUploadCheck>
			<MediaUpload
				// Fenêtre de la médiathèque recréée au changement de mode : sinon elle
				// garde les types acceptés du mode précédent.
				key={ isOffset ? 'offset' : 'badge' }
				value={ iconId }
				allowedTypes={ isOffset ? OFFSET_TYPES : ICON_TYPES }
				onSelect={ ( media ) => setAttributes( { iconId: media?.id } ) }
				render={ ( { open } ) => content( open ) }
			/>
		</MediaUploadCheck>
	);

	// Pastille : un SVG est peint en pétrole (masque), une image matricielle
	// (PNG / WebP) garde ses couleurs. Un JPG n'y a pas sa place.
	const isUnmaskable = ! isOffset && !! iconMime && ! ICON_TYPES.includes( iconMime );
	const isRaster = !! iconMime && 'image/svg+xml' !== iconMime;

	let icon = null;

	if ( iconUrl && isOffset ) {
		icon = <img className="wp-block-couturier-icon-card__image" src={ iconUrl } alt="" />;
	} else if ( iconUrl && isRaster && ! isUnmaskable ) {
		icon = <img className="wp-block-couturier-icon-card__picture" src={ iconUrl } alt="" />;
	} else if ( iconUrl && ! isUnmaskable ) {
		icon = <span className="wp-block-couturier-icon-card__icon" aria-hidden="true" style={ { '--icon': `url("${ iconUrl }")` } } />;
	}

	const badgeClass = 'wp-block-couturier-icon-card__badge' + ( isOffset ? ' is-offset' : '' );

	// Pastille : pictogramme, emplacement « + » en cours d'édition, rien sinon.
	// Carte en cours d'édition (elle, son titre ou son texte) : boutons
	// « Remplacer » et « Supprimer » dans le coin de la carte, et pastille
	// cliquable pour remplacer. Aucun contrôle hors édition : rendu du site.
	let badge = null;

	if ( icon && isCardEditing ) {
		badge = picker( ( open ) => (
			<>
				<span className={ badgeClass }>
					<Button className="wp-block-couturier-icon-card__replace" onClick={ open } label={ __( 'Remplacer le pictogramme', 'couturier' ) } showTooltip>
						{ icon }
					</Button>
				</span>
				{ /* Coin supérieur droit : hors de la barre d'outils du titre, posée au-dessus de la pastille. */ }
				<span className="wp-block-couturier-icon-card__icon-actions">
					<Button size="compact" icon={ replace } onClick={ open } label={ __( 'Remplacer le pictogramme', 'couturier' ) } showTooltip />
					<Button
						size="compact"
						icon={ trash }
						isDestructive
						onClick={ () => setAttributes( { iconId: undefined } ) }
						label={ __( 'Supprimer le pictogramme', 'couturier' ) }
						showTooltip
					/>
				</span>
			</>
		) );
	} else if ( icon ) {
		badge = <span className={ badgeClass }>{ icon }</span>;
	} else if ( isEditing ) {
		// Sans visuel, ou visuel impossible à peindre en pastille : emplacement « + ».
		badge = (
			<span className={ badgeClass }>
				{ picker( ( open ) => (
					<Button
						className="wp-block-couturier-icon-card__choose"
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
				<PanelBody title={ __( 'Fond de la carte', 'couturier' ) }>
					<ColorPalette
						colors={ BACKGROUNDS.map( ( { name, color } ) => ( { name, color } ) ) }
						value={ background.color }
						onChange={ ( color ) =>
							setAttributes( { background: BACKGROUNDS.find( ( item ) => item.color === color )?.slug ?? 'white' } )
						}
						disableCustomColors
						clearable={ false }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Pictogramme', 'couturier' ) }>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Présentation', 'couturier' ) }
						value={ isOffset ? 'offset' : 'badge' }
						onChange={ ( value ) => setAttributes( { iconStyle: value } ) }
					>
						<ToggleGroupControlOption value="badge" label={ __( 'Pastille', 'couturier' ) } />
						<ToggleGroupControlOption value="offset" label={ __( 'Visuel décalé', 'couturier' ) } />
					</ToggleGroupControl>
					<p>
						{ isOffset
							? __( 'Image JPG, PNG ou SVG affichée dans ses couleurs, à 80 px de haut, décalée sur un disque. Elle est décorative : son texte alternatif n\'est pas utilisé.', 'couturier' )
							: __( 'Un pictogramme SVG est peint en pétrole quelles que soient ses couleurs d\'origine ; une image PNG garde les siennes. Il est décoratif : son texte alternatif n\'est pas utilisé.', 'couturier' ) }
					</p>
					{ isUnmaskable && (
						<Notice status="warning" isDismissible={ false }>
							{ __( 'Cette image ne peut pas être affichée en pastille : choisissez « Visuel décalé » ou un pictogramme SVG / PNG à fond transparent.', 'couturier' ) }
						</Notice>
					) }
				</PanelBody>
			</InspectorControls>
			{ badge }
			{ children }
			<RichText
				tagName="p"
				className="wp-block-couturier-icon-card__text"
				aria-label={ __( 'Texte de la carte', 'couturier' ) }
				placeholder={ __( 'Texte', 'couturier' ) }
				value={ text }
				onChange={ ( value ) => setAttributes( { text: nonBreaking( value ) } ) }
				allowedFormats={ TEXT_FORMATS }
			/>
			{ isEditing && isIncomplete && (
				<Notice status="warning" isDismissible={ false } className="wp-block-couturier-icon-card__notice">
					{ __( 'Titre obligatoire : sans lui, cette carte n\'est pas affichée sur le site.', 'couturier' ) }
				</Notice>
			) }
		</li>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( attributes.text ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-icon-card__text" value={ attributes.text } />
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
