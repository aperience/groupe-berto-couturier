/**
 * Formats du texte proposés dans le titre du bloc « Titre de section » : les mêmes
 * que dans le titre du CTA et de la FAQ, mise en avant comprise (orange foncé sur
 * fond clair, `text-accent`). Le sous-titre, champ RichText du bloc lui-même,
 * fixe les siens par `allowedFormats`. Cf. `blocks/_shared/formats.js`.
 */
import { HEADING_FORMATS_OFF, restrictFormats } from '../_shared/formats.js';
import metadata from './block.json';

restrictFormats( metadata.name, {
	'core/heading': HEADING_FORMATS_OFF,
} );
