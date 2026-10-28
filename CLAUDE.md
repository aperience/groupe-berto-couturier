# CLAUDE.md — Thème Couturier

Documentation d'architecture du thème WordPress `couturier`. Ce fichier couvre le thème (code, build,
conventions) ; l'environnement Docker (services, ports, base de données, WP-CLI) est documenté dans le
`CLAUDE.md` à la racine du dépôt (`04 - Code`). Les deux sont versionnés dans le même dépôt.

Le thème est né du squelette `wp-theme-skeleton` (v1.7.3), adapté à l'environnement Docker : dev
server Vite en HTTP dans le conteneur `node` (pas de mkcert), `bin/wp` en `--allow-root`, et
`BlockLoader` écrit dans le thème (annoncé par le squelette, absent du squelette comme du socle).

Namespaces PHP : `Theme\` pour le code du projet (`src/`), `Deefuse\ThemeCore\` pour le socle,
installé en dépendance Composer. Text-domain du thème : `couturier`.

---

## Accessibilité — niveau AA obligatoire

**Le thème doit impérativement respecter le niveau AA des WCAG 2.2** (référentiel français :
RGAA 4.1, fondé sur le niveau AA des WCAG). L'exigence vaut pour tout ce que le thème produit : HTML
des gabarits Twig et des blocs (`render.php`, `save()`), CSS, JavaScript, et interface des blocs
custom dans l'éditeur.

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
  (`RestrictHeadingLevels`) : le `<h1>` de chaque page est produit par le gabarit Twig.
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

Dans l'environnement Docker, les commandes `npm` tournent dans le conteneur `node` (dont le répertoire
de travail est le thème) et `composer` dans le conteneur `cli` :

```bash
docker compose exec node npm run <script>
docker compose exec -w /var/www/html/wp-content/themes/couturier cli composer install
```

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

> **Règle :** si aucun provider existant ne correspond au domaine de la feature, **ne pas en créer un
> d'office** — proposer le nouveau provider à Aurélien et attendre son accord explicite avant de l'ajouter
> (fichier `src/Providers/`, `use` + ajout à la liste de `functions.php`, ligne dans ce tableau).

### Providers et catégories de features

| Provider | Rôle | Dossiers `Features/` associés |
|----------|------|-----------------------------------|
| `SetupServiceProvider` | Initialisation du thème, chargé en premier | `Setup/` — `ThemeSupport`, `Menus`, `TwigDump` |
| `SecurityServiceProvider` | Durcissement : surface d'attaque et informations publiées | `Security/` — `DisableApplicationPasswords`, `DisableUserEnumeration`, `DisableXmlRpc`, `HideLoginErrors`, `SecurityHeaders` |
| `FrontServiceProvider` | Front-end public | `Front/` — `Assets`, `CleanHead`, `Favicons`, désactivation des styles de blocs core / dashicons / emojis / heartbeat |
| `AdminServiceProvider` | Back-office, éditeur, contenus | `Admin/` (socle) — blocs autorisés, supports natifs des blocs, admin bar, dashboard, connecteurs, verrouillage de l'éditeur de site / personnaliseur, sélecteur de langue et lien « Politique de confidentialité » du login (page de connexion réservée à l'équipe ; à revoir si l'inscription est ouverte), icône du site, mises à jour, commentaires, publication par e-mail, services de mise à jour, jeu de couleurs, pied de page, styles du canvas de l'éditeur, logo de login, interrupteur d'affichage du titre, support SVG, conversion WebP à l'upload<br>`Admin/` (thème) — `NestedPagesLinks` (lien « Pages publiées » du tableau de bord et bouton de retour de l'éditeur des pages vers Nested Pages, si l'extension est active), `HelpScreen` (menu « Aide », cf. *Page d'aide*)<br>`Blocks/` (thème) — `BlockLoader` (auto-découverte de `dist/blocks/*/block.json`), `RestrictHeadingLevels` (titres limités à H2 / H3 partout), `DisableDropCap` (pas de lettrine sur les paragraphes), `ButtonStyles` (boutons du design system sur `core/button`, cf. *Blocs Gutenberg*)<br>`PostTypes/` (thème, à venir) — déclaration des CPT et de leurs metas |
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
Il passe `--allow-root` : dans l'environnement Docker, il tourne dans le conteneur `node`, en root.

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
- `macros/ui.twig` — macros réutilisables (boutons, etc.)
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
  (cf. `macros/ui.twig`) — l'échappement automatique ne s'applique pas aux concaténations `{% set %}`.
- **`|e('esc_url')|raw` sur toute URL placée dans un `href` / `src`** qui ne vient pas d'une valeur
  sûre (champ saisi dans l'admin, option, attribut de bloc) : l'échappement HTML laisse passer
  `javascript:`, `esc_url` l'écarte (chaîne vide). Le `|raw` est nécessaire : sa sortie est déjà
  prête pour un attribut, l'échappement automatique doublerait les `&` (cf. `macros/ui.twig`).
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
├── _brand.scss            ← charte : design system + ancienne palette de l'admin (cf. *Design System*)
├── _mixins.scss
├── _fonts.scss            ← @font-face
├── partials/              ← layout du site (header, footer, navigation…) — front uniquement
└── block/                 ← un fichier _{nom-du-bloc}.scss par bloc Gutenberg
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
  argument `levels:`). Elle réécrit le défaut de l'attribut `levelOptions` de tout bloc à niveau
  (`core/heading`, `core/post-title`…) — depuis WordPress 7, le core en déduit les variations H1…H6
  proposées — et injecte dans l'éditeur un garde-fou (`resources/js/editor/restrict-heading-levels.js`)
  qui ramène au plus proche tout autre niveau créé par raccourci Markdown, collage ou éditeur de code.
  Un bloc custom qui imbrique un `core/heading` verrouillé (`templateLock: 'all'`) perd le sélecteur de
  variations de la barre d'outils : il pose son propre `HeadingLevelDropdown` (cf. `blocks/CLAUDE.md`)
- Blocs conteneur / enfant : le parent déclare `allowedBlocks`, l'enfant déclare `parent`
- Fournir un `example` dans `block.json` pour la prévisualisation de l'inserter
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

## Offre du moment

Une seule offre mise en avant (ex. « Vacances de la Toussaint – Je me lance »), gérée par les
éditeurs dans l'admin (menu **Offre du moment**, sous Pages) : titre, texte, page dédiée (obligatoires
pour activer l'offre), intitulé du lien (défaut « Découvrir l'offre »), dates et heures de début et de fin
(fuseau du site, heure à 00:00 par défaut, instant de fin exclu : une fin au 5 novembre à 00:00
arrête l'offre à la fin du 4), interrupteur. Code dans `src/Features/CurrentOffer/` :

| Classe | Provider | Rôle |
|--------|----------|------|
| `CurrentOffer` | — | Logique sans hook : option `couturier_current_offer` (autoloadée), état, dates, bloc d'état de l'admin, `flush()` |
| `CurrentOfferSettings` | Marketing | Écran (Settings API, capacité `edit_others_pages`), validation : une saisie incohérente est enregistrée mais l'offre désactivée ; onglet « Offre du moment » de la page d'aide (cf. *Page d'aide*) |
| `CurrentOfferDashboard` | Marketing | Widget du tableau de bord : état (même bloc que l'écran, `CurrentOffer::render_status()`), aperçu « **titre** • texte lien », lien vers l'écran |
| `CurrentOfferContext` | Marketing | `current_offer` dans le contexte Timber de toutes les pages (`null` hors ligne), mis en cache dans `wp_cache` jusqu'à la prochaine date |
| `CurrentOfferPageCache` | Marketing | Purge du cache de page à l'enregistrement et aux dates (tâches WP-Cron) : W3 Total Cache, WP Super Cache |

Rendu : `resources/views/partials/current-offer.twig`, inclus par `page.twig` ; sans styles, à habiller
avec le héros.

> ⚠️ **Production avec cache de page : vrai cron obligatoire.** Les visites servies par le cache
> n'exécutent pas WordPress, donc pas WP-Cron : la fin de l'offre ne serait purgée qu'à la visite non
> cachée suivante. `define( 'DISABLE_WP_CRON', true );` + `wp cron event run --due-now` chaque
> minute dans la crontab du serveur (en place en préprod, sous `deefuse`). Procédure complète et branchement d'un autre plugin de cache :
> `docs/mise-en-prod.md` (racine du dépôt).

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
- Les images importées **avant** l'activation restent en JPEG / PNG. `wp media regenerate` ne sait
  pas les régénérer en local : le conteneur `cli` n'a ni Imagick ni GD, et le conteneur `php` n'a pas
  WP-CLI.

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
| `_brand.scss` | Valeurs sources, sans sortie CSS — partie 1, design system : primitives (`$ds-palette`, `ds-color()`), rôles sémantiques (`$ds-semantic-colors`, `ds-semantic()`), espacements, rayons, ombres, layout et styles de texte (mobile, desktop), `to-rem()` ; partie 2, ancienne charte `$brand_*` (admin, connexion) |
| `_tokens.scss` | Émet les custom properties sur `:root` (front et éditeur, via `_content.scss`) |
| `_variables.scss` | Overrides Bootstrap tirés du design system (couleurs, polices, tailles, rayons, ombres, conteneur) |
| `_typography.scss` | Interlignes par style, classes `.text-body-medium` et `.text-eyebrow` |
| `_mixins.scss` | `text-style($nom)` : applique un style de texte complet |

**Règles d'usage :**
- Les composants n'emploient **que les tokens** : `var(--color-{rôle})`, `var(--space-{px})`,
  `var(--radius-{sm|md|lg|xl|full})`, `var(--shadow-{card|floating|nav})`, `var(--layout-…)`,
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
- Conteneur : 1040 px de contenu + 24 px de marge de chaque côté, gouttière 16 px (valeurs
  desktop). Les valeurs mobiles (marge 12 px, gouttière 14 px) sont à poser à l'intégration du
  layout, via `--layout-*`.

> **Back-office et page de connexion** : aux couleurs du design system (partie 2 de
> `resources/scss/_brand.scss`, doublée dans `AdminServiceProvider` → `AdminColorScheme`) — menu
> et boutons de connexion en bleu pétrole, accent (élément courant, boutons primaires, pastilles)
> en orange/700, liens en pétrole, sous-menus en pétrole/700. L'orange de la charte ne tenant pas
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
> | Red Hat Display | ExtraBold 800 (Display), Bold 700 (titres) | Titres, `.display-1` | `$headings-font-family` |
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

Le dépôt Git est à la **racine du projet** (`04 - Code`, remote `git@github.com:achappard/couturier-wp.git`) :
il versionne l'environnement Docker et le thème, et ignore le reste de `wordpress/` (cf. `CLAUDE.md`
racine). Branches : `master` (livré), `dev` (intégration), `feature/{nom}` créées depuis `dev`.

Messages de commit : `<emoji> <type>. <message>` — ex. `✨ feat. ajout du bloc hero`
Types : `feat.`, `fix.`, `refactor.`, `docs.`, `chore.`, `style.`, `test.`
Toujours proposer le message avant de committer, et ne jamais committer sans validation explicite.

`.gitignore` du thème : `vendor/`, `node_modules/`, `dist/`, les fichiers de traduction compilés
(`languages/*.mo`, `*.l10n.php`, `*.json`), fichiers d'IDE / OS, logs et `.env`.

**`composer.lock` et `package-lock.json` sont versionnés** : ce sont eux qui garantissent que le
déploiement installe exactement les versions testées en local. Ne pas les ajouter au `.gitignore`.
