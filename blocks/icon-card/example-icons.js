/**
 * Pictogrammes de l'aperçu de l'inserteur (`example` du bloc « Cartes à
 * pictogramme ») : ceux de la maquette, en SVG inline (data URI), pour que
 * l'aperçu ne dépende pas de la médiathèque.
 *
 * Une carte de l'aperçu porte un `iconId` négatif (-1, -2, -3), jamais
 * enregistré : `index.js` lui associe le pictogramme correspondant ;
 * `render.php` n'en trouve pas de pièce jointe et ne rend pas de pastille.
 */

const svg = ( paths ) =>
	`data:image/svg+xml,${ encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00232D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ paths }</svg>`
	) }`;

/** `iconId` -1, -2, -3 → pictogramme. */
export const EXAMPLE_ICONS = {
	// Cœur.
	'-1': svg( '<path d="M19 14C20.49 12.54 22 10.79 22 8.5C22 7.04131 21.4205 5.64236 20.3891 4.61091C19.3576 3.57946 17.9587 3 16.5 3C14.74 3 13.5 3.5 12 5C10.5 3.5 9.26 3 7.5 3C6.04131 3 4.64236 3.57946 3.61091 4.61091C2.57946 5.64236 2 7.04131 2 8.5C2 10.8 3.5 12.55 5 14L12 21L19 14Z"/>' ),
	// Toque.
	'-2': svg( '<path d="M21.42 10.92C21.5996 10.8412 21.752 10.7114 21.8584 10.5466C21.9647 10.3819 22.0203 10.1895 22.0182 9.99339C22.016 9.7973 21.9563 9.60617 21.8464 9.44377C21.7365 9.28137 21.5812 9.15486 21.4 9.08L12.83 5.18C12.5694 5.06115 12.2864 4.99964 12 4.99964C11.7136 4.99964 11.4306 5.06115 11.17 5.18L2.6 9.08C2.42255 9.15824 2.27168 9.2864 2.16576 9.44886C2.05985 9.61131 2.00345 9.80106 2.00345 9.995C2.00345 10.1889 2.05985 10.3787 2.16576 10.5411C2.27168 10.7036 2.42255 10.8318 2.6 10.91L11.17 14.82C11.4306 14.9389 11.7136 15.0004 12 15.0004C12.2864 15.0004 12.5694 14.9389 12.83 14.82L21.42 10.92Z"/><path d="M22 10V16"/><path d="M6 12.5V16C6 16.7956 6.63214 17.5587 7.75736 18.1213C8.88258 18.6839 10.4087 19 12 19C13.5913 19 15.1174 18.6839 16.2426 18.1213C17.3679 17.5587 18 16.7956 18 16V12.5"/>' ),
	// Bouclier.
	'-3': svg( '<path d="M20 13C20 18 16.5 20.5 12.34 21.95C12.1222 22.0238 11.8855 22.0203 11.67 21.94C7.5 20.5 4 18 4 13V6C4 5.73478 4.10536 5.48043 4.29289 5.29289C4.48043 5.10536 4.73478 5 5 5C7 5 9.5 3.8 11.24 2.28C11.4519 2.099 11.7214 1.99955 12 1.99955C12.2786 1.99955 12.5481 2.099 12.76 2.28C14.51 3.81 17 5 19 5C19.2652 5 19.5196 5.10536 19.7071 5.29289C19.8946 5.48043 20 5.73478 20 6V13Z"/><path d="M9 12L11 14L15 10"/>' ),
};

/** URL du pictogramme d'aperçu d'un `iconId`, `undefined` hors aperçu. */
export const exampleIconUrl = ( iconId ) => ( iconId < 0 ? EXAMPLE_ICONS[ iconId ] : undefined );
