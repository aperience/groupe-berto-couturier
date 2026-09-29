#!/usr/bin/env node
/**
 * Génère l'image Open Graph par défaut (1200×630), consommée par
 * `Seo\OpenGraph` du socle en repli quand un contenu n'a pas d'image à la une.
 *
 * Entrée, sous resources/images/ : `og-default.{png,jpg,jpeg,webp}` (premier
 * trouvé, dans cet ordre). Le squelette livre un `og-default.png` générique
 * (fond neutre, sans identité de marque) — même rôle que `login-logo.svg` et
 * `favicon-light.svg` : un placeholder à remplacer à l'étape charte, jamais
 * un fichier absent à gérer en code. Recadrée en 1200×630 (`fit: cover`,
 * centré) et aplatie sur `config.backgroundColor` si elle a de la
 * transparence — même traitement que l'apple-touch-icon dans
 * `generate-favicons.mjs`.
 *
 * Réutilise `config.backgroundColor` de `bin/favicons.config.mjs` plutôt
 * qu'un nouveau fichier de configuration — aucune autre valeur n'est
 * nécessaire ici.
 *
 * Sortie, sous dist/assets/ — nom stable, sans hash : ce fichier ne change
 * quasiment jamais après la mise en place initiale (contrairement aux
 * entrées Vite), le cache-busting du manifest n'apporte rien ici. Résolu
 * depuis PHP par `Seo\OpenGraph`, exactement comme les favicons.
 */

import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import config from './favicons.config.mjs';

const themeDir = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const srcDir = join( themeDir, 'resources/images' );
const outDir = join( themeDir, 'dist/assets' );
const outFile = join( outDir, 'image-og-default.png' );

const source = [ 'png', 'jpg', 'jpeg', 'webp' ]
	.map( ( ext ) => join( srcDir, `og-default.${ ext }` ) )
	.find( ( path ) => existsSync( path ) );

if ( ! source ) {
	console.error( `og-image:generate — source manquante : ${ join( srcDir, 'og-default.png' ) }` );
	console.error( 'Le fichier doit être fourni par le projet (charte graphique).' );
	process.exit( 1 );
}

mkdirSync( outDir, { recursive: true } );

sharp( source )
	.resize( 1200, 630, { fit: 'cover', position: 'centre' } )
	.flatten( { background: config.backgroundColor } )
	.png()
	.toFile( outFile )
	.then( () => {
		console.log( `og-image:generate — ${ outFile.replace( themeDir + '/', '' ) } généré depuis ${ source.replace( themeDir + '/', '' ) }.` );
	} );
