/**
 * Texte d'une colonne du bloc « Texte repliable » : partagé par la colonne
 * (`index.js`) et le bloc parent (avertissement), sans réenregistrer la colonne.
 */
import { textOf } from '../_shared/locked-content.js';

/** Paragraphe saisi, ou liste dont un élément (à toute profondeur) est saisi. */
export const hasContent = ( block ) => !! textOf( block ) || block.innerBlocks.some( hasContent );
