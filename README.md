# Couturier — thème WordPress

![Aperçu du thème Couturier : page d’accueil](screenshot.png)

Thème sur mesure basé sur **Timber 2** (Twig), **Vite** (SCSS / JS) et **@wordpress/scripts**
(blocs Gutenberg), bâti sur le socle `deefuse/wp-theme-core`. PHP 8.5, namespace `Theme\`,
text-domain `couturier`.

## Installation

```bash
composer install
npm install
npm run build
```

`composer install` est obligatoire : `functions.php` s'arrête avec un message explicite si
`vendor/autoload.php` est absent.

## Développement

Scripts npm disponibles :

```bash
npm run dev          # Vite (HMR) + watch des blocs Gutenberg
npm run build        # Build de production (assets + blocs + traductions)
npm run build:blocks # Rebuild des blocs Gutenberg uniquement
npm run watch:editor # Rebuild continu de dist/assets/ (admin-colors, editor-gutenberg)
npm run i18n:pot     # Régénère languages/couturier.pot
npm run i18n:compile # Recompile .mo / .l10n.php / JSON depuis les .po (inclus dans `build`)
```

Le site se consulte toujours sur son URL WordPress ; le dev server Vite ne sert que les assets.
La bascule dev / prod est automatique via le fichier témoin `dist/hot`, écrit au démarrage du dev
server et supprimé à l'arrêt.

> **Après toute modification SCSS / JS / bloc : `npm run build`.** Rien n'est servi depuis
> `resources/` en production.

## Structure

```
couturier/
├── functions.php          # autoload Composer + Kernel::boot() (ThemeContext + providers)
├── style.css              # en-têtes du thème
├── page.php, single.php…  # wrappers : construisent le contexte et rendent le Twig
├── src/
│   ├── Providers/         # Setup → Security → Front → Admin → Seo
│   └── Features/          # features propres au projet (Blocks/BlockLoader…)
├── vendor/deefuse/wp-theme-core/   # le socle : Kernel, contrats, features génériques, Support/
├── resources/
│   ├── views/             # templates Twig (base, partials/, macros/)
│   ├── scss/              # sources styles (Bootstrap 5.3)
│   ├── js/                # app (front), login
│   └── fonts/
├── blocks/                # sources des blocs Gutenberg → dist/blocks/
├── languages/             # couturier.pot + .po versionnés, .mo / .l10n.php / .json générés
├── bin/                   # wrapper WP-CLI + génération de la map i18n JS
└── dist/                  # build (gitignoré)
```

## Points structurants

- **Une feature = une classe** implémentant `FeatureInterface`, déclarée dans le provider
  correspondant à son domaine. Aucune logique métier dans `functions.php`.
- **Noms de fichiers hachés** dans `dist/assets/` : le cache-busting est automatique, résolu par
  `Support\ViteManifest` (socle) via `dist/assets/.vite/manifest.json`. Aucune feature ne doit rouvrir ce
  manifest directement.
- **Échappement Twig activé** : `{{ post.title }}` est échappé d'office, `|raw` est une décision
  explicite réservée au HTML volontaire.
- **Textes traduits directement dans les templates Twig** : `{{ __('Texte', 'couturier') }}`,
  extraits par `npm run i18n:pot` grâce à la dépendance de dev `timber/wp-i18n-twig`.

## Documentation

Les conventions détaillées (providers, i18n, échappement, build, blocs) sont dans `CLAUDE.md`, à la
racine du thème.
