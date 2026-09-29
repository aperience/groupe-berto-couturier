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

## Commandes

Dans l'environnement Docker, les commandes `npm` tournent dans le conteneur `node` (dont le répertoire
de travail est le thème) et `composer` dans le conteneur `cli` (agent SSH transmis pour le socle privé) :

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
npm run i18n:compile  # Recompile .mo / .l10n.php / JSON depuis les .po (inclus dans `build`)
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

**Le socle est une dépendance Composer**, tirée d'un dépôt privé déclaré en `repositories` de type
`git` (et non `vcs` : avec une URL SSH, le driver GitHub tente une URL `dist` sur `api.github.com`,
inaccessible à une deploy key, et chaque `composer install` d'un serveur essuierait un 404 avant de
retomber sur le clone). Sa documentation complète est dans son propre README.

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
└── SeoServiceProvider.php

vendor/deefuse/wp-theme-core/src/          ← le socle (lecture seule, ne jamais éditer ici)
├── Kernel.php                             ← Singleton : Timber + chargement des providers
├── ThemeContext.php                       ← identité du thème, transmise aux providers
├── Contracts/
│   ├── FeatureInterface.php               ← register(): void
│   └── ServiceProviderInterface.php       ← static features( ThemeContext ): array
├── Features/{Categorie}/                  ← une classe = une feature
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
2. Implémenter `FeatureInterface` → méthode `register()` qui pose les `add_action` / `add_filter`
3. L'ajouter au tableau `features()` du provider adapté (cf. table ci-dessous), avec son `use`

### `Support/` : le code qui n'est pas une feature

