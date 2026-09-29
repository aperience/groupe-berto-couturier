#!/usr/bin/env node
/**
 * Génère le jeu de favicons (mode clair + mode sombre) depuis un ou deux SVG
 * sources.
 *
 * Entrées, sous resources/images/ :
 *   - favicon-light.svg (obligatoire)
 *   - favicon-dark.svg  (optionnelle — son absence désactive silencieusement
 *     la variante sombre partout : copie SVG, <link media> et
 *     <meta theme-color> dark restent absents, plutôt que de retomber sur la
 *     version claire, qui donnerait un favicon illisible sur fond sombre)
 *
 * Sortie, sous dist/assets/favicons/ — noms stables, sans hash : ces fichiers
 * ne changent quasiment jamais après la mise en place initiale (contrairement
 * aux entrées Vite), le cache-busting du manifest n'apporte rien ici.
 *
 *   favicon.svg                       copie de favicon-light.svg
 *   favicon-dark.svg                  copie de favicon-dark.svg (si fournie)
 *   favicon.ico                       16/32/48, depuis la source claire uniquement
 *   favicon-96x96.png                 fallback PNG (navigateurs sans SVG favicon)
 *   apple-touch-icon.png              180×180, aplati sur backgroundColor
 *   web-app-manifest-192x192.png      PWA/Android, purpose "maskable"
 *   web-app-manifest-512x512.png      PWA/Android, purpose "maskable"
 *   site.webmanifest                  référence les deux PNG PWA
 *
 * Les icônes PWA sont déclarées "maskable" : la source SVG doit prévoir une
 * marge de sécurité d'environ 40 % (le motif tient dans un cercle centré aux
 * deux tiers de la taille totale), sans quoi Android peut rogner le motif au
 * recadrage. Le placeholder livré ici respecte cette contrainte.
 *
 * Le legacy Windows Tiles / Safari pinned tab est volontairement absent —
 * hors périmètre du set retenu.
 */

import { existsSync, copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import config from './favicons.config.mjs';

const themeDir = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const srcDir = join( themeDir, 'resources/images' );
const outDir = join( themeDir, 'dist/assets/favicons' );

const lightSvg = join( srcDir, 'favicon-light.svg' );
const darkSvg = join( srcDir, 'favicon-dark.svg' );

if ( ! existsSync( lightSvg ) ) {
	console.error( `favicons:generate — source manquante : ${ lightSvg }` );
	console.error( 'Le fichier doit être fourni par le projet (charte graphique).' );
	process.exit( 1 );
}

const hasDark = existsSync( darkSvg );

mkdirSync( outDir, { recursive: true } );

/**
 * Rasterise un SVG à une taille donnée. `density` est monté au-delà du DPI
 * intrinsèque d'un SVG (souvent 72-96) pour que le rendu reste net une fois
 * redimensionné à de grandes tailles (jusqu'à 512px pour un viewBox usuel de
 * 16 à 48 unités) ; à ajuster si une future source a un viewBox inhabituel.
 */
async function rasterize( svgPath, size ) {
	return sharp( svgPath, { density: 384 } )
		.resize( size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } } )
		.png()
		.toBuffer();
}

async function run() {
	// 1. favicon.svg — copie brute, aucune transformation
	copyFileSync( lightSvg, join( outDir, 'favicon.svg' ) );

	// 2. favicon-dark.svg — copie brute, seulement si fournie
	if ( hasDark ) {
		copyFileSync( darkSvg, join( outDir, 'favicon-dark.svg' ) );
	}

	// 3. favicon.ico — multi-résolution 16/32/48, source claire uniquement :
	// un .ico ne peut pas changer selon le thème du navigateur.
	const icoBuffers = await Promise.all( [ 16, 32, 48 ].map( ( size ) => rasterize( lightSvg, size ) ) );
	writeFileSync( join( outDir, 'favicon.ico' ), await pngToIco( icoBuffers ) );

	// 4. favicon-96x96.png — fallback PNG
	writeFileSync( join( outDir, 'favicon-96x96.png' ), await rasterize( lightSvg, 96 ) );

	// 5. apple-touch-icon.png — 180×180, aplati sur fond opaque : iOS remplit
	// lui-même toute zone transparente en noir, un aplat volontaire évite le
	// résultat non maîtrisé.
	const appleTouchIcon = await sharp( lightSvg, { density: 384 } )
		.resize( 180, 180, { fit: 'contain', background: config.backgroundColor } )
		.flatten( { background: config.backgroundColor } )
		.png()
		.toBuffer();
	writeFileSync( join( outDir, 'apple-touch-icon.png' ), appleTouchIcon );

	// 6. Icônes PWA/Android — transparence conservée, l'OS gère son propre masque
	await Promise.all( [
		rasterize( lightSvg, 192 ).then( ( buf ) => writeFileSync( join( outDir, 'web-app-manifest-192x192.png' ), buf ) ),
		rasterize( lightSvg, 512 ).then( ( buf ) => writeFileSync( join( outDir, 'web-app-manifest-512x512.png' ), buf ) ),
	] );

	// 7. site.webmanifest
	const manifest = {
		name: config.name,
		short_name: config.shortName,
		icons: [
			{ src: 'web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
			{ src: 'web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
		],
		// Un seul theme_color côté manifest (le spec Web App Manifest ne
		// supporte pas de media query) : la variante sombre du chrome
		// navigateur passe exclusivement par les deux <meta name="theme-color">
		// du <head>, générés par la feature PHP, pas par ce fichier.
		theme_color: config.themeColorLight,
		background_color: config.backgroundColor,
		display: 'standalone',
	};
	writeFileSync( join( outDir, 'site.webmanifest' ), `${ JSON.stringify( manifest, null, '\t' ) }\n` );

	console.log( `favicons:generate — ${ hasDark ? '2 sources' : '1 source (pas de variante sombre)' }, ${ hasDark ? 8 : 7 } fichiers écrits dans dist/assets/favicons/` );
}

run();
