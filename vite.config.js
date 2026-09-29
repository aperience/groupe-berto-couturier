import { defineConfig } from 'vite';
import path from 'path';
import { writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Port du dev server. Propre au projet : deux thèmes en `npm run dev` simultanément
// se marcheraient dessus — Vite décalerait le port du second, mais DEV_SERVER_URL,
// server.origin et dist/hot continueraient d'annoncer celui-ci, et tous les assets
// partiraient en 404 sans message d'erreur.
const DEV_SERVER_PORT = 5173;
// HTTP, pas HTTPS : dans l'environnement Docker, le site WordPress est servi en HTTP
// (localhost:8081), et un certificat mkcert généré dans le conteneur node ne serait
// de toute façon pas reconnu par le navigateur de l'hôte. Une page HTTP charge des
// assets HTTP sans blocage « contenu mixte ».
// Le port publié sur l'hôte (VITE_PORT, .env de l'environnement) doit être identique.
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
const hotFile = path.resolve(__dirname, 'dist/hot');

/**
 * Recharge le navigateur quand un fichier PHP ou Twig est modifié.
 *
 * Ces fichiers ne font pas partie du module graph de Vite : configureServer les
 * ajoute explicitement à chokidar, handleHotUpdate envoie un full-reload.
 */
function phpTwigWatcher() {
  return {
    name: 'couturier-php-twig',

    configureServer(server) {
      server.watcher.add([
        path.resolve(__dirname, '*.php'),
        path.resolve(__dirname, 'src/**/*.php'),
        path.resolve(__dirname, 'blocks/**/*.php'),
        path.resolve(__dirname, 'resources/views/**/*.twig'),
      ]);
    },

    handleHotUpdate({ file, server }) {
      if (!/\.(php|twig)$/.test(file)) return;

      server.hot.send({ type: 'full-reload' });
      return [];
    },
  };
}

/** Crée dist/hot au démarrage du dev server — supprimé à l'arrêt ou au build. */
function wordpressHot() {
  let exitHandlersBound = false;

  return {
    name: 'couturier-wordpress-hot',

    configureServer() {
      mkdirSync(path.resolve(__dirname, 'dist'), { recursive: true });
      writeFileSync(hotFile, DEV_SERVER_URL);

      if (!exitHandlersBound) {
        const cleanup = () => { if (existsSync(hotFile)) unlinkSync(hotFile); };

        // Pattern du plugin officiel Laravel/Vite : process.on('exit') est
        // synchrone et toujours exécuté ; les handlers de signaux forcent un
        // process.exit() pour que 'exit' soit bien émis lors d'un Ctrl+C.
        process.on('exit', cleanup);
        process.on('SIGINT',  () => process.exit());
        process.on('SIGTERM', () => process.exit());
        process.on('SIGHUP',  () => process.exit());

        exitHandlersBound = true;
      }
    },

    buildStart() {
      if (!this.meta.watchMode && existsSync(hotFile)) unlinkSync(hotFile);
    },
  };
}

export default defineConfig(({ mode, command }) => ({
  plugins: [
    phpTwigWatcher(),
    wordpressHot(),
  ],

  // En dev les assets sont servis par Vite (URL absolue obligatoire) ; au build,
  // des chemins relatifs pour que WordPress résolve depuis le dossier du thème.
  base: command === 'build' ? './' : `${DEV_SERVER_URL}/`,

  build: {
    // Vite écrit dans dist/assets/, wp-scripts dans dist/blocks/ : chaque outil
    // possède son dossier, donc chacun peut le vider sans toucher à l'autre.
    outDir: 'dist/assets',
    emptyOutDir: true,
    // Génère dist/assets/.vite/manifest.json, lu par la feature Front\Assets.
    manifest: true,
    target: 'es2020',
    rollupOptions: {
      input: {
        app:    path.resolve(__dirname, 'resources/js/app.js'),
        login:  path.resolve(__dirname, 'resources/js/login.js'),
        // Entrées CSS pures, sans JS d'accompagnement : c'est WordPress qui lit
        // ces deux feuilles, jamais le navigateur via le dev server. Elles sont
        // donc toujours servies depuis dist/assets/, même en `npm run dev`.
        //
        // Jeu de couleurs de l'admin — URL déclarée dans wp_admin_css_color()
        // (feature Admin\AdminColorScheme).
        'admin-colors': path.resolve(__dirname, 'resources/scss/admin-colors.scss'),
        // Canvas de l'éditeur de blocs — chemin déclaré par add_editor_style()
        // (feature Admin\EditorStyles), dont le core inline le contenu.
        'editor-gutenberg': path.resolve(__dirname, 'resources/scss/editor-gutenberg.scss'),
      },
      output: {
        // Noms hachés : l'URL change dès que le contenu change, le cache-busting
        // est donc automatique (aucun paramètre ?ver= à maintenir).
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const fontExts = ['woff', 'woff2', 'ttf', 'eot'];
          const ext = assetInfo.name?.split('.').pop();

          return fontExts.includes(ext)
            ? 'fonts/[name]-[hash][extname]'
            : '[name]-[hash][extname]';
        },
      },
    },
    assetsInlineLimit: 0,
    sourcemap: mode !== 'production',
  },

  esbuild: mode === 'production' ? {
    // Supprime console.log/debug/warn en prod — console.info préservé
    pure: ['console.log', 'console.debug', 'console.warn'],
  } : {},

  resolve: {
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
      // Sources SCSS du core, utilisées par resources/scss/admin-colors.scss
      // pour dériver le jeu de couleurs de l'administration. Seule dépendance
      // du build au core : elle suppose le thème dans une installation WordPress.
      '~wp-admin': path.resolve(__dirname, '../../../wp-admin'),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        // Silence les warnings Bootstrap 5 avec Dart Sass 2.x (dépréciations normales)
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },

  server: {
    // '0.0.0.0' (et non 'localhost') : le dev server tourne dans le conteneur
    // Docker "node", et doit écouter sur toutes les interfaces pour être joignable
    // depuis l'hôte via le port publié. `hmr.host`/`origin` restent 'localhost' :
    // c'est l'adresse que le navigateur, lui, utilise.
    host: '0.0.0.0',
    port: DEV_SERVER_PORT,
    cors: true,
    // La page est servie par WordPress, les assets par Vite.
    // Sans `origin`, Vite réécrit les url() du CSS en chemin absolu sans origine
    // (/resources/images/logo.svg) : le navigateur les résout contre WordPress,
    // et l'asset part en 404. `base` ne couvre pas ce cas en dev.
    origin: DEV_SERVER_URL,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
}));
