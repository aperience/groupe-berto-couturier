/**
 * Texte du bloc « Image et texte » : partagé par le bloc texte (`index.js`) et le
 * bloc parent (avertissement), sans réenregistrer le bloc texte.
 */
import { textOf } from '../_shared/locked-content.js';

/** Paragraphe saisi, ou liste dont un élément (à toute profondeur) est saisi. */
export const hasContent = ( block ) => !! textOf( block ) || block.innerBlocks.some( hasContent );
