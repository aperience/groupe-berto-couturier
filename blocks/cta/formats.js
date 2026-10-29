/**
 * Formats du texte proposés dans le titre et le texte du bloc « Appel à l'action ».
 *
 * Seuls restent ceux du texte des boutons (Barrer, Exposant, Indice), plus Gras,
 * Italique et Lien dans le texte, et la « Mise en avant » dans le titre (orange sur
 * le fond sombre du CTA, 5,8:1). Cf. `blocks/_shared/formats.js`.
 */
import { HEADING_FORMATS_OFF, TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import metadata from './block.json';

restrictFormats( metadata.name, {
	'core/heading': HEADING_FORMATS_OFF,
	'core/paragraph': TEXT_FORMATS_OFF,
} );