Une classe de `Support/` ne pose aucun hook, n'implémente pas `FeatureInterface` et n'est déclarée
dans aucun provider : elle n'existe que pour être appelée par des features, et n'a donc pas de
« moment d'exécution » propre. Dans le socle, `Support/` est le seul dossier dans ce cas.

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
| `AdminServiceProvider` | Back-office, éditeur, contenus | `Admin/` (socle) — blocs autorisés, supports natifs des blocs, admin bar, dashboard, connecteurs, verrouillage de l'éditeur de site / personnaliseur, sélecteur de langue du login, icône du site, mises à jour, commentaires, jeu de couleurs, pied de page, styles du canvas de l'éditeur, logo de login, interrupteur d'affichage du titre, support SVG, conversion WebP à l'upload<br>`Blocks/` (thème) — `BlockLoader` (auto-découverte de `dist/blocks/*/block.json`), `RestrictHeadingLevels` (titres limités à H2 / H3 partout)<br>`PostTypes/` (thème, à venir) — déclaration des CPT et de leurs metas |
| `SeoServiceProvider` | Référencement | `Seo/` — `DocumentTitle`, `MetaDescription`, `SitemapExclusion`, `SeoPanel` (panneau de l'éditeur), `OpenGraph` |

Le dossier de la feature suit sa **nature** (`Security/`, `Blocks/`, `PostTypes/`…), le provider suit son
**domaine de responsabilité**. C'est pourquoi plusieurs dossiers peuvent alimenter un même provider.

Ces domaines sont de deux familles. `Setup`, `Front` et `Admin` désignent un **moment d'exécution** :
initialisation, rendu public, back-office. `Security` et `Seo` désignent une **préoccupation
transverse**, qui traverse ces moments — le durcissement touche le front, l'API REST, la page de
connexion et `xmlrpc.php` ; le SEO touche le rendu public et l'éditeur. Ranger une feature de
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

**Tous les textes en dur** dans le PHP et les blocs passent par les fonctions i18n. Les templates
Twig, eux, ne contiennent aucun appel i18n : ils reçoivent des chaînes déjà traduites (cf. plus bas).

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
- JS (éditeur Gutenberg) : `import { __ } from '@wordpress/i18n'` + `"textdomain": "couturier"` dans `block.json`

### Règle Twig : pas de `__()` dans les templates

`wp i18n make-pot` **ne lit pas les fichiers `.twig`**. Un `{{ __('Texte', 'couturier') }}` s'afficherait
correctement mais n'atteindrait jamais le `.pot` : le template aurait l'air traduisible sans l'être.

Les chaînes sont donc résolues dans le wrapper PHP et passées au contexte, regroupées sous `labels` :

```php
// 404.php
$context['labels'] = [
    'title'     => __( 'Erreur 404 — Page introuvable', 'couturier' ),
    'back_home' => __( 'Retour à la page d\'accueil', 'couturier' ),
];
```

```twig
{# 404.twig #}
<h1>{{ labels.title }}</h1>
```

### Chaîne de traduction

Cinq formats, dont deux seulement sont écrits à la main et versionnés :

| Fichier | Rôle | Produit par | Versionné |
|---------|------|-------------|-----------|
| `languages/couturier.pot` | Gabarit : les chaînes source du projet | `npm run i18n:pot` | oui |
| `languages/{locale}.po` | Une langue : chaîne + traduction, format texte | le traducteur (Poedit) | oui |
| `languages/{locale}.mo` | Le `.po` compilé — byproduct local, sans usage en production | Poedit, à l'enregistrement | non |
| `languages/{locale}.l10n.php` | Même contenu en tableau PHP, **format que charge WordPress en priorité** (`translation_file_format`, défaut `'php'` depuis WP 6.5) | `npm run build` | non |
| `languages/couturier-{locale}-{md5}.json` | Traductions JS, chargées par `wp_set_script_translations()` | `npm run build` | non |

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

> **Ne jamais ajouter `--no-location`.** Les références `#: blocks/hero/index.js:42` sont ce sur quoi
> `make-json` s'appuie pour distinguer les chaînes JS des chaînes PHP. Sans elles, le build réussit
> et l'éditeur Gutenberg reste en anglais.

#### `npm run i18n:compile` — automatique, à chaque build

Enchaîne `make-php` et `make-json`, précédés de `node bin/i18n-js-map.mjs`. Pas de `make-mo` : voir
plus haut pourquoi `.mo` n'est plus produit par le build.

Ce dernier existe pour une raison précise : le nom d'un JSON de traduction est un **md5 du chemin du
script tel que WordPress l'enfile**, donc du fichier compilé (`dist/blocks/hero/index.js`), alors que
les références du `.po` pointent vers la source (`blocks/hero/index.js`). Le script génère la table de
correspondance `dist/i18n-js-map.json` passée à `make-json --use-map`. Sans elle, les JSON sont créés
avec le mauvais nom et WordPress ne les trouve jamais — sans erreur, là encore.

Il cartographie les blocs (tout le dossier d'un bloc est fondu dans `dist/blocks/{nom}/index.js`,
sauf `view.js`) et les points d'entrée Vite via le manifest. **Limite connue :** un module importé par
une entrée Vite (ex. `resources/js/credits.js` importé par `app.js`) n'apparaît pas dans le manifest
et n'est donc pas cartographié — garder les chaînes traduisibles dans le fichier d'entrée.

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

Poedit ignore en revanche complètement les JSON du JavaScript et le format `.l10n.php` : ceux-là ne
peuvent venir que du build.

---

## Templates Twig (`resources/views/`)

Rendu via **Timber 2.x**. Configuration dans `Kernel::init_timber()`, alimentée par `ThemeContext::$view_paths` :
`Timber::$dirname = ['resources/views']`, et l'échappement automatique est **activé**
(`autoescape => 'html'` via le filtre `timber/twig/environment/options`, cf. `Kernel::set_twig_options()`).

- `base.twig` — layout master, blocks Twig : `header`, `content`, `footer`
- `page.twig`, `single.twig`, `index.twig`, `404.twig` — étendent `base.twig`
- `partials/` — header, footer, navigation, favicon
- `macros/ui.twig` — macros réutilisables (boutons, etc.)

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
├── _brand.scss            ← palette de marque
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

---

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

## Design System

> **À définir.** Aucune guideline de design n'est disponible à ce stade.
>
> Tant que la charte n'est pas fournie : ne pas inventer de palette, de typographie ni d'échelle
> d'espacement « définitives ». Les couleurs actuelles sont celles de Bootstrap, posées comme
> placeholders dans `resources/scss/_brand.scss` (doublées dans `AdminServiceProvider` →
> `AdminColorScheme`, et pour `theme-color` dans `FrontServiceProvider` → `Favicons` et
> `bin/favicons.config.mjs`) ; les overrides Bootstrap vont dans `_variables.scss`. Signaler
> explicitement tout choix provisoire.
>
> Cette section sera complétée avec : polices, palette de couleurs, breakpoints, échelle typographique,
> espacements et règles de layout.

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
