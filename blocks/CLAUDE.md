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
| Texte **placé entre deux blocs imbriqués** (ex. texte du CTA, entre le titre et les boutons) | `core/paragraph` imbriqué, verrouillé : un bloc n'a qu'une zone d'imbrication, un attribut ne s'écrit qu'avant ou après elle (dans `save()` comme dans `edit()`) |
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
exigences. Son nom français est antérieur à la règle de nommage ci-dessus. Le bloc
`couturier/section-title` en est la version en place, avec un sous-titre écrit **après** le titre.
Remplacer `titre` / `surtitre` par le nom du bloc et de ses attributs.

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
- **Ne passer le `template` qu'à l'insertion** (`template: blocks.length ? undefined : TEMPLATE`, où
  `blocks` sont les blocs imbriqués). Sous `templateLock: 'all'`, WordPress resynchronise les blocs
  imbriqués avec le modèle **à chaque ouverture de l'éditeur, en profondeur** et sans trace dans
  l'historique (`useInnerBlockTemplateSync`) : un bloc imbriqué supprimé (bouton, groupe) revient au
  rechargement. Contrepartie : un titre retiré par l'éditeur de code n'est plus recréé — le bloc doit
  alors ne rien rendre (cf. `render.php` du CTA) et avertir dans l'éditeur.
- **Cadenas « Déverrouiller »** : il apparaît sur tout bloc imbriqué verrouillé et lève le verrou ; une
  fois levé, le titre peut être supprimé, déplacé, transformé en paragraphe ou changé de niveau. Le
  retirer du site (`canLockBlocks: false`, ou `supports.lock` de `core/heading`) est écarté : global.
  Si le bloc l'exige (CTA), **rétablir le verrou aussitôt** : poser `lock: { remove: true, move: true }`
  dans le modèle, et dans `edit()` un `useEffect` qui le réécrit s'il a changé
  (`__unstableMarkNextChangeAsNotPersistent()` puis `updateBlockAttributes`) ; masquer le cadenas de la
  barre d'outils par une règle `<style>` montée le temps de la sélection du bloc imbriqué (filtre
  `editor.BlockEdit`, `.block-editor-block-lock-toolbar`). L'entrée « Déverrouiller » du menu
  « Options », sans classe, reste visible, sans effet. Cf. `blocks/cta/index.js`.
- **Niveau fixe** (CTA : toujours H2) : `useEffect` qui ramène `level`, et masquage des variations
  H1…H6 de la barre latérale (`.block-editor-block-variation-transforms`, même règle `<style>`).
  Le sélecteur « Titre 2 » de la barre d'outils est inerte sous le verrou.
- **Niveau au choix (H2 / H3)** : depuis WordPress 7, `core/heading` change de niveau par ses variations H1…H6,
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
  Verrou rétabli sans niveau fixe : `useLockedContent( blocks, { names: [ 'core/heading' ] } )`,
  **sans `level`** — fourni, il écraserait le choix. Exemple complet : `blocks/section-title/index.js`.
- **L'attribut `levelOptions` d'une instance est ignoré** : ne pas le mettre dans un template.
- **Niveaux limités à H2 / H3 sur tout le site** par la feature `Theme\Features\Blocks\RestrictHeadingLevels`
  (variations restreintes + garde-fou JS qui corrige Markdown, collage, éditeur de code). Un bloc n'a
  donc pas à corriger lui-même un niveau hors plage. Seules exceptions : les héros
  (`couturier/home-hero`, `couturier/page-hero`), déclarés dans `exempt_parents:` de la feature,
  dont le premier titre est un H1 — le bloc fixe ses niveaux par `useLockedContent( blocks, { level } )`
  (fonction `( titre, rang ) => …` pour l'accueil : H1 puis H2).
- Le titre reste un `core/heading` : classes `wp-block-heading`, ancres automatiques, variations.

---

## Blocs imbriqués facultatifs (ex. boutons du CTA)

- **Supprimables malgré `templateLock: 'all'`** : poser `lock: { remove: false, move: true }` sur le
  bloc imbriqué dans le modèle. Le verrou propre au bloc l'emporte sur celui du modèle
  (`canRemoveBlock`) ; le verrou du modèle continue d'interdire tout ajout.
- **Rajout** : `insertBlocks` respecte le verrou, `replaceInnerBlocks` non. Le CTA expose un réglage
  « Nombre de boutons » (barre latérale) et, bloc sélectionné et sans bouton, un bouton « Ajouter des
  boutons » dans le canvas ; les deux passent par le même hook (`useButtonCount`).
- Un groupe vidé de ses enfants est retiré par un `useEffect`, marqué non persistant pour rester
  dans la même étape d'annulation.

## Liste d'éléments répétables (ex. questions de la FAQ)

- Sous un parent en `templateLock: 'all'`, des éléments à ajouter / retirer / réordonner vivent dans
  un **bloc conteneur** imbriqué et verrouillé (`couturier/faq-list`), dont le propre
  `templateLock: false` l'emporte pour ses enfants. Enfant : `"parent": [ conteneur ]`.
- Bouton d'ajout du conteneur (`renderAppender`, affiché pendant l'édition seulement) : créer
  l'élément **avec ses blocs imbriqués** et placer le curseur dans le premier
  (`createBlocksFromInnerBlocksTemplate`, `insertBlock( …, false )`, `selectBlock( id, 0 )`) —
  sinon ils n'arrivent qu'ensuite, par le modèle, et le curseur va dans le seul champ présent.
