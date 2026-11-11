/**
 * Formats proposés dans le titre et le texte du bloc « Appel à action compact » :
 * aucun dans le titre, Gras, Italique et Lien dans le texte. Cf. `blocks/_shared/formats.js`.
 */
import { HEADING_FORMATS_OFF, TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import metadata from './block.json';

restrictFormats( metadata.name, {
	'core/heading': HEADING_FORMATS_OFF,
	'core/paragraph': TEXT_FORMATS_OFF,
} );
