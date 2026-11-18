#!/usr/bin/env node
/**
 * Régénère les captures du catalogue des blocs (onglet « Catalogue des blocs » de la
 * page d'aide, feature `Blocks\BlockCatalog`) depuis le site local.
 *
 * Pour chaque bloc, ouvre sa page de démonstration dans Chrome (Playwright, canal
 * `chrome` : le Chrome installé sur le poste) en 1440 px de large, masque l'en-tête
 * collant et la barre d'admin, et capture le premier exemplaire du bloc — en bas,
 * jusqu'à l'élément qui descend le plus bas (encart contact du héros de page, qui
 * déborde). Sortie : `resources/images/help/blocks/{nom}.webp`, 1200 px de large au
 * plus (ImageMagick `magick`), puis `npm run build` pour les publier dans `dist/`.
 *
 * À lancer **depuis le poste**, pas dans le conteneur `node` (ni Chrome ni
 * ImageMagick) : `node bin/capture-blocks.mjs [nom…]` — sans argument, tous les blocs.
 *
 * `PAGES` doit rester aligné sur `BlockCatalog::GROUPS` (mêmes pages de démonstration).
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const SITE = process.env.SITE_URL ?? 'http://localhost:8081';
const themeDir = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const outDir = join( themeDir, 'resources/images/help/blocks' );

/** Page de démonstration => blocs capturés sur cette page. */
const PAGES = {
    '': [ 'home-hero', 'image-text', 'faq', 'icon-cards', 'photo-cards', 'reassurance', 'cta', 'reviews' ],
    'auto-ecole/': [ 'page-hero', 'section-title', 'image-cards', 'steps', 'compact-cta' ],
    'le-centre/': [ 'collapsible-text', 'team', 'pickup-map' ],
    'formation-pro/': [ 'logo-strip' ],
    'auto-ecole/permis-b/permis-accelere/': [ 'formulas', 'sessions', 'journey' ],
    'formation-pro/caces/caces-r489/': [ 'training-overview' ],
};

const only = process.argv.slice( 2 );
const tmp = mkdtempSync( join( tmpdir(), 'capture-blocks-' ) );
const browser = await chromium.launch( { channel: 'chrome' } );
const page = await browser.newPage( { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' } );

try {
    for ( const [ path, slugs ] of Object.entries( PAGES ) ) {
        const todo = slugs.filter( ( slug ) => ! only.length || only.includes( slug ) );
        if ( ! todo.length ) {
            continue;
        }

        await page.goto( `${ SITE }/${ path }`, { waitUntil: 'networkidle' } );
        // Fait défiler la page pour charger les images différées.
        await page.evaluate( async () => {
            for ( let y = 0; y < document.body.scrollHeight; y += 600 ) {
                scrollTo( 0, y );
                await new Promise( ( r ) => setTimeout( r, 80 ) );
            }
            scrollTo( 0, 0 );
        } );
        await page.waitForLoadState( 'networkidle' );
        await page.addStyleTag( { content: '.site-header, #wpadminbar, .mega-backdrop { display: none !important } html { margin-top: 0 !important }' } );

        for ( const slug of todo ) {
            const clip = await page.evaluate( ( selector ) => {
                const el = document.querySelector( selector );
                if ( ! el ) {
                    return null;
                }
                const box = el.getBoundingClientRect();
                let bottom = box.bottom;
                el.querySelectorAll( '*' ).forEach( ( child ) => {
                    const r = child.getBoundingClientRect();
                    if ( r.height ) {
                        bottom = Math.max( bottom, r.bottom );
                    }
                } );
                return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: bottom - box.y + 8 };
            }, `.wp-block-couturier-${ slug }` );

            if ( ! clip ) {
                console.warn( `⚠ ${ slug } : absent de /${ path }` );
                continue;
            }

            const png = join( tmp, `${ slug }.png` );
            await page.screenshot( { path: png, clip, fullPage: true, animations: 'disabled' } );
            execFileSync( 'magick', [ png, '-resize', '1200x>', '-quality', '85', join( outDir, `${ slug }.webp` ) ] );
            console.log( `✓ ${ slug }` );
        }
    }
} finally {
    await browser.close();
    rmSync( tmp, { recursive: true, force: true } );
}
