# CLAUDE.md — Thème Couturier

Documentation d'architecture du thème WordPress `couturier` (code, build, conventions).

Le thème est né du squelette `wp-theme-skeleton` (v1.7.3), adapté : dev
server Vite en HTTP (pas de mkcert), `bin/wp` en `--allow-root`, et
`BlockLoader` écrit dans le thème (annoncé par le squelette, absent du squelette comme du socle).

Namespaces PHP : `Theme\` pour le code du projet (`src/`), `Deefuse\ThemeCore\` pour le socle,
installé en dépendance Composer. Text-domain du thème : `couturier`.

---

## Accessibilité — niveau AA obligatoire (front)

**Le front du thème doit impérativement respecter le niveau AA des WCAG 2.2** (référentiel
français : RGAA 4.1, fondé sur le niveau AA des WCAG). L'exigence vaut pour tout ce que voit un
visiteur du site : HTML des gabarits Twig et des blocs (`render.php`, `save()`), CSS et JavaScript
du front.

**L'administration WordPress n'y est pas soumise** (décision d'Aurélien, 2026-10-28) : écrans
d'admin du thème (Settings API, tableaux, scripts de `resources/js/editor/`), interface des blocs
custom dans l'éditeur, jeu de couleurs de l'admin, page de connexion. Elle ne sert qu'à l'équipe :
y écrire un code propre et utilisable, sans alerte « ⚠️ Accessibilité » ni blocage sur un écart AA.
Les règles ci-dessous ne visent donc que le front.

### Règles pour Claude

- **Écrire du HTML valide** (sans erreur au validateur W3C Nu, <https://validator.w3.org/nu/>) **et
  conforme AA** — pas de code « à rendre accessible plus tard ».
- **Alerter systématiquement** dès qu'un code — existant, demandé ou produit — ne respecte pas le
  niveau AA ou n'est pas valide : HTML, CSS **ou** JS. L'alerte est explicite, en tête de réponse
  (« ⚠️ Accessibilité »), et donne pour chaque point : l'élément en cause (`fichier:ligne`), le
  critère WCAG enfreint (numéro et niveau), l'impact pour l'utilisateur, la correction proposée.
- **Ne pas contourner l'alerte** : si une demande impose un code non conforme (maquette, contrainte
  client), le signaler avant d'écrire, proposer l'alternative conforme, et n'écrire la version non
  conforme qu'avec un accord explicite.
- **Ne pas corriger en silence** un code existant qui change le rendu : signaler, proposer, attendre.

### Points de contrôle (à vérifier sur tout code produit)

- **Structure** : un seul `<h1>` par page, hiérarchie de titres sans saut ; repères uniques
  `<header>`, `<nav>` (nommé par `aria-label` s'il y en a plusieurs), `<main>`, `<footer>` ; lien
  d'évitement vers `#main` en premier élément focusable (2.4.1) — en place : en tête de
  `base.twig`, style `partials/_skip-link.scss`. Les blocs n'offrent que H2 / H3
  (`RestrictHeadingLevels`), sauf les héros — de l'accueil (`couturier/home-hero`) et des pages
  (`couturier/page-hero`), un seul par page —, qui portent le `<h1>` de la page. Sans héros,
  `page.twig` et `single.twig` affichent le titre en `<h1>` (`has_block()`) ; `index.twig` n'a
  pas encore le sien.
- **Langue** : `lang` sur `<html>` (via `language_attributes`), `lang` sur tout passage dans une
  autre langue (3.1.1, 3.1.2).
- **Contrastes** : 4,5:1 pour le texte, 3:1 pour le texte de grande taille (≥ 24 px, ou ≥ 18,66 px
  gras), les composants d'interface et l'indicateur de focus (1.4.3, 1.4.11). À contrôler à l'étape
  charte, sur chaque couleur de `_brand.scss` et chaque combinaison texte / fond.
- **Focus** : toujours visible — jamais `outline: none` sans indicateur de remplacement au moins
  aussi visible (2.4.7) ; jamais masqué par un élément fixe, header collant compris (2.4.11).
- **Clavier** : tout ce qui se fait à la souris se fait au clavier, dans un ordre logique, sans
  piège (2.1.1, 2.1.2, 2.4.3). `<button>` pour une action, `<a href>` pour une navigation ; jamais de
  `<div>` ou `<span>` cliquable.
- **Cibles** : zone cliquable d'au moins 24 × 24 px, ou espacement suffisant (2.5.8).
- **Images** : `alt` pertinent pour une image porteuse d'information, `alt=""` pour une image
  décorative ; SVG décoratif en `aria-hidden="true" focusable="false"` (1.1.1).
- **Liens** : intitulé compréhensible hors contexte ou complété (pas de « Lire la suite » seul, sinon
  texte masqué `.visually-hidden`) ; ouverture dans une nouvelle fenêtre signalée (2.4.4).
- **Formulaires** : `<label>` associé à chaque champ, erreurs identifiées en texte et reliées au
  champ, `autocomplete` sur les données personnelles (1.3.1, 3.3.1, 3.3.2, 1.3.5).
- **Couleur** : jamais seule porteuse d'une information — liens dans un texte soulignés ou
  distingués autrement (1.4.1).
- **Adaptabilité** : lisible à 200 % de zoom et à 320 px de large sans défilement horizontal
  (1.4.4, 1.4.10) ; espacements de texte modifiables sans perte (1.4.12) ; pas de `user-scalable=no`
  ni de `maximum-scale`.
- **Mouvement** : animations et transitions désactivées sous `prefers-reduced-motion: reduce` ;
  rien qui clignote plus de 3 fois par seconde (2.3.1).
- **ARIA** : uniquement quand le HTML natif ne suffit pas, et alors complet (rôle, nom, état
  maintenu à jour par le JS : `aria-expanded`, `aria-controls`…) (4.1.2).
- **Contenu dynamique** : un message d'état (résultat, erreur, ajout) annoncé via une région
  `aria-live` / `role="status"` sans déplacer le focus (4.1.3).

### Vérifier

Validateur W3C Nu sur le HTML rendu, extension axe DevTools (ou WAVE) sur chaque gabarit, parcours
complet au clavier, contrôle au lecteur d'écran (VoiceOver sur macOS), zoom 200 % et fenêtre de
320 px. Les outils automatiques ne détectent qu'une partie des erreurs : le parcours clavier et le
lecteur d'écran restent indispensables.

---

## Commandes

Scripts disponibles :

```bash
npm run dev           # Dev server Vite (HMR) + watch des blocs
npm run build         # Build de prod (minifié, sans source maps, sans console.log)
npm run build:blocks  # Rebuild blocs Gutenberg uniquement
npm run dev:blocks    # Watch blocs uniquement
npm run watch:editor  # Rebuild de dist/assets/ à chaque sauvegarde (feuilles lues par WordPress)
npm run i18n:pot      # Régénère languages/couturier.pot (chaînes du projet)
npm run i18n:compile  # Recompile les .l10n.php depuis les .po (inclus dans `build`)
composer install      # Dépendances PHP (Timber, WP-CLI i18n en dev)
```

**Règle absolue :** après chaque modification SCSS / JS / bloc → `npm run build` (ou `npm run build:blocks`
si seuls les blocs ont changé). Rien n'est servi depuis `resources/` en production.

**`watch:editor` pour itérer sur `admin-colors.scss` et `editor-gutenberg.scss`.** Ces deux feuilles
sont lues sur disque par WordPress : le dev server ne les sert pas, et `npm run dev` ne change donc
rien à leur rendu. Ce script est un `vite build --watch --mode development` — il reconstruit
`dist/assets/` à chaque sauvegarde (~50 ms), sans minification et avec les source maps, pour
retrouver la ligne SCSS d'origine dans l'inspecteur. Il ne reste qu'à recharger la page.

> Il reconstruit **toutes** les entrées Vite, pas seulement celles de l'éditeur, et laisse `dist/`
> en build de développement : relancer `npm run build` avant de conclure. Ne pas le lancer en même
> temps que `npm run dev` — il réécrit `dist/assets/` en continu, or c'est de là que WordPress sert
> le jeu de couleurs de l'admin et les styles de l'éditeur.

---

## Architecture PHP (`src/`)

**Deux namespaces, deux périmètres** :

| Namespace | Emplacement | Rôle |
|-----------|-------------|------|
| `Deefuse\ThemeCore\` | `vendor/deefuse/wp-theme-core/` | Le socle réutilisable : noyau, contrats, 37 features génériques |
| `Theme\` | `src/` | Ce qui appartient au projet : les providers, puis les CPT et blocs métier |

PSR-4 du thème : `{"Theme\\": "src/"}` — le socle apporte le sien.

**Le socle est une dépendance Composer**, tirée de son dépôt GitHub public (pas sur Packagist), déclaré
en `repositories` de type `git` avec l'URL HTTPS : Composer clone le dépôt sans clé SSH ni token, et
sans passer par l'API GitHub. Sa documentation complète est dans son propre README.

Sur un projet livré : **toujours `composer update deefuse/wp-theme-core`**, jamais `composer update`
nu, qui mettrait aussi à jour Timber et le reste du graphe.
**Version PHP cible : 8.5** (`"php": ">=8.5"` dans `composer.json`, `Requires PHP: 8.5` dans `style.css`).

> Le namespace projet est **figé à `Theme\`**, identique dans tous les projets : il n'y a qu'un thème
> actif par installation WordPress, donc aucune collision possible. Ne pas le renommer d'après le client.

```
src/Providers/                             ← tout ce que le thème possède en propre
├── SetupServiceProvider.php
├── SecurityServiceProvider.php
├── FrontServiceProvider.php
├── AdminServiceProvider.php
├── MailServiceProvider.php
└── SeoServiceProvider.php

vendor/deefuse/wp-theme-core/src/          ← le socle (lecture seule, ne jamais éditer ici)
├── Kernel.php                             ← Singleton : Timber, chargement des providers, page des features
├── ThemeContext.php                       ← identité du thème, transmise aux providers
├── Contracts/
│   ├── FeatureInterface.php               ← register(): void, description(): string
│   └── ServiceProviderInterface.php       ← static features( ThemeContext ): array
├── Features/{Categorie}/                  ← une classe = une feature
├── Internal/
│   └── ListingFeaturesPage.php            ← page Outils › Fonctionnalités du thème
└── Support/
    ├── ViteManifest.php                   ← résolution des noms hachés du build
    └── ViteDevServer.php                  ← arbitrage dev/prod, ES modules
