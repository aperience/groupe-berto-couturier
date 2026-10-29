/**
 * Formats du texte proposés dans le titre et le texte du bloc « Questions
 * fréquentes » : les mêmes que dans le CTA, mise en avant du titre comprise (en
 * orange foncé sur fond clair, `text-accent`). Cf. `blocks/_shared/formats.js`.
 */
import { HEADING_FORMATS_OFF, TEXT_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import metadata from './block.json';

restrictFormats( metadata.name, {
	'core/heading': HEADING_FORMATS_OFF,
	'core/paragraph': TEXT_FORMATS_OFF,
} );
