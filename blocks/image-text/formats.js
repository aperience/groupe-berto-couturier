/**
 * Formats proposés dans le titre du bloc « Image et texte » : la seule « Mise en
 * avant » (orange foncé sur fond clair, 4,99:1). Les paragraphes du texte sont
 * restreints par leur propre bloc (`image-text-body`). Cf. `blocks/_shared/formats.js`.
 */
import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import metadata from './block.json';

restrictFormats( metadata.name, { 'core/heading': HEADING_FORMATS_OFF } );
