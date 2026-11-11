/**
 * Logo affiché sur le site : légende saisie (l'image est facultative). Partagé
 * par l'encart et le bloc parent, sans réenregistrer le bloc logo.
 */
import { textOf } from '../_shared/locked-content.js';

export const isComplete = ( block ) => !! textOf( block.attributes.caption );
