/**
 * Nom d'un point de ramassage (`core/heading` imbriqué dans
 * `couturier/pickup-point`) : modèle partagé par le point (`index.js`) et par la
 * liste, qui crée le point avec son nom pour y placer le curseur dès l'ajout.
 */
import { __ } from '@wordpress/i18n';

import { LOCKED } from '../_shared/locked-content.js';

/** Le nom est toujours un `<h3>`, sous le `<h2>` du bloc. */
export const LEVEL = 3;

export const NAME = [ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Nom du point de ramassage', 'couturier' ) } ];
