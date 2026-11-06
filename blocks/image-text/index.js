/**
 * Bloc « Image et texte » (`couturier/image-text`) : une image à gauche ou à
 * droite et, à côté, surtitre, titre, texte libre et boutons.
 *
 * - le surtitre est un attribut (`source: html`), écrit par `save()` avant les
 *   blocs imbriqués : compté par le compteur de mots ;
 * - le titre est un `core/heading` imbriqué (panneau Structure, cf.
 *   `blocks/CLAUDE.md`), toujours un `<h2>`, verrouillé ;
 * - le texte est un `couturier/image-text-body` verrouillé, dont le propre
 *   `templateLock: false` accueille paragraphes et listes ;
 * - les icônes (pictogramme, libellé, lien) vivent dans un
 *   `couturier/image-text-icons` verrouillé, dont le propre `templateLock: false`
 *   permet d'en ajouter, retirer et déplacer sans limite ;
 * - les boutons sont des `core/button` (0, 1 ou 2), habillés par
 *   `Blocks\ButtonStyles`, comme ceux du CTA.
 *
 * Surtitre, titre et texte sont facultatifs un à un ; sans aucun des trois,
 * `render.php` n'affiche rien. L'image (`imageId`) aussi : sans elle, le texte
 * prend toute la largeur. Elle précède le texte dans le DOM (toujours au-dessus
 * en mobile) ; `imagePosition` ne la place à droite qu'en desktop.
 *
 * `save()` n'enregistre que le surtitre et les blocs imbriqués : l'enveloppe et
 * l'image sont produites par `render.php`.
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	InspectorControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import {
	Button,
	Notice,
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { ButtonsControl, useButtonCount } from '../_shared/buttons.js';
import ImageField, { ImageInfoPanel } from '../_shared/image-field.js';
import { plus } from '../_shared/icons.js';
import {
	LOCKED,
	REMOVABLE,
	hideLockedControls,
	nonBreaking,
	textOf,
	useLockedContent,
	useNonBreakingPunctuation,
} from '../_shared/locked-content.js';
import { hasContent } from '../image-text-body/content.js';
import metadata from './block.json';
import exampleImage from './example.webp';
import './formats.js';

const BODY = 'couturier/image-text-body';
const ICONS = 'couturier/image-text-icons';

/** Blocs imbriqués verrouillés : le titre, le texte et la rangée d'icônes. */
const LOCKED_BLOCKS = [ 'core/heading', BODY, ICONS ];

/** Le titre est toujours un `<h2>`. */
const LEVEL = 2;

/**
 * `imageId` réservé à l'aperçu de l'inserteur (`example`), cf. bloc CTA. Jamais
 * enregistré.
 */
const EXAMPLE_IMAGE_ID = -1;
const EXAMPLE_MEDIA = { source_url: exampleImage, alt_text: '', media_details: { width: 760, height: 515 } };

/** Les deux boutons du modèle : pétrole foncé avec flèche, puis contour. */
const BUTTONS = [
	[ 'core/button', { className: 'is-style-deep', hasArrow: true, lock: REMOVABLE } ],
	[ 'core/button', { className: 'is-style-outline', lock: REMOVABLE } ],
];

