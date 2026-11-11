/**
 * Formats du titre du bloc « Centre et points de ramassage » : ceux du CTA,
 * mise en avant comprise (orange foncé, `text-accent`). Cf.
 * `blocks/_shared/formats.js`.
 */
import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import metadata from './block.json';

restrictFormats( metadata.name, {
	'core/heading': HEADING_FORMATS_OFF,
} );
