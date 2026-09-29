# CLAUDE.md — Blocs Gutenberg du thème Couturier

Règles de conception des blocs custom (`blocks/{nom}/`). Elles complètent la section « Blocs
Gutenberg » du `CLAUDE.md` du thème (build, `BlockLoader`, styles), sans la répéter.

---

## Exigences de l'éditeur (non négociables)

Tout bloc custom doit satisfaire, dans l'éditeur WordPress :

1. **Le compteur de mots** (panneau Structure : « Mots », « Caractères », temps de lecture) compte
   **tout le texte saisi** dans le bloc.
2. **Le panneau Structure** liste **chaque titre** (`h2` / `h3`) du bloc, avec son niveau.

Et une préférence : **utiliser des attributs du bloc chaque fois que c'est possible**, plutôt que des
blocs imbriqués (InnerBlocks). Un bloc à attributs est plus simple à saisir (un seul bloc, pas de
sélection séparée, pas de cadenas) et son balisage est entièrement maîtrisé.

---

## Comment WordPress calcule ces deux informations

Vérifié dans le code de l'éditeur (WordPress 7.1, `wp-includes/js/dist/editor.min.js`) :

- **Compteur de mots** : il lit le **contenu sérialisé** du post (`getEditedPostAttribute('content')`)
  et en retire les commentaires HTML (`HTMLcommentRegExp` de `@wordpress/wordcount`). Seul le texte
  présent **dans le HTML enregistré** est compté ; un attribut rangé dans le commentaire
  `<!-- wp:couturier/… {"attr":"…"} -->` ne l'est pas.
- **Panneau Structure** : il parcourt tous les blocs, imbriqués compris
  (`getClientIdsWithDescendants()`), mais ne retient **que les blocs `core/heading`**, en dur, sans
  filtre d'extension. Un `<h2>` produit par un bloc custom (attribut, `render.php`, `save()`) n'y
  apparaît **jamais**. La même limite vaut pour `core/table-of-contents`.

---

## Règle de décision

