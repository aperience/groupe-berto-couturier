/**
 * Membre du bloc « Équipe » (`couturier/team-member`) : une carte = un bloc
 * enfant, pour profiter du déplacement natif (flèches, glisser-déposer, vue en
 * liste, animation). Attributs : `contactId`, `background` (fond de la carte),
 * `focalPoint` (point focal de la photo → `--focal`, `object-position`).
 *
 * Canvas : carte au balisage de `team-card.twig`, le bloc étant lui-même le `<li>`.
 * Sans contact affichable : champ de choix si le parent est en cours d'édition,
 * sinon `is-incomplete` (masqué comme sur le front, où rien n'est rendu).
 */
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { ColorPalette, ComboboxControl, ExternalLink, FocalPointPicker, Notice, PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { CONTACTS_URL, OPTIONS, contactOptions, findContact, isShown, labelOf, validBg } from '../team/members.js';
import metadata from './block.json';

const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };

/** `object-position` du point focal, en variable `--focal` (même calcul dans `render.php`). */
const objectPosition = ( { x, y } = DEFAULT_FOCAL_POINT ) =>
	`${ Math.round( x * 1000 ) / 10 }% ${ Math.round( y * 1000 ) / 10 }%`;

function ContactPicker( { contactId, onChange, exclude } ) {
	const current = findContact( contactId );
	const options = contactOptions( exclude );
	if ( current && contactId > 0 ) {
		options.unshift( { value: String( contactId ), label: labelOf( current ) } );
	}

	return (
		<ComboboxControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Contact', 'couturier' ) }
			value={ contactId > 0 ? String( contactId ) : null }
			options={ options }
			onChange={ ( value ) => value && onChange( Number( value ) ) }
			help={ __( 'Contacts publiés qui ont un nom affiché.', 'couturier' ) }
		/>
	);
}

function Edit( { attributes, setAttributes, clientId } ) {
	const { contactId, background, focalPoint } = attributes;
	const contact = findContact( contactId );
	const shown = isShown( contact );

	const { isEditing, siblings } = useSelect(
		( select ) => {
			const store = select( blockEditorStore );
			const parentId = store.getBlockRootClientId( clientId );
			return {
				isEditing: store.isBlockSelected( parentId ) || store.hasSelectedInnerBlock( parentId, true ),
				siblings: store.getBlocks( parentId )
					.filter( ( block ) => block.clientId !== clientId )
					.map( ( block ) => block.attributes.contactId ),
			};
		},
		[ clientId ]
	);

	const className = [
		'wp-block-couturier-team__card',
		`is-bg-${ validBg( background ) }`,
		shown && contact.photo && 'has-image',
		! shown && 'is-incomplete',
	].filter( Boolean ).join( ' ' );

	const blockProps = useBlockProps( { className } );
	const picker = (
		<ContactPicker contactId={ contactId } exclude={ siblings }
			onChange={ ( id ) => setAttributes( { contactId: id, focalPoint: undefined } ) } />
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Membre', 'couturier' ) }>
					{ contactId > 0 && ! shown && (
						<Notice status="warning" isDismissible={ false }>
							{ __( 'Ce contact a été supprimé, dépublié ou n\'a pas de nom affiché : sa carte n\'est pas affichée.', 'couturier' ) }
						</Notice>
					) }
					{ picker }
					<p>
						<ExternalLink href={ CONTACTS_URL }>{ __( 'Gérer les contacts', 'couturier' ) }</ExternalLink>
					</p>
				</PanelBody>
				{ shown && contact.photo && (
					<PanelBody title={ __( 'Photo', 'couturier' ) }>
						<FocalPointPicker
							__nextHasNoMarginBottom
							label={ __( 'Point focal', 'couturier' ) }
							help={ __( 'Partie de la photo toujours visible, quel que soit le recadrage.', 'couturier' ) }
							url={ contact.photo }
							value={ focalPoint ?? DEFAULT_FOCAL_POINT }
							onChange={ ( value ) => setAttributes( { focalPoint: value } ) }
						/>
					</PanelBody>
				) }
				<PanelBody title={ __( 'Fond de la carte', 'couturier' ) }>
						<ColorPalette
							colors={ OPTIONS.map( ( { name, color } ) => ( { name, color } ) ) }
							value={ OPTIONS.find( ( item ) => item.slug === validBg( background ) )?.color }
							onChange={ ( color ) => {
								const item = OPTIONS.find( ( option ) => option.color === color );
								if ( item ) {
									setAttributes( { background: item.slug } );
								}
							} }
							disableCustomColors
							clearable={ false }
						/>
					</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				{ shown ? (
					<>
						<div className="wp-block-couturier-team__media">
							{ contact.photo && (
								<img className="wp-block-couturier-team__image" src={ contact.photo } alt=""
									style={ focalPoint ? { '--focal': objectPosition( focalPoint ) } : undefined } />
							) }
						</div>
						<p className="wp-block-couturier-team__name">{ contact.displayName.trim() }</p>
						{ contact.role?.trim() && <p className="wp-block-couturier-team__role">{ contact.role.trim() }</p> }
					</>
				) : (
					isEditing && <div className="wp-block-couturier-team__picker">{ picker }</div>
				) }
			</li>
		</>
	);
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => null,
} );