- Un titre imbriqué rendu dans un `<button>` (accordéon) : `render.php` garde la balise ouvrante
  du titre enregistré et enveloppe son contenu. Aucun format dans ce titre (un lien dans un
  `<button>` est invalide).
- Identifiants et relations ARIA (`aria-controls`…) : posés par le `render.php` du conteneur
  (`WP_HTML_Tag_Processor`), avec un préfixe `wp_unique_id()` — jamais enregistrés dans le contenu.

## Plusieurs zones de texte libre (ex. colonnes du texte repliable)

- Un bloc n'a qu'une zone d'imbrication : chaque zone est un **bloc enfant** (`couturier/collapsible-text-column`),
  présent en nombre fixe dans le modèle du parent (`templateLock: 'all'`, enfants verrouillés),
  avec son propre `templateLock: false` et ses `allowedBlocks` (paragraphes, listes).
- Préféré aux colonnes CSS (`column-count`) : la coupure entre colonnes est décidée par le
  rédacteur, pas par le navigateur (paragraphe coupé, liste reportée, colonne de droite plus
  longue que la gauche). Contrepartie : l'ordre de lecture est celui des zones (gauche puis droite).
- Zone vide : son `render.php` ne rend rien, et son `edit()` pose `is-incomplete` (masquée dans le
  canvas hors édition par `_front-preview.scss`) — le parent n'a rien à calculer.
- Une fonction partagée par l'enfant et le parent (`hasContent`) vit dans un module à part
  (`collapsible-text-column/content.js`) : importer l'`index.js` d'un bloc l'enregistrerait une
  seconde fois.

## Liste d'éléments répétables en attribut

