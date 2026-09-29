---
description: Crée une branche feature depuis dev pour le thème Couturier
argument-hint: [nom-de-la-feature]
allowed-tools: Bash(cd:*), Bash(git branch:*), Bash(git checkout:*), Bash(git pull:*), Bash(git status:*)
---

Démarre une nouvelle branche de feature depuis `dev` pour le thème Couturier.

**Argument attendu :** $ARGUMENTS (nom court de la feature en kebab-case, ex: `ajout-section-avis`)

Si $ARGUMENTS est vide, demander à l'utilisateur le nom de la feature avant de continuer.

**Répertoire de travail git :** `wp-content/themes/couturier/` (tous les git doivent s'exécuter depuis ce répertoire).

**Étapes à exécuter dans l'ordre :**

1. Aller dans le répertoire git : `cd wp-content/themes/couturier`
2. Vérifier la branche courante avec `git branch --show-current`
3. Se placer sur `dev` et récupérer les dernières modifications : `git checkout dev && git pull origin dev`
4. Créer et basculer sur la branche feature : `git checkout -b feature/$ARGUMENTS`
5. Confirmer à l'utilisateur :
   - La branche créée : `feature/$ARGUMENTS`
   - La base : `dev` (à jour avec origin)

Ne pas faire autre chose. Attendre les instructions de l'utilisateur pour le développement de la feature.
