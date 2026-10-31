# Journal des corrections

## v8 : la v7 corrigée, fiabilisée et allégée

Aucune fonctionnalité nouvelle : tout ce qui marchait en v7 marche pareil, en mieux. Les sauvegardes de la v7 sont
reprises telles quelles (même clé `learnward:v8`, champs manquants complétés). 34 tests ont été ajoutés
(`tests/v8.test.ts`) ; chaque correction de logique y a le sien.

### Sécurité

| Problème en v7 | Correction |
| --- | --- |
| `next@15.5.6` et `react@19.1.0` : dizaines de failles connues, dont des exécutions de code à distance critiques | `next@15.5.28`, `react@19.1.10`, `postcss` forcé en version corrigée : `npm audit` affiche 0 vulnérabilité |
| `/controle/constructor`, `/seance/constructor/jouer`, `/reviser/toString` : plantage complet de l'appli | Vraie page 404, et recherche de contenu protégée (`own`) |
| `/passions?retour=//exemple.fr` : le bouton Enregistrer pouvait mener hors de l'appli | Le lien de retour reste interne (`safeReturn`) |
| Aucun en-tête de sécurité, serveur annoncé par `X-Powered-By` | En-têtes ajoutés, dont une politique qui limite le micro à l'appli |

### Pertes de données et blocages

| Problème en v7 | Correction |
| --- | --- |
| Une sauvegarde abîmée ou un contenu retiré (séance, récompense) : page blanche à chaque ouverture | `sanitize` répare l'état à l'ouverture |
| Aucune protection contre les erreurs : un bug dans un écran donnait une page blanche | `error.tsx` et `global-error.tsx` : message clair et bouton « Réessayer » |
| Écrit blanc : le chrono ne s'arrêtait pas pendant la pause (il sautait au premier clic) | Temps calculé à partir des pauses, juste même après un rechargement |
| Écrit blanc : une copie notée rouvrait avec le chrono en marche, et pouvait être rendue une seconde fois (historique faussé) | La copie notée libère le brouillon |
| Automatismes : fermer l'écran de bilan par la croix perdait tout le travail | Enregistré dès le dernier calcul |
| Deux onglets ouverts s'écrasaient mutuellement | Les onglets se synchronisent |
| « Recommencer comme un nouvel élève » gardait les brouillons d'écrit | Ils sont effacés |

### Vie privée

| Problème en v7 | Correction |
| --- | --- |
| Oral blanc et grand oral : un enregistrement en cours continuait après « Fin de l'oral », micro ouvert, sans bouton pour l'arrêter | Arrêt automatique |
| Micro resté ouvert si l'élève quittait l'écran pendant la demande d'accès | Le micro est toujours fermé en quittant |

### Cagnotte et calculs

| Problème en v7 | Correction |
| --- | --- |
| Plafond parental comparé au mois réel alors que les demandes sont datées du mois de la démo : il ne bloquait rien | Comparé au bon mois, et à la bonne année |
| Solde et plafond vérifiés seulement à l'écran : la demande elle-même pouvait passer, solde négatif compris | Règle unique `redeemBlock`, appliquée aussi à la demande |
| Défi « 3 matières » : une capsule d'Explorer, sans matière, comptait comme une matière | Seules les vraies matières comptent |
| Identifiants à la milliseconde : deux crédits simultanés pouvaient entrer en collision | Identifiants uniques (`uid`) |
| Bilan de séance : solde affiché sans déduire les points réservés | Même solde que partout ailleurs |
| Un contrôle remplaçait le gain de la dernière séance, et le bilan mélangeait les deux | Chacun garde son résultat |
| VO, défi oral et épreuves rédigées absents du temps de la semaine, de l'espace parent et de la série | Comptés partout |
| Espace parent : « Énoncés personnalisés » n'avait aucun effet, et l'accord et les réglages se perdaient en changeant de page | Réglages sauvegardés, et l'interrupteur agit sur les énoncés |
| Changer de LV2 effaçait la progression confirmée de toutes les matières | Seule la langue change |
| Révision espacée : date décalée d'un jour dans les fuseaux à UTC+12 et au-delà | Calcul en date locale |
| Copie : un « − » seul comptait comme une réponse fausse au lieu d'une question sans réponse | Compté comme vide |
| Automatismes : énoncés du type « x² + 0x − 4 » ou « x² + 1x » | Écriture mathématique propre |

### Interface

| Problème en v7 | Correction |
| --- | --- |
| 6 écrans débordaient en largeur sur un petit téléphone (320 px) | Plus aucun débordement, de 320 à 1 280 px |
| Accueil : les rappels sans séance étaient des boutons sans effet | Ils ouvrent le chapitre |
| Défi oral : « Recommencer » gardait l'ancien enregistrement et empêchait d'en refaire un ; l'enregistrement continuait après les 3 minutes | Corrigé |
| Copie vide d'une épreuve : le lien menait à un autre sujet | Il mène à la bonne épreuve |
| Poème de Hugo : erreurs React de clés en double | Corrigé |
| Feuilles modales : le clavier pouvait en sortir, le focus se perdait à la fermeture | Le clavier reste dans la feuille et revient où il était |
| Entrée gardée enfoncée : plusieurs exercices sautés d'un coup | Une seule validation |
| Pavé numérique actif derrière une feuille ouverte | Il attend que la feuille se ferme |
| « 1 jours de suite », « 1 textes », « en svt », « ? » seul en début de ligne, code cashback tronqué pour « Éloïse » (« LOSE ») | Corrigés |
| Application installée bloquée en portrait, y compris sur tablette | Toutes les orientations |
| `/demo` : mention « Prototype v6 », trois liens surlignés à la fois, classe et thème désynchronisés, interrogation de la page toutes les 400 ms | Panneau à jour, sans interrogation : l'appli annonce ses changements |

### Vitesse

| Mesure | v7 | v8 |
| --- | --- | --- |
| Routes rendues par le serveur à chaque visite | 9 | **0**, tout est statique |
| JavaScript au premier chargement de l'accueil | 253 Ko | **193 Ko** |
| JavaScript au premier chargement d'un écran courant | environ 225 Ko | **environ 183 Ko** |
| Fichier commun à toutes les pages (compressé) | 110 Ko | **66 Ko** |
| Changer d'onglet dans Programme | un aller-retour serveur | **instantané** |

- Le contenu (séances, épreuves, capsules : 263 Ko de code source) n'est chargé que par les écrans qui le jouent. Les
  autres utilisent un catalogue de 10 Ko, généré et vérifié par un test.
- Le chrono d'une épreuve se redessine seul : la copie ne se redessine plus chaque seconde.
- Les sauvegardes sont regroupées, et rien ne se perd si la page se ferme.
- Calcul de la maîtrise et recherche dans le programme : index construits une fois, au lieu de parcourir les listes.

### À savoir

- **Node.js 22 ou plus** est nécessaire pour `npm test` sous Windows (la version 20 n'interprète pas le motif de fichiers).
- Après avoir modifié une séance, une épreuve ou une capsule : `npm run gen:catalog`. Un test le rappelle si on oublie.