Quand les éléments n'ont **pas de titre** (rien à montrer dans le panneau Structure), un seul bloc
suffit : la liste est un attribut tableau, relu depuis le HTML enregistré — textes comptés par le
compteur de mots, aucun bloc enfant. Exemple complet : l'ancien bloc `couturier/key-figures`
(supprimé, retrouvable dans l'historique git, commit `26547a8`).

```json
"items": {
	"type": "array", "source": "query", "selector": "li.wp-block-couturier-{nom}__item",
	"query": {
		"value": { "type": "string", "source": "html", "selector": ".wp-block-couturier-{nom}__value" },
		"label": { "type": "string", "source": "html", "selector": ".wp-block-couturier-{nom}__label" }
	},
	"default": [ … ]
}
```

- **`default`** : les éléments vides du bloc inséré. Il ne revient pas sur un bloc enregistré : la
  liste est toujours relue depuis le HTML.
- **Tout élément est enregistré, même incomplet** — sinon un champ vide le ferait disparaître au
  rechargement, avec ce qu'il contenait déjà. `save()` pose `is-incomplete` sur l'élément ; le
  `render.php` le retire du front (expression régulière sur le balisage de `save()`), et
  `_front-preview.scss` le masque dans le canvas hors édition.
- **`render.php` ne voit pas l'attribut** : WordPress ne lit pas les attributs `source` côté
  serveur. Il travaille sur `$content`.
- **Ajout, déplacement, suppression** : boutons du canvas, affichés bloc sélectionné seulement
  (règle « bloc désélectionné = front »), bornés par un minimum et un maximum (`disabled` +
  `accessibleWhenDisabled`, bouton d'ajout absent au maximum). Les clés React sont les index :
  sans incidence ici, chaque champ ne tient que sa valeur.
- Le HTML relu peut différer de la valeur saisie (`&nbsp;` au lieu du caractère) sans invalider
  le bloc : la comparaison porte sur le balisage.

## Deux champs `RichText` sur une même ligne (ex. formation · date des avis)

Deux `RichText` en `inline` côte à côte (`<span>` dans un `<p>`) : un clic sur le second, vide,
place le curseur **à la fin du premier**, et le texte tapé y part (constaté sur `couturier/reviews`).
Les passer en `inline-block` dans le canvas (`> [contenteditable] { display: inline-block }`,
sans effet sur le front) donne à chacun sa boîte. Un séparateur entre les deux (« · ») se pose en
CSS, conditionné à leur contenu : sur le front, `save()` n'écrit pas un champ vide ; dans le canvas,
un champ vide est présent (placeholder) — signaler l'état par une classe posée par `edit()`
(`is-date-empty`), un `:has()` ne pouvant pas s'imbriquer.

## Blocs imbriqués positionnés librement (ex. tags du héros de page)

Des blocs enfants posés en absolu sur une image (`couturier/page-hero-tag`, position x / y en
attribut, `--tag-x` / `--tag-y`) : l'éditeur contrarie ce placement de plusieurs façons.

- **`position` et marges** : tout bloc du canvas reçoit `position: relative`
  (`.block-editor-block-list__block`) et la marge par défaut (`:where(.wp-block)`) — les
  rétablir dans `resources/scss/editor/` (`position: absolute; margin: 0`).
- **`transform`** : l'animation de déplacement des blocs pose un `transform` en ligne sur le bloc.
  Décaler l'élément par la propriété **`translate`**, qu'il n'écrase pas.
- **Largeur** : un élément positionné près du bord droit n'a plus de largeur disponible ; le champ
  `RichText` étant en `pre-wrap`, le libellé passe à la ligne — `width: max-content`.
- **Déplacement par glisser-déposer / flèches** : sans objet (la position se règle dans la barre
  latérale) — verrou `lock.move` par **défaut d'attribut dans `block.json`** (rien d'enregistré),
  cadenas masqué par `hideLockedControls()` depuis le parent, verrou rétabli par un `useEffect`
  non persistant s'il est levé par « Déverrouiller ».
- **Nombre borné** : zone `templateLock: false` sans bouton d'ajout du core
  (`renderAppender: false`), bouton du bloc parent affiché tant que le maximum n'est pas atteint.

## Formats du texte des blocs imbriqués

Le core ne permet pas de restreindre les formats (gras, lien…) d'un bloc qu'il fournit. Comme
`resources/js/editor/button.js`, `restrictFormats()` (`blocks/_shared/formats.js`) réenregistre chaque format à retirer avec
une interface (bouton, raccourci) qui ne s'affiche pas quand le bloc imbriqué concerné est
sélectionné. Les formats sont enregistrés par plusieurs scripts, parfois à l'initialisation de
l'éditeur (`core/footnote`) : les envelopper dès qu'ils apparaissent dans le store (`subscribe`). Un
format propre au bloc (mise en avant orange du titre du CTA) est enregistré pour tout le site — un
contenu collé ailleurs reste valide — mais son bouton n'est proposé que dans le titre des blocs
listés dans `HIGHLIGHT_HOSTS`, et dans un titre libre (`core/heading` sans parent). Sa couleur se
pose dans le partial de chaque bloc qui le propose.

## Transformations (ex. titre de section)

Déclarées dans `blocks/{nom}/transforms.js`, passé à `registerBlockType` (`transforms`) : tout se
déclare côté bloc custom, `from` comme `to`.

- **Blocs imbriqués** : la transformation crée le bloc avec ses enfants
  (`createBlock( nom, attributs, [ createBlock( 'core/heading', … ) ] )`). Poser le verrou
  (`LOCKED`) sur le titre imbriqué créé, et **le retirer** du titre libre rendu par `to` — sinon
  il ne pourrait être ni supprimé ni déplacé. Ne reprendre que les attributs utiles (niveau,
  texte, ancre) : pas de `placeholder` ni de `lock` du modèle.
- **Rien de perdu au retour** : un attribut texte sans équivalent dans le bloc cible devient un
  bloc à part (`to` peut renvoyer un tableau : titre + paragraphe du sous-titre).
- **Sélection de blocs de types différents** (titre + paragraphe) : WordPress ne la propose qu'à
  une transformation `blocks: [ '*' ]`, `isMultiBlock: true` ; son `isMatch( attributs, blocs )`
  reçoit alors les blocs (avec leur `name`) et doit n'accepter que la combinaison voulue, dans
  l'ordre. `transform` ne reçoit que les attributs, dans l'ordre de la sélection.
- **`content` d'un `core/paragraph` / `core/heading` est un objet `RichTextData`** : le ramener à
  son HTML (`String( … )`) avant d'en faire un attribut `string` ; un `core/heading` créé l'accepte
  tel quel.
- Vérifier dans l'éditeur, par le menu « Transformer en » : aller-retour sans perte, une seule
  étape d'annulation, verrous attendus (`canRemoveBlock`), blocs valides après rechargement.

## Le canvas montre le rendu du front

**Un bloc non sélectionné s'affiche exactement comme sur le front** (décision d'Aurélien,
2026-10-28) : avertissements, boutons d'ajout, emplacements vides et boutons sur les images ne
s'affichent que lorsque le bloc **ou l'un de ses blocs imbriqués** est sélectionné.

