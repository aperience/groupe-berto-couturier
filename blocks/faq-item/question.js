/**
 * Titre d'une question de FAQ (`core/heading` imbriqué dans `couturier/faq-item`) :
 * modèle partagé par la question (`index.js`) et par la liste, qui crée la
 * question avec son titre pour y placer le curseur dès l'ajout.
 */
import { __ } from '@wordpress/i18n';

import { LOCKED } from '../_shared/locked-content.js';

/** La question est toujours un `<h3>`, sous le `<h2>` de la FAQ. */
export const LEVEL = 3;

export const QUESTION = [ 'core/heading', { level: LEVEL, lock: LOCKED, placeholder: __( 'Question', 'couturier' ) } ];
