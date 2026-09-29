#!/usr/bin/env node
/**
 * Génère la table de correspondance « source JS → fichier compilé » que consomme
 * `wp i18n make-json` via son option --use-map.
 *
 * Pourquoi : make-pot extrait les chaînes des sources (blocks/, resources/js/) et
 * inscrit ces chemins en références dans le .pot, donc dans les .po. Or WordPress
 * enfile les fichiers *compilés* (dist/) et cherche les traductions JS dans un
 * fichier nommé {domaine}-{locale}-{md5 du chemin du script enfilé}.json.
 * Sans cette table, les JSON portent le md5 du chemin source : WordPress ne les
 * trouve jamais, et l'éditeur reste en anglais sans la moindre erreur.
 *
 * Sortie : dist/i18n-js-map.json — artefact de build, régénéré à chaque `npm run build`.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const themeDir = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const map = {};

/** Chemin relatif à la racine du thème, en séparateurs POSIX (format des références .po). */
const toRef = ( absolutePath ) => relative( themeDir, absolutePath ).split( sep ).join( '/' );

/** Liste récursivement les fichiers .js / .jsx d'un dossier. */
function listScripts( directory ) {
	return readdirSync( directory, { withFileTypes: true } ).flatMap( ( entry ) => {
		const path = join( directory, entry.name );

		if ( entry.isDirectory() ) {
			return listScripts( path );
		}

		return /\.jsx?$/.test( entry.name ) ? [ path ] : [];
	} );
}

// Blocs Gutenberg : wp-scripts regroupe tout le dossier du bloc dans dist/blocks/{nom}/index.js,
// à l'exception de view.js, qui reste un point d'entrée distinct (script de frontend).
const blocksDir = join( themeDir, 'blocks' );

if ( existsSync( blocksDir ) ) {
	for ( const block of readdirSync( blocksDir, { withFileTypes: true } ) ) {
		if ( ! block.isDirectory() ) {
			continue;
		}

		for ( const script of listScripts( join( blocksDir, block.name ) ) ) {
			const bundle = /(^|\/)view\.jsx?$/.test( toRef( script ) ) ? 'view.js' : 'index.js';

			map[ toRef( script ) ] = `dist/blocks/${ block.name }/${ bundle }`;
		}
	}
}

// Points d'entrée Vite : le nom de sortie est haché, seul le manifest le connaît.
// Les modules importés par une entrée sont fondus dans son bundle et n'y figurent pas :
// une chaîne traduisible placée dans un module importé (ex. resources/js/credits.js)
// ne serait donc pas cartographiée. Les garder dans le fichier d'entrée.
const manifestPath = join( themeDir, 'dist/assets/.vite/manifest.json' );

if ( existsSync( manifestPath ) ) {
	const manifest = JSON.parse( readFileSync( manifestPath, 'utf8' ) );

	for ( const [ source, chunk ] of Object.entries( manifest ) ) {
		if ( chunk.isEntry && /\.jsx?$/.test( source ) ) {
			map[ source ] = `dist/assets/${ chunk.file }`;
		}
	}
}

mkdirSync( join( themeDir, 'dist' ), { recursive: true } );
writeFileSync( join( themeDir, 'dist/i18n-js-map.json' ), `${ JSON.stringify( map, null, '\t' ) }\n` );

console.log( `i18n-js-map : ${ Object.keys( map ).length } script(s) cartographié(s).` );
