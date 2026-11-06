/**
 * Images de l'aperçu de l'inserteur (`example` du héros de l'accueil) : celles de
 * la maquette (Figma 536:7454), en WebP dans le dossier du bloc, pour que l'aperçu
 * ne dépende pas de la médiathèque.
 *
 * Une carte de l'aperçu porte des `imageId` / `contactImageId` négatifs (-1 à -4),
 * jamais enregistrés : `index.js` leur associe l'image correspondante ; `render.php`
 * n'en trouve pas de pièce jointe et ne rend pas d'image.
 */
import autoEcole from './example-auto-ecole.webp';
import contactAutoEcole from './example-contact-auto-ecole.webp';
import contactFormationPro from './example-contact-formation-pro.webp';
import formationPro from './example-formation-pro.webp';

const media = ( url, width, height ) => ( { source_url: url, alt_text: '', media_details: { width, height } } );

/** `imageId` -1 à -4 → pièce jointe factice (forme de `getMedia()`). */
const EXAMPLE_IMAGES = {
	'-1': media( autoEcole, 520, 412 ),
	'-2': media( formationPro, 520, 347 ),
	'-3': media( contactAutoEcole, 132, 132 ),
	'-4': media( contactFormationPro, 132, 132 ),
};

/** Pièce jointe d'aperçu d'un `imageId`, `undefined` hors aperçu. */
export const exampleMedia = ( imageId ) => ( imageId < 0 ? EXAMPLE_IMAGES[ imageId ] : undefined );
