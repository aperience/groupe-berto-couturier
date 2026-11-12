/**
 * Bloc « Parcours en étapes » (`couturier/journey`) : image facultative à gauche,
 * étapes numérotées en accordéon à droite (empilées en mobile, image au-dessus).
 *
 * - l'image est un attribut (`imageId`, composant `ImageField`) ;
 * - les étapes vivent dans `couturier/journey-list`, seul bloc imbriqué, verrouillé
 *   (`templateLock: 'all'`) ; la liste a son propre `templateLock: false`.
 *
 * `save()` n'enregistre que les blocs imbriqués : l'enveloppe et l'image sont
 * produites par `render.php`, qui n'affiche rien sans étape complète.
 */
import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks, store as blockEditorStore, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import ImageField, { ImageInfoPanel } from '../_shared/image-field.js';
import { LOCKED, hideLockedControls, textOf, useLockedContent } from '../_shared/locked-content.js';
import { hasContent } from '../collapsible-text-column/content.js';
import exampleImage from '../image-text/example.webp';
import { BODY, TEMPLATE as STEP_TEMPLATE } from '../journey-step/template.js';
import metadata from './block.json';

const LIST = 'couturier/journey-list';

const LOCKED_BLOCKS = [ LIST ];

/** `imageId` réservé à l'aperçu de l'inserteur (`example`). Jamais enregistré. */
const EXAMPLE_IMAGE_ID = -1;
const EXAMPLE_MEDIA = { source_url: exampleImage, alt_text: '', media_details: { width: 760, height: 515 } };

const TEMPLATE = [ [ LIST, { lock: LOCKED }, [ [ 'couturier/journey-step', {}, STEP_TEMPLATE ] ] ] ];

/** Étape complète : titre et texte saisis (sinon non rendue). */
const isComplete = ( step ) =>
	!! textOf( step.innerBlocks.find( ( block ) => block.name === 'core/heading' ) ) &&
	!! step.innerBlocks.find( ( block ) => block.name === BODY )?.innerBlocks.some( hasContent );

function Edit( { attributes, setAttributes, clientId, isSelected } ) {
	const { imageId } = attributes;
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
	const isEditing = useSelect(
		( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
		[ clientId, isSelected ]
	);

	const list = blocks.find( ( block ) => block.name === LIST );
	const isIncomplete = blocks.length > 0 && ! list?.innerBlocks.some( isComplete );
	// Colonne image : l'image, ou son emplacement pendant l'édition (pas pendant le
	// chargement d'une image déjà choisie).
	const isImageLoading = !! imageId && ! media && ! isMissing;
	const hasMediaColumn = !! media || ( isEditing && ! isImageLoading );

	// Liste toujours verrouillée.
	useLockedContent( blocks, { names: LOCKED_BLOCKS } );

	// Modèle passé à l'insertion seulement (bloc vide), cf. `blocks/CLAUDE.md`.
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{ className: 'wp-block-couturier-journey__steps' },
		{ template: blocks.length ? undefined : TEMPLATE, templateLock: 'all' }
	);

	return (
		<>
			<ImageInfoPanel media={ media } isMissing={ isMissing } />
			<div { ...useBlockProps( { className: hasMediaColumn ? 'has-image' : undefined } ) }>
				{ isEditing && isIncomplete && (
					<Notice status="warning" isDismissible={ false } className="wp-block-couturier-journey__notice">
						{ __( 'Au moins une étape avec titre et texte est obligatoire : sans elle, ce bloc n\'est pas affiché sur le site.', 'couturier' ) }
					</Notice>
				) }
				{ hasMediaColumn && (
					<ImageField
						className="wp-block-couturier-journey__media"
						imageClassName="wp-block-couturier-journey__image"
						media={ media }
						isEditing={ isEditing }
						onSelect={ ( selected ) => setAttributes( { imageId: selected?.id } ) }
						onRemove={ () => setAttributes( { imageId: undefined } ) }
						label={ __( 'Image (facultative)', 'couturier' ) }
					/>
				) }
				<div { ...innerBlocksProps }>{ children }</div>
			</div>
		</>
	);
}

registerBlockType( metadata.name, {
	example: { ...metadata.example, attributes: { imageId: EXAMPLE_IMAGE_ID } },
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );

// Liste sélectionnée : pas de cadenas.
hideLockedControls( metadata.name, LOCKED_BLOCKS );
