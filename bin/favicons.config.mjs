/**
 * Couleurs et identité de marque consommées par bin/generate-favicons.mjs.
 *
 * Doublent volontairement resources/scss/_brand.scss et FrontServiceProvider
 * (Favicons) : aucun des trois n'est une source de vérité que les deux autres
 * pourraient dériver automatiquement (Sass ne parle pas à Node, et PHP encore
 * moins) — la duplication est assumée, comme pour la palette admin
 * (cf. resources/scss/_brand.scss). Les trois se modifient ensemble à l'étape
 * charte, en même temps que resources/images/favicon-light.svg (et
 * favicon-dark.svg, optionnelle).
 */
export default {
	// Nom affiché lors de l'installation en PWA (site.webmanifest).
	name: 'Couturier',
	shortName: 'Couturier',

	// Couleur de la barre de navigateur / chrome PWA. Doit rester alignée sur
	// $brand_base-color de _brand.scss.
	themeColorLight: '#0a3c6e',
	themeColorDark: '#0a3c6e',

	// Fond de l'écran de démarrage PWA (site.webmanifest → background_color)
	// et couleur de remplissage de l'apple-touch-icon (iOS n'accepte pas la
	// transparence : les zones transparentes de la source sont aplaties sur
	// cette couleur). Blanc et non marine : le logo contient du marine, qui
	// disparaîtrait sur un fond de même couleur.
	backgroundColor: '#ffffff',
};