```js
const isEditing = useSelect(
	( select ) => isSelected || select( blockEditorStore ).hasSelectedInnerBlock( clientId, true ),
	[ clientId, isSelected ]
);
```

**Champs vides : masqués d'office.** Le front ne rend pas un champ vide (texte facultatif,
libellé de bouton, attribut RichText) ; dans le canvas, un bloc `couturier/*` non sélectionné les
masque donc, placeholder compris, par une règle générique (`resources/scss/editor/_front-preview.scss`,
sur l'attribut `data-empty="true"` que le core pose sur tout RichText vide). Rien à écrire par
bloc. Une partie que le front ne rend pas pour une autre raison (question de FAQ sans réponse)
reçoit la classe `is-incomplete`, masquée par la même règle.

**À vérifier sur chaque bloc** : bloc désélectionné, chaque champ vide disparaît comme sur le
front — aucun placeholder visible.

---

## Images : toujours le composant `ImageField`

**Toute image d'un bloc custom passe par `blocks/_shared/image-field.js`** (décision d'Aurélien,
2026-10-28) — premier usage : `couturier/cta`. Dans le canvas :

| Bloc | Image choisie | Pas d'image |
|---|---|---|
| En cours d'édition (bloc ou bloc imbriqué sélectionné) | image + boutons « Remplacer » (médiathèque) et « Supprimer » (rouge) posés dessus | emplacement `MediaPlaceholder` (téléverser, médiathèque, glisser-déposer) **à la place de l'image** |
| Non sélectionné | image seule | rien |

Un bloc non sélectionné montre ainsi le rendu du front, sans aucun contrôle.

```js
import ImageField, { imageUrl } from '../_shared/image-field.js';

<ImageField
	className="wp-block-couturier-{nom}__media"       // enveloppe : ses dimensions
	imageClassName="wp-block-couturier-{nom}__image"  // même classe que l'<img> du front
	media={ media }                                   // getMedia( imageId ), null sans image
	isEditing={ isEditing }                           // isSelected || hasSelectedInnerBlock( clientId, true )
	onSelect={ ( selected ) => setAttributes( { imageId: selected?.id } ) }
	onRemove={ () => setAttributes( { imageId: undefined } ) }
	label={ __( 'Image', 'couturier' ) }
/>
```

- Donnée : un attribut `imageId` (number), rendu au front par `wp_get_attachment_image()` dans
  `render.php` (`alt` de la médiathèque, vide à défaut ; pièce jointe supprimée → pas d'image).
- Pendant le chargement d'une image déjà choisie (`imageId` sans `media`), ne pas afficher
  l'emplacement : il clignoterait à chaque ouverture de l'éditeur (cf. `hasMediaColumn` du CTA).
- Le format de l'emplacement se fixe dans le partial du bloc
  (`.wp-block-couturier-{nom}__media > .couturier-image-field__placeholder { aspect-ratio: … }`) ;
  les styles du composant (boutons, emplacement) sont dans `resources/scss/editor/_image-field.scss`,
  importé par `editor-gutenberg.scss` seulement.
- **Aucun autre contrôle de l'image** : ni bouton dans la barre d'outils du bloc
  (`MediaReplaceFlow`), ni boutons dans la barre latérale — ils doubleraient ceux du canvas. La
  barre latérale ne porte que `<ImageInfoPanel media={ media } isMissing={ isMissing } />` (même
  module) : texte alternatif repris de la médiathèque, ou avertissement s'il manque (image
  décorative) ; avertissement si l'image a été supprimée de la médiathèque. Absent sans image.

---

## Styles

- Partial `resources/scss/block/_{nom}.scss`, importé **une seule fois** dans `_content.scss`, partagé
  par le front et l'éditeur : le bloc a le même rendu des deux côtés. Les variables et mixins de
  Bootstrap y sont disponibles ; pas les classes utilitaires (absentes de l'éditeur).
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
5. Titre imbriqué : non supprimable (`canRemoveBlock` → `false`), sélecteur de niveau visible (ou
   niveau fixe rétabli) ; un bloc imbriqué supprimé ne revient pas après enregistrement et
   rechargement.
6. Bloc non sélectionné : rendu du front, sans aucun contrôle de l'éditeur.
7. Front : balisage attendu, `logs/debug.log` vide.
8. **Accessibilité AA** (cf. section « Accessibilité » du `CLAUDE.md` du thème) : HTML rendu valide
   au validateur W3C Nu, titres du bloc à leur place dans la hiérarchie de la page, contrastes,
   images avec `alt` adapté ; dans l'éditeur, chaque champ du bloc atteignable et nommé au clavier
   (`aria-label` sur un `RichText` sans libellé visible). Alerter sur tout écart avant de conclure.
9. Supprimer la page de test.