```

> **Les providers sont la surface de surcharge.** Le socle n'est qu'un catalogue de classes : c'est le
> thème qui choisit lesquelles il enregistre, dans quel ordre et avec quelles valeurs. Pour modifier un
> comportement : retirer la ligne du provider · changer un argument nommé · écrire sa propre classe
> implémentant `FeatureInterface`. **Ne jamais hériter d'une classe du socle** (elles sont `final`), ni
> éditer quoi que ce soit dans `vendor/`.

- `functions.php` → vérifie la présence de `vendor/autoload.php` (`wp_die` explicite si `composer install`
  n'a pas été lancé), le charge, puis **compose le thème** : un `ThemeContext` et la liste ordonnée des
  providers, passés à `Kernel::boot()`
- `Kernel::load_features()` parcourt les providers **dans l'ordre reçu** et appelle `register()` sur
  chaque feature. **L'ordre est décidé par `functions.php`, pas par le noyau** : retirer un provider
  de la liste éteint toutes ses features d'un coup.
- Le `Kernel` monte ensuite la page **Outils › Fonctionnalités du thème**, réservée aux
  administrateurs : les features enregistrées, un tableau par provider, avec leur `description()`.
  Ce n'est pas une feature, aucun provider ne peut la retirer.

### `ThemeContext` : ce qui change d'un projet à l'autre

`final readonly class` à cinq valeurs — `slug` (obligatoire), `text_domain`, `asset_prefix`,
`block_namespace` (les trois retombant sur le slug) et `view_paths` — plus une méthode
`handle( string $name )` qui construit les handles WordPress préfixés.

**Objet de configuration, jamais de service** : il ne contient que des valeurs. Une feature qui a besoin
d'un collaborateur (`ViteManifest`, `ViteDevServer`) le reçoit par son propre constructeur, avec une
valeur par défaut.

Les valeurs propres au projet (palette, crédits d'agence, liste blanche de blocs) sont passées aux
features en **arguments nommés** depuis les providers. Celles qui décrivent la marque n'ont
volontairement **pas de défaut** : les omettre lève une `ArgumentCountError` au démarrage plutôt que
de livrer un site aux couleurs d'un autre client.

### Principe : une feature = une classe, un provider = un domaine de responsabilité

Aucune instanciation de feature dans `Kernel.php` — `functions.php` ne fait que composer le thème :
tout comportement (hook, filtre, CPT, réglage admin…) est encapsulé dans une classe implémentant
`FeatureInterface`, déclarée dans le provider correspondant à son domaine.

Chaque provider implémente `ServiceProviderInterface` et expose une unique méthode statique
`features( ThemeContext $context ): FeatureInterface[]` qui retourne ses features **dans leur ordre
d'enregistrement**. Cette signature est le contrat que tout projet implémente : elle ne change pas.

**Ajouter une feature :**
1. Créer `src/Features/{Categorie}/{NomClasse}.php` (namespace `Theme\Features\{Categorie}`).
   Si la feature est **générique** et a vocation à servir sur d'autres projets, elle a sa place dans le
   socle : la développer dans `wp-theme-core`, publier une version MINOR, puis la déclarer ici
2. Implémenter `FeatureInterface` → méthode `register()` qui pose les `add_action` / `add_filter`,
   et méthode `description()` : une phrase destinée à un administrateur, en
   `__( '…', 'couturier' )`, affichée sur la page *Outils › Fonctionnalités du thème*. Elle est
   obligatoire : une feature qui ne l'implémente pas provoque une erreur fatale au démarrage
3. L'ajouter au tableau `features()` du provider adapté (cf. table ci-dessous), avec son `use`

### `Support/` : le code qui n'est pas une feature

Une classe de `Support/` ne pose aucun hook, n'implémente pas `FeatureInterface` et n'est déclarée
dans aucun provider : elle n'existe que pour être appelée par des features, et n'a donc pas de
« moment d'exécution » propre. Dans le socle, `Support/` est le seul dossier dans ce cas.
(`Internal/` n'est pas non plus fait de features, mais c'est le code du `Kernel` lui-même, hors
surface publique : à ne jamais appeler depuis le thème.)

Y placer ce que **plusieurs features** doivent faire de la même façon, plutôt que d'en dupliquer la
logique — `ViteManifest` y est né du fait que trois features rouvraient chacune le manifest Vite.
Si une seule feature est concernée, garder la méthode privée dans la feature.

Le thème a aussi son `src/Support/` (namespace `Theme\Support`), pour ce que partagent **ses**
features : `PageCache::purge()` (vider le cache de page W3 Total Cache / WP Super Cache), appelée par
l'offre du moment, le pied de page et les contacts. Un autre plugin de cache s'ajoute là, une seule fois.
`Breadcrumb` (fil d'Ariane, cf. *Fil d'Ariane*) et `CardBackground` (classe du fond d'une carte, cf. *Fonds de carte*) y sont aussi : appelés par des blocs, pas par une feature.

> **Règle :** si aucun provider existant ne correspond au domaine de la feature, **ne pas en créer un
> d'office** — proposer le nouveau provider à Aurélien et attendre son accord explicite avant de l'ajouter
> (fichier `src/Providers/`, `use` + ajout à la liste de `functions.php`, ligne dans ce tableau).

### Providers et catégories de features

| Provider | Rôle | Dossiers `Features/` associés |
|----------|------|-----------------------------------|
| `SetupServiceProvider` | Initialisation du thème, chargé en premier | `Setup/` — `ThemeSupport`, `Menus`, `TwigDump` |
| `SecurityServiceProvider` | Durcissement : surface d'attaque et informations publiées | `Security/` — `DisableApplicationPasswords`, `DisableUserEnumeration`, `DisableXmlRpc`, `HideLoginErrors`, `SecurityHeaders` |
| `FrontServiceProvider` | Front-end public | `Front/` — `Assets`, `CleanHead`, `Favicons`, désactivation des styles de blocs core / dashicons / emojis / heartbeat<br>`Footer/` (thème) — `FooterSettings` (écran « Pied de page »), `FooterContext` (`footer` dans le contexte Timber), cf. *Pied de page*<br>`Fonts/` (thème) — `FontPreload` (préchargement des polices du header : Space Grotesk 400, 500, 700 ; rien en mode dev)<br>`Navigation/` (thème) — `MegaMenuFields` (champs des éléments du menu principal), `HeaderSettings` (écran « En-tête »), `NavigationContext` (`navigation` dans le contexte Timber), cf. *Header et méga menu* |
| `AdminServiceProvider` | Back-office, éditeur, contenus | `Admin/` (socle) — blocs autorisés, supports natifs des blocs, admin bar, dashboard, connecteurs, verrouillage de l'éditeur de site / personnaliseur, sélecteur de langue et lien « Politique de confidentialité » du login (page de connexion réservée à l'équipe ; à revoir si l'inscription est ouverte), icône du site, mises à jour, commentaires, publication par e-mail, services de mise à jour, jeu de couleurs, pied de page, styles du canvas de l'éditeur, logo de login, interrupteur d'affichage du titre, support SVG, conversion WebP à l'upload<br>`Admin/` (thème) — `NestedPagesLinks` (lien « Pages publiées » du tableau de bord et bouton de retour de l'éditeur des pages vers Nested Pages, si l'extension est active), `HelpScreen` (menu « Aide », cf. *Page d'aide*), `NavMenuDropdowns` (écran des menus : listes « Parent » / « Ordre » du core remplies pour les seuls éléments dépliés, cf. *Header et méga menu*)<br>`Blocks/` (thème) — `BlockLoader` (auto-découverte de `dist/blocks/*/block.json`), `RestrictHeadingLevels` (titres limités à H2 / H3 partout, sauf le H1 des héros), `PageScopedBlocks` (héros de l'accueil dans la seule page d'accueil, héros de page partout ailleurs), `DisableDropCap` (pas de lettrine sur les paragraphes), `HeadingTextAlign` (titres libres alignés à gauche ou centrés, cf. *Titres libres*), `DisableCorePatterns` (ni compositions du cœur ni compositions distantes du Pattern Directory ; restent celles de `patterns/` et de l’éditeur), `ButtonStyles` (boutons du design system sur `core/button`, cf. *Blocs Gutenberg*), `AttachedBlocks` (réglage « Rapprocher du bloc précédent » des blocs du thème de premier niveau, cf. *Espacement entre blocs*), `BlockImageSizes` (retire le `auto` de l'attribut `sizes` des images `wp-block-couturier-{nom}__image` : sans lui, une image en `width: auto` s'afficherait en 300 px)<br>`Contacts/` (thème) — `ContactPostType`, `ContactMetaBox`, `ContactEditorData`, `ContactPageCache` : contacts prédéfinis des héros, cf. *Contacts prédéfinis*<br>`PostTypes/` (thème, à venir) — déclaration des CPT et de leurs metas |
| `MailServiceProvider` | Forme des e-mails envoyés par `wp_mail()` | `Mail/` (thème) — `HtmlEmails` (cf. *E-mails* plus bas) |
| `MarketingServiceProvider` | Mise en avant commerciale | `CurrentOffer/` (thème) — `CurrentOfferSettings` (écran « Offre du moment »), `CurrentOfferDashboard` (widget du tableau de bord), `CurrentOfferContext` (`current_offer` dans le contexte Timber), `CurrentOfferPageCache` (purge W3 Total Cache / WP Super Cache), cf. *Offre du moment* |
| `SeoServiceProvider` | Référencement | `Seo/` — `DocumentTitle`, `MetaDescription`, `SitemapExclusion`, `SeoPanel` (panneau de l'éditeur), `OpenGraph` |

> **Une feature répartie sur plusieurs classes garde un seul dossier** (`src/Features/{Feature}/`) et
> un seul provider : ex. `CurrentOffer/`, entièrement déclaré dans `MarketingServiceProvider`. Sa logique
> partagée y reste aussi, dans une classe sans hook, plutôt que dans `Support/`.

Le dossier de la feature suit sa **nature** (`Security/`, `Blocks/`, `PostTypes/`…), le provider suit son
**domaine de responsabilité**. C'est pourquoi plusieurs dossiers peuvent alimenter un même provider.

Ces domaines sont de deux familles. `Setup`, `Front` et `Admin` désignent un **moment d'exécution** :
initialisation, rendu public, back-office. `Security`, `Mail`, `Seo` et `Marketing` désignent une **préoccupation
transverse**, qui traverse ces moments — le durcissement touche le front, l'API REST, la page de
connexion et `xmlrpc.php` ; le SEO touche le rendu public et l'éditeur ; un e-mail part aussi bien
du front que de l'admin, de `wp-login.php`, de WP-Cron ou de WP-CLI. Ranger une feature de
sécurité dans `Front` au prétexte qu'elle agit sur le front reviendrait à mentir sur son périmètre.

**Le critère est la raison d'être de la feature, pas le hook qu'elle utilise.** `DisableComment`
retire une surface exploitable, mais existe pour désactiver une fonctionnalité éditoriale : elle
reste dans `Admin`. `DisableUserEnumeration` n'a d'autre objet que de réduire ce que l'installation
publie d'elle-même : elle est dans `Security`.

### Conventions de code PHP

- `declare(strict_types=1);` en tête des nouveaux fichiers
- Types de retour et de paramètres systématiques
- Providers déclarés `final` et implémentant `ServiceProviderInterface`
- Docblock court en français en tête de classe et de méthode publique
- Échappement systématique en sortie : `esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`
- Sanitisation systématique en entrée, vérification des nonces et des capabilities dans l'admin

---

## Internationalisation

**Tous les textes en dur** dans le PHP, les templates Twig et les blocs passent par les fonctions
i18n (cf. « Traduire dans les templates Twig » plus bas).

### Deux text-domains, un par périmètre

| Domaine | Chaînes de | Catalogue | Généré par |
|---------|-----------|-----------|------------|
| `couturier` | `src/`, wrappers PHP racine, `blocks/`, `style.css` | `languages/` | `npm run i18n:pot` |
| `wp-theme-core` | le socle | `vendor/deefuse/wp-theme-core/languages/` | le dépôt du socle |

**Pourquoi deux.** Les features du socle partiront dans `vendor/`, que `make-pot` exclut par défaut :
leurs chaînes disparaîtraient du `.pot` du projet, et seraient à retraduire sur chaque nouveau site.
Le socle porte donc son propre domaine et son propre catalogue, traduits une fois pour tous les projets.

Le domaine du socle est enregistré par `Kernel::init_core_translations()` — WordPress ne le fait que
pour le thème. **Le domaine `wp-theme-core` n'a rien à faire dans le code du projet, ni l'inverse.**
Les traductions du socle sont livrées avec le package : elles ne se régénèrent pas depuis le thème.

> ⚠️ Le nom attendu du `.mo` du socle dépend de l'emplacement de son répertoire : `fr_FR.mo` s'il est
> sous le thème, `wp-theme-core-fr_FR.mo` sinon — et ce test bascule selon que le package est installé
> normalement ou monté en `repository: path` avec `symlink`. Livrer **les quatre fichiers**
> (`fr_FR.mo`, `fr_FR.l10n.php`, `wp-theme-core-fr_FR.mo`, `wp-theme-core-fr_FR.l10n.php`) est la seule
> façon d'être correct dans les deux cas. Voir le docblock de `Kernel::init_core_translations()`.

> Les chaînes sources du socle sont **rédigées en français** : sans catalogue, `__()` renvoie la source,
> et le site s'affiche donc correctement en français. Le `.pot` du socle ne sert qu'aux autres langues.

- Text-domain : un **littéral**, seule forme que `wp i18n make-pot` sait extraire.
  Celui du thème doit rester aligné sur l'en-tête `Text Domain:` de `style.css`.
  Ne jamais passer le text-domain par une variable, une constante ni un appel de méthode :
  l'extraction l'ignorerait **sans erreur**, et les chaînes disparaîtraient du `.pot`
- Chargement : **aucune feature à écrire**. WordPress enregistre lui-même le répertoire des traductions
  du thème à partir des en-têtes `Text Domain:` et `Domain Path:` de `style.css` — `WP_Theme::load_textdomain()`
  est appelé dans `wp-settings.php`, **avant** l'inclusion de `functions.php`. Une feature qui appellerait
  `load_theme_textdomain()` ferait doublon. Le chemin étant interne au thème, les fichiers sont nommés
  d'après la seule locale : `languages/fr_FR.mo` (et **non** `couturier-fr_FR.mo`)
- PHP : `__( 'Texte', 'couturier' )`
- JS (éditeur Gutenberg) : `import { __ } from '@wordpress/i18n'` + `"textdomain": "couturier"` dans `block.json`.
  **Les chaînes JS ne sont pas traduites** (choix du projet) : aucun catalogue JSON n'est produit ni
  chargé, `__()` renvoie la source — l'interface des blocs dans l'éditeur reste donc en français.
  Garder néanmoins `__()`, pour pouvoir brancher `make-json` plus tard sans retoucher les blocs

### Traduire dans les templates Twig

Les textes d'un template s'écrivent **directement dans le `.twig`**, avec le text-domain en littéral :

```twig
<a class="skip-link visually-hidden-focusable" href="#main">{{ __('Aller au contenu', 'couturier') }}</a>
<h1>{{ __('Erreur 404 — Page introuvable', 'couturier') }}</h1>
```

Timber expose les fonctions i18n de WordPress dans Twig (`__`, `_x`, `_n`, `_nx`, `esc_html__`…) ;
`wp i18n make-pot` ne lit pas les `.twig` seul, mais la dépendance de dev **`timber/wp-i18n-twig`**
lui apprend à le faire : la chaîne arrive dans le `.pot` avec sa référence
(`#: resources/views/base.twig:13`). Vérifier après ajout d'une chaîne que `npm run i18n:pot` la
reprend bien.

- **Pas de `labels` préparés en PHP** pour un simple texte d'interface : l'écrire dans le template.
  Le contexte ne transporte que des données (post, menus, réglages). Les wrappers PHP
  (`404.php`, `index.php`…) se limitent à construire ce contexte et à rendre le template.
- Une apostrophe dans le texte : guillemets doubles côté Twig
  (`{{ __("Retour à la page d'accueil", 'couturier') }}`), extraits eux aussi.

### Chaîne de traduction

Quatre formats, dont deux seulement sont écrits à la main et versionnés :

| Fichier | Rôle | Produit par | Versionné |
|---------|------|-------------|-----------|
| `languages/couturier.pot` | Gabarit : les chaînes source du projet | `npm run i18n:pot` | oui |
| `languages/{locale}.po` | Une langue : chaîne + traduction, format texte | le traducteur (Poedit) | oui |
| `languages/{locale}.mo` | Le `.po` compilé — byproduct local, sans usage en production | Poedit, à l'enregistrement | non |
| `languages/{locale}.l10n.php` | Même contenu en tableau PHP, **format que charge WordPress en priorité** (`translation_file_format`, défaut `'php'` depuis WP 6.5) | `npm run build` | non |

**`.mo` n'est jamais lu en production.** `load_theme_textdomain()` ne fait, depuis WP 6.7, qu'enregistrer
un chemin ; le chargement effectif a lieu dans `load_textdomain()`, qui essaie d'abord `.l10n.php`
et ne retombe sur `.mo` que si ce premier fichier est absent. `.l10n.php` étant toujours régénéré par
`npm run build`, `.mo` ne sert donc qu'à l'aperçu de Poedit en local — `i18n:compile` ne le produit
plus (`make-mo` retiré du script, redondant avec la compilation automatique de Poedit).

Un `.po` traduit à 100 % mais non recompilé en `.l10n.php` donne un site dont les chaînes du thème
restent en français, sans erreur : cette compilation n'est pas optionnelle. Elle est donc branchée sur
`npm run build`, pour ne jamais dépendre d'un geste manuel avant un déploiement.

#### `npm run i18n:pot` — à la main, quand les chaînes du code changent

`--exclude=dist` évite de compter deux fois les chaînes des blocs (sources dans `blocks/`, copies
compilées dans `dist/blocks/`) ; `node_modules` et `vendor` sont exclus d'office par WP-CLI.
En-têtes fixés dans la commande : copyright **Deefuse** (avec l'année courante),
`Report-Msgid-Bugs-To: aurelien.chappard@deefuse.fr`. `Project-Id-Version` reste déduit de `style.css`
(`Theme Name` + `Version`), et `POT-Creation-Date` est conservé — le `.pot` change donc à chaque
régénération, c'est voulu.

> **Ne jamais ajouter `--no-location`.** Les références `#: resources/views/base.twig:13` situent
> chaque chaîne pour le traducteur, et seraient indispensables si la traduction des chaînes JS
> (`make-json`) était un jour branchée.

#### `npm run i18n:compile` — automatique, à chaque build

Lance `make-php`, qui compile chaque `.po` en `.l10n.php`. Pas de `make-mo` : voir plus haut
pourquoi `.mo` n'est plus produit par le build. Pas de `make-json` non plus : les chaînes JS ne sont
pas traduites (cf. plus haut).

#### `bin/wp` — WP-CLI épinglé

WP-CLI est une dépendance de dev Composer (`wp-cli/i18n-command`) : version verrouillée dans
`composer.lock`, aucune dépendance au `wp` global du poste. Le wrapper `bin/wp` lui fournit un PHP ≥ 8.5
(via `WP_CLI_PHP`), sans quoi le platform check généré par Composer fait échouer la commande — le `php`
du PATH est souvent plus ancien. Il cherche dans l'ordre `$PHP_BIN`, le `php` du PATH, puis MAMP.
Il passe `--allow-root`.

### Traduire une nouvelle langue (Poedit)

Les traducteurs travaillent sous **Poedit**, qui compile le `.mo` à l'enregistrement (option activée
par défaut). Ce `.mo`, gitignoré, ne sert qu'à l'aperçu local : WordPress charge en priorité le
`.l10n.php`, régénéré par `npm run build` — c'est donc un build qui rend une traduction visible sur le
site, en local comme au déploiement. La case cochée ou non ne change rien.

Trois règles à leur transmettre :

1. **Nommer le fichier `fr_FR.po`, jamais `couturier-fr_FR.po`.** Poedit propose souvent la forme
   préfixée, qui est celle des plugins. Le thème charge son domaine depuis son propre dossier :
   WordPress ne cherche que la locale nue. Un fichier mal nommé ne produit aucune erreur.
2. **Créer et mettre à jour depuis `languages/couturier.pot`** (*Nouveau depuis un fichier POT*, puis
   *Traduction → Mettre à jour depuis un fichier POT*). Ne jamais utiliser le scan de sources de
   Poedit : son extracteur ignore les `block.json` et les en-têtes de `style.css`, et désynchroniserait
   le catalogue de ce que produit WP-CLI.
3. **Conserver les références de source** reprises du `.pot` (cf. `--no-location` ci-dessus).

Poedit ignore en revanche le format `.l10n.php` : il ne peut venir que du build.

---

## Templates Twig (`resources/views/`)

Rendu via **Timber 2.x**. Configuration dans `Kernel::init_timber()`, alimentée par `ThemeContext::$view_paths` :
`Timber::$dirname = ['resources/views']`, et l'échappement automatique est **activé**
(`autoescape => 'html'` via le filtre `timber/twig/environment/options`, cf. `Kernel::set_twig_options()`).

- `base.twig` — layout master, blocks Twig : `header`, `content`, `footer`
- `page.twig`, `single.twig`, `index.twig`, `404.twig` — étendent `base.twig`
- `partials/` — header, footer, navigation, favicon
- `emails/` — gabarit des e-mails (`layout.twig`), macros (`macros.twig`) et fragments du projet
- `admin/help/` — un gabarit par onglet de la page d'aide de l'admin (cf. *Page d'aide*)

**Wrappers PHP** à la racine du thème (`page.php`, `single.php`, `index.php`, `404.php`…) : ils se contentent
de construire le contexte et de rendre le Twig correspondant.

```php
$context         = Timber\Timber::context();
$context['post'] = Timber\Timber::get_post();

Timber\Timber::render( 'page.twig', $context );
```

Toute donnée globale supplémentaire est ajoutée au contexte par une **feature**, sur le filtre
`timber/context` (c'est ce que font `Setup\Menus` et `Front\Favicons`) — jamais dans `Kernel`, ni dans
`functions.php`.

### Échappement : sûr par défaut, exception explicite

Timber désactive l'échappement Twig par défaut ; le thème rétablit le comportement natif de Twig.
Conséquence pour tous les templates :

- **Par défaut, ne rien écrire** : `{{ post.title }}`, `{{ site.name }}`, une valeur de champ ou un
  paramètre d'URL sont échappés automatiquement.
- **`|raw` uniquement sur le HTML volontaire** : `{{ post.content|raw }}`, `{{ post.excerpt|raw }}`,
  `{{ site.language_attributes|raw }}`. Un `|raw` est une décision, pas un réflexe.
- **`|e('html_attr')` sur toute valeur concaténée dans une chaîne d'attributs** sortie en `|raw`
  — l’échappement automatique ne s'applique pas aux concaténations `{% set %}`.
- **`|e('esc_url')|raw` sur toute URL placée dans un `href` / `src`** qui ne vient pas d'une valeur
  sûre (champ saisi dans l'admin, option, attribut de bloc) : l'échappement HTML laisse passer
  `javascript:`, `esc_url` l'écarte (chaîne vide). Le `|raw` est nécessaire : sa sortie est déjà
  prête pour un attribut, l'échappement automatique doublerait les `&`.
- `|e` est inutile sur une sortie normale : l'échappement est déjà appliqué.

Oublier un `|raw` produit un bug d'affichage immédiatement visible (les balises apparaissent en texte) ;
c'est voulu, l'erreur est bruyante plutôt que silencieuse.

---

## Assets — Build Vite

Sources dans `resources/`, sorties dans `dist/` (noms de fichiers **hachés**, résolus par le manifest) :

| Source | Sortie (noms hachés) |
|--------|----------------------|
| `resources/js/app.js` + `app.scss` | `dist/assets/app-{hash}.js` et `app-{hash}.css` |
| `resources/js/login.js` + `login.scss` | `dist/assets/login-{hash}.js` et `login-{hash}.css` (page de connexion) |
| `resources/js/email.js` → `resources/images/email-logo.png` | `dist/assets/email-logo-{hash}.png` (logo des e-mails, cf. *E-mails*) |
| `resources/scss/admin-colors.scss` | `dist/assets/admin-colors-{hash}.css` (jeu de couleurs de l'admin) |
| `resources/scss/editor-gutenberg.scss` | `dist/assets/editor-gutenberg-{hash}.css` (canvas de l'éditeur) |
| `resources/fonts/` | `dist/assets/fonts/` |
| — | `dist/assets/.vite/manifest.json` (résolution des noms) |

- `dist/` est **gitignoré** — le build est refait au déploiement.
- Chaque outil a son dossier : Vite écrit dans `dist/assets/`, wp-scripts dans `dist/blocks/`.
  Chacun peut donc vider le sien (`emptyOutDir: true`) sans effacer l'autre.
- **Cache-busting automatique** : les noms de sortie contiennent un hash du contenu, l'URL change
  donc dès que le fichier change. Aucun `?ver=` à maintenir, rien à bumper à la mise en prod.
- **`dist/assets/.vite/manifest.json`** associe chaque entrée source à son fichier haché. Il n'est
  lu que par `Support\ViteManifest` — une fois par requête, résultat mémorisé — qui expose
  `entry()`, `entry_url()`, `entry_relative_path()` et `asset_url()` aux features. **Ne jamais rouvrir ce fichier ailleurs :**
  toute feature qui enfile un asset buildé passe par cette classe. Manifest absent ou illisible →
  tableau vide, à charge de l'appelant de ne rien enfiler plutôt que de produire une URL cassée.
- **`admin-colors.scss` et `editor-gutenberg.scss` sont des entrées CSS pures**, sans JS
  d'accompagnement, et les deux seules feuilles que le thème n'enfile pas : c'est WordPress qui les
  lit. Toutes deux sont donc **toujours servies depuis `dist/assets/`**, même quand le dev server
  tourne — les modifier impose un `npm run build`.
- `admin-colors.scss` : son URL est déclarée à WordPress via `wp_admin_css_color()` (feature `Admin\AdminColorScheme`),
  et le core la charge à la place de son propre `colors.css`. Elle dérive la palette des sources
  SCSS du core (`wp-admin/css/colors/_admin.scss`), atteintes par l'alias `~wp-admin` de
  `vite.config.js` — **seul point du build qui dépend du core**, donc à builder depuis une
  installation WordPress complète. La même feature retire du
  sélecteur les jeux de couleurs du core listés dans son argument `schemes_to_remove:` — sur
  `admin_init`, jamais sur `admin_head`, qui s'exécute une fois la feuille déjà imprimée
  (cf. le docblock de `remove_core_schemes()`, qui détaille l'incohérence que cela produirait).
- `editor-gutenberg.scss` : son **chemin** — et non son URL — est déclaré via `add_editor_style()`
  (feature `Admin\EditorStyles`), qui pose aussi `add_theme_support( 'editor-styles' )`, sans lequel
  le core ignorerait la feuille. Le core lit le fichier sur disque et **inline son contenu** dans le
  canvas de l'éditeur — une iframe, dont le `<body>` porte la classe `editor-styles-wrapper` : un
  `body { … }` y cible la zone d'édition. La feuille y est injectée telle quelle ; sans iframe
  (bloc tiers en apiVersion < 3), le core la préfixerait par `.editor-styles-wrapper`. Deux conséquences pour l'écriture de la feuille — ne pas y importer
  Bootstrap en entier, dont le poids serait inliné à chaque ouverture de l'éditeur, et ne pas
  chercher à y styler l'interface de l'éditeur, hors de portée du préfixe.
- **Même rendu du contenu au front et dans l'éditeur** : `app.scss` et `editor-gutenberg.scss`
  importent tous deux `_content.scss`, source unique des styles du contenu éditorial (socle
  typographique Bootstrap `root` / `reboot` / `type`, styles de blocs). Ses règles, préfixées dans le
  canvas, l'emportent sur les styles par défaut de l'éditeur (police `serif`, marges de 28 px des
  blocs, liens et gras de l'admin), de spécificité nulle ou faible. Vérifié par mesure des styles
  calculés (titres, paragraphe, gras, lien, liste) : valeurs identiques des deux côtés.
- **Même largeur** : WordPress limite chaque bloc du canvas à 840 px, centré, avec 8 px de marge
  (styles classiques de l'éditeur). `editor-gutenberg.scss` neutralise cette mise en page pour
  reprendre celle du front — `main.container-fluid` : toute la largeur, gouttière Bootstrap
  (`$container-padding-x * .5` de chaque côté). **Si le layout du front change** (conteneur à largeur
  maximale, colonne de lecture…), mettre à jour ces règles en même temps.
- En production, Vite supprime `console.log` / `console.debug` / `console.warn`.

### Organisation SCSS

```
resources/scss/
├── app.scss               ← entrée front : fonts, variables, bootstrap-config, mixins, content,
│                             bootstrap-layout, partials
├── editor-gutenberg.scss  ← entrée éditeur : fonts, variables, bootstrap-config, mixins, content
├── admin-colors.scss      ← jeu de couleurs de l'admin
├── login.scss             ← page de connexion
├── _content.scss          ← **contenu éditorial, partagé front / éditeur** : Bootstrap root, reboot,
│                             type (+ images, tables au besoin), styles du thème, partials de blocs
├── _bootstrap-config.scss ← Bootstrap sans sortie CSS : fonctions, variables, maps, mixins
├── _bootstrap-layout.scss ← Bootstrap front uniquement : conteneurs, grille, composants, utilitaires
├── _variables.scss        ← overrides Bootstrap, AVANT `bootstrap-config`
├── _tokens.scss           ← custom properties du design system, importé par `_content.scss`
├── _typography.scss       ← interlignes et styles de texte, importé par `_content.scss`
├── _brand.scss            ← charte : design system + couleurs de l'admin et de la connexion (cf. *Design System*)
├── _mixins.scss
├── _fonts.scss            ← @font-face
├── partials/              ← layout du site (header, footer, navigation…) — front uniquement
├── block/                 ← un fichier _{nom-du-bloc}.scss par bloc Gutenberg
└── editor/                ← interface des blocs custom dans le canvas (boutons sur une image,
                              emplacement vide…) — importé par `editor-gutenberg.scss` seulement
```

**Où écrire un style ?** S'il touche au contenu saisi dans l'éditeur (typographie, titres, listes,
liens, blocs) → `_content.scss` ou un partial importé par lui, pour qu'il vaille des deux côtés. S'il
ne concerne que le site autour du contenu → `partials/`, importé par `app.scss` seul. Un module
Bootstrap qui met en forme du contenu (`images`, `tables`) se décommente dans `_content.scss`, les
autres dans `_bootstrap-layout.scss`. Les deux entrées utilisent `@import` (Bootstrap 5.3 n'est pas
compatible `@use`).

Base CSS : **Bootstrap 5.3** (alias `~bootstrap` vers `node_modules/bootstrap`).
Ne pas dupliquer ce que Bootstrap fournit déjà (grille, utilitaires, breakpoints).

### Organisation JS

`resources/js/app.js` est un simple point d'entrée qui importe des modules autonomes
(un fichier = une responsabilité, ex. `burger.js`, `scrollHeader.js`, `transitions.js`).
Chaque module s'auto-protège si son élément DOM n'existe pas sur la page.

Plugins JS de Bootstrap : importés un par un depuis `bootstrap/js/dist/` (jamais le bundle
complet), pour leur seule data-api, déléguée au document — aucun code d'initialisation. En place :
`collapse` (accordéon du bloc FAQ), avec le module SCSS `transitions` (`.collapse` /
`.collapsing`, transition coupée sous `prefers-reduced-motion`) dans `_bootstrap-layout.scss`.

Modules du thème : `megaMenu.js`, `mobileMenu.js`, `scrollHeader.js` (header, cf. *Header et méga menu*), `photo-cards.js` (flèches du bloc Cartes photo, desktop seulement), `collapsible-text.js` (repli du bloc Texte repliable, desktop seulement). Il
n'utilise pas Collapse de Bootstrap, dont le bouton doit être rendu par le serveur avec la data-api
et qui ne se limite pas à un point de rupture : il anime lui-même `max-height`.
`read-more.js` (module, sans effet seul) : repli « … Plus » / « Moins » d'un texte, partagé par
`reviews.js` (avis du bloc Avis Google, `--reviews-lines`, tous écrans ; texte d'un paragraphe passé en
`inline`, bouton à sa suite) et `image-text.js` (texte du bloc Image et texte, `--image-text-lines`,
**desktop seulement** — `isEnabled` / `media` ; paragraphes et listes, bouton déplacé à la fin du
dernier `p` / `li` affiché, `insideText`, focus rendu au bouton déplacé). Il coupe le texte
**entre deux mots**, au plus long début qui tient en N lignes avec « … Plus »
collé derrière — dichotomie sur les fins de mots, en mesurant la hauteur
rendue ; refaite quand la largeur change et une fois les polices chargées. `line-clamp` a été
écarté : le navigateur y ajoute son propre « … » quand le mot suivant ne tient pas, et un bouton posé
sur la fin de ligne coupe des mots. Le texte replié est retiré du DOM (un lecteur d'écran lit ce qui
est affiché). Dépli et repli animés comme le texte repliable (`max-height` de l'enveloppe, 0,35 s,
coupé sous `prefers-reduced-motion`) ; au repli, le texte n'est coupé qu'en fin d'animation, à la
hauteur visée, et « … Plus » réapparaît en fondu (0,25 s, `is-appearing`).

---

## Blocs Gutenberg (`blocks/`)

> **Règles de conception des blocs** (mots comptés, titres visibles dans le panneau Structure,
> attributs plutôt que blocs imbriqués) : voir `blocks/CLAUDE.md`, à lire avant de créer ou modifier
> un bloc.

Sources : `blocks/{nom}/` → compilés par `@wordpress/scripts` dans `dist/blocks/{nom}/`.
`BlockLoader` enregistre automatiquement tout `dist/blocks/*/block.json` — aucun `register_block_type()` manuel.

Fichiers par bloc :

- `block.json` — définition (`apiVersion: 3`, `name: "couturier/{nom}"`, attributs, `editorScript`, `render`, `textdomain`)
- `index.js` — interface éditeur (React/JSX, `@wordpress/blocks`, `@wordpress/block-editor`)
- `render.php` — rendu frontend dynamique (`$attributes`, `$content`, `$block`), wrapper via `get_block_wrapper_attributes()`

**Code partagé entre blocs** : `blocks/_shared/` (sans `block.json`, wp-scripts ne le compile pas
seul ; il est inclus dans le script de chaque bloc qui l'importe) — `image-field.js` (image d'un
bloc : emplacement, boutons « Remplacer » / « Supprimer », panneau d'informations, cf.
`blocks/CLAUDE.md`), `icons.js` (icônes SVG de l'interface — ajouter, chevrons, image, remplacer,
corbeille, surligneur, lien : `@wordpress/icons` n'est pas installé),
`formats.js` (formats retirés d'un bloc imbriqué, format « Mise en avant » — titres du CTA, de la
FAQ, du titre de section, de l’image et texte, et titres libres), `locked-content.js`
(verrou et niveau fixe éventuel des blocs imbriqués rétablis, espace insécable avant « ? ! : ; », cadenas masqué),
`buttons.js` (nombre de boutons facultatifs : hook et panneau), `backgrounds.js` (fond choisi dans une liste fermée, cf. *Fonds de carte*), `contacts.js` (contact prédéfini
d'un héros : liste de choix de la barre latérale, aperçu de l'encart, cf. *Contacts prédéfinis*).
Styles propres au canvas :
`resources/scss/editor/` — dont `_front-preview.scss`, qui masque les champs vides d'un bloc
`couturier/*` non sélectionné (cf. `blocks/CLAUDE.md`).

**Blocs du thème :**

| Bloc | Rôle |
|------|------|
| `couturier/cta` « Appel à l'action » | Carte pétrole foncé : titre H2 (mots mis en avant en orange, format `couturier/highlight`), texte (`core/paragraph` : gras, italique, lien, barré, exposant, indice), 0 à 2 boutons (orange avec flèche, transparent), image facultative jamais recadrée. Rien n'est rendu si le titre ou le texte est vide. Styles : `block/_cta.scss` ; titre en Red Hat Display Black (900), styles de texte `cta-title` / `cta-text` (`_brand.scss`) |
| `couturier/compact-cta` « Appel à action compact » | Bandeau clair arrondi (32 px) de la maquette 301:6347 : titre H2 (`core/heading` verrouillé, niveau fixe, sans format), texte (`core/paragraph` : gras, italique, lien) et 0 ou 1 bouton (`deep` avec flèche, panneau « Bouton »). Rien n'est rendu si le titre ou le texte est vide. **Fond** (`background`, panneau « Fond du bandeau », cf. *Fonds de carte*) : pétrole/100 (défaut), pêche/300, orange/100, pétrole/50, neutre/50 — pas de blanc, couleur de la page ; seule `--compact-cta-bg` change. Anciens styles de bloc (`is-style-peach` / `-pink` / `-default`) migrés à l'ouverture dans l'éditeur, repli CSS d'ici là. Mobile : empilé. Desktop (`lg`) : 1063 px centrés, grille titre et texte à gauche, bouton à droite centré verticalement. Titre, texte et boutons sont enfants directs de la `section` au front comme dans le canvas ; dans le canvas, marges automatiques et `max-width: none` de `.wp-block` neutralisés par des sélecteurs plus spécifiques (sinon titre et texte centrés, bandeau à 1136 px). Styles : `block/_compact-cta.scss`, styles de texte `compact-cta-title` / `compact-cta-text` (`_brand.scss`) |
| `couturier/faq` « Questions fréquentes » | Titre H2 (mise en avant en orange foncé, `text-accent`), texte facultatif, 0 ou 1 bouton (pétrole foncé avec flèche), à gauche ; à droite la liste `couturier/faq-list` (son propre `templateLock: false` : questions ajoutées, retirées, déplacées) de questions `couturier/faq-item` — titre H3 imbriqué verrouillé (panneau Structure) et réponse en attribut. À partir de `lg` : 940 px centrés, colonnes 2fr / 3fr. Accordéon Bootstrap Collapse câblé au rendu par `faq-list/render.php` : 1re question ouverte, une seule à la fois. Contenu par défaut à l'insertion (titre, une question et sa réponse). Rien n'est rendu sans titre ni question complète. Styles : `block/_faq.scss` ; icônes `images/icons/plus.svg` / `minus.svg` ; styles de texte `faq-title` / `faq-text` / `faq-question` / `faq-answer` (`_brand.scss`) |
| `couturier/section-title` « Titre de section » | `<hgroup>` : titre `core/heading` imbriqué verrouillé, H2 ou H3 au choix (`HeadingLevelDropdown`), mots mis en avant en orange foncé (`text-accent`) ; sous-titre facultatif en attribut (`source: html`, gras, italique, lien). **Alignement** (`textAlign`, barre d'outils du bloc et de son titre, `AlignmentControl`) : centré (défaut) ou à gauche → classe `has-text-align-left` sur le `<hgroup>` (titre et sous-titre). Rien n'est rendu sans titre. Transformations (`transforms.js`) : titre libre → titre de section, titre + paragraphe sélectionnés ensemble → titre + sous-titre, et retour (titre libre déverrouillé, sous-titre en paragraphe). Styles : `block/_section-title.scss` (H2 au style `section-title`, H3 au style du H3 libre — mixin `section-title-h3`, style `h2` de la charte —, sous-titre `body-lg`) |
| `couturier/collapsible-text` « Texte repliable » | Titre H3 (`core/heading` imbriqué verrouillé, niveau fixe, style Titre/H2 de Figma) et deux colonnes `couturier/collapsible-text-column` « Colonne de texte » (verrouillées, `templateLock: false` propre : paragraphes et listes libres), saisies par le rédacteur — la gauche se lit avant la droite (mobile, lecteur d'écran) ; une colonne vide n'est pas rendue et l'autre prend toute la largeur (masquée aussi dans le canvas hors édition, `is-incomplete`). Mobile : colonnes empilées, texte entier. À partir de `lg` : 1060 px centrés, colonnes côte à côte (écart 48 px), bouton « Réduire – » / « Lire la suite + » à droite du titre qui replie le texte jusqu'au titre seul — modèle *Disclosure* (`aria-expanded`, `aria-controls`), animation de `max-height` à la durée de l'accordéon Bootstrap (coupée sous `prefers-reduced-motion`), texte replié en `visibility: hidden`. Déplié au chargement ; bouton `hidden` sans JS. Réglages (panneau « Mise en page ») : « Une seule colonne » (`singleColumn`, `is-single-column` : colonnes empilées pleine largeur, la droite sous la gauche) et « Texte repliable » (`isCollapsible`, coché par défaut ; décoché → `is-not-collapsible`, ni bouton ni `aria-controls`, texte toujours entier). Rien n'est rendu sans titre ni texte. Styles : `block/_collapsible-text.scss` (texte `body`), mise en page du canvas dans `editor/_collapsible-text.scss` ; script `resources/js/collapsible-text.js` |
| `couturier/reviews` « Avis Google » | Note moyenne Google, lien « Lire tous les avis » et trois avis fixes (un mis en avant, deux secondaires), **saisis à la main** (pas d'API Google : la maquette affiche une formation, « Permis B », que Google ne fournit pas). Bloc à attributs, sans bloc imbriqué (aucun titre : « Ils nous font confiance » est un titre de section placé au-dessus) : note en `source: html`, avis en `source: query` (texte, nom, formation, date facultative ; étoiles 1–5 en `data-stars`, réglées dans la barre latérale), URL de la fiche Google dans le commentaire du bloc. Un avis sans texte ou sans nom est retiré du front ; rien n'est rendu sans avis complet. `render.php` ajoute l'en-tête (note lue « 4,8 sur 5 », logo Google et étoiles remplies selon la note — 4,8 → 4 pleines et 4/5 de la 5e), les étoiles de chaque avis (lues « Note : N sur 5 ») et le bouton « Plus » (`hidden`, `aria-controls`). Deux maquettes : mobile sous `lg` (cartes empilées, avis mis en avant en pétrole), desktop à partir de `lg` (deux colonnes, avis mis en avant en rose pâle avec grand guillemet). **Fond de l'avis mis en avant** (`background` du bloc, panneau « Fond de l'avis mis en avant », cf. *Fonds de carte*), en desktop seulement : orange/100 (défaut), pétrole/100, pêche/300, pétrole/50 — autres couleurs inchangées (date et guillemet orange 700 : 4,31:1 sur orange/100, 4,08:1 sur pétrole/100, 3,93:1 sur pêche/300 — sous l'AA, demandé par Aurélien —, 4,51:1 sur pétrole/50 ; « Plus » à 2,32:1). L'ancien style « Pétrole clair » (`is-style-petrol`) est migré à l'ouverture dans l'éditeur, repli CSS d'ici là. Logo (`images/google-logo.svg`, Wikimedia Commons) et étoile (`images/icons/star.svg`, masque en `currentColor`) sont des images CSS décoratives. Couleurs de la maquette appliquées telles quelles, contrastes sous l'AA compris (lien et « Plus » en orange 500, date orange 700 sur rose — rapport de contrastes global à venir). Styles : `block/_reviews.scss` ; script `resources/js/reviews.js` |
| `couturier/image-text` « Image et texte » | Image facultative (ratio 555 × 409 recadré, rayon 20 → 32 px) à gauche ou à droite en desktop (réglage « Position de l'image », `is-image-{left|right}`), **toujours au-dessus en mobile** (première dans le DOM), alignée en haut sans s'étirer ; sans image, texte pleine largeur. À côté : surtitre facultatif (attribut `source: html` ; Body Medium atténué en mobile, Body L en desktop), titre H2 facultatif (`core/heading` verrouillé, niveau fixe, style `section-title` à 49 px d'interligne et −1 px en desktop, mise en avant orange foncé), texte `couturier/image-text-body` (paragraphes et listes libres, Body → Body L ; en desktop, coupé à 4 lignes avec « … Plus » / « Moins », cf. `read-more.js`), rangée `couturier/image-text-icons` (`<ul>`, icônes sans limite, ajoutées par « Ajouter une icône ») de `couturier/image-text-icon` — pictogramme SVG / PNG de la médiathèque en **masque CSS** (`--icon`) peint en pétrole, libellé en attribut, lien facultatif par le `LinkControl` natif (URL d'un contenu recalculée par son ID au rendu, nouvel onglet annoncé) ; icône sans pictogramme ou sans libellé non rendue —, puis 0 à 2 boutons (deep avec flèche, outline). Rien n'est rendu sans surtitre, titre ni texte. Styles : `block/_image-text.scss`, canvas dans `editor/_image-text.scss` |
| `couturier/icon-cards` « Cartes à pictogramme » | Liste (`<ul>`) de cartes `couturier/icon-card` « Carte à pictogramme » (insérée avec trois cartes, sans limite : « Ajouter une carte », retrait et déplacement libres). Carte : pastille 48 px orange/100 avec pictogramme de la médiathèque — SVG en **masque CSS** (`--icon`, peint en `text-default`), PNG / WebP (les PNG sont convertis en WebP à l'upload) en `<img>` aux couleurs d'origine ; décoratif, remplacé ou supprimé par les boutons du coin de la carte en cours d'édition ; titre H3 (`core/heading` imbriqué verrouillé, niveau fixe, sans format) ; texte en attribut (`source: html` : gras, italique, lien). Carte sans titre non rendue (avertissement dans le canvas) ; sans pictogramme ou sans texte, rendue sans eux. Une carte par ligne en mobile, deux à partir de `md`, trois à partir de `lg` ; réglage « Cartes par ligne (desktop) » (`columns`, 3 par défaut ou 4 → `has-4-columns`) : quatre à partir de `xl` ; **fond par carte** (`background`, cf. *Fonds de carte* ; blanc par défaut, pétrole/100, pêche/300, pétrole/50, orange/100, neutre/50 → classe `is-bg-{fond}` : sans bordure, pastille blanche, texte en pétrole/500 ; l'ancien style « Cartes colorées » `is-style-colored` est migré à l'ouverture dans l'éditeur, repli CSS d'ici là) ; **présentation du visuel** par carte (`iconStyle`) : « Pastille » (défaut) ou « Visuel décalé » (`has-offset-visual`, Figma 301:6225 / 301:6812 : disque rond de 64 px, image JPG / PNG / SVG en `<img>` aux couleurs d'origine, 80 px de haut, décalée de 26 px à droite et 17 px vers le haut, débordant du disque ; `alt=""`) ; une ligne incomplète répartit ses cartes (`space-around`). Aperçu de l'inserteur avec les pictogrammes de la maquette (`iconId` négatifs, `icon-card/example-icons.js`). Styles : `block/_icon-cards.scss`, canvas dans `editor/_icon-cards.scss` |
| `couturier/image-cards` « Cartes illustrées » | Liste (`<ul>`) de cartes `couturier/image-card` « Carte illustrée » (insérée avec trois cartes, sans limite : « Ajouter une carte », retrait et déplacement libres), même grille et même réglage « Cartes par ligne (desktop) » (`columns` → `has-4-columns`) que les cartes à pictogramme. Carte (Figma 301:6291) : aplat pêche/100, rayon 28 px, contenu rogné (`overflow: hidden`) ; image de fond facultative (`ImageField`, compact sans image, décorative `alt=""`, chargement différé, point focal → `--focal`) estompée à 20 % (opacité sur l'`<img>` seule : un calque transparent enfermerait les boutons de l'éditeur) ; pictogramme **facultatif** SVG / PNG en masque CSS peint en pétrole dans une bulle blanche pivotée qui déborde du coin haut gauche — sans pictogramme, ni bulle ni `has-icon` (réserve de 118 px en haut) ; titre H3 (`core/heading` imbriqué verrouillé, sans format) et texte en attribut (`source: html` : gras, italique, lien souligné en pétrole/500) calés en bas (`min-height` 234 px). Carte sans titre non rendue (avertissement dans le canvas). Canvas : boutons de l'image puis du pictogramme dans le coin haut droit. Aperçu de l'inserteur : `imageId` / `iconId` négatifs (`image-card/example-assets.js`). Styles : `block/_image-cards.scss`, canvas dans `editor/_image-cards.scss` |
| `couturier/reassurance` « Réassurance » | Liste (`<ul>`) d'atouts `couturier/reassurance-item` « Atout » (insérée avec quatre atouts, sans limite : « Ajouter un atout », retrait et déplacement libres). Atout : pastille 48 px avec pictogramme SVG / PNG de la médiathèque en **masque CSS** (`--icon`, peint en `text-default`, décoratif ; choisi par le « + » de la pastille, remplacé en cliquant dessus, ou par les boutons du panneau « Pictogramme »), **pêche pour les atouts impairs, pétrole clair pour les pairs** (`:nth-child`, aucun réglage) ; titre H3 (`core/heading` imbriqué verrouillé, niveau fixe, sans format) ; court texte en attribut (`source: html`, sans format, sans saut de ligne). Atout sans titre non rendu (avertissement dans le canvas) ; sans pictogramme ou sans texte, rendu sans eux. Un atout par ligne en mobile (écart 8 px, padding 8 / 24 px), deux à partir de `md`, **quatre à partir de `lg`**, contenu centré dans sa colonne ; une ligne incomplète répartit ses atouts (`space-around`). En desktop, padding horizontal retiré (carte blanche sur fond blanc) pour que les textes de la maquette tiennent sur une ligne. Aperçu de l'inserteur avec les pictogrammes de la maquette (`iconId` négatifs, `reassurance-item/example-icons.js`). Maquettes : desktop 536:7501, mobile 595:1386. Styles : `block/_reassurance.scss`, canvas dans `editor/_reassurance.scss` |
| `couturier/photo-cards` « Cartes photo » | Rangée de cartes `couturier/photo-card` « Carte photo » (insérée avec cinq cartes, sans limite : « Ajouter une carte », retrait et déplacement libres). Réglage « Taille des cartes » (`size`, `is-size-{small|large|xlarge}`) : « Petites » (`small`, 212 px, 5 par ligne à partir de `lg`), « Moyennes » (`large`, 252 px, 4 par ligne) ou « Grandes » (`xlarge`, 280 px en mobile, 3 par ligne, hors maquette) — valeurs internes conservées, la taille passe aux cartes par contexte (`couturier/photoCardsSize`, `sizes` de l'image). **Fond par carte** (`background` de `photo-card`, cf. *Fonds de carte*) : neutre/50 (défaut, sur-titre orange/700 à 4,62:1), blanc (4,99:1), pétrole/50 (sur-titre `text-muted` à 4,55:1, zone photo vide en pétrole/100 — rangée « Formation Pro », Figma 536:7544) ; pétrole/100, pêche/300 et orange/100 écartés, le sur-titre n'y tiendrait pas 4,5:1. L'ancien style « Pétrole clair » du conteneur (`is-style-petrol`) est migré à l'ouverture dans l'éditeur (cartes en gris passées en pétrole/50), repli CSS d'ici là. Carte : photo (`ImageField`, 150 px recadrés, seuls les coins hauts arrondis), badge facultatif (interrupteur « Afficher un badge » → `hasBadge`, libellé libre prérempli « Le + choisi », `source: html`, centré à cheval sur le bord haut), sur-titre (`source: html`, sans format), titre H3 (`core/heading` imbriqué verrouillé, niveau fixe, sans format), texte court (`source: html`, gras, lien et saut de ligne). Case « Activer les boutons de défilement » (`scrollButtons`, cochée par défaut) : décochée, pas de flèches (`render.php` ne rend pas `__nav`) et classe `is-wrapped` — cartes à la ligne à partir de `lg` (même écart entre les lignes qu'entre les cartes), ruban au doigt inchangé en mobile. **Carte non cliquable** : l'ancien lien de toute la carte (attribut `link`, `LinkControl`, lien étendu par `::after`) a été supprimé le 2026-11-11, les liens se placent dans le texte court (soulignés, couleur du texte) ; les anciennes valeurs sont ignorées. Carte sans titre non rendue (avertissement dans le canvas). Piste `ul.__track` défilante (`scroll-snap`), marges intérieures pour le badge, l'ombre et le contour, compensées par des marges négatives. Sous `lg` : ruban au doigt, la carte suivante dépasse, pas de barre de défilement. À partir de `lg` : flèches orange de la maquette (`images/icons/photo-cards-arrow.svg`) rendues `hidden` par `render.php` et affichées par `resources/js/photo-cards.js` quand les cartes dépassent ; défilement d'une page ; en bout de piste `aria-disabled` (pas `disabled`, qui ferait perdre le focus). Canvas : cartes passées à la ligne pendant l'édition. Aperçu de l'inserteur avec les photos de la maquette (`imageId` négatifs, `photo-card/example-images.js`). ⚠️ Flèche `#E0EAEC` sur `#FF6B35` (≈ 2,4:1, sous les 3:1 de 1.4.11) : couleurs de la maquette appliquées. Styles : `block/_photo-cards.scss` (styles de texte `photo-card-eyebrow` / `-title` / `-text`, `_brand.scss`), canvas dans `editor/_photo-cards.scss` |
| `couturier/home-hero` « Héros de l'accueil » | En-tête de l'accueil, **un seul par page** (`supports.multiple: false`), **proposé dans l'éditeur de la seule page d'accueil** (page statique de Réglages › Lecture ; feature `Blocks\PageScopedBlocks`, filtre `allowed_block_types_all` après la liste blanche du socle — un héros déjà présent ailleurs reste affiché et modifiable) : image de fond décorative (`ImageField`, `alt` vide, `fetchpriority="high"`, sans chargement différé ; point focal par `FocalPointPicker` → variable `--focal` / `object-position`), H1 (petite ligne en capitales, ombre portée ajoutée à la maquette pour la lisibilité), H2 d'accroche (Red Hat Display Black 64 → 32 px), texte (`core/paragraph` verrouillé, gras seulement), puis deux cartes `couturier/home-hero-card` « Carte univers » verrouillées (style « Pêche » par défaut, « Pétrole » `is-style-petrol`). Tout est imbriqué et verrouillé (`templateLock: 'all'`, cartes comprises) ; exempté de la restriction H2 / H3 (`exempt_parents` de `RestrictHeadingLevels`). Rien n'est rendu sans H1. Mise en page en grille sur `__content` (titres pleine largeur, une carte par colonne, deux colonnes dès le mobile). Fond : pleine largeur en mobile (coins bas arrondis), à 30 px des bords de la fenêtre et 703 px de haut à partir de `lg` (sortie du container par `margin-inline`, rétablie dans le canvas par `editor/_home-hero.scss`) ; fond gris foncé neutre `#3c434a` (pétrole 700 sur la maquette), visible avant le chargement de la photo ou sans photo, puis calques : photo et fondu blanc (le voile orangé de la maquette, 10 %, est retiré : il ternissait la photo). Le *mesh gradient* de la maquette (shader en fusion « Incrustation » à 20 %) n'est pas un calque du bloc : il est compris dans l'image de fond (export de la maquette, photo recadrée et shader appliqués). **Remonte derrière l'en-tête collant** quand il est le premier bloc (`partials/_layout.scss`, variables `--header-height` / `--header-bar-top` posées par `scrollHeader.js` ; sans JS, il reste sous l'en-tête). Carte : sur-titre, photo, titre H3 (imbriqué verrouillé, sans format), texte, bouton-lien (libellé en attribut, lien par le `LinkControl` natif — barre d'outils de la carte et de son titre, barre latérale ; non rendu sans lien ou sans libellé) ; en desktop, bouton à cheval sur le bas de la photo (`order` : il reste après le texte dans le balisage), en mobile en bas de carte (libellé 13 px, pastille 28 px, au lieu de 15 / 34 sur la maquette, pour les libellés longs — libellés courts mobiles en attente de validation du client). Encart contact **desktop seulement** sous la carte (`render.php` sépare `__body` et `__contact`) : **contact prédéfini** choisi dans la barre latérale (`contactId`, cf. *Contacts prédéfinis*) — photo ronde en noir et blanc avec pastille enveloppe, texte, téléphone et e-mail ; non rendu sans contact publié. Les anciens champs saisis dans la carte sont repris par une entrée `deprecated` qui les retire. Carte sans titre non rendue. Aperçu de l'inserteur avec les visuels de la maquette (`imageId` négatifs, `home-hero/example.webp`, `home-hero-card/example-images.js`). Maquettes : desktop 536:7444 / 536:7454, mobile 595:1342. ⚠️ H1 blanc sur ciel clair (contraste dépendant de la photo) et libellé blanc sur orange/600 (≈ 3,4:1, sous l'AA en mobile) : couleurs de la maquette appliquées. Styles : `block/_home-hero.scss`, canvas dans `editor/_home-hero.scss` |
| `couturier/page-hero` « Héros de page » | En-tête des pages intérieures, **un seul par page**, **proposé partout sauf dans la page d'accueil** (`Blocks\PageScopedBlocks`, `not_on_front_page:`), billets et futurs CPT compris. Blocs imbriqués verrouillés : H1 (`core/heading`, niveau fixe, exempté de `RestrictHeadingLevels` ; « Mise en avant » orange 700), texte (`core/paragraph` facultatif), 0 à 2 boutons (`core/buttons` supprimables, orange avec flèche puis contour, panneau « Boutons »), visuel `couturier/page-hero-media`. `render.php` les rend un par un et ajoute : **fil d'Ariane** en tête (`Theme\Support\Breadcrumb`, cf. *Fil d'Ariane* ; aperçu tiré des pages parentes dans le canvas), **avis** entre le texte et les boutons (attributs `showRating`, `rating` « 4,8 », `reviewCount`, `ratingLink` par `LinkControl` ; étoiles en masque remplies selon la note, « 4,8 / 5 » lu « Note : 4,8 sur 5, 200 avis » ; dans le canvas, aperçu replacé par `order`), **contact** prédéfini (`contactId`, desktop seulement, sous les boutons, déborde de 75 px sous le héros — `has-contact` ajoute ces 75 px à la marge basse). Rien n'est rendu sans H1. Styles de bloc « Pêche » (défaut), « Rose clair » (`is-style-pink`), « Pétrole clair » (`is-style-petrol`) : fond, couleur de la forme du visuel (`--page-hero-shape` : orange, pétrole) et de l'encart contact. Mobile : fond pleine largeur, coins bas arrondis (28 px), **remonte derrière l'en-tête** quand il est le premier bloc (`partials/_layout.scss`), éléments empilés, visuel sous les boutons (marge basse pour la forme). Desktop (`lg`) : encadré arrondi (40 px) à 22 px sous l'en-tête ; avec visuel (`has-media`), **grille** texte / visuel de 429 px — un seul conteneur au front comme dans le canvas, lignes `repeat(7, auto) 1fr` pour que la hauteur du visuel ne disperse pas le texte, contact calé dans la dernière ligne ; sans visuel, contenu sur toute la largeur du héros. Styles de texte `page-hero-title` (Black 34 → 46 px) et `page-hero-text` (`_brand.scss`). **Visuel** `couturier/page-hero-media` « Visuel du héros » (imbriqué, verrouillé) : image facultative (`ImageField`, `alt` de la médiathèque, point focal, `fetchpriority="high"`), cadre 429 × 492 arrondi, forme inclinée derrière (pseudo-élément, 3,21°) ; surtitre, titre (`<p>` et non un titre : accroche hors du plan de la page ; gras ×1,25 en Red Hat Display 700, reste en 400) et bouton (libellé + `LinkControl`, balisage `wp-block-buttons` / `is-style-outline has-arrow`) posés sur l'image, en attributs `source: html` ; **sans voile ni dégradé** (décision d'Aurélien) ; rien n'est rendu sans image. **Tags** `couturier/page-hero-tag` « Tag du visuel » (0 à 2, zone d'imbrication libre du visuel, bouton « Ajouter un tag » du canvas) : libellé (`source: html`), pictogramme (aucun, point orange ou pétrole en CSS, repère / lecture / calendrier : `images/icons/pin.svg`, `play.svg`, `calendar.svg` en masque), position x / y de 0 à 1 réglée **dans la barre latérale seulement** (`FocalPointPicker` sur l'image ; tag non déplaçable dans le canvas : `lock.move` par défaut, cadenas masqué, verrou rétabli), « Masquer en mobile », liens facultatifs **sur une partie du libellé** (seul format permis : `core/link` ; mots-liens orange 700, soulignés au survol / focus ; l'ancien attribut `link` du tag entier est repris par l'éditeur en lien sur tout le libellé, et `render.php` l'applique d'ici là). Placement proportionnel (`--tag-x`, `--tag-y` ; propriété `translate`, que le `transform` de l'animation des blocs de l'éditeur n'écrase pas) dans une zone qui déborde de l'image de 20 px (mobile) / 48 px (desktop) : le tag chevauche le bord sans sortir de l'écran. **Chiffres clés** `couturier/page-hero-facts` « Chiffres clés du héros » (imbriqué, ajouté ou retiré par le panneau « Chiffres clés » du héros via `replaceInnerBlocks`, **à la place du contact** : l'un, l'autre ou aucun ; l'activer vide `contactId`, et `render.php` ignore le contact en leur présence) : 1 à 5 cartes en attribut tableau (`source: query`, `dl` > `div.__item` > `dt` libellé en surtitre + `dd` valeur en H3, sauts de ligne permis), carte incomplète retirée du front ; desktop : rangée sur toute la largeur sous le texte et le visuel, fonds alternés (impaires pêche 300 + valeur orange 700, paires pétrole 50 + valeur pétrole 500), débord de 66 px sous le héros (`has-facts`) ; mobile : grille de deux colonnes **sous le fond coloré** du héros (le bloc reste dedans ; calque à la couleur de la page sous les cartes et coins arrondis redessinés en pseudo-éléments), toutes pêche 300 + valeur orange 700 (maquette 301:6977). Aperçu de l'inserteur : photo de la maquette (`page-hero-media/example.webp`, `imageId: -1`), contact d'exemple (`home-hero-card/example-images.js`). Maquettes : desktop 301:6148, 301:6425, 301:6948, 301:7208 ; mobile 596:1342, 598:1342, 605:1350, 608:1354 ; contact 301:6747. ⚠️ Fil d'Ariane pétrole 400 (3,96 à 4,34:1), texte blanc posé directement sur la photo (contraste dépendant de l'image), orange 700 sur pêche 100 dans l'encart contact (4,47:1) : couleurs de la maquette appliquées. Styles : `block/_page-hero.scss`, `block/_page-hero-media.scss`, canvas dans `editor/_page-hero.scss` |
| `couturier/logo-strip` « Logos partenaires » | Section arrondie (40 px) de la maquette 301:6827 / 605:1480 : titre H2 facultatif (`core/heading` verrouillé, niveau fixe, mise en avant orange foncé), texte `couturier/logo-strip-body` (paragraphes et listes, centrés ; titre et texte sur toute la largeur), encart blanc `couturier/logo-strip-items` (`<ul>`, logos sans limite, « Ajouter un logo ») de `couturier/logo-strip-item` « Logo » — image facultative (`ImageField`, décorative `alt=""` : la légende nomme le logo), à défaut cercle coloré (pêche/300, pétrole/100, orange/100, pétrole/50 en rotation, `:nth-child`), légende en attribut (`source: html`, 12 px minimum en mobile), lien facultatif par le `LinkControl` natif (logo et légende dans le lien, nouvel onglet annoncé). Logo sans légende non rendu ; encart sans logo non rendu ; rien n'est rendu sans titre, texte ni logo. **Fond** (`background`, panneau « Fond de la section », cf. *Fonds de carte*) : pêche/100 (défaut), pêche/300, pétrole/100, pétrole/50, orange/100, neutre/50. Mobile : bande défilante au doigt (`scroll-snap`, 2 logos visibles, 3 à partir de `md`), sans JS ni flèches. Desktop (`lg`) : grille de 5 logos par ligne. Styles : `block/_logo-strip.scss` (styles de texte `logo-strip-text` / `logo-strip-caption`), canvas dans `editor/_logo-strip.scss` |

**Fonds de carte.** Un bloc qui propose un fond au choix (`icon-card`, `photo-card`, avis mis en
avant de `reviews`, `compact-cta`, `logo-strip`) le fait par un attribut `background` à liste fermée, jamais par
des styles de bloc :
- `block.json` : `"background": { "type": "string", "enum": [ … ], "default": "…" }` — l'`enum`
  ne reprend que les fonds où **tous** les textes du bloc tiennent l'AA (sauf dérogation demandée) ;
- éditeur : `useBackground( metadata, attributes.background )` et `<BackgroundPanel>`
  (`blocks/_shared/backgrounds.js`, liste des sept fonds avec leur hexa pour les pastilles) ;
- rendu : classe `is-bg-{slug}`, sauf pour le défaut du bloc — `Theme\Support\CardBackground::class_name( $attributes, $block )`
  dans `render.php`, qui relit l'`enum` du `block.json` ;
- styles : `$ds-card-backgrounds` (`_brand.scss`, slug → rôle sémantique), parcouru par le partial
  du bloc (`var(--color-#{rôle})`).
Un ancien style de bloc remplacé est migré à l'ouverture dans l'éditeur (`useEffect` qui pose
`background` et retire la classe), avec un repli CSS tant que le contenu n'est pas réenregistré.

**Titres libres** (`core/heading` au premier niveau du contenu) : même style que le titre de
section, ciblé par `:where(.container, .is-root-container) > h2.wp-block-heading` (H2, style
`section-title`) et `> h3.wp-block-heading` (H3, mixin `section-title-h3`) — les titres imbriqués
du CTA et de la FAQ ne sont pas concernés ; mise en avant proposée (orange foncé). **Alignement**
centré (défaut) ou à gauche (feature `Blocks\HeadingTextAlign`) : attribut `textAlignment` déclaré
côté serveur sur `core/heading` (pas `textAlign`, ancien attribut du core que ses `deprecated`
migreraient ; le support natif `typography.textAlign`, retiré par `DisableNativeBlockSupports`,
proposerait « à droite » et vaudrait pour les titres imbriqués), stocké dans le commentaire du bloc ;
réglage dans la barre d'outils des seuls titres de premier niveau
(`resources/js/editor/heading-text-align.js`, inline) ; classe `has-text-align-left` posée par
`render_block_core/heading` et dans le canvas. Le bloc qui suit un titre (libre ou de section) perd sa marge haute : la marge basse du
titre fait l'écart, sans fusionner avec le `--layout-section-gap` des blocs.

**Espacement entre blocs :** chaque bloc du thème pose `margin-block: var(--layout-section-gap)`
(48 px en mobile, 96 px en desktop) ; les marges de deux blocs voisins fusionnent, d'où un écart de
section entre deux blocs quels qu'ils soient. Deux exceptions :
- après un titre (libre ou de section), le bloc suivant perd sa marge haute (ci-dessus) ;
- réglage **« Rapprocher du bloc précédent »** (barre latérale, panneau « Espacement ») sur les
  blocs `couturier/*` de premier niveau et les titres libres (`core/heading` au premier niveau ;
  jamais sur le premier bloc du contenu) (feature `Blocks\AttachedBlocks`) : écart ramené à 32 px,
  mobile comme desktop, pour deux blocs que la maquette présente comme une seule section (cartes
  « valeurs » sous « Image et texte » de l'accueil). Attribut `isAttached` déclaré côté serveur,
  stocké dans le commentaire du bloc ; classe `is-attached` posée par `render_block` sur le front
  et par `resources/js/editor/attached-blocks.js` dans le canvas. Styles :
  `block/_attached.scss`, importé après les blocs (il annule aussi la marge basse du bloc
  précédent, sinon les 96 px l'emporteraient à la fusion). Un nouveau bloc qui suit la règle
  `margin-block: var(--layout-section-gap)` en profite sans rien ajouter.

**Ajouter un bloc :**
1. Créer `blocks/{nom}/` avec `block.json`, `index.js`, `render.php`
2. Créer les styles dans `resources/scss/block/_{nom}.scss` et les importer **une seule fois**, dans
   `_content.scss` (`@import 'block/{nom}';`, section « Blocs Gutenberg ») : ils valent alors pour le
   front et pour l'éditeur
3. `npm run build:blocks`

> **Styles de blocs :** ils vivent dans `resources/scss/block/_*.scss`, plutôt que dans un
> `style.scss` par bloc, et sont importés par `_content.scss`, lui-même chargé par `app.scss` (front,
> via `Front\Assets`) et par `editor-gutenberg.scss` (canvas, via `Admin\EditorStyles`) : un seul
> import, même rendu des deux côtés. N'ajouter un `"style"` dans `block.json` qu'en cas de besoin
> spécifique.
>
> Les variables, fonctions et mixins de Bootstrap (`_bootstrap-config.scss`) sont disponibles dans
> les partials de blocs, côté front comme côté éditeur. Seuls les composants et utilitaires de
> Bootstrap (`_bootstrap-layout.scss`) sont absents de l'éditeur : un bloc ne doit pas compter sur
> une classe utilitaire (`.d-flex`, `.mb-3`…) pour son rendu dans le canvas.

**Conventions :**
- Préfixe de tous les blocs custom : `couturier/` (valeur de `ThemeContext::$block_namespace`)
- Un titre porté par un bloc custom doit être un `core/heading` **imbriqué** (InnerBlocks), jamais un
  attribut : l'onglet Structure de l'éditeur ne retient que les `core/heading`, et le compteur de mots
  ne lit que le HTML enregistré dans le contenu. Un texte secondaire (sur-titre, accroche) peut en
  revanche être un attribut, à condition d'être écrit dans le HTML par `save()` et relu depuis lui
  (`"source": "html"`) — sinon, rangé dans le commentaire `<!-- wp:… -->`, il échappe au compteur.
  Détails et exemple : `blocks/CLAUDE.md`
- **Niveaux de titre : H2 et H3 uniquement, sur tout le site** (feature `Blocks\RestrictHeadingLevels`,
  argument `levels:`), **sauf le H1 des héros** : les titres enfants directs des blocs
  `exempt_parents:` (`couturier/home-hero`, `couturier/page-hero`) échappent au garde-fou, le bloc
  fixe lui-même leur niveau (`useLockedContent()` : H1 puis H2 pour l'accueil, H1 pour les pages). Elle réécrit le défaut de l'attribut `levelOptions` de tout bloc à niveau
  (`core/heading`, `core/post-title`…) — depuis WordPress 7, le core en déduit les variations H1…H6
  proposées — et injecte dans l'éditeur un garde-fou (`resources/js/editor/restrict-heading-levels.js`)
  qui ramène au plus proche tout autre niveau créé par raccourci Markdown, collage ou éditeur de code.
  Un bloc custom qui imbrique un `core/heading` verrouillé (`templateLock: 'all'`) perd le sélecteur de
  variations de la barre d'outils : il pose son propre `HeadingLevelDropdown` (cf. `blocks/CLAUDE.md`)
- Blocs conteneur / enfant : le parent déclare `allowedBlocks`, l'enfant déclare `parent`
- Fournir un `example` dans `block.json` pour la prévisualisation de l'inserter, en **largeur
  desktop** : `"viewportWidth": 1200` (≥ `lg`), sinon l'aperçu montre la mise en page mobile
  (CTA, FAQ). Exception : le titre de section (420), illisible réduit en desktop
- Les blocs core autorisés sont whitelistés par la feature `Admin\DisableBlocks` (core minimal + `couturier/*`)
- **Boutons : blocs du core habillés**, pas de bloc custom (feature `Blocks\ButtonStyles`, styles
  dans `resources/scss/block/_button.scss`). Les cinq styles de bloc (`primary` par défaut,
  `outline`, `secondary`, `deep`, `ghost`) remplacent `fill` / `outline` du core ; un attribut
  `hasArrow` (interrupteur « Afficher la flèche », `resources/js/editor/button.js`) ajoute la
  classe `has-arrow` **au rendu** (`render_block_core/button`) et dans le canvas, jamais dans le
  HTML enregistré. Styles, attribut et supports retirés (bordure, ombre, espacements, largeur) se
  déclarent sur `register_block_type_args` : la définition serveur l'emporte dans l'éditeur. La
  flèche (`resources/images/icons/arrow-right.svg`) est un masque CSS peint en `currentColor` : elle
  prend la couleur `--button-arrow` du style. `ghost` (texte blanc, fond transparent) est réservé
  aux sections sombres. ⚠️ Le bouton orange a un texte **blanc** (choix du client, comme la
  maquette), en dérogation à `text-on-accent` : 2,84:1, sous l'AA — validation reportée. Le
  même script masque, quand un bouton est sélectionné, les formats sans objet dans un libellé :
  « Gras », « Italique » (texte au style « Button »), « Code en ligne », « Image en ligne »,
  « Langue », « Maths », « Mettre en évidence », « Saisie au clavier » (liste `FORMATS_OFF`).

---

## Contacts prédéfinis

Personnes à contacter affichées dans les héros (encart « Une question ? … » des cartes de l'accueil
et du héros de page), **saisies une fois** et choisies dans les blocs : un numéro qui change se
corrige à un seul endroit. Code dans `src/Features/Contacts/`, déclaré dans `AdminServiceProvider` :

| Classe | Rôle |
|--------|------|
| `Contact` | Logique sans hook : contact publié (`find()`), liste (`all()`), lien `tel:` (numéro français au format international), rendu de l'encart (`render()`, gabarit `partials/hero-contact.twig`, espace insécable avant « ? ! : ; ») |
| `ContactPostType` | CPT `couturier_contact` **non public** (ni URL, ni recherche, ni plan du site, ni API REST), écran classique : titre = nom interne (sert à le choisir), image mise en avant = photo. **Droits des pages** (`capability_type => 'page'` : éditeurs et administrateurs). Menu de premier niveau « Contacts » (position 22) |
| `ContactMetaBox` | Boîte « Coordonnées » (texte affiché sur plusieurs lignes, téléphone, e-mail validé ; nonce, droits) et colonnes de la liste |
| `ContactEditorData` | Liste des contacts publiés passée à l'éditeur de blocs en script en ligne (`window.couturierContacts`), lue par `blocks/_shared/contacts.js` |
| `ContactPageCache` | Purge du cache de page à l'enregistrement, à la (dé)publication et à la suppression d'un contact |

- Les blocs n'enregistrent que l'ID (`contactId`) : texte, photo et coordonnées sont lus au rendu.
  Contact supprimé, en brouillon ou à la corbeille : pas d'encart sur le site, avertissement dans
  l'éditeur (panneau « Contact »).
- Encart : `resources/views/partials/hero-contact.twig` (contenu seul, l'appelant pose
  `div.hero-contact` et sa classe), styles du contenu `block/_hero-contact.scss` ; enveloppe et
  couleurs propres à chaque héros.
- **Nested Pages** : sa personnalisation du menu d'admin (option `nestedpages_admin`) fige l'ordre
  du menu par rôle et range à la fin ce qu'elle ne connaît pas. « Contacts » y a été placé sous
  « Pages » (administrateurs, éditeurs) : réglage en base, à refaire en préprod sans synchro de la
  BDD (Réglages de Nested Pages, menu d'admin).

## Fil d'Ariane

**Données de Rank Math, balisage du thème** : `Theme\Support\Breadcrumb` lit le fil calculé par Rank
Math (`RankMath\Frontend\Breadcrumbs::get()->get_crumbs()` — accueil, pages parentes, page des
articles et catégorie principale des billets) et le rend dans `resources/views/partials/breadcrumb.twig` :
`<nav aria-label="Fil d'Ariane">` + `<ol>`, séparateur « › » décoratif en CSS, dernier élément sans
lien (Rank Math lui donne une URL : retirée) avec `aria-current="page"`. Le HTML de Rank Math
(`rank_math_the_breadcrumbs()`) n'est pas utilisé : libellé ARIA en anglais, pas de liste, séparateur
lu. Rank Math émet le JSON-LD `BreadcrumbList` (module Schema).

- Plugin absent, ou fil désactivé (Rank Math › Réglages généraux › Fil d'Ariane), ou fil réduit à
  l'accueil : rien n'est rendu. Réglages en place : fil activé, accueil « Accueil », page Blog dans
  le fil des billets — à refaire en préprod sans synchro de la BDD.
- `Breadcrumb::items()` est le **seul point de contact avec le plugin** : pour en changer, ne
  réécrire que lui.
- Affiché par le héros de page ; styles `block/_breadcrumb.scss` (classe `breadcrumb-trail`, pas
  `breadcrumb` : celle de Bootstrap).
- ⚠️ Rank Math recouvre des features SEO du socle (titre, meta description, Open Graph, panneau
  SEO, plan du site : `og:title` et `twitter:card` sortent en double) : à trancher en fin de
  chantier du héros de page — décision d'Aurélien, couper celles du socle.

## Offre du moment

Une seule offre mise en avant (ex. « Vacances de la Toussaint – Je me lance »), gérée par les
éditeurs dans l'admin (menu **Offre du moment**, sous Pages) : titre, texte, page dédiée (obligatoires
pour activer l'offre), intitulé du lien (défaut « Voir l'offre »), dates et heures de début et de fin
(fuseau du site, heure à 00:00 par défaut, instant de fin exclu : une fin au 5 novembre à 00:00
arrête l'offre à la fin du 4), interrupteur. Code dans `src/Features/CurrentOffer/` :

| Classe | Provider | Rôle |
|--------|----------|------|
| `CurrentOffer` | — | Logique sans hook : option `couturier_current_offer` (autoloadée), état, dates, bloc d'état de l'admin, `flush()` |
| `CurrentOfferSettings` | Marketing | Écran (Settings API, capacité `edit_others_pages`), validation : une saisie incohérente est enregistrée mais l'offre désactivée ; onglet « Offre du moment » de la page d'aide (cf. *Page d'aide*) |
| `CurrentOfferDashboard` | Marketing | Widget du tableau de bord : état (même bloc que l'écran, `CurrentOffer::render_status()`), aperçu « **titre** • texte lien », lien vers l'écran |
| `CurrentOfferContext` | Marketing | `current_offer` dans le contexte Timber de toutes les pages (`null` hors ligne), mis en cache dans `wp_cache` jusqu'à la prochaine date |
| `CurrentOfferPageCache` | Marketing | Purge du cache de page (`Support\PageCache`) à l'enregistrement et aux dates (tâches WP-Cron) : W3 Total Cache, WP Super Cache |

Rendu : `resources/views/partials/current-offer.twig`, bandeau au-dessus de la barre du header, inclus
par `partials/header.twig` sur la page d'accueil seulement, et en desktop seulement (≥ `xl`) ; styles
dans `partials/_header.scss`.

> ⚠️ **Production avec cache de page : vrai cron obligatoire.** Les visites servies par le cache
> n'exécutent pas WordPress, donc pas WP-Cron : la fin de l'offre ne serait purgée qu'à la visite non
> cachée suivante. `define( 'DISABLE_WP_CRON', true );` + `wp cron event run --due-now` chaque
> minute dans la crontab du serveur (en place en préprod, sous `deefuse`). Procédure complète et branchement d'un autre plugin de cache :
> `docs/mise-en-prod.md` (racine du dépôt).

## Header et méga menu

Gabarit `resources/views/partials/header.twig`, découpé en `partials/header/` (`nav`, `mega-panel`,
`mobile-menu`, `link` — lien de menu avec `aria-current` et nouvel onglet annoncé), bandeau
`partials/current-offer.twig`, styles `resources/scss/partials/_header.scss`, modules JS
`megaMenu.js`, `mobileMenu.js`, `scrollHeader.js`. Maquettes Figma (fichier
`CmEKbzTaMLwJhFUxjEGeER`) : desktop `488-191` (Auto-école), `488-643` (Formation Pro), `495-5043`
(Tarifs), `495-4576` (Le centre) ; mobile `489-795` (niveau 1), `489-848`, `489-923` (rubriques).
Code PHP dans `src/Features/Navigation/`, déclaré dans `FrontServiceProvider` :

| Classe | Rôle |
|--------|------|
| `MegaMenu` | Logique sans hook : clés des métas, variantes, arbre du menu principal (`tree()`), liens des accès rapides (`links()`) |
| `MegaMenuFields` | Champs des éléments du menu principal (Apparence › Menus), enregistrement, purge du cache de page à l'enregistrement des menus et des emplacements |
| `Header` | Logique sans hook : option `couturier_header`, actions « Se connecter » / « Être rappelé » prêtes à afficher |
| `HeaderSettings` | Écran Apparence › « En-tête » (Settings API, `edit_others_pages`), onglet « Menu et en-tête » de la page d'aide ; recherche de la page « Être rappelé » (`resources/js/editor/header-settings.js`, inline, sans build : jQuery UI Autocomplete sur `/wp/v2/pages`, pages publiées, titre seulement ; seul un champ caché porte l'ID posté) |
| `NavigationContext` | `navigation` dans le contexte Timber : `{ primary, quick_access, actions, logo_url }` |

**Données.**
- **Un seul menu** pour desktop et mobile : emplacement `primary`, **trois niveaux au plus** (au-delà,
  ignorés sans erreur). Un niveau 1 qui a des enfants ouvre un méga menu ; sans enfant, c'est un lien.
  Un seul libellé par élément, le même partout.
- **Champs natifs des éléments** (`wp_nav_menu_item_custom_fields` / `wp_update_nav_menu_item`, métas
  `_couturier_mega_*`), rendus pour le **seul menu affecté à `primary`** ; les deux groupes de champs sont
  toujours dans le DOM et affichés selon la classe `menu-item-depth-{n}` (CSS) que WordPress tient à
  jour au glisser-déposer. Cases à cocher doublées d'un champ caché à `0` (l'écran sérialise le
  formulaire dans `nav-menu-data`).
  - Niveau 1 : **variante** Orange (défaut) / Pétrole, choisie par rubrique ; **surtitre** (desktop
    seulement) ; **texte** ; **deux boutons** (libellé, adresse, nouvel onglet). Le titre de l'encart est
    toujours le libellé de l'élément. Sans surtitre, texte ni bouton : pas d'encart.
  - Niveau 2 : **intertitre** (case ; « Lien personnalisé » `#` ; ouvre un groupe des niveaux 2
    suivants, ex. « Explorer autrement ») ; **libellé du lien « Tout voir »** (vers l'URL de l'élément,
    vide = pas de lien). Sous-titre du panneau de niveau 3 = champ natif « Description » (à activer
    dans les Options de l'écran).
- **Écran des menus, performance** (`Admin\NavMenuDropdowns`, `resources/js/editor/nav-menu-dropdowns.js`,
  inline, sans build) : depuis WordPress 6.7, `nav-menu.js` remplit pour chaque élément deux listes de
  déplacement d'une option par élément — 120 éléments = 15 000 `<option>`, et Chrome figeait la page
  ~6 s au premier focus dans un champ (analyse du formulaire, une fois par chargement). Le script
  enveloppe `updateParentDropdown` / `updateOrderDropdown` (après `wpNavMenu.jQueryExtensions()`) pour
  ne remplir que les éléments dépliés : ~1,7 s restent, dus au volume du formulaire du core. Ces listes
  ne sont pas lues à l'enregistrement (champs cachés `menu-item-parent-id` / `menu-item-position`).
- L'URL d'un niveau 1 qui a des enfants n'est utilisée nulle part (c'est un bouton) : la page de la
  rubrique s'atteint par les boutons de l'encart.
- **Accès rapides** : emplacement `quick_access`, un niveau, **mobile seulement**.
- **Actions** (écran Apparence › En-tête, option autoloadée `couturier_header`) : « Se connecter »
  (adresse de l'espace élève externe, http(s) ; libellés desktop et mobile) et « Être rappelé » (page
  publiée, cherchée par son titre ; libellé). Sans adresse ou sans page : non affichée ; libellé vide :
  valeur par défaut.
- **Cache de page** : tout le cache est vidé (`Support\PageCache`) à l'enregistrement de l'écran
  En-tête, à l'enregistrement ou la suppression d'un menu et au changement des emplacements
  (`theme_mods`).

**Desktop (≥ `xl`).**
- Barre en pilule (logo, niveaux 1, « Se connecter », « Être rappelé »). Niveau 1 avec méga menu =
  `<button aria-expanded aria-controls>` (motif *disclosure navigation*, pas de `role="menu"`) suivi de
  son panneau dans le DOM ; rubrique de la page courante en orange.
- Panneau : **encart** (couleurs de la variante ; boutons = balisage du bloc Bouton, style
  `secondary` en pétrole avec pastille blanche), **colonne de niveau 2** (avec enfants = bouton à chevron
  qui choisit le panneau ; sans enfant = lien ; intertitres = `<p>` qui étiquette la liste suivante ;
  niveau 1 pointant sur la **page des articles** — Blog — : niveaux 2 sur deux colonnes remplies
  colonne par colonne sous l'intertitre, `has-columns`),
  **panneaux de niveau 3** (tous dans le HTML, un seul visible : celui de la page courante, sinon le
  premier ; liste sur deux colonnes remplies colonne par colonne, puis « Tout voir → »). Sans niveau 3
  (ex. « Le centre ») : ni filet ni panneau.
- `megaMenu.js` : ouverture au clic (reste ouvert jusqu'au clic suivant) ou au survol après 150 ms
  (refermé 300 ms après la sortie de la souris ; un clic le garde ouvert) ; un seul ouvert. Rubrique
  choisie au clic ou au survol (100 ms, pour traverser la colonne en diagonale). Clavier : flèches
  haut / bas, Début / Fin dans la colonne, flèche droite pour entrer dans le panneau, gauche pour en
  revenir. Fermeture : Échap (focus rendu au niveau 1), clic hors du header ou sur le voile, focus
  sorti du méga menu. **Voile** pétrole 40 % (`.mega-backdrop`), défilement non bloqué. Animations
  CSS (fondu + descente, fondu du panneau) rejouées au retrait de `hidden`. Sans JS : panneaux masqués.
- **Bandeau « Offre du moment »** au-dessus de la barre : accueil seulement (`is_front_page()`),
  desktop seulement, offre en ligne (cf. *Offre du moment*).

**Mobile et tablette (< `xl`).** Barre : logo (compressible, pour tenir à 320 px), « Être rappelé »,
burger. `mobileMenu.js` : panneau plein écran (`#mobile-menu`) ouvert sur l'écran de niveau 1 (rubriques
à chevron, liens, accès rapides, « Se connecter à son espace ») ; reste de la page `inert` et figé
(`html.has-mobile-menu`). Une rubrique ouvre son écran en glissant de droite à gauche (« ‹ Menu » :
sens inverse, focus rendu à la rubrique ; à l'arrivée, focus sur le titre de l'écran) : titre, texte de
l'encart (sans surtitre) et ses boutons rendus en **liens fléchés** (`.mega__all`, comme « Voir toute
l'auto-école → » de la maquette), niveaux 2 en accordéons (Collapse de Bootstrap, plusieurs ouverts,
celui de la page courante déplié), intertitres. Échap ferme (focus au burger). Sans JS : burger et
panneau masqués.

**Au défilement** (`scrollHeader.js`) : header collant (`position: sticky`), `top` négatif
(`--header-stick`) égal à la hauteur du bandeau, qui part avec la page (`is-stuck` masque ce qui en
dépasserait) ; masqué en descendant (`is-hidden`), réaffiché en remontant, sauf méga menu ou menu mobile
ouvert ou focus clavier dans le header. `transform` reste à `none` hors masquage : sinon le voile et le
menu mobile, en `position: fixed`, se placeraient par rapport au header.

**Animations** coupées sous `prefers-reduced-motion` (changement d'écran mobile immédiat).

> ⚠️ **Accessibilité** (couleurs de la maquette, cf. *Accessibilité*) : texte de l'encart pétrole
> (`text-muted` sur `surface-petrol-soft`, 4,11:1), boutons orange de l'encart (blanc sur
> `action-primary`, 2,84:1), « Être rappelé » (blanc sur `action-primary-hover`, 3,61:1) sont sous l'AA.

## Pied de page

Gabarit `resources/views/partials/footer.twig`, découpé en `partials/footer/` (`certifications`, `nav`,
`bottom`, `link` — lien de menu avec `aria-current` et nouvel onglet annoncé), styles
`resources/scss/partials/_footer.scss`. Fond orange (`surface-footer`) en pseudo-élément, décalé
sous le haut de la carte blanche des certifications, qui chevauche ainsi son bord.

- **Menus** (Apparence › Menus) : emplacement `footer`, **à deux niveaux** — chaque élément de
  premier niveau est une colonne (titre en `<h2>`, cliquable sauf lien personnalisé `#`), ses
  sous-éléments en sont les liens ; emplacement `legal` pour les liens de la barre du bas.
- **Écran Apparence › « Pied de page »** (feature `Footer\FooterSettings`, capacité `edit_others_pages`, Settings
  API comme l'offre du moment), option autoloadée `couturier_footer` (lecture : `Footer\Footer`) :
  - certifications : image de la médiathèque (SVG compris), lien facultatif et interrupteur
    « Activer » (une certification désactivée reste dans la liste mais n'est pas affichée), dans
    l'ordre d'affichage ; déplacement par une poignée « ≡ » (glisser-déposer jQuery UI Sortable comme Nested Pages, flèches
    ↑ ↓ au clavier, ou clic pour un menu Monter / Descendre / premier / dernier) ; ajout et retrait
    par boutons ; annoncés en `role="status"`
    (`resources/js/editor/footer-settings.js`, injecté en inline sur l'écran seul). Champs postés en
    tableaux parallèles (`image_id[]`, `url[]`, `enabled[]`) : l'ordre du DOM fait l'ordre enregistré
    (classes `couturier-sortable__*`, communes aux deux tableaux). Le texte
    alternatif de la médiathèque sert d'intitulé au logo (à défaut, le titre de l'image ; l'écran
    signale l'image sans alt) ;
  - réseaux sociaux : tableau réordonnable de même forme (liste fixe `Footer::NETWORKS`, sans ajout
    ni retrait), adresse et interrupteur « Activer » ; réseau sans adresse ou désactivé masqué.
    Stockés en liste `{ network, url, enabled }` ; l'ancien format `{ réseau: adresse }` est relu
    par `Footer::networks()` ;
    pastilles rendues par `partials/footer/bottom.twig`, icônes SVG en ligne
    (`source()`) depuis `resources/views/partials/footer/icons/{réseau}.svg`, en `currentColor` —
    dans les vues et non `resources/images/`, que le déploiement n'envoie pas ;
  - copyright : texte après « © année », « Groupe Couturier · Sainte-Gemme-Moronval (28) » par défaut ;
  - adresses : http(s) seulement ; une adresse invalide est retirée et signalée par une erreur qui
    nomme la ligne en cause.
- **Aide** : onglet « Pied de page » de la page d'aide (cf. *Page d'aide*), gabarit
  `resources/views/admin/help/footer.twig` ; le lien vers Apparence › Menus n'y est donné qu'à qui
  a `edit_theme_options`.
- **Cache de page** : chaque enregistrement de l'écran vide tout le cache (`Support\PageCache`), le
  pied de page étant sur toutes les pages.
- **Menu de l'admin** : sous-menu d'**Apparence** (`add_theme_page()`). Un éditeur, qui n'a pas
  `edit_theme_options`, voit « Apparence » réduit à ce seul écran. Si la personnalisation du menu de
  Nested Pages est active (option `nestedpages_admin`, par rôle), vérifier qu'elle ne masque pas
  « Apparence » pour les éditeurs.

> ⚠️ **Accessibilité** : titres de colonne en blanc sur l'orange (2,8:1, sous l'AA), choix du
> client, validation reportée (cf. `_brand.scss`). Liens et barre du bas en pétrole 900 (5,8:1).

## Page d'aide

Menu **Aide** de l'admin, tout en bas (feature `Admin\HelpScreen`, `AdminServiceProvider`), réservé
aux éditeurs et administrateurs (`edit_others_pages`) : explique aux éditeurs les fonctionnalités du
thème, **un onglet par fonctionnalité**. Seules les fonctionnalités choisies par Aurélien y figurent —
ne pas en ajouter d'office.

- **Ce sont les features qui déclarent leurs onglets**, sur le filtre `HelpScreen::TABS_FILTER`
  (`couturier_help_tabs`) : `HelpScreen` n'en connaît aucun. Retirer un provider retire l'aide de ses
  features ; sans onglet, le menu n'est pas ajouté.
- **Ajouter un onglet** : dans la feature concernée, un `add_filter( HelpScreen::TABS_FILTER, … )`
  qui ajoute `'{slug}' => [ 'label' => …, 'priority' => …, 'context' => [ … ] ]`, et le gabarit
  `resources/views/admin/help/{slug}.twig`, rendu avec `context` (URL des écrans cités…). Titres à
  partir de `h2` (le `h1` est celui de la page), textes en `__( '…', 'couturier' )`, puis
  `npm run i18n:pot`. Le gabarit reste dans `resources/views/`, comme tous les Twig du thème.
- **Ordre** : `priority` croissante (défaut `HelpScreen::DEFAULT_PRIORITY` = 10), puis ordre de
  déclaration à égalité. Numéroter de 10 en 10 pour pouvoir intercaler.
- Onglets : liens natifs `nav-tab-wrapper` vers `&tab={slug}` (`aria-current="page"` sur l'actif),
  sans JS ; un slug inconnu retombe sur le premier onglet.

| Slug | Priorité | Déclaré par |
|------|----------|-------------|
| `current-offer` | 10 | `CurrentOffer\CurrentOfferSettings::help_tab()` |
| `menu` | 15 | `Navigation\HeaderSettings::help_tab()` |
| `footer` | 20 | `Footer\FooterSettings::help_tab()` |

## Blog : permaliens

Tout le blog est rangé sous le slug de la page des articles (`blog`, Réglages › Lecture), **par
réglage, sans code** : Réglages › Permaliens, options en base (elles partent en préprod avec la
synchro de la BDD de `bin/deploy-preprod`, sinon à refaire là-bas).

- Structure personnalisée : `/blog/%category%/%postname%/` ; préfixe des catégories : `blog/categorie`
  (WordPress n'y ajoute pas le début de la structure quand il est renseigné, d'où le `blog/` en entier) ;
  préfixe des étiquettes vide.
- En WP-CLI : `wp rewrite structure '/blog/%category%/%postname%/' --category-base=blog/categorie`.

| URL | Contenu |
|-----|---------|
| `/blog/`, `/blog/page/2/` | page des articles (les règles de page passent avant celles des billets) |
| `/blog/{catégorie}/{billet}/` | billet |
| `/blog/categorie/{catégorie}/` (+ `page/N/`, `feed/`) | archive de catégorie (ses règles passent avant celles des billets) |
| `/blog/tag/…`, `/blog/author/…`, `/blog/{année}/…` | étiquettes, auteurs, dates : héritent du préfixe `/blog/` |

**Contraintes.**
- Le slug `blog` est **écrit en dur** dans les deux réglages : à mettre à jour si la page des articles
  change de slug.
- Aucune catégorie au slug `categorie` : ses billets seraient pris pour une archive de catégorie.
- Billet dans plusieurs catégories : l'URL prend celle au plus petit ID (filtre `post_link_category`
  pour une catégorie principale).
- **Futurs CPT** (`PostTypes/`) : `'rewrite' => [ 'with_front' => false, … ]`, sinon ils sont préfixés
  par `/blog/`. Idem pour une taxonomie custom.
- `/blog/{catégorie}/` répond aussi (effet de bord de `%category%`), mais pas sa pagination ni son flux
  (lus comme un billet → 404) : aucun lien n'y mène, ne pas en créer.
- Les anciennes URL `/{billet}/` et `/categorie/{catégorie}/` donnent 404, sans redirection : prévoir des
  301 si des billets sont publiés et indexés avant la mise en prod.

## Médias : conversion WebP à l'upload

`Admin\ConvertUploadsToWebp` du socle (≥ 1.10.0, déclarée dans `AdminServiceProvider`) convertit chaque
JPEG / PNG déposé en WebP sur le filtre `wp_handle_upload`, **avant** la génération des miniatures :
fichier principal, version `-scaled` et toutes les tailles sortent en WebP, l'original est supprimé.
Couvre les deux chemins d'upload : médiathèque (`upload`) et éditeur de blocs / REST (`sideload`).

- **Qualité** : JPEG → WebP à 90 (argument `quality:`). Les miniatures gardent la qualité par défaut
  du core. GIF non converti.
- **PNG adaptatif** : encodé sans perte (Imagick, repli GD) *et* à 90 ; la version avec perte n'est
  gardée que si elle allège d'au moins 50 % (argument `png_lossy_min_saving:`, `1.0` = toujours sans
  perte). En pratique : photo enregistrée en PNG → avec perte (−94 % mesuré), capture / logo / aplat
  → sans perte, pixel pour pixel (−70 %), transparence conservée.
- **Orientation EXIF** appliquée aux pixels avant conversion (le WebP perd l'EXIF) ; les autres
  métadonnées IPTC / EXIF (légende, crédit…) sont perdues.
- **Traitement côté navigateur désactivé** (`wp_client_side_media_processing_enabled` → `false`) :
  depuis WP 7.1, l'éditeur redimensionne les images dans le navigateur en HTTPS ou sur `localhost`,
  ce qui court-circuiterait la conversion.
- Une conversion impossible ne bloque jamais l'upload : l'original est alors conservé.
- Les images importées **avant** l'activation restent en JPEG / PNG.

---

## E-mails

**Tous les e-mails envoyés par `wp_mail()` partent en HTML**, dans le gabarit
`resources/views/emails/layout.twig` — feature `Mail\HtmlEmails` (`MailServiceProvider`), branchée
sur le filtre `wp_mail`. Elle couvre le core (mot de passe oublié, nouveau compte, changement
d'adresse…), dont les textes restent ceux de WordPress, les plugins et les e-mails du projet.
Reprise du projet Anytime ; mise en page des e-mails par défaut de Laravel (`illuminate/mail`) :
logo centré, carte blanche de 570px, pied discret, responsive, thème clair uniquement.

**Couleurs** (design system, cf. *Design System* — valeurs en dur, le HTML e-mail ne lit pas les
variables CSS), toutes AA (WCAG 1.4.3) : fond neutral/50 `#f6f6f6`, filet orange `#ff6b35` en tête
de carte (décoratif), bordure petrol/100 `#e0eaec`, texte petrol/900 `#00232d` (16,4:1), titres et
liens petrol/500 `#004e63` (9,25:1, liens soulignés — 1.4.1), bouton orange `#ff6b35` à texte
petrol/900 (5,79:1 ; le blanc n'y tiendrait que 2,8:1), pied petrol/400 `#3b7787` (4,65:1 sur le
fond). Le gris des e-mails Laravel (`#718096`, 4,0:1) a été écarté.

| Corps reçu | Traitement |
|------------|------------|
| Texte brut (le core) | Échappé, URL rendues cliquables, paragraphes restitués, puis inséré dans le gabarit |
| Fragment HTML (`Content-Type: text/html` déclaré) | Inséré tel quel dans le gabarit |
| Document complet (contient `<html`) | Laissé intact : son auteur gère son rendu |

Dans les deux premiers cas, le texte d'origine (ou sa version texte, déduite du fragment) part en
**alternative texte** (`multipart/alternative`), et les balises du corps sans attribut `style`
(`h1`, `h2`, `p`, `a`, `ul`, `ol`, `li`) reçoivent les styles en ligne de `HtmlEmails::TAG_STYLES`.

### Envoyer un e-mail depuis le projet

Toujours `wp_mail()`, jamais PHPMailer directement : c'est par lui que passent l'habillage,
l'alternative texte et, en local, Mailpit. Texte brut pour un message court ; pour un message mis en
forme, un **fragment Twig** dans `resources/views/emails/` qui ne contient **que le corps**, envoyé
avec l'en-tête `Content-Type: text/html` (sans lui, les balises seraient échappées) :

```php
$body = Timber\Timber::compile( 'emails/inscription-confirmee.twig', [ 'first_name' => $first_name, 'url' => home_url( '/mon-espace/' ) ] );

wp_mail( $to, __( 'Votre inscription est confirmée', 'couturier' ), $body, [ 'Content-Type: text/html; charset=UTF-8' ] );
```

```twig
{# resources/views/emails/inscription-confirmee.twig #}
{% import 'emails/macros.twig' as email %}

{# translators: %s : prénom. #}
<h1>{{ __('Bonjour %s,', 'couturier')|format(first_name) }}</h1>
<p>{{ __('Votre inscription est confirmée.', 'couturier') }}</p>

{{ email.button(url, __('Accéder à mon espace', 'couturier')) }}

{{ email.subcopy(url, __('Accéder à mon espace', 'couturier')) }}
```

| Macro (`emails/macros.twig`) | Rôle |
|-------|------|
| `email.button(url, label)` | Bouton centré orange ; pleine largeur sur mobile, forme VML pour Outlook |
| `email.subcopy(url, label)` | En fin de message, sous un filet : l'URL du bouton en clair |

- HTML nu dans le fragment : pas de classes (aucune feuille ne les suit) ; un `style` posé à la main
  remplace le style par défaut de la balise. Ni `<html>` ni `<body>`.
- Un seul `<h1>` par message ; objet en texte brut, traduit côté PHP.
- Images : PNG / JPG en URL absolue, avec `width` et `alt`. Pas de SVG.
- Pas de `add_filter( 'wp_mail_content_type', … )` : il s'appliquerait à tous les envois suivants
  de la requête. L'en-tête par envoi suffit.

**Tester** : Mailpit (`http://localhost:8025`) — rendu, onglet **Text** (alternative), onglet
**HTML Check** (compatibilité des messageries).

### Maintenir le gabarit

Règles du HTML e-mail rappelées en tête de `layout.twig` : tables `role="presentation"`, styles en
ligne (le `<style>` ne porte que le responsive), 570px max avec table fantôme pour Outlook, polices
système. Couleurs **dupliquées** entre `layout.twig`, `macros.twig` et `HtmlEmails::TAG_STYLES` :
les modifier ensemble.

**Logo** : `resources/images/email-logo.png`, PNG 440px affiché à 220px (Gmail et Outlook
n'affichent pas le SVG), rastérisé depuis `login-logo.svg` — **à régénérer avec lui** :
`magick -background none -density 300 resources/images/login-logo.svg -resize 440x -depth 8 PNG32:resources/images/email-logo.png`.
Il entre dans le build par l'entrée `resources/js/email.js` et la feature le résout par
`ViteManifest` : toujours l'URL buildée de `dist/` (servie par le `.htaccess` de préprod), jamais le
dev server — un e-mail est lu bien après son envoi. Sans build, le nom du site remplace le logo.

---

## Design System

**Source** : planche « Couturier · Design System » (Permis & Formations), transcrite dans
`resources/scss/_brand.scss` (partie 1). Toutes les valeurs ont été vérifiées une à une dans Figma
(2026-10-27).

| Fichier | Rôle |
|---------|------|
| `_brand.scss` | Valeurs sources, sans sortie CSS — partie 1, design system : primitives (`$ds-palette`, `ds-color()`), rôles sémantiques (`$ds-semantic-colors`, `ds-semantic()`), fonds de carte (`$ds-card-backgrounds`), espacements, rayons, ombres, layout et styles de texte (mobile, desktop), `to-rem()` ; partie 2, couleurs `$brand_*` de l'admin et de la connexion, tirées de la partie 1 |
| `_tokens.scss` | Émet les custom properties sur `:root` (front et éditeur, via `_content.scss`) — sauf rayons et ombres, déjà émis par Bootstrap (`--bs-border-radius-*`, `--bs-box-shadow-*`) |
| `_variables.scss` | Overrides Bootstrap tirés du design system (couleurs, polices, tailles, rayons, ombres, conteneur) |
| `_typography.scss` | Interlignes par style, classes `.text-body-medium` et `.text-eyebrow` |
| `_mixins.scss` | `text-style($nom)` : applique un style de texte complet |

**Règles d'usage :**
- Les composants n'emploient **que les tokens** : `var(--color-{rôle})`, `var(--space-{px})`,
  `var(--layout-…)`, rayons `var(--bs-border-radius[-sm|-lg|-xl|-pill])` et ombres
  `var(--bs-box-shadow[-sm|-lg])` (émis par Bootstrap depuis `$ds-radius` / `$ds-shadows`),
  `@include text-style(…)`. Jamais une primitive (`ds-color()`), jamais un hexadécimal en dur.
  `ds-color()` / `ds-semantic()` ne servent qu'à `_tokens.scss` et aux overrides Bootstrap.
- Tokens responsive (`--fs-*`, `--lh-*`, `--layout-*`) : valeur mobile, desktop à partir de `md`
  (768 px).
- Texte posé sur l'orange : `--color-text-on-accent` (pétrole foncé, 5,8:1), jamais du blanc
  (2,8:1). C'est aussi `$color-contrast-dark` de Bootstrap.
- Corps de texte = style **Body** (14 px), `.lead` = **Body L**, `small` = **Small**, `.display-1` =
  **Display**. Bootstrap ne pilote que les tailles (`var(--fs-*)`, RFS désactivé).
- `$spacers` de Bootstrap inchangés (4, 8, 16, 24, 48 px, tous dans l'échelle du design system) ;
  les autres pas n'existent qu'en `--space-*`.
- Conteneur : 1136 px de contenu (1040 sur la planche, élargi le 2026-10-28) + 24 px de marge de chaque côté, gouttière 16 px (valeurs
  desktop). Sous `xl` (menu mobile), le contenu prend la largeur de la pilule du header : 12 px de
  chaque côté au total (`partials/_layout.scss`, repris dans `editor-gutenberg.scss`). La gouttière
  mobile (14 px) reste à poser via `--layout-*`.

> **Back-office et page de connexion** : aux couleurs du design system (partie 2 de
> `resources/scss/_brand.scss`, doublée dans `AdminServiceProvider` → `AdminColorScheme`) — menu
> de gauche et barre d'admin en pétrole/700, sous-menus dépliés en pétrole/500 (plus clairs),
> boutons de connexion en pétrole/500, accent (élément courant, boutons primaires, pastilles)
> en orange/700, liens en pétrole vif `#0a7c99`, hors palette (pétrole/500 au survol ; 4,23:1, sous l'AA, assumé). **Éditeur de blocs** : couleur d'interaction en pétrole/500
> (liens et boutons de la barre latérale, interrupteurs, « Publier », focus). WordPress 7 y pose sa
> palette en style inline, depuis une table codée en dur des seuls jeux du core : un jeu personnalisé
> retombe sur le bleu `#3858e9`. `admin-colors.scss` (section « Éditeur de blocs ») la remplace en
> `!important` sur les éléments qui portent ce bleu — à revoir si WordPress permet un jour de
> déclarer la couleur d'un jeu personnalisé. L'orange de la charte ne tenant pas
> 4,5:1 avec du texte blanc, ni orange/700 sur le fond `#f0f0f1` de l'admin, cf. en-tête de la
> partie 2.
>
> **Favicons** : `theme-color` en petrol/500 `#004e63` (clair comme sombre), dans
> `FrontServiceProvider` → `Favicons` et `bin/favicons.config.mjs` ; fond de l'apple-touch-icon en
> blanc. SVG sources : `favicon-light.svg` en petrol/500 `#004e63` et orange/500 `#ff6b35` ;
> `favicon-dark.svg` reprend le même dessin, pétrole remplacé par du blanc.
>
> **Front** : encore sur Bootstrap — overrides dans `_variables.scss`.
>
> **Polices** (licence SIL OFL, fichiers et licences dans `resources/fonts/`, `@font-face` dans
> `_fonts.scss`) :
>
> | Famille | Graisses | Usage | Variable Bootstrap |
> |---------|----------|-------|--------------------|
> | Red Hat Display | Black 900 (titre du CTA), ExtraBold 800 (Display), Bold 700 (titres), Regular 400 (partie non grasse du titre sur l'image du héros de page) | Titres, `.display-1` | `$headings-font-family` |
> | Space Grotesk | Regular 400, Medium 500, Bold 700 | Texte courant | `$font-family-sans-serif` |
>
> Une graisse = un fichier woff2 (~15 Ko), instance statique de la police variable de Google Fonts,
> réduite aux glyphes du français (le script de génération est décrit en tête de `_fonts.scss`).
> Aucune autre graisse ni italique n'existe : ne pas utiliser `fw-light`, `fw-semibold`…, qui
> retomberaient sur la graisse la plus proche ; l'italique (`<em>`) est simulé par le navigateur.
> Les mêmes `@font-face` valent pour le front et le canvas de l'éditeur. La page de connexion et
> les e-mails restent en polices système.

---

## Git

Le dépôt Git est le **dossier du thème** (remote `git@github.com:achappard/couturier-wp.git`). Branches : `master` (livré), `dev` (intégration), `feature/{nom}` créées depuis `dev`.

Messages de commit : `<emoji> <type>. <message>` — ex. `✨ feat. ajout du bloc hero`
Types : `feat.`, `fix.`, `refactor.`, `docs.`, `chore.`, `style.`, `test.`
Toujours proposer le message avant de committer, et ne jamais committer sans validation explicite.

`.gitignore` du thème : `vendor/`, `node_modules/`, `dist/`, les fichiers de traduction compilés
(`languages/*.mo`, `*.l10n.php`, `*.json`), fichiers d'IDE / OS, logs et `.env`.

**`composer.lock` et `package-lock.json` sont versionnés** : ce sont eux qui garantissent que le
déploiement installe exactement les versions testées en local. Ne pas les ajouter au `.gitignore`.