| Contenu du bloc | Implémentation |
|---|---|
| **Titre** (`h2` / `h3`) | **Toujours** un `core/heading` imbriqué (InnerBlocks) — seule façon d'apparaître dans le panneau Structure |
| **Texte** (sur-titre, accroche, paragraphe, libellé…) | **Attribut** `"type": "string", "source": "html", "selector": "…"`, écrit dans le HTML par `save()` |
| Texte long, libre, multi-paragraphes | Blocs imbriqués (`core/paragraph`, `core/list`) si la saisie libre l'exige ; sinon attribut |
| Donnée non textuelle (image, URL, booléen, choix) | Attribut classique (stocké dans le commentaire, non compté — c'est voulu) |

**Un attribut de texte doit avoir `"source": "html"`.** Sans source, WordPress stocke la valeur dans
le commentaire JSON du bloc : elle n'est pas comptée, et si `save()` l'écrit aussi en HTML, le texte
est stocké deux fois (cas du `hero` d'Emil'Volt, à ne pas reproduire).

**Rendu 100 % `render.php` (dynamique pur) = texte non compté.** Un bloc dont tout le texte est en
attributs et que seul `render.php` affiche échoue à l'exigence 1. Le texte doit passer par `save()`.

---

## Nommage : les blocs portent un nom anglais

Le **nom technique** d'un bloc est **en anglais**, en kebab-case, et se retrouve partout à l'identique :

| Élément | Exemple |
|---|---|
| `name` dans `block.json` | `couturier/section-title` |
| Dossier des sources | `blocks/section-title/` |
| Partial SCSS | `resources/scss/block/_section-title.scss` |
| Classe générée par WordPress | `.wp-block-couturier-section-title` |

- Le **libellé affiché** dans l'inserteur (`"title"` du `block.json`), la description et les mots-clés
  restent **en français** : ce sont des chaînes traduisibles (`"textdomain": "couturier"`), et les
  chaînes sources du thème sont rédigées en français.
- **Ne jamais renommer un bloc déjà utilisé dans un contenu** : le `name` est enregistré dans chaque
  page (`<!-- wp:couturier/… -->`), un renommage rend toutes ses instances orphelines (« bloc non pris
  en charge »). Choisir le nom anglais dès la création.

## Architecture type — exemple : un titre avec sur-titre

Exemple tiré d'un bloc d'essai « Titre avec sur-titre » (`couturier/titre`, supprimé depuis) : un
sur-titre en attribut, un titre en `core/heading` imbriqué. Il a été validé dans l'éditeur sur les deux
exigences. Son nom français est antérieur à la règle de nommage ci-dessus : un tel bloc s'appellerait
aujourd'hui `couturier/section-title`. Remplacer `titre` / `surtitre` par le nom du bloc et de ses
attributs.

```
blocks/{nom}/
├── block.json   ← attribut texte en "source": "html" ; "render": "file:./render.php"
├── index.js     ← edit (RichText + InnerBlocks du titre) ; save (texte + InnerBlocks.Content)
└── render.php   ← enveloppe seulement, autour de $content
```

### `block.json`

```json
"attributes": {
	"surtitre": { "type": "string", "source": "html", "selector": "p", "role": "content" }
}
```

- Le `selector` ne voit que le HTML **du bloc lui-même** : WordPress retire celui des blocs imbriqués
  avant de lire les attributs. Un `p` ne capture donc pas un paragraphe imbriqué.
- Avec plusieurs attributs texte de même balise, cibler par classe (`"selector": "p.xxx__accroche"`).

### `save()` : texte en attributs + blocs imbriqués

```js
save: ( { attributes } ) => (
	<>
		{ ! RichText.isEmpty( attributes.surtitre ) && (
			<RichText.Content tagName="p" className="wp-block-couturier-titre__surtitre" value={ attributes.surtitre } />
		) }
		<InnerBlocks.Content />
	</>
),
```

- **N'enregistrer que le contenu, pas l'enveloppe** : l'élément conteneur (`<hgroup>`, `<section>`…)
  est produit par `render.php` à partir de `$content`. Il peut ainsi évoluer sans invalider les pages
  existantes.
- **Tout balisage écrit par `save()` est figé** : changer la balise ou la classe d'un attribut texte
  impose une entrée `deprecated` dans le bloc, sinon « contenu inattendu » sur les pages existantes.
- Ne rien écrire pour un texte vide (`RichText.isEmpty`).

### `edit()` : placer un champ texte avant les blocs imbriqués

```js
const { children, ...innerBlocksProps } = useInnerBlocksProps( useBlockProps(), {
	template: [ [ 'core/heading', { level: 2, placeholder: __( 'Titre', 'couturier' ) } ] ],
	templateLock: 'all',
} );

return (
	<hgroup { ...innerBlocksProps }>
		<RichText tagName="p" className="…" value={ … } onChange={ … } allowedFormats={ [] } disableLineBreaks />
		{ children }
	</hgroup>
);
```

`children` est extrait de `useInnerBlocksProps` pour intercaler les champs RichText où on veut par
rapport aux blocs imbriqués.

### `render.php`

```php
printf( '<hgroup %s>%s</hgroup>', get_block_wrapper_attributes(), $content );
```

---

## Titres imbriqués : ce qu'il faut savoir

- **Verrouiller la structure** avec `templateLock: 'all'` (ni suppression, ni déplacement, ni ajout).
  **Pas `contentOnly`** : testé, il ajoute un bouton « Modifier la composition » (barre d'outils et
  barre latérale) qui lève le verrou, sans réglage pour le retirer sur un bloc custom.
- **Cadenas « Déverrouiller »** : il apparaît sur le titre imbriqué verrouillé et permet de lever le
  verrou. Accepté en l'état (sa suppression passerait par `canLockBlocks: false`, global au site, écarté).
- **Niveau H2 / H3** : depuis WordPress 7, `core/heading` change de niveau par ses variations H1…H6,
  dont le sélecteur de barre d'outils disparaît sous `templateLock: 'all'`. Poser un
  `HeadingLevelDropdown` dans `BlockControls` — sur le bloc, et sur le titre imbriqué via le filtre
  `editor.BlockEdit` (c'est lui que l'utilisateur sélectionne le plus souvent) :

  ```js
  const getLevels = () => getBlockType( 'core/heading' )?.attributes?.levelOptions?.default ?? [ 2, 3 ];

  function LevelControl( { clientId, level } ) {
  	const { updateBlockAttributes } = useDispatch( blockEditorStore );
  	return (
  		<BlockControls group="block">
  			<HeadingLevelDropdown value={ level } options={ getLevels() }
  				onChange={ ( newLevel ) => updateBlockAttributes( clientId, { level: newLevel } ) } />
  		</BlockControls>
  	);
  }

  // Dans edit() du bloc : le titre imbriqué, à passer à <LevelControl>.
  const heading = useSelect( ( select ) => select( blockEditorStore ).getBlocks( clientId )
  	.find( ( block ) => block.name === 'core/heading' ), [ clientId ] );

  // Sur le titre lui-même, quand il est sélectionné dans le bloc (sans effet ailleurs).
  addFilter( 'editor.BlockEdit', 'couturier/{nom}/heading-level', createHigherOrderComponent(
  	( BlockEdit ) => ( props ) => {
  		const isInBlock = useSelect( ( select ) => props.name === 'core/heading' &&
  			select( blockEditorStore ).getBlockParentsByBlockName( props.clientId, metadata.name ).length > 0,
  			[ props.name, props.clientId ] );
  		return <>
  			{ isInBlock && props.isSelected && <LevelControl clientId={ props.clientId } level={ props.attributes.level } /> }
  			<BlockEdit { ...props } />
  		</>;
  	}, 'withHeadingLevel' ) );
  ```
- **L'attribut `levelOptions` d'une instance est ignoré** : ne pas le mettre dans un template.
- **Niveaux limités à H2 / H3 sur tout le site** par la feature `Theme\Features\Blocks\RestrictHeadingLevels`
  (variations restreintes + garde-fou JS qui corrige Markdown, collage, éditeur de code). Un bloc n'a
  donc pas à corriger lui-même un niveau hors plage. Un futur H1 (bloc héro) devra être exclu de cette
  feature.
- Le titre reste un `core/heading` : classes `wp-block-heading`, ancres automatiques, variations.

---

## Styles

- Partial `resources/scss/block/_{nom}.scss`, importé dans `app.scss` **et** en tête de
  `editor-gutenberg.scss` (`@use`, avant toute règle).
- **Cibler les attributs texte par leur classe** (`.wp-block-couturier-titre__surtitre`), identique dans
  l'éditeur (RichText) et dans le HTML enregistré.

---

## Vérifier un bloc (obligatoire avant de le déclarer terminé)

Dans l'éditeur, sur une page de test, **en saisissant comme un utilisateur** (clics et frappe — pas
seulement en posant des attributs par JS : c'est ainsi qu'un sélecteur de niveau invisible est passé
inaperçu) :

1. Panneau Structure : chaque titre du bloc listé avec son niveau.
2. Compteur de mots : il inclut **tous** les textes du bloc (le comparer au total attendu).
3. Contenu enregistré (`wp.data.select('core/editor').getEditedPostContent()`) : chaque texte est
   dans le HTML, hors des commentaires `<!-- wp:… -->`.
4. Enregistrer, recharger : bloc et blocs imbriqués **valides** (`isValid`), attributs relus.
5. Titre imbriqué : non supprimable (`canRemoveBlock` → `false`), sélecteur de niveau visible.
6. Front : balisage attendu, `logs/debug.log` vide. Supprimer la page de test.
