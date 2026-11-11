/**
 * Visuels de l'aperçu de l'inserteur (`example` du bloc « Cartes illustrées ») :
 * photos en WebP dans le dossier du bloc, pictogrammes repris des cartes à
 * pictogramme, pour que l'aperçu ne dépende pas de la médiathèque.
 *
 * Une carte de l'aperçu porte un `imageId` et un `iconId` négatifs (-1 à -3),
 * jamais enregistrés : `index.js` leur associe ces visuels ; `render.php` n'en
 * trouve pas de pièce jointe et ne rend ni image ni bulle.
 */
import { exampleIconUrl } from '../icon-card/example-icons.js';
import one from './example-1.webp';
import two from './example-2.webp';
import three from './example-3.webp';

const media = ( url ) => ( { source_url: url, alt_text: '', media_details: { width: 440, height: 300 } } );

/** `imageId` -1 à -3 → pièce jointe factice (forme de `getMedia()`). */
const EXAMPLE_IMAGES = {
	'-1': media( one ),
	'-2': media( two ),
	'-3': media( three ),
};

/** Pièce jointe d'aperçu d'un `imageId`, `undefined` hors aperçu. */
export const exampleMedia = ( imageId ) => ( imageId < 0 ? EXAMPLE_IMAGES[ imageId ] : undefined );

export { exampleIconUrl };
