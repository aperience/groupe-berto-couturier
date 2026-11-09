/**
 * Formats proposés dans les blocs imbriqués du héros de page : la « Mise en
 * avant » seule dans le H1 (orange 700), gras, italique et lien dans le texte.
 * Cf. `blocks/_shared/formats.js`.
 */
import { HEADING_FORMATS_OFF, TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import metadata from './block.json';

restrictFormats( metadata.name, {
	'core/heading': [ ...HEADING_FORMATS_OFF, 'core/strikethrough', 'core/superscript', 'core/subscript' ],
	'core/paragraph': TEXT_FORMATS_OFF,
} );
