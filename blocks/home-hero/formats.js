/**
 * Formats proposés dans les blocs imbriqués du héros de l'accueil : aucun dans les
 * deux titres (H1, H2), seulement le gras dans le texte (le saut de ligne,
 * Maj + Entrée, n'est pas un format). Cf. `blocks/_shared/formats.js`.
 */
import { HEADING_FORMATS_OFF, TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import metadata from './block.json';

restrictFormats( metadata.name, {
	'core/heading': HEADING_FORMATS_OFF,
	'core/paragraph': [ ...TEXT_FORMATS_OFF, 'core/italic', 'core/link', 'core/strikethrough', 'core/superscript', 'core/subscript' ],
} );
