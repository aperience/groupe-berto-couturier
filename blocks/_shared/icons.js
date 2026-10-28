/**
 * Icônes de l'interface des blocs custom (24 × 24, `currentColor`), dans le style
 * de celles de WordPress. `@wordpress/icons` n'est pas installé, et les Dashicons
 * ne sont pas chargés dans le canvas : les tracés sont donc ici, partagés par
 * tous les blocs.
 */
import { Path, SVG } from '@wordpress/primitives';

const icon = ( ...paths ) => (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		{ paths.map( ( d ) => <Path key={ d } d={ d } fillRule="evenodd" clipRule="evenodd" /> ) }
	</SVG>
);

/** « + » : ajouter. */
export const plus = icon( 'M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z' );

/** Image : cadre, montagne et soleil. */
export const image = icon(
	'M5 4.5h14a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5ZM3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z',
	'M4.5 16.6 9 13l3 2.2 4-4.2 3.5 3.4v2.1L16 13.1l-3.9 4.1L9 15l-4.5 3.6v-2Z',
	'M9 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z'
);

/** Remplacer : deux flèches en boucle. */
export const replace = icon(
	'M12 5.5a6.5 6.5 0 0 0-6.06 4.15l-1.4-.54A8 8 0 0 1 18.5 7.06V4.5H20V10h-5.5V8.5h3.06A6.49 6.49 0 0 0 12 5.5Z',
	'M12 18.5a6.5 6.5 0 0 0 6.06-4.15l1.4.54A8 8 0 0 1 5.5 16.94v2.56H4V14h5.5v1.5H6.44A6.49 6.49 0 0 0 12 18.5Z'
);

/** Supprimer : corbeille. */
export const trash = icon(
	'M12 5.5A2.25 2.25 0 0 0 9.88 7h4.24A2.25 2.25 0 0 0 12 5.5ZM12 4a3.75 3.75 0 0 0-3.68 3H5v1.5h1.27l.82 9a2.75 2.75 0 0 0 2.74 2.5h4.34a2.75 2.75 0 0 0 2.74-2.5l.82-9H19V7h-3.32A3.75 3.75 0 0 0 12 4Zm4.22 4.5H7.78l.8 8.86a1.25 1.25 0 0 0 1.25 1.14h4.34a1.25 1.25 0 0 0 1.25-1.14l.8-8.86Z'
);

/** Surligneur : mise en avant d'un mot. */
export const highlighter = icon(
	'M18.4 5.4 14.6 1.6l-1 1-7.3 7.3a1 1 0 0 0 0 1.4l.7.7L4 15v3.5h3.6l3-3 .6.7a1 1 0 0 0 1.4 0L20 9l-1.6-1.6ZM7 17H5.5v-1.4l2.6-2.6 1.4 1.4L7 17Zm5-2.2L9.2 12l5.4-5.4 2.8 2.8-5.4 5.4ZM3 20.5h18V22H3z'
);
