/**
 * Images et contacts de l'aperçu de l'inserteur (`example` du héros de l'accueil) :
 * ceux de la maquette (Figma 536:7454), images en WebP dans le dossier du bloc, pour
 * que l'aperçu ne dépende ni de la médiathèque ni des contacts saisis.
 *
 * Une carte de l'aperçu porte des `imageId` (-1, -2) et `contactId` (-1, -2)
 * négatifs, jamais enregistrés : `index.js` leur associe l'image ou le contact
 * correspondant ; `render.php` n'en trouve ni pièce jointe ni contact et ne les rend
 * pas.
 */
import autoEcole from './example-auto-ecole.webp';
import contactAutoEcole from './example-contact-auto-ecole.webp';
import contactFormationPro from './example-contact-formation-pro.webp';
import formationPro from './example-formation-pro.webp';

const media = ( url, width, height ) => ( { source_url: url, alt_text: '', media_details: { width, height } } );

/** `imageId` -1, -2 → pièce jointe factice (forme de `getMedia()`). */
const EXAMPLE_IMAGES = {
	'-1': media( autoEcole, 520, 412 ),
	'-2': media( formationPro, 520, 347 ),
};

/** `contactId` -1, -2 → contact factice (forme de `window.couturierContacts`). */
const EXAMPLE_CONTACTS = {
	'-1': {
		text: 'Une question ?\nEloim vous aide à choisir la formule adaptée',
		phone: '02 37 42 42 69',
		tel: 'tel:+33237424269',
		email: 'contact@couturier-permis.com',
		image: contactAutoEcole,
	},
	'-2': {
		text: 'Une question ?\nMartin, Responsable de l’offre Entreprise',
		phone: '02 37 42 42 69',
		tel: 'tel:+33237424269',
		email: 'contact@couturier-formapro.fr',
		image: contactFormationPro,
	},
};

/** Pièce jointe d'aperçu d'un `imageId`, `undefined` hors aperçu. */
export const exampleMedia = ( imageId ) => ( imageId < 0 ? EXAMPLE_IMAGES[ imageId ] : undefined );

/** Contact d'aperçu d'un `contactId`, `undefined` hors aperçu. */
export const exampleContact = ( contactId ) => ( contactId < 0 ? EXAMPLE_CONTACTS[ contactId ] : undefined );
