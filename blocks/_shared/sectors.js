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

/**
 * Secteurs de l'aperçu de l'inserteur (`example` de `couturier/sessions`) : ID
 * négatifs, jamais en base, pour que les sessions d'exemple soient complètes
 * (sinon masquées comme au front) quels que soient les secteurs saisis.
 */
const EXAMPLE_SECTORS = [
	{ id: -1, name: 'Dreux' },
	{ id: -2, name: 'Sainte-Gemme-Moronval' },
];

/** Secteur d'ID `id` (ou d'exemple si négatif), `undefined` s'il n'existe plus. */
export const findSector = ( id ) =>
	( id < 0 ? EXAMPLE_SECTORS : sectors() ).find( ( sector ) => sector.id === id );

/** Secteurs d'ID `ids` : ceux de l'aperçu si tous sont négatifs, sinon la liste réelle. */
export const sectorsFor = ( ids ) =>
	ids.size && [ ...ids ].every( ( id ) => id < 0 ) ? EXAMPLE_SECTORS : sectors();
