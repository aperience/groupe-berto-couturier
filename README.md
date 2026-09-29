# Couturier — thème WordPress

Thème sur mesure basé sur **Timber 2** (Twig), **Vite** (SCSS / JS) et **@wordpress/scripts**
(blocs Gutenberg). PHP 8.5, namespace `Couturier`, text-domain `couturier`.

## Installation

```bash
composer install
npm install
npm run build
```

`composer install` est obligatoire : `functions.php` s'arrête avec un message explicite si
`vendor/autoload.php` est absent.

## Développement

```bash
npm run dev          # Vite (HMR) + watch des blocs Gutenberg
npm run build        # Build de production (assets + blocs + traductions)
npm run build:blocks # Rebuild des blocs Gutenberg uniquement
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
├── functions.php          # autoload Composer + Theme::get_instance()
├── style.css              # en-têtes du thème
├── page.php, single.php…  # wrappers : construisent le contexte et rendent le Twig
├── src/
│   ├── Theme.php          # singleton : init Timber + chargement des providers
│   ├── Contracts/         # FeatureInterface, ServiceProviderInterface
│   ├── Providers/         # Setup → Security → Front → Admin → Seo
│   ├── Features/          # une classe = une feature, rangée par catégorie
│   └── Support/           # utilitaires sans hook (ViteManifest)
├── resources/
│   ├── views/             # templates Twig (base, partials/, macros/)
│   ├── scss/              # sources styles (Bootstrap 5.3)
│   ├── js/                # app, editor, admin, login
│   └── fonts/
├── blocks/                # sources des blocs Gutenberg → dist/blocks/
├── languages/             # couturier.pot + .po versionnés, .mo / .l10n.php / .json générés
├── bin/                   # wrapper WP-CLI + génération de la map i18n JS
└── dist/                  # build (gitignoré)
```

## Points structurants

- **Une feature = une classe** implémentant `FeatureInterface`, déclarée dans le provider
  correspondant à son domaine. Aucune logique métier dans `functions.php` ni dans `Theme.php`.
- **Noms de fichiers hachés** dans `dist/assets/` : le cache-busting est automatique, résolu par
  `Support\ViteManifest` via `dist/assets/.vite/manifest.json`. Aucune feature ne doit rouvrir ce
  manifest directement.
- **Échappement Twig activé** : `{{ post.title }}` est échappé d'office, `|raw` est une décision
  explicite réservée au HTML volontaire.
- **Pas de `__()` dans les templates Twig** : `wp i18n make-pot` ne lit pas les `.twig`. Les chaînes
  sont traduites dans le wrapper PHP et passées au contexte sous `labels`.

## Documentation

Les conventions détaillées (providers, i18n, échappement, build, blocs) sont dans `CLAUDE.md`, à la
racine du thème.