const TEMPLATE = [
	[ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Titre (facultatif)', 'couturier' ) } ],
	[ BODY, { lock: LOCKED }, [ [ 'core/paragraph', { placeholder: __( 'Texte (facultatif)', 'couturier' ) } ] ] ],
	[ ICONS, { lock: LOCKED } ],
	[ 'core/buttons', { lock: REMOVABLE }, BUTTONS ],
];

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { imageId, imagePosition, surtitre } = attributes;
	const blocks = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId ), [ clientId ] );
	// Pièce jointe de l'image ; `isMissing` si elle a été supprimée de la médiathèque.
	const { media, isMissing } = useSelect(
		( select ) => {
			if ( ! imageId ) {
				return { media: null, isMissing: false };
			}

			if ( EXAMPLE_IMAGE_ID === imageId ) {
				return { media: EXAMPLE_MEDIA, isMissing: false };
			}

			const attachment = select( coreStore ).getMedia( imageId, { context: 'view' } );
			const isResolved = select( coreStore ).hasFinishedResolution( 'getMedia', [ imageId, { context: 'view' } ] );

			return { media: attachment ?? null, isMissing: isResolved && ! attachment };
		},
		[ imageId ]
	);
	// Bloc ou l'un de ses blocs imbriqués sélectionné. Sinon, le canvas montre le
	// rendu du site : ni avertissement, ni emplacement d'image, ni bouton d'ajout.
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const heading = blocks.find( ( block ) => block.name === 'core/heading' );
	const body = blocks.find( ( block ) => block.name === BODY );
	const isEmpty =
		blocks.length > 0 && ! textOf( surtitre ) && ! textOf( heading ) && ! ( body?.innerBlocks ?? [] ).some( hasContent );
	const [ buttonCount, setButtonCount ] = useButtonCount( clientId, blocks, BUTTONS, { after: LOCKED_BLOCKS } );
	// Colonne image : l'image, ou son emplacement tant que le bloc est en cours
	// d'édition (pas pendant le chargement d'une image déjà choisie).
	const isImageLoading = !! imageId && ! media && ! isMissing;
	const hasMediaColumn = !! media || ( isEditing && ! isImageLoading );

	// Titre, texte et icônes toujours verrouillés, titre toujours en H2 ; espace insécable
	// avant « ? ! : ; » dans le titre.
	useLockedContent( blocks, { level: LEVEL, names: LOCKED_BLOCKS } );
	useNonBreakingPunctuation( blocks );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{ className: 'wp-block-couturier-image-text__content' },
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	const className = [ `is-image-${ imagePosition }`, hasMediaColumn ? 'has-image' : '' ].filter( Boolean ).join( ' ' );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Image', 'couturier' ) }>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Position de l\'image', 'couturier' ) }
						help={ __( 'En desktop seulement : en mobile, l\'image est toujours au-dessus du texte.', 'couturier' ) }
						value={ imagePosition }
						onChange={ ( value ) => setAttributes( { imagePosition: value } ) }
					>
						<ToggleGroupControlOption value="left" label={ __( 'À gauche', 'couturier' ) } />
						<ToggleGroupControlOption value="right" label={ __( 'À droite', 'couturier' ) } />
					</ToggleGroupControl>
				</PanelBody>
			</InspectorControls>
			<ButtonsControl
				count={ buttonCount }
				setCount={ setButtonCount }
				max={ 2 }
				help={ __( 'Le premier bouton est pétrole foncé avec une flèche, le second à contour.', 'couturier' ) }
			/>
			<ImageInfoPanel media={ media } isMissing={ isMissing } />
			<div { ...useBlockProps( { className } ) }>
				{ isEditing && isEmpty && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-image-text__notice">
						{ __( 'Saisissez au moins un surtitre, un titre ou un texte : sans eux, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
					</Notice>
				) }
				{ hasMediaColumn && (
					<ImageField
						className="wp-block-couturier-image-text__media"
						imageClassName="wp-block-couturier-image-text__image"
						media={ media }
						isEditing={ isEditing }
						onSelect={ ( selected ) => setAttributes( { imageId: selected?.id } ) }
						onRemove={ () => setAttributes( { imageId: undefined } ) }
						label={ __( 'Image (facultative)', 'couturier' ) }
					/>
				) }
				<div { ...innerBlocksProps }>
					<RichText
						tagName="p"
						className="wp-block-couturier-image-text__surtitre"
						aria-label={ __( 'Surtitre', 'couturier' ) }
						placeholder={ __( 'Surtitre (facultatif)', 'couturier' ) }
						value={ surtitre }
						onChange={ ( value ) => setAttributes( { surtitre: nonBreaking( value ) } ) }
						allowedFormats={ [] }
						disableLineBreaks
					/>
					{ children }
					{ /* Sans bouton, rien d'autre ne signale qu'on peut en remettre. */ }
					{ isEditing && 0 === buttonCount && (
						<Button
							__next40pxDefaultSize
							variant="secondary"
							icon={ plus }
							className="wp-block-couturier-image-text__add-buttons"
							onClick={ () => setButtonCount( 2 ) }
						>
							{ __( 'Ajouter des boutons', 'couturier' ) }
						</Button>
					) }
				</div>
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	example: { ...metadata.example, attributes: { ...metadata.example.attributes, imageId: EXAMPLE_IMAGE_ID } },
	edit: Edit,
	save: ( { attributes } ) => (
		<>
			{ ! RichText.isEmpty( attributes.surtitre ) && (
				<RichText.Content tagName="p" className="wp-block-couturier-image-text__surtitre" value={ attributes.surtitre } />
			) }
			<InnerBlocks.Content />
		</>
	),
} );

// Titre, texte ou rangée d'icônes sélectionné : ni cadenas, ni variations de niveau.
hideLockedControls( metadata.name, LOCKED_BLOCKS );
