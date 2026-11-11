/**
 * Formats du texte proposés dans le titre du bloc « Texte repliable » : les mêmes
 * que dans le titre de section, mise en avant comprise (orange foncé sur fond
 * clair, `text-accent`). Cf. `blocks/_shared/formats.js`.
 */
import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import metadata from './block.json';

restrictFormats( metadata.name, {
	'core/heading': HEADING_FORMATS_OFF,
} );
