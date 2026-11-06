/**
 * Photos de l'aperçu de l'inserteur (`example` du bloc « Cartes photo ») : celles
 * de la maquette (Figma 536:7506 à 536:7528), en WebP dans le dossier du bloc,
 * pour que l'aperçu ne dépende pas de la médiathèque.
 *
 * Une carte de l'aperçu porte un `imageId` négatif (-1 à -4), jamais enregistré :
 * `index.js` lui associe la photo correspondante ; `render.php` n'en trouve pas
 * de pièce jointe et ne rend pas d'image.
 */
import accelere from './example-accelere.webp';
import code from './example-code.webp';
import moto from './example-moto.webp';
import permisB from './example-permis-b.webp';

const media = ( url ) => ( { source_url: url, alt_text: '', media_details: { width: 440, height: 300 } } );

/** `imageId` -1 à -4 → pièce jointe factice (forme de `getMedia()`). */
const EXAMPLE_IMAGES = {
	'-1': media( permisB ),
	'-2': media( accelere ),
	'-3': media( moto ),
	'-4': media( code ),
};

/** Pièce jointe d'aperçu d'un `imageId`, `undefined` hors aperçu. */
export const exampleMedia = ( imageId ) => ( imageId < 0 ? EXAMPLE_IMAGES[ imageId ] : undefined );
