import type { Activity, Stimulus } from "@/lib/content/types";
import type { TrackId } from "./tracks";

export { TRACKS, getTrack, type Track, type TrackId } from "./tracks";

/**
 * Explorer : apprendre pour le plaisir, en dehors du programme (inspiré des parcours interactifs type Brilliant).
 * Pas de note, pas de maîtrise, pas de rappel imposé : une capsule de 3 à 5 minutes, des exercices courts,
 * et quelques points la première fois. Les contenus restent rigoureux : chaque réponse chiffrée est recalculée par les tests.
 */

export interface Capsule {
  id: string;
  track: TrackId;
  title: string;
  /** Ce qu'on saura faire à la fin, en une ligne. */
  promise: string;
  minutes: number;
  activities: Activity[];
}

const code = (title: string, lines: string[]): Stimulus => ({
  kind: "code",
  title,
  language: "Python",
  lines,
  provenance: { authentic: false, type: "Code écrit pour l'exercice", limits: "Exemple court, à lire comme le ferait l'ordinateur.", verification: "illustrative_mock" },
});

const NOTE = "Pour le plaisir : rien n'est noté.";

export const CAPSULES: Capsule[] = [
  /* ——— Coder en Python ——— */
  {
    id: "code-variables",
    track: "code",
    title: "Variables et calculs",
    promise: "Suivre la valeur d'une variable comme le fait l'ordinateur.",
    minutes: 4,
    activities: [
      {
        kind: "mcq", id: "cv-1", stage: "rappel", ops: ["retrieve", "interpret"], competence: "te-programmer",
        stimulus: code("Programme 1", ["x = 3", "x = x + 2", "print(x * 2)"]),
        prompt: "Qu'affiche ce programme ?",
        options: [
          { text: "10", feedback: "x vaut 3, puis 3 + 2 = 5 ; on affiche 5 × 2 = 10." },
          { text: "8", feedback: "Attention : x a changé à la ligne 2, il vaut 5, pas 4." },
          { text: "6", feedback: "La ligne 2 modifie x : il vaut 5 quand on l'affiche." },
          { text: "x * 2", feedback: "print calcule l'expression avant de l'afficher : on obtient un nombre." },
        ],
        correct: 0,
        hint: "Note la valeur de x après chaque ligne.",
        solution: ["Ligne 1 : x = 3.", "Ligne 2 : x = 3 + 2 = 5.", "Ligne 3 : on affiche 5 × 2 = 10."],
        takeaway: "Une variable garde la dernière valeur qu'on lui a donnée : x = x + 2 remplace l'ancienne valeur.",
      },
      {
        kind: "problem", id: "cv-2", stage: "application", ops: ["apply"], competence: "te-programmer",
        stimulus: code("Programme 2", ["prix = 12", "quantite = 4", "total = prix * quantite - 5", "print(total)"]),
        context: "Un programme calcule le prix d'une commande avec une réduction.",
        hint: "Calcule d'abord la multiplication, comme en maths.",
        solution: [],
        takeaway: "Python respecte les priorités de calcul : la multiplication passe avant la soustraction.",
        parts: [
          { id: "cv-2a", label: "a", competence: "te-programmer", prompt: "Quel nombre le programme affiche-t-il ?", answer: { expected: 43, knownErrors: [{ value: -8, code: "priorite" }] }, errors: { priorite: "Tu as calculé 12 × (4 − 5). La multiplication passe avant la soustraction : 12 × 4 − 5." }, hint: "prix * quantite vaut 48.", solution: ["12 × 4 = 48", "48 − 5 = 43"], recap: "Affiche 43", reviewLabel: "Priorités de calcul en Python" },
        ],
      },
      {
        kind: "spot-error", id: "cv-3", stage: "transfert", ops: ["analyze", "evaluate"], competence: "te-programmer",
        prompt: "Ce programme plante. Touche la ligne qui provoque l'erreur.",
        author: "Sam",
        lines: ["age = input(\"Ton âge ? \")", "dans_5_ans = age + 5", "print(dans_5_ans)"],
        wrongLine: 1,
        lineFeedback: ["input demande une réponse au clavier : c'est correct.", "", "Cette ligne serait juste si la précédente marchait."],
        correction: "dans_5_ans = int(age) + 5",
        hint: "Que renvoie input : un nombre ou du texte ?",
        solution: ["input renvoie toujours du texte : on ne peut pas ajouter 5 à du texte.", "On convertit d'abord en nombre entier : int(age) + 5."],
        takeaway: "input renvoie du texte : pour calculer, on convertit avec int() ou float().",
      },
    ],
  },
  {
    id: "code-boucles",
    track: "code",
    title: "Les boucles",
    promise: "Prévoir ce que fait une boucle for ou while.",
    minutes: 5,
    activities: [
      {
        kind: "mcq", id: "cb-1", stage: "rappel", ops: ["retrieve", "interpret"], competence: "te-programmer",
        stimulus: code("Programme 1", ["for i in range(3):", "    print(i)"]),
        prompt: "Quels nombres ce programme affiche-t-il ?",
        options: [
          { text: "0, 1, 2", feedback: "range(3) compte à partir de 0 et s'arrête avant 3." },
          { text: "1, 2, 3", feedback: "range commence à 0 par défaut." },
          { text: "0, 1, 2, 3", feedback: "La borne de fin est exclue : 3 n'est pas affiché." },
          { text: "3", feedback: "La boucle affiche chaque valeur de i, pas seulement le nombre de tours." },
        ],
        correct: 0,
        hint: "range(3) produit trois valeurs. Laquelle est la première ?",
        solution: ["range(3) donne 0, 1, 2.", "Chaque tour affiche i."],
        takeaway: "range(n) donne n valeurs, de 0 à n − 1.",
      },
      {
        kind: "problem", id: "cb-2", stage: "application", ops: ["apply"], competence: "te-programmer",
        stimulus: code("Programme 2", ["total = 0", "for i in range(1, 5):", "    total = total + i", "print(total)"]),
        context: "La boucle ajoute des nombres un par un.",
        hint: "range(1, 5) donne 1, 2, 3 et 4.",
        solution: [],
        takeaway: "Une variable « accumulateur » se met à jour à chaque tour de boucle.",
        parts: [
          { id: "cb-2a", label: "a", competence: "te-programmer", prompt: "Quel nombre le programme affiche-t-il ?", answer: { expected: 10, knownErrors: [{ value: 15, code: "borne" }, { value: 4, code: "dernier" }] }, errors: { borne: "Tu as compté 5. range(1, 5) s'arrête avant 5.", dernier: "4, c'est la dernière valeur de i ; on affiche la somme." }, hint: "1 + 2 + 3 + 4", solution: ["total vaut 1, puis 3, puis 6, puis 10.", "On affiche 10."], recap: "Affiche 10", reviewLabel: "Accumuler dans une boucle" },
        ],
      },
      {
        kind: "order", id: "cb-3", stage: "transfert", ops: ["apply", "produce"], competence: "te-programmer",
        prompt: "Remets les lignes dans l'ordre pour un compte à rebours 3, 2, 1, puis « Décollage ! ».",
        steps: ["compte = 3", "while compte > 0:", "    print(compte)", "    compte = compte - 1", "print(\"Décollage !\")"],
        display: [3, 0, 4, 1, 2],
        hint: "La variable doit exister avant la boucle ; le message final est hors de la boucle.",
        solution: ["On crée compte = 3, puis tant que compte > 0, on l'affiche et on le diminue.", "Le message, sans décalage, s'affiche une fois la boucle finie."],
        takeaway: "Le décalage (indentation) dit ce qui est dans la boucle et ce qui vient après.",
      },
    ],
  },
  {
    id: "code-conditions",
    track: "code",
    title: "Les conditions",
    promise: "Écrire et corriger un test if / else.",
    minutes: 4,
    activities: [
      {
        kind: "mcq", id: "cc-1", stage: "rappel", ops: ["interpret"], competence: "te-programmer",
        stimulus: code("Programme", ["note = 14", "if note >= 10:", "    print(\"Reçu\")", "else:", "    print(\"Recalé\")"]),
        prompt: "Qu'affiche ce programme ?",
        options: [
          { text: "Reçu", feedback: "14 ≥ 10 est vrai : on exécute le bloc du if." },
          { text: "Recalé", feedback: "Le else ne s'exécute que si le test est faux." },
          { text: "Reçu puis Recalé", feedback: "Un seul des deux blocs s'exécute." },
          { text: "Rien", feedback: "Le test est vrai, donc on affiche quelque chose." },
        ],
        correct: 0,
        hint: "14 est-il supérieur ou égal à 10 ?",
        solution: ["Le test note >= 10 vaut True.", "On affiche « Reçu » et on saute le else."],
        takeaway: "if / else : un seul des deux blocs s'exécute.",
      },
      {
        kind: "classify", id: "cc-2", stage: "application", ops: ["apply"], competence: "te-programmer",
        prompt: "Range chaque test : vaut-il True ou False ?",
        categories: ["True (vrai)", "False (faux)"],
        items: [
          { text: "5 > 3", category: 0, feedback: "5 est bien plus grand que 3." },
          { text: "2 == 3", category: 1, feedback: "== teste l'égalité : 2 n'est pas égal à 3." },
          { text: "\"a\" in \"chat\"", category: 0, feedback: "La lettre a apparaît dans « chat »." },
          { text: "10 % 2 == 1", category: 1, feedback: "% donne le reste : 10 % 2 vaut 0, pas 1." },
        ],
        hint: "% donne le reste de la division ; == compare deux valeurs.",
        solution: ["True : 5 > 3 et \"a\" in \"chat\".", "False : 2 == 3 et 10 % 2 == 1."],
        takeaway: "== compare, = range une valeur ; % donne le reste d'une division.",
      },
      {
        kind: "spot-error", id: "cc-3", stage: "transfert", ops: ["analyze", "evaluate"], competence: "te-programmer",
        prompt: "Python refuse ce programme. Touche la ligne fautive.",
        author: "Léna",
        lines: ["moyenne = 10", "if moyenne = 10:", "    print(\"Pile la moyenne\")"],
        wrongLine: 1,
        lineFeedback: ["Ici, = range la valeur 10 dans moyenne : correct.", "", "Ligne correcte une fois le test réparé."],
        correction: "if moyenne == 10:",
        hint: "Dans un test, faut-il ranger une valeur ou comparer ?",
        solution: ["Un test compare : on écrit ==.", "if moyenne == 10:"],
        takeaway: "Dans un if, on compare avec ==, jamais avec =.",
      },
    ],
  },

  /* ——— Gérer son argent ——— */
  {
    id: "argent-budget",
    track: "argent",
    title: "Ton budget",
    promise: "Savoir ce qui reste, et en combien de temps on s'offre un projet.",
    minutes: 4,
    activities: [
      {
        kind: "classify", id: "ab-1", stage: "rappel", ops: ["interpret"], competence: "raisonner",
        prompt: "Besoin ou envie ? Range chaque dépense.",
        categories: ["Besoin", "Envie"],
        items: [
          { text: "Les repas de la cantine", category: 0, feedback: "Manger est un besoin." },
          { text: "Un skin dans un jeu vidéo", category: 1, feedback: "Agréable, mais pas indispensable : une envie." },
          { text: "Les fournitures scolaires", category: 0, feedback: "Nécessaires pour aller en cours : un besoin." },
          { text: "Un troisième sweat de la même marque", category: 1, feedback: "Tu en as déjà : c'est une envie." },
        ],
        hint: "Pourrais-tu vivre normalement sans cette dépense ?",
        solution: ["Besoins : cantine, fournitures.", "Envies : skin, troisième sweat."],
        takeaway: "Un budget commence par séparer besoins et envies : les envies passent après.",
      },
      {
        kind: "problem", id: "ab-2", stage: "application", ops: ["apply", "interpret"], competence: "calculer",
        context: "Tu reçois 40 € par mois. Tu dépenses 12 € de forfait téléphone et 15 € de sorties. Tu mets le reste de côté.",
        hint: "Commence par ce qui reste chaque mois.",
        solution: [],
        takeaway: "Épargner un montant fixe chaque mois rend un projet prévisible.",
        parts: [
          { id: "ab-2a", label: "a", competence: "calculer", prompt: "Combien mets-tu de côté chaque mois, en euros ?", answer: { expected: 13, knownErrors: [{ value: 27, code: "depenses" }] }, errors: { depenses: "27 €, ce sont les dépenses. On cherche ce qui reste." }, hint: "40 − 12 − 15", solution: ["40 − 12 − 15 = 13 €"], recap: "Épargne : 13 € par mois", reviewLabel: "Calculer ce qui reste" },
          { id: "ab-2b", label: "b", competence: "calculer", prompt: "Quel pourcentage de ton argent de poche épargnes-tu ?", answer: { expected: 32.5, tolerance: { abs: 0.05 }, knownErrors: [{ value: 13, code: "montant" }] }, errors: { montant: "13, c'est le montant en euros. Le pourcentage, c'est 13 sur 40." }, hint: "13 ÷ 40 × 100", solution: ["13 ÷ 40 = 0,325", "Soit 32,5 %"], recap: "32,5 % épargnés", reviewLabel: "Calculer un pourcentage" },
          { id: "ab-2c", label: "c", competence: "raisonner", prompt: "En combien de mois pourras-tu t'offrir un casque à 117 € ?", answer: { expected: 9, knownErrors: [{ value: 3, code: "total" }] }, errors: { total: "Tu as divisé par l'argent de poche. On met de côté 13 € par mois." }, hint: "117 ÷ 13", solution: ["117 ÷ 13 = 9 mois"], recap: "9 mois", reviewLabel: "Planifier une épargne" },
        ],
      },
    ],
  },
  {
    id: "argent-interets",
    track: "argent",
    title: "Les intérêts composés",
    promise: "Comprendre pourquoi commencer à épargner tôt change tout.",
    minutes: 5,
    activities: [
      {
        kind: "worked", id: "ai-1", stage: "rappel", ops: ["apply", "justify"], competence: "calculer",
        prompt: "100 € sont placés à 5 % par an, et les intérêts restent placés. Complète l'étape manquante.",
        steps: [
          { text: "Fin de l'année 1 : 100 × 1,05 = 105 €", why: "Ajouter 5 %, c'est multiplier par 1,05." },
          { text: "…", why: "La deuxième année, les 5 % portent sur 105 €, intérêts compris." },
          { text: "Les intérêts ont eux-mêmes rapporté 0,25 €", why: "C'est l'effet des intérêts composés." },
        ],
        blank: 1,
        options: [
          { text: "Fin de l'année 2 : 105 × 1,05 = 110,25 €", feedback: "Les intérêts de l'année 1 rapportent aussi : 110,25 €." },
          { text: "Fin de l'année 2 : 105 + 5 = 110 €", feedback: "Ce serait le cas si les 5 % portaient toujours sur 100 € (intérêts simples)." },
          { text: "Fin de l'année 2 : 100 × 1,10 = 110 €", feedback: "Deux fois 5 % ne font pas exactement 10 % quand les intérêts restent placés." },
        ],
        correct: 0,
        hint: "Sur quelle somme portent les 5 % la deuxième année ?",
        solution: ["105 × 1,05 = 110,25 €.", "Avec des intérêts simples, on aurait 110 € : la différence vient des intérêts sur les intérêts."],
        takeaway: "Intérêts composés : chaque année, on multiplie par le même coefficient.",
      },
      {
        kind: "problem", id: "ai-2", stage: "application", ops: ["apply"], competence: "calculer",
        context: "Tu places 1 000 € à 2 % par an pendant 2 ans, sans rien retirer.",
        hint: "Multiplie deux fois par 1,02.",
        solution: [],
        takeaway: "Capital après n années : capital de départ × (1 + taux)ⁿ.",
        parts: [
          { id: "ai-2a", label: "a", competence: "calculer", prompt: "Quel est le capital au bout de 2 ans, en euros ?", answer: { expected: 1040.4, tolerance: { abs: 0.005 }, knownErrors: [{ value: 1040, code: "simple" }] }, errors: { simple: "1 040 €, ce sont des intérêts simples. La deuxième année, les 2 % portent sur 1 020 €." }, hint: "1 000 × 1,02 = 1 020, puis × 1,02.", solution: ["1 000 × 1,02 = 1 020", "1 020 × 1,02 = 1 040,40 €"], recap: "1 040,40 €", reviewLabel: "Calculer des intérêts composés" },
        ],
      },
      {
        kind: "mcq", id: "ai-3", stage: "transfert", ops: ["transfer", "justify"], competence: "raisonner",
        prompt: "Pourquoi conseille-t-on de commencer à épargner tôt, même de petites sommes ?",
        options: [
          { text: "Parce que les intérêts rapportent eux-mêmes des intérêts, et cet effet grandit avec le temps", feedback: "Oui : plus la durée est longue, plus l'effet des intérêts composés est fort." },
          { text: "Parce que les banques donnent plus d'argent aux jeunes", feedback: "Ce n'est pas la raison : c'est la durée de placement qui compte." },
          { text: "Parce que les prix baissent avec le temps", feedback: "En général, les prix augmentent (inflation)." },
        ],
        correct: 0,
        hint: "Repense à ce qui s'est passé la deuxième année.",
        solution: ["Les intérêts gagnés sont replacés et rapportent à leur tour.", "Sur 10 ou 20 ans, cet effet devient important."],
        takeaway: "Le temps est l'allié de l'épargne : c'est l'effet boule de neige.",
      },
    ],
  },
  {
    id: "argent-arnaques",
    track: "argent",
    title: "Repérer une arnaque",
    promise: "Reconnaître les signaux d'alerte avant de cliquer ou de payer.",
    minutes: 3,
    activities: [
      {
        kind: "classify", id: "aa-1", stage: "application", ops: ["analyze"], competence: "raisonner",
        prompt: "Signal d'alerte ou situation normale ?",
        categories: ["Signal d'alerte", "Normal"],
        items: [
          { text: "On te promet un gain garanti de 20 % par mois", category: 0, feedback: "Aucun placement honnête ne garantit un tel rendement." },
          { text: "On te presse de payer « avant ce soir »", category: 0, feedback: "L'urgence sert à t'empêcher de réfléchir." },
          { text: "Quelqu'un te demande le code reçu par SMS de ta banque", category: 0, feedback: "Ce code ne se donne jamais, à personne." },
          { text: "Un site affiche ses mentions légales et un service client joignable", category: 1, feedback: "C'est attendu d'un vendeur sérieux (à vérifier quand même)." },
        ],
        hint: "Promesse trop belle, urgence, demande de code : ce sont les trois pièges classiques.",
        solution: ["Alertes : gain garanti énorme, urgence, demande de code.", "Normal : mentions légales et service client."],
        takeaway: "Trop beau, trop pressé, ou un code demandé : on s'arrête et on vérifie.",
      },
      {
        kind: "mcq", id: "aa-2", stage: "transfert", ops: ["transfer", "evaluate"], competence: "raisonner",
        prompt: "Un SMS dit : « Ton colis est bloqué, paie 1,99 € de frais via ce lien ». Que fais-tu ?",
        options: [
          { text: "Je ne clique pas, et je vérifie sur le site officiel du transporteur", feedback: "C'est le bon réflexe : on ne passe jamais par le lien du message." },
          { text: "Je paie, ce n'est que 1,99 €", feedback: "Le but est surtout de récupérer ta carte bancaire, pas les 1,99 €." },
          { text: "Je réponds au SMS pour demander des détails", feedback: "Répondre confirme que ton numéro est actif." },
        ],
        correct: 0,
        hint: "Qui t'a vraiment envoyé ce message ?",
        solution: ["C'est un hameçonnage classique : le faux site récupère tes données bancaires.", "On vérifie toujours par un canal officiel."],
        takeaway: "Un lien reçu par message ne sert jamais à payer : on passe par le site officiel.",
      },
    ],
  },

  /* ——— IA et numérique ——— */
  {
    id: "ia-apprendre",
    track: "ia",
    title: "Comment une IA apprend",
    promise: "Savoir ce qu'une IA fait bien, et ce qu'il faut toujours vérifier.",
    minutes: 4,
    activities: [
      {
        kind: "mcq", id: "ia-1", stage: "rappel", ops: ["retrieve"], competence: "sn-donnees",
        prompt: "Un programme qui reconnaît les chats sur des photos a appris surtout…",
        options: [
          { text: "à partir de très nombreux exemples d'images déjà étiquetées", feedback: "Oui : il ajuste ses paramètres pour reproduire les étiquettes des exemples." },
          { text: "grâce à une liste de règles écrites à la main (oreilles pointues, moustaches…)", feedback: "Ces règles seraient trop fragiles : l'apprentissage se fait sur des exemples." },
          { text: "en comprenant ce qu'est un chat, comme un humain", feedback: "Il repère des régularités statistiques, sans « comprendre » comme nous." },
        ],
        correct: 0,
        hint: "Comment apprend-on à reconnaître quelque chose qu'on ne sait pas définir ?",
        solution: ["Apprentissage automatique : on montre des milliers d'exemples avec la bonne réponse.", "Le modèle ajuste ses paramètres pour se tromper de moins en moins."],
        takeaway: "Une IA apprend sur des exemples : la qualité des données décide de la qualité du résultat.",
      },
      {
        kind: "classify", id: "ia-2", stage: "application", ops: ["evaluate"], competence: "sn-donnees",
        prompt: "Avec une IA qui génère du texte : ce qu'elle fait bien, ou ce qu'il faut toujours vérifier ?",
        categories: ["Elle le fait bien", "À vérifier"],
        items: [
          { text: "Reformuler un paragraphe plus simplement", category: 0, feedback: "Reformuler est une de ses forces." },
          { text: "Une date ou un chiffre précis", category: 1, feedback: "Elle peut inventer des chiffres plausibles mais faux." },
          { text: "Une citation attribuée à une personne réelle", category: 1, feedback: "Les fausses citations sont un défaut connu : on vérifie la source." },
          { text: "Proposer des idées pour démarrer un exposé", category: 0, feedback: "Bon point de départ, à trier ensuite." },
        ],
        hint: "Elle produit un texte probable, pas forcément vrai.",
        solution: ["Forces : reformuler, proposer des idées.", "À vérifier : faits précis, chiffres, citations."],
        takeaway: "Une IA générative écrit ce qui est probable : les faits se vérifient à la source.",
      },
      {
        kind: "mcq", id: "ia-3", stage: "transfert", ops: ["transfer", "justify"], competence: "sn-donnees",
        prompt: "Un modèle a surtout vu des photos de médecins hommes. Que risque-t-il de faire ?",
        options: [
          { text: "Associer plus souvent « médecin » à un homme", feedback: "C'est un biais : le modèle reproduit le déséquilibre de ses données." },
          { text: "Corriger tout seul le déséquilibre", feedback: "Il n'a aucun moyen de savoir que ses données sont déséquilibrées." },
          { text: "Refuser de reconnaître des médecins", feedback: "Il les reconnaît, mais avec un biais." },
        ],
        correct: 0,
        hint: "Que reproduit un modèle ?",
        solution: ["Le modèle reproduit les régularités de ses données, y compris leurs déséquilibres.", "On parle de biais : il faut des données variées et des tests."],
        takeaway: "Des données déséquilibrées donnent une IA biaisée.",
      },
    ],
  },
  {
    id: "ia-donnees",
    track: "ia",
    title: "Tes données en ligne",
    promise: "Reconnaître une donnée personnelle et protéger tes comptes.",
    minutes: 3,
    activities: [
      {
        kind: "classify", id: "id-1", stage: "rappel", ops: ["interpret"], competence: "sn-donnees",
        prompt: "Donnée personnelle ou pas ?",
        categories: ["Donnée personnelle", "Pas une donnée personnelle"],
        items: [
          { text: "Ton adresse e-mail", category: 0, feedback: "Elle permet de t'identifier." },
          { text: "Ta position GPS", category: 0, feedback: "Elle dit où tu es : très sensible." },
          { text: "La météo de ta ville", category: 1, feedback: "Elle ne dit rien sur toi." },
          { text: "Ta photo de profil", category: 0, feedback: "Ton visage t'identifie." },
        ],
        hint: "Permet-elle de te reconnaître, directement ou non ?",
        solution: ["Personnelles : e-mail, position, photo.", "Pas personnelle : la météo."],
        takeaway: "Une donnée personnelle permet d'identifier quelqu'un, directement ou en la croisant avec d'autres.",
      },
      {
        kind: "mcq", id: "id-2", stage: "application", ops: ["apply"], competence: "sn-donnees",
        prompt: "Quel mot de passe est le plus solide ?",
        options: [
          { text: "Une phrase longue et unique, différente pour chaque site", feedback: "La longueur et l'unicité comptent plus que les symboles." },
          { text: "Ton prénom suivi de ta date de naissance", feedback: "Facile à deviner avec tes réseaux sociaux." },
          { text: "Le même mot de passe compliqué partout", feedback: "Si un site est piraté, tous tes comptes tombent." },
        ],
        correct: 0,
        hint: "Que se passe-t-il si un site où tu es inscrit se fait voler ses mots de passe ?",
        solution: ["Long : difficile à deviner.", "Unique : une fuite sur un site ne touche pas les autres."],
        takeaway: "Long et unique pour chaque site ; un gestionnaire de mots de passe aide à s'en souvenir.",
      },
      {
        kind: "mcq", id: "id-3", stage: "transfert", ops: ["transfer"], competence: "sn-donnees",
        prompt: "En Europe, le RGPD te donne notamment le droit de…",
        options: [
          { text: "demander quelles données un service garde sur toi, et leur suppression", feedback: "Oui : droit d'accès et droit à l'effacement." },
          { text: "utiliser n'importe quelle appli sans accepter de conditions", feedback: "Non : le RGPD encadre l'usage des données, pas l'accès aux services." },
          { text: "obtenir un remboursement de tes achats en ligne", feedback: "C'est un autre domaine (droit de la consommation)." },
        ],
        correct: 0,
        hint: "RGPD : règlement général sur la protection des données.",
        solution: ["Le RGPD prévoit notamment un droit d'accès et un droit à l'effacement.", "Avant 15 ans en France, l'accord d'un parent est souvent nécessaire."],
        takeaway: "Tes données t'appartiennent : tu peux demander à les voir et à les faire effacer.",
      },
    ],
  },

  /* ——— L'espace ——— */
  {
    id: "espace-distances",
    track: "espace",
    title: "Les distances de l'Univers",
    promise: "Mesurer l'Univers avec la vitesse de la lumière.",
    minutes: 5,
    activities: [
      {
        kind: "problem", id: "ed-1", stage: "application", ops: ["apply"], competence: "app",
        context: "La lumière parcourt environ 300 000 km par seconde. Le Soleil est à environ 150 millions de km de la Terre ; la Lune, à environ 384 000 km.",
        hint: "Durée = distance ÷ vitesse.",
        solution: [],
        takeaway: "Quand tu regardes le Soleil, tu le vois tel qu'il était il y a environ 8 minutes.",
        parts: [
          { id: "ed-1a", label: "a", competence: "app", prompt: "Combien de temps met la lumière du Soleil pour nous parvenir ?", units: ["s", "min"], answer: { expected: 500, unit: "s", requireUnit: true, tolerance: { rel: 0.01 }, knownErrors: [{ value: 0.002, code: "inverse" }] }, errors: { inverse: "Tu as divisé la vitesse par la distance : c'est l'inverse." }, hint: "150 000 000 ÷ 300 000", solution: ["t = 150 000 000 ÷ 300 000 = 500 s", "Soit environ 8 min 20 s."], recap: "Environ 500 s (8 min 20 s)", reviewLabel: "Calculer une durée de trajet de la lumière" },
          { id: "ed-1b", label: "b", competence: "app", prompt: "Et depuis la Lune ?", units: ["s", "min"], answer: { expected: 1.28, unit: "s", requireUnit: true, tolerance: { abs: 0.01 } }, hint: "384 000 ÷ 300 000", solution: ["t = 384 000 ÷ 300 000 = 1,28 s"], recap: "1,28 s", reviewLabel: "Calculer une durée de trajet de la lumière" },
        ],
      },
      {
        kind: "mcq", id: "ed-2", stage: "rappel", ops: ["retrieve"], competence: "app",
        prompt: "Une année-lumière, c'est…",
        options: [
          { text: "une distance : celle que parcourt la lumière en un an", feedback: "Malgré son nom, c'est une distance (environ 9 500 milliards de km)." },
          { text: "une durée : un an mesuré avec la lumière", feedback: "Piège du nom : c'est une distance." },
          { text: "la vitesse de la lumière", feedback: "C'est la distance parcourue à cette vitesse pendant un an." },
        ],
        correct: 0,
        hint: "Que mesure-t-on en kilomètres ?",
        solution: ["Distance = vitesse × durée : 300 000 km/s pendant un an.", "Environ 9 500 milliards de kilomètres."],
        takeaway: "L'année-lumière est une unité de distance.",
      },
      {
        kind: "mcq", id: "ed-3", stage: "transfert", ops: ["transfer", "justify"], competence: "app",
        prompt: "Pourquoi voit-on la Lune sous des formes différentes (phases) au cours du mois ?",
        options: [
          { text: "Parce que la partie éclairée par le Soleil que nous voyons change pendant que la Lune tourne autour de la Terre", feedback: "Oui : la Lune est toujours à moitié éclairée, on en voit plus ou moins." },
          { text: "Parce que l'ombre de la Terre la cache en partie", feedback: "Ça, c'est une éclipse de Lune, un phénomène rare." },
          { text: "Parce que des nuages passent devant", feedback: "Les phases se voient aussi par ciel parfaitement clair." },
        ],
        correct: 0,
        hint: "Quelle moitié de la Lune est éclairée, et laquelle voit-on ?",
        solution: ["Le Soleil éclaire toujours une moitié de la Lune.", "Selon sa position autour de la Terre, nous voyons une part plus ou moins grande de cette moitié."],
        takeaway: "Les phases viennent de l'angle sous lequel on voit la moitié éclairée, pas de l'ombre de la Terre.",
      },
    ],
  },

  /* ——— Apprendre à apprendre ——— */
  {
    id: "cerveau-memoire",
    track: "cerveau",
    title: "Comment ta mémoire fonctionne",
    promise: "Savoir quelles façons de réviser marchent vraiment.",
    minutes: 3,
    activities: [
      {
        kind: "mcq", id: "cm-1", stage: "rappel", ops: ["retrieve"], competence: "svt-savoirs",
        prompt: "Pour retenir une leçon longtemps, qu'est-ce qui marche le mieux ?",
        options: [
          { text: "Se tester plusieurs fois, en espaçant les révisions sur plusieurs jours", feedback: "La récupération active et l'espacement sont parmi les effets les mieux établis." },
          { text: "Relire la leçon cinq fois la veille", feedback: "Relire donne une impression de maîtrise, mais retient peu à long terme." },
          { text: "Surligner tout le texte", feedback: "Surligner seul aide peu : on ne se teste pas." },
        ],
        correct: 0,
        hint: "Ta mémoire se renforce quand tu dois aller chercher l'information.",
        solution: ["Se tester oblige à récupérer l'information : c'est ce qui consolide.", "Espacer les séances aide à retenir plus longtemps."],
        takeaway: "Se tester, et espacer : c'est ce que fait LearnWard avec les rappels.",
      },
      {
        kind: "classify", id: "cm-2", stage: "application", ops: ["evaluate"], competence: "svt-savoirs",
        prompt: "Efficace ou peu efficace pour apprendre ?",
        categories: ["Efficace", "Peu efficace"],
        items: [
          { text: "M'interroger sans regarder le cours", category: 0, feedback: "C'est de la récupération active." },
          { text: "Relire en boucle", category: 1, feedback: "On reconnaît le texte, mais on ne s'entraîne pas à le retrouver." },
          { text: "Réviser un peu chaque jour", category: 0, feedback: "L'espacement aide à retenir longtemps." },
          { text: "Tout réviser la veille au soir", category: 1, feedback: "Ça aide à court terme, mais s'oublie vite." },
          { text: "Expliquer la notion à quelqu'un", category: 0, feedback: "Expliquer oblige à organiser ce qu'on sait." },
        ],
        hint: "Qu'est-ce qui oblige ton cerveau à travailler ?",
        solution: ["Efficace : se tester, espacer, expliquer.", "Peu efficace : relire en boucle, tout réviser la veille."],
        takeaway: "Ce qui demande un effort de rappel est ce qui fait retenir.",
      },
    ],
  },

  /* ——— Aller plus loin ——— */
  {
    id: "loin-0999",
    track: "approfondir",
    title: "0,999… est-il égal à 1 ?",
    promise: "Démontrer un résultat qui surprend tout le monde.",
    minutes: 4,
    activities: [
      {
        kind: "worked", id: "l9-1", stage: "application", ops: ["apply", "justify"], competence: "raisonner",
        prompt: "On note x = 0,999… (une infinité de 9). Complète la démonstration.",
        steps: [
          { text: "10x = 9,999…", why: "Multiplier par 10 décale la virgule d'un rang." },
          { text: "…", why: "On soustrait x : les décimales, toutes égales à 9, s'annulent." },
          { text: "Donc x = 1", why: "On divise par 9." },
        ],
        blank: 1,
        options: [
          { text: "10x − x = 9,999… − 0,999…, donc 9x = 9", feedback: "Les infinités de 9 se compensent exactement." },
          { text: "10x − x = 9, donc x = 9", feedback: "10x − x vaut 9x, pas x." },
          { text: "10x = 10, donc x = 1", feedback: "On ne sait pas encore que 10x = 10 : c'est ce qu'on veut montrer." },
        ],
        correct: 0,
        hint: "Que reste-t-il quand on soustrait 0,999… à 9,999… ?",
        solution: ["10x − x = 9,999… − 0,999… = 9.", "9x = 9, donc x = 1."],
        takeaway: "0,999… et 1 sont deux écritures du même nombre.",
      },
      {
        kind: "mcq", id: "l9-2", stage: "transfert", ops: ["transfer", "justify"], competence: "raisonner",
        prompt: "1/3 = 0,333… En multipliant par 3, que peut-on conclure ?",
        options: [
          { text: "3 × 1/3 = 1, et 3 × 0,333… = 0,999… : donc 0,999… = 1", feedback: "Une autre preuve, plus rapide." },
          { text: "0,999… est un peu plus petit que 1", feedback: "Si c'était le cas, il existerait un nombre entre les deux : il n'y en a aucun." },
          { text: "Rien : on ne peut pas multiplier une infinité de chiffres", feedback: "On peut : chaque 3 devient un 9, sans retenue." },
        ],
        correct: 0,
        hint: "Calcule chaque membre séparément.",
        solution: ["3 × 1/3 = 1.", "3 × 0,333… = 0,999…, donc les deux sont égaux."],
        takeaway: "Deux nombres différents ont toujours un nombre entre eux : entre 0,999… et 1, il n'y en a aucun.",
      },
    ],
  },
  {
    id: "loin-gps",
    track: "approfondir",
    title: "Le GPS et la lumière",
    promise: "Comprendre pourquoi une erreur d'un millionième de seconde compte.",
    minutes: 4,
    activities: [
      {
        kind: "problem", id: "lg-1", stage: "application", ops: ["apply", "interpret"], competence: "app",
        context: "Un satellite GPS est à environ 20 000 km de toi. Son signal voyage à la vitesse de la lumière, environ 300 000 km/s.",
        hint: "Durée = distance ÷ vitesse.",
        solution: [],
        takeaway: "Le GPS mesure des durées pour en déduire des distances : il lui faut des horloges extrêmement précises.",
        parts: [
          { id: "lg-1a", label: "a", competence: "app", prompt: "Combien de millisecondes met le signal pour arriver ? (1 s = 1 000 ms)", answer: { expected: 66.7, tolerance: { abs: 0.1 } }, hint: "20 000 ÷ 300 000 secondes, puis × 1 000.", solution: ["20 000 ÷ 300 000 ≈ 0,0667 s", "Soit environ 66,7 ms"], recap: "≈ 66,7 ms", reviewLabel: "Calculer une durée de trajet" },
          { id: "lg-1b", label: "b", competence: "app", prompt: "Si l'horloge se trompe d'un millionième de seconde (0,000 001 s), de combien de mètres se trompe la distance ?", answer: { expected: 300, knownErrors: [{ value: 0.3, code: "km" }] }, errors: { km: "0,3, c'est en kilomètres. La question demande des mètres." }, hint: "300 000 km/s = 300 000 000 m/s ; multiplie par 0,000 001 s.", solution: ["d = 300 000 000 × 0,000 001 = 300 m"], recap: "300 m", reviewLabel: "Calculer une distance" },
        ],
      },
      {
        kind: "mcq", id: "lg-2", stage: "transfert", ops: ["transfer", "justify"], competence: "app",
        prompt: "Pourquoi un récepteur GPS a-t-il besoin d'au moins quatre satellites ?",
        options: [
          { text: "Trois pour situer la position, un de plus pour corriger l'erreur de l'horloge du récepteur", feedback: "Oui : quatre inconnues (trois coordonnées et le décalage d'horloge), donc quatre mesures." },
          { text: "Parce qu'un satellite ne couvre qu'un quart de la Terre", feedback: "La couverture n'est pas la raison : il s'agit du calcul de la position." },
          { text: "Pour avoir des satellites de secours", feedback: "Il faut au moins quatre mesures simultanées, pas des réserves." },
        ],
        correct: 0,
        hint: "L'horloge de ton téléphone est bien moins précise que celles des satellites.",
        solution: ["Trois distances suffiraient avec une horloge parfaite.", "Le décalage de l'horloge du récepteur est une inconnue de plus : il faut un quatrième satellite."],
        takeaway: "Quatre inconnues, quatre mesures : c'est le principe du positionnement GPS.",
      },
    ],
  },
  {
    id: "loin-zero",
    track: "approfondir",
    title: "Pourquoi on ne divise pas par zéro",
    promise: "Comprendre la règle au lieu de l'apprendre par cœur.",
    minutes: 3,
    activities: [
      {
        kind: "mcq", id: "lz-1", stage: "application", ops: ["justify"], competence: "raisonner",
        prompt: "Si 6 ÷ 0 valait un nombre a, que devrait vérifier a ?",
        options: [
          { text: "a × 0 = 6, ce qui est impossible car a × 0 = 0 pour tout nombre a", feedback: "La division est l'opération inverse de la multiplication : aucun a ne convient." },
          { text: "a = 0, car diviser par 0 donne 0", feedback: "Alors on aurait 0 × 0 = 6, ce qui est faux." },
          { text: "a = 6, car diviser par 0 ne change rien", feedback: "Alors on aurait 6 × 0 = 6, ce qui est faux." },
        ],
        correct: 0,
        hint: "6 ÷ 2 = 3 parce que 3 × 2 = 6. Applique la même idée.",
        solution: ["a ÷ b = c signifie c × b = a.", "Ici il faudrait a × 0 = 6 : impossible."],
        takeaway: "On ne divise pas par 0 parce qu'aucun nombre ne fonctionnerait comme résultat.",
      },
      {
        kind: "mcq", id: "lz-2", stage: "transfert", ops: ["transfer", "justify"], competence: "raisonner",
        prompt: "Et 0 ÷ 0 ? Avec le même raisonnement, quel nombre a vérifierait a × 0 = 0 ?",
        options: [
          { text: "Tous les nombres : c'est pour ça qu'on ne peut pas choisir une valeur", feedback: "Trop de réponses possibles : 0 ÷ 0 n'est pas défini." },
          { text: "Seulement 1", feedback: "2 × 0 = 0 aussi, et 1 000 × 0 = 0." },
          { text: "Seulement 0", feedback: "5 × 0 = 0 aussi : 0 n'est pas le seul." },
        ],
        correct: 0,
        hint: "Essaie a = 1, puis a = 7.",
        solution: ["N'importe quel a vérifie a × 0 = 0.", "Aucune valeur ne s'impose : 0 ÷ 0 n'est pas défini."],
        takeaway: "6 ÷ 0 : aucune réponse. 0 ÷ 0 : trop de réponses. Dans les deux cas, ce n'est pas défini.",
      },
    ],
  },
];

export const getCapsule = (id: string) => CAPSULES.find((c) => c.id === id);
export const capsulesOf = (t: TrackId) => CAPSULES.filter((c) => c.track === t);
export const EXPLORE_NOTE = NOTE;
