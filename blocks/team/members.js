/**
 * Données partagées par `couturier/team` et `couturier/team-member` : contacts
 * (réels ou factices de l'aperçu), fonds proposés. Module à part : importer
 * l'`index.js` d'un bloc l'enregistrerait une seconde fois.
 */
import { __ } from '@wordpress/i18n';

import { BACKGROUNDS } from '../_shared/backgrounds.js';
import { contacts } from '../_shared/contacts.js';
import memberMetadata from '../team-member/block.json';

export const MEMBER = memberMetadata.name;

export const CONTACTS_URL = 'edit.php?post_type=couturier_contact';

const { enum: SLUGS, default: DEFAULT_BG } = memberMetadata.attributes.background;

export { DEFAULT_BG };

/** Fonds proposés, dans l'ordre de l'`enum`. Nouveau membre : fond par défaut. */
export const OPTIONS = SLUGS.map( ( slug ) => BACKGROUNDS.find( ( item ) => item.slug === slug ) ).filter( Boolean );

export const validBg = ( slug ) => ( SLUGS.includes( slug ) ? slug : DEFAULT_BG );


const EXAMPLES = {
	'-1': { displayName: 'Camille D.', role: __( 'Enseignant·e de la conduite', 'couturier' ) },
	'-2': { displayName: 'Hugo M.', role: __( 'Enseignant·e de la conduite', 'couturier' ) },
	'-3': { displayName: 'Léa P.', role: __( 'Formateur·rice Formation Pro', 'couturier' ) },
	'-4': { displayName: 'Inès B.', role: __( 'Secrétariat · accueil', 'couturier' ) },
};

/** Contact d'un membre (factice si ID négatif), `null` s'il n'est plus publié. */
export function findContact( id ) {
	if ( ! id ) {
		return null;
	}
	if ( id < 0 ) {
		return EXAMPLES[ id ] ? { id, photo: '', ...EXAMPLES[ id ] } : null;
	}
	return contacts().find( ( item ) => item.id === id ) ?? null;
}

/** Contact affichable : publié et nommé, comme `Contact::render_card()`. */
export const isShown = ( contact ) => !! contact?.displayName?.trim();

export const labelOf = ( contact ) => contact.displayName?.trim() || contact.name;

/** Options de recherche : contacts affichables, sauf ceux de `exclude`. */
export const contactOptions = ( exclude = [] ) =>
	contacts()
		.filter( ( item ) => isShown( item ) && ! exclude.includes( item.id ) )
		.map( ( item ) => ( {
			value: String( item.id ),
			label: item.role?.trim() ? `${ labelOf( item ) } — ${ item.role.trim() }` : labelOf( item ),
		} ) );
