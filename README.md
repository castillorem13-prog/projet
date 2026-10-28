# Nom du projet

> Courte description du projet.







## Initialisation

On a tous les deux VS Code et Python, il manque juste Git.

Les commandes ci-dessous se tapent dans le terminal de VS Code.

**1. Installer Git** (puis fermer et rouvrir VS Code)

```bash
winget install --id Git.Git -e --source winget
```

**2. Configurer Git** (mettre le même email que sur GitHub)

```bash
git config --global user.name "Ton Pseudo"
git config --global user.email "ton-email@exemple.com"
```

**3. Accepter l'invitation** de collaborateur reçue par mail (GitHub).

**4. Récupérer le projet**

```bash
git clone https://github.com/PSEUDO/NOM-DU-DEPOT.git
cd NOM-DU-DEPOT
code .
```







## Organisation du travail

* `main` : la version propre et validée du projet. On ne code jamais directement dessus.
* Chacun a sa propre branche pour travailler, nommée avec ses **initiales** (ex. `ab`).
* Pour intégrer son travail dans `main`, on ouvre une Pull Request sur GitHub. L'autre relit et valide avant le merge.

> Dans les commandes ci-dessous, remplacer `initiales` par ses vraies initiales.







## Commandes de base

### Créer sa branche (une seule fois)

```bash
git checkout -b initiales
git push -u origin initiales
```

### Changer de branche

```bash
git checkout main          # aller sur main
git checkout initiales     # revenir sur sa branche
git branch                 # voir sur quelle branche on est (celle avec \*)
```

### Enregistrer et envoyer son travail

```bash
git status                       # voir les fichiers modifiés
git add .                        # préparer tous les fichiers modifiés
git commit -m "Message clair"    # enregistrer en local
git push                         # envoyer sur GitHub
```

> `commit` = sauvegarde en local. `push` = envoi sur GitHub. Tant qu'on n'a pas push, l'autre ne voit rien.

### Récupérer les dernières modifs de main

À faire **avant chaque session de code** :

```bash
git checkout main
git pull
git checkout initiales
git merge main
```

### Voir l'historique

```bash
git log --oneline
```







## Mettre son travail dans main (Pull Request)

1. Faire un `git push` de sa branche.
2. Sur GitHub, cliquer sur **Compare \& pull request** (ou onglet **Pull requests → New pull request**).
3. Vérifier : `initiales` → `main`, écrire ce qu'on a fait, **Create pull request**.
4. L'autre relit, commente si besoin, puis **Approve**.
5. Cliquer sur **Merge pull request**.
6. Chacun récupère le nouveau `main` (voir plus haut).





## En cas de conflit

Ça arrive quand on a modifié les mêmes lignes tous les deux.

1. VS Code surligne les zones en conflit avec des boutons : **Accept Current**, **Accept Incoming**, **Accept Both**.
2. Choisir la bonne version, sauvegarder le fichier.
3. Puis :

```bash
git add .
git commit -m "Résolution du conflit"
git push
```







## Règles entre nous

* On commit souvent, avec des messages clairs (ex. `Ajout du menu principal`, pas `modif`).
* On récupère `main` avant de commencer à coder.
* On évite de modifier le même fichier en même temps : on se prévient.
* On ne merge jamais sa propre Pull Request sans l'accord de l'autre.

