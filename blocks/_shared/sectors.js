/**
 * Secteurs des sessions de formation (taxonomie `couturier_sector`, menu
 * « Secteurs ») dans l'éditeur.
 *
 * La liste arrive par `window.couturierSectors`, posé au chargement de l'éditeur
 * par la feature `TrainingSessions\SectorEditorData` (la taxonomie n'est pas dans
 * l'API REST), par ordre alphabétique — l'ordre des boutons du filtre. Un
 * secteur créé pendant l'édition n'apparaît qu'au rechargement.
 */

/** Écran des secteurs (relatif à `wp-admin/`). */
export const SECTORS_URL = 'edit-tags.php?taxonomy=couturier_sector';

/** @return {{ id: number, name: string }[]} Secteurs, par nom. */
export const sectors = () => ( Array.isArray( window.couturierSectors ) ? window.couturierSectors : [] );

/** Secteur d'ID `id`, `undefined` s'il n'existe plus. */
export const findSector = ( id ) => sectors().find( ( sector ) => sector.id === id );
