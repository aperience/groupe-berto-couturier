/**
 * Contacts prédéfinis (CPT `couturier_contact`, menu « Contacts ») dans les blocs :
 * choix dans la barre latérale et aperçu de l'encart dans le canvas.
 *
 * La liste des contacts publiés arrive par `window.couturierContacts`, posé au
 * chargement de l'éditeur par la feature `Contacts\ContactEditorData` (le type de
 * contenu n'est pas dans l'API REST). Un contact créé pendant l'édition n'apparaît
 * qu'au rechargement.
 *
 * Le bloc n'enregistre que l'ID du contact (`contactId`) : texte, photo et
 * coordonnées sont lus au rendu (`Contact::render()`, gabarit
 * `resources/views/partials/hero-contact.twig`), dont `ContactPreview` reproduit
 * le balisage.
 */
import { InspectorControls } from '@wordpress/block-editor';
import { ExternalLink, Notice, PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { nonBreaking } from './locked-content.js';

/** Écran des contacts (relatif à `wp-admin/`). */
const CONTACTS_URL = 'edit.php?post_type=couturier_contact';

/** Contacts publiés, par nom. */
export const contacts = () => ( Array.isArray( window.couturierContacts ) ? window.couturierContacts : [] );

/**
 * Contact d'un bloc.
 *
 * @param {number}   contactId ID du contact ; négatif : contact de l'aperçu de l'inserteur.
 * @param {Function} [example] ID négatif → contact factice (même forme), aperçu seulement.
 * @return {{ contact: ?Object, isMissing: boolean }} `isMissing` : ID enregistré
 *         sans contact publié (supprimé, mis à la corbeille, dépublié).
 */
export function useContact( contactId, example ) {
	if ( ! contactId ) {
		return { contact: null, isMissing: false };
	}

	if ( contactId < 0 ) {
		return { contact: example?.( contactId ) ?? null, isMissing: false };
	}

	const contact = contacts().find( ( item ) => item.id === contactId ) ?? null;

	return { contact, isMissing: ! contact };
}

/**
 * Panneau « Contact » de la barre latérale.
 *
 * @param {Object}   props
 * @param {number}   props.contactId ID choisi.
 * @param {boolean}  props.isMissing Contact enregistré introuvable.
 * @param {Function} props.onChange  Reçoit l'ID choisi (`undefined` : aucun).
 * @param {string}   props.help      Aide sous la liste.
 */
export function ContactPanel( { contactId, isMissing, onChange, help } ) {
	const options = [
		{ value: '', label: __( 'Aucun contact', 'couturier' ) },
		...contacts().map( ( item ) => ( { value: String( item.id ), label: item.name } ) ),
	];

	if ( isMissing ) {
		options.push( { value: String( contactId ), label: __( 'Contact introuvable', 'couturier' ), disabled: true } );
	}

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Contact', 'couturier' ) }>
				{ isMissing && (
					<Notice status="warning" isDismissible={ false }>
						{ __( 'Le contact choisi a été supprimé ou dépublié : l\'encart n\'est pas affiché. Choisissez-en un autre.', 'couturier' ) }
					</Notice>
				) }
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Contact affiché', 'couturier' ) }
					value={ contactId > 0 ? String( contactId ) : '' }
					options={ options }
					onChange={ ( value ) => onChange( value ? Number( value ) : undefined ) }
					help={ help }
				/>
				<p>
					<ExternalLink href={ CONTACTS_URL }>{ __( 'Gérer les contacts', 'couturier' ) }</ExternalLink>
				</p>
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Contenu de l'encart, comme `hero-contact.twig` (l'appelant fournit l'enveloppe
 * `div.hero-contact`). Coordonnées en `<span>` : pas de navigation depuis le canvas.
 *
 * @param {Object} props
 * @param {Object} props.contact Contact (`useContact()`).
 */
export function ContactPreview( { contact } ) {
	// Espace avant « ? ! : ; » insécable, comme `Contact::render()`.
	const lines = String( contact.text ?? '' ).trim().split( /\r?\n/ ).map( nonBreaking );

	return (
		<>
			{ contact.image && (
				<div className="hero-contact__photo">
					<img className="hero-contact__image" src={ contact.image } alt="" />
				</div>
			) }
			<div className="hero-contact__body">
				<p className="hero-contact__title">
					{ lines.map( ( line, index ) => (
						<span key={ index }>
							{ index > 0 && <br /> }
							{ line }
						</span>
					) ) }
				</p>
				{ ( contact.tel || contact.email ) && (
					<p className="hero-contact__details">
						{ contact.tel && <span className="hero-contact__phone">{ contact.phone }</span> }
						{ contact.tel && contact.email && <span aria-hidden="true"> - </span> }
						{ contact.email && <span className="hero-contact__email">{ contact.email }</span> }
					</p>
				) }
			</div>
		</>
	);
}
