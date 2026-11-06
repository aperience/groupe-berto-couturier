/**
 * Champ image d'un bloc custom, dans le canvas de l'éditeur. **À utiliser pour
 * toute image d'un bloc** (cf. `blocks/CLAUDE.md`).
 *
 * - Image choisie : elle est affichée comme sur le front ; tant que le bloc est
 *   en cours d'édition (`isEditing`), deux boutons la recouvrent : « Remplacer »
 *   (médiathèque) et « Supprimer » (rouge).
 * - Pas d'image, bloc en cours d'édition : un emplacement (`MediaPlaceholder` :
 *   téléversement, médiathèque, glisser-déposer) à la place de l'image.
 * - Pas d'image, bloc non sélectionné : rien, comme sur le front.
 * - Petite image (`compact`, ex. photo ronde du contact du héros, 66 px) : sans
 *   image, un bouton rond (icône) ouvre la médiathèque à la place de l'emplacement,
 *   trop grand pour elle ; « Remplacer » / « Supprimer » inchangés.
 *
 * Pas d'autre contrôle de l'image (ni barre d'outils, ni boutons dans la barre
 * latérale) : la barre latérale ne porte que `ImageInfoPanel`, des informations
 * que le canvas ne montre pas.
 *
 * Styles propres à l'éditeur : `resources/scss/editor/_image-field.scss`. Les
 * dimensions de l'image et de l'emplacement sont celles du bloc (`className`,
 * `imageClassName`).
 *
 * Hors de `blocks/{nom}/` : ce dossier n'a pas de `block.json`, wp-scripts ne le
 * compile pas seul ; il est inclus dans le script de chaque bloc qui l'importe.
 */
import { InspectorControls, MediaPlaceholder, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, Notice, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { image, replace, trash } from './icons.js';

const IMAGE_TYPES = [ 'image' ];

/** URL de l'image dans l'éditeur : taille `large`, à défaut l'originale. */
export const imageUrl = ( media ) => media.media_details?.sizes?.large?.source_url ?? media.source_url;

/**
 * @param {Object}   props
 * @param {?Object}  props.media          Pièce jointe (`getMedia()`), `null` sans image.
 * @param {boolean}  props.isEditing      Bloc ou l'un de ses blocs imbriqués sélectionné.
 * @param {Function} props.onSelect       Reçoit la pièce jointe choisie.
 * @param {Function} props.onRemove       Retire l'image.
 * @param {string}   props.className      Classe de l'enveloppe (dimensions de l'emplacement).
 * @param {string}   props.imageClassName Classe de l'`<img>`, identique au front.
 * @param {string}   props.label          Titre de l'emplacement.
 * @param {boolean}  [props.compact]      Petite image : bouton de la médiathèque au lieu de l'emplacement.
 */
export default function ImageField( { media, isEditing, onSelect, onRemove, className, imageClassName, label, compact } ) {
	if ( ! media && compact ) {
		return isEditing ? (
			<div className={ `couturier-image-field ${ className ?? '' }` }>
				<MediaUploadCheck>
					<MediaUpload
						allowedTypes={ IMAGE_TYPES }
						onSelect={ onSelect }
						render={ ( { open } ) => (
							<Button
								className="couturier-image-field__compact"
								icon={ image }
								label={ label ?? __( 'Choisir une image', 'couturier' ) }
								showTooltip
								onClick={ open }
							/>
						) }
					/>
				</MediaUploadCheck>
			</div>
		) : null;
	}

	if ( ! media ) {
		return isEditing ? (
			<div className={ `couturier-image-field ${ className ?? '' }` }>
				<MediaPlaceholder
					className="couturier-image-field__placeholder"
					icon={ image }
					labels={ {
						title: label ?? __( 'Image', 'couturier' ),
						instructions: __( 'Téléversez une image, choisissez-la dans la médiathèque ou déposez-la ici.', 'couturier' ),
					} }
					allowedTypes={ IMAGE_TYPES }
					accept="image/*"
					onSelect={ onSelect }
				/>
			</div>
		) : null;
	}

	return (
		<div className={ `couturier-image-field ${ className ?? '' }` }>
			<img className={ imageClassName } src={ imageUrl( media ) } alt={ media.alt_text ?? '' } />
			{ isEditing && (
				<div className="couturier-image-field__actions">
					<MediaUploadCheck>
						<MediaUpload
							value={ media.id }
							allowedTypes={ IMAGE_TYPES }
							onSelect={ onSelect }
							render={ ( { open } ) => (
								<Button __next40pxDefaultSize variant="secondary" icon={ replace } onClick={ open }>
									{ __( 'Remplacer', 'couturier' ) }
								</Button>
							) }
						/>
					</MediaUploadCheck>
					<Button __next40pxDefaultSize variant="primary" isDestructive icon={ trash } onClick={ onRemove }>
						{ __( 'Supprimer', 'couturier' ) }
					</Button>
				</div>
			) }
		</div>
	);
}

/**
 * Panneau « Image » de la barre latérale : ce que le canvas ne montre pas. Le texte
 * alternatif repris de la médiathèque (ou l'avertissement qu'il manque, l'image
 * étant alors décorative), et l'image introuvable (supprimée de la médiathèque :
 * le bloc ne l'affiche plus). Absent sans image.
 *
 * @param {Object}  props
 * @param {?Object} props.media     Pièce jointe (`getMedia()`), `null` sans image.
 * @param {boolean} props.isMissing Image choisie mais introuvable.
 */
export function ImageInfoPanel( { media, isMissing } ) {
	if ( ! media && ! isMissing ) {
		return null;
	}

	const alt = media?.alt_text?.trim();

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Image', 'couturier' ) }>
				{ isMissing && (
					<Notice status="warning" isDismissible={ false }>
						{ __( 'L\'image choisie n\'existe plus dans la médiathèque.', 'couturier' ) }
					</Notice>
				) }
				{ media && ( alt ? (
					<p>{ `${ __( 'Texte alternatif :', 'couturier' ) } ${ alt }` }</p>
				) : (
					<Notice status="warning" isDismissible={ false }>
						{ __( 'Sans texte alternatif dans la médiathèque : l\'image sera considérée comme décorative.', 'couturier' ) }
					</Notice>
				) ) }
			</PanelBody>
		</InspectorControls>
	);
}
