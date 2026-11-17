import type { CompetenceId } from "@/lib/content/types";
import { findUnit } from "@/lib/curriculum";
import { classify, gen, mcq } from "../build";
import { GRAMMAR_POINTS, UNIT_GRAMMAR } from "../lessons/langues";
import type { Generator } from "../types";

/**
 * Grammaire en langues vivantes et en français : des phrases à trou, chacune avec sa bonne forme et trois pièges
 * expliqués. Une phrase n'entre dans la banque que si aucun piège n'y est correct, même dans un usage familier
 * ou régional : les cas discutés (« Hoy trabajé », « Kannst du mir helfen ? ») ont été écartés.
 * Contenu au statut « à relire » comme le reste de la banque : à faire valider par un professeur de langue.
 */

/** [phrase avec ___, bonne réponse, pièges [forme, explication], règle, consigne propre (facultatif)] */
type Item = [s: string, answer: string, wrong: [string, string][], rule: string, q?: string];

const EN: Record<string, Item[]> = {
  "en:be-have": [
    ["My sister ___ twelve years old.", "is", [["has", "L'âge s'exprime avec be : she is twelve."], ["are", "Le sujet my sister est singulier : is."], ["have", "L'âge se dit avec be, jamais avec have."]], "En anglais, on « est » son âge : be + nombre d'années."],
    ["We ___ got a big garden.", "have", [["has", "Avec we, on emploie have."], ["are", "La possession s'exprime avec have got."], ["is", "La possession s'exprime avec have got, et we demande have."]], "have got exprime la possession : I/you/we/they have got, he/she/it has got."],
    ["___ you from Scotland?", "Are", [["Is", "Avec you, be se conjugue are."], ["Do", "Avec be, la question se forme par inversion, sans do."], ["Have", "Être originaire d'un lieu se dit be from."]], "Question avec be : on inverse le sujet et le verbe (Are you…?)."],
    ["He ___ got any brothers or sisters.", "hasn't", [["haven't", "À la 3e personne du singulier : hasn't got."], ["isn't", "have got se met à la forme négative avec hasn't ou haven't."], ["doesn't", "have got se met à la forme négative sans do."]], "Négation de have got : haven't got, hasn't got (3e personne du singulier)."],
    ["I ___ hungry: can I have a sandwich?", "am", [["have", "Avoir faim se dit be hungry."], ["is", "Avec I, be se conjugue am."], ["are", "Avec I, be se conjugue am."]], "Avoir faim, soif, froid : be hungry, thirsty, cold."],
    ["They ___ very funny and kind.", "are", [["is", "They est pluriel : are."], ["has", "Pour décrire quelqu'un, on emploie be."], ["am", "am s'emploie seulement avec I."]], "be au présent : I am, you are, he/she/it is, we/you/they are."],
  ],
  "en:present-simple": [
    ["She usually ___ the bus to school.", "takes", [["take", "À la 3e personne du singulier, on ajoute -s."], ["taking", "Il manque un verbe conjugué."], ["is take", "On ne combine pas be avec la base verbale."]], "Présent simple : -s à la 3e personne du singulier (she takes)."],
    ["___ your brother play the guitar?", "Does", [["Do", "Avec your brother (3e personne du singulier), on emploie does."], ["Is", "Au présent simple, la question se forme avec do ou does."], ["Has", "Au présent simple, la question se forme avec do ou does."]], "Question au présent simple : Do/Does + sujet + base verbale."],
    ["My parents ___ work on Sundays.", "don't", [["doesn't", "My parents est pluriel : don't."], ["aren't", "Au présent simple, la négation se forme avec do."], ["not", "Il faut l'auxiliaire do : don't work."]], "Négation au présent simple : don't/doesn't + base verbale."],
    ["He never ___ his homework after dinner.", "does", [["do", "3e personne du singulier : does."], ["doing", "Il manque un verbe conjugué."], ["is doing", "Avec never (habitude), on emploie le présent simple."]], "Les adverbes de fréquence (always, never…) accompagnent le présent simple."],
    ["I always ___ up at seven.", "get", [["gets", "Avec I, pas de -s."], ["am getting", "Une habitude s'exprime au présent simple."], ["got", "C'est une habitude au présent, pas une action passée."]], "Habitudes et vérités générales : présent simple."],
    ["Where does she ___?", "live", [["lives", "Après does, le verbe reste à la base verbale."], ["living", "Après does, on emploie la base verbale."], ["lived", "Après does, on emploie la base verbale."]], "Après do/does, le verbe reste à la base verbale, sans -s."],
  ],
  "en:there-is": [
    ["___ a castle near my town.", "There is", [["There are", "a castle est singulier : there is."], ["It has", "« Il y a » se traduit par there is / there are."], ["It is", "« Il y a » se traduit par there is / there are."]], "Il y a : there is + singulier, there are + pluriel."],
    ["___ two cinemas in the city centre.", "There are", [["There is", "two cinemas est pluriel : there are."], ["They are", "« Il y a » se traduit par there are."], ["It has", "« Il y a » se traduit par there are."]], "Il y a : there is + singulier, there are + pluriel."],
    ["Are there ___ shops near your house?", "any", [["some", "Dans les questions, on emploie any."], ["a", "shops est pluriel : pas d'article a."], ["much", "much accompagne les indénombrables ; shops est dénombrable."]], "some dans les phrases affirmatives, any dans les questions et les négations."],
    ["There ___ any milk in the fridge.", "isn't", [["aren't", "milk est indénombrable : singulier."], ["hasn't", "« Il n'y a pas » se dit there isn't."], ["don't", "« Il n'y a pas » se dit there isn't."]], "Les indénombrables (milk, water, bread) s'emploient au singulier."],
    ["There are ___ beautiful beaches in Cornwall.", "some", [["any", "Dans une phrase affirmative, on emploie some."], ["a", "beaches est pluriel : pas d'article a."], ["much", "beaches est dénombrable : much ne convient pas."]], "some s'emploie dans les phrases affirmatives."],
    ["How many students ___ in your class?", "are there", [["is there", "students est pluriel : are there."], ["there are", "Dans une question, on inverse : are there."], ["have there", "« Combien y a-t-il » se dit how many… are there."]], "Question : Is there…? Are there…? How many… are there?"],
  ],
  "en:preterit-regular": [
    ["Yesterday we ___ football in the park.", "played", [["play", "Yesterday situe l'action dans le passé : prétérit."], ["plays", "Yesterday situe l'action dans le passé : prétérit."], ["playing", "Il manque un verbe conjugué."]], "Prétérit des verbes réguliers : base verbale + -ed."],
    ["She ___ her grandmother last weekend.", "visited", [["visit", "Last weekend situe l'action dans le passé."], ["visiting", "Il manque un verbe conjugué."], ["visits", "Last weekend situe l'action dans le passé."]], "Prétérit des verbes réguliers : base verbale + -ed."],
    ["___ you watch the match last night?", "Did", [["Do", "Last night situe la question dans le passé : did."], ["Were", "Au prétérit, la question avec un verbe d'action se forme avec did."], ["Have", "Au prétérit, la question se forme avec did."]], "Question au prétérit : Did + sujet + base verbale."],
    ["I didn't ___ the film.", "like", [["liked", "Après didn't, le verbe reste à la base verbale."], ["likes", "Après didn't, le verbe reste à la base verbale."], ["liking", "Après didn't, le verbe reste à la base verbale."]], "Négation au prétérit : didn't + base verbale."],
    ["Once upon a time, a dragon ___ in a cave.", "lived", [["live", "Un conte se raconte au prétérit."], ["lives", "Un conte se raconte au prétérit."], ["living", "Il manque un verbe conjugué."]], "Le récit au passé emploie le prétérit."],
    ["Where ___ she yesterday?", "was", [["were", "Avec she, be au prétérit se conjugue was."], ["did", "Avec be, pas d'auxiliaire did."], ["is", "Yesterday : on emploie le prétérit."]], "Prétérit de be : I/he/she/it was, you/we/they were."],
  ],
  "en:like-ing": [
    ["I love ___ in the sea.", "swimming", [["swim", "Après love, le verbe prend la forme -ing."], ["swims", "Après love, le verbe prend la forme -ing."], ["swam", "Après love, le verbe prend la forme -ing."]], "like, love, hate, enjoy + verbe en -ing."],
    ["She hates ___ up early.", "getting", [["get", "Après hate, le verbe prend la forme -ing."], ["gets", "Après hate, le verbe prend la forme -ing."], ["got", "Après hate, le verbe prend la forme -ing."]], "like, love, hate, enjoy + verbe en -ing."],
    ["My brother doesn't like ___.", "dancing", [["dance", "Après like, le verbe prend la forme -ing."], ["dances", "Après like, le verbe prend la forme -ing."], ["danced", "Après like, le verbe prend la forme -ing."]], "like, love, hate, enjoy + verbe en -ing."],
    ["They really enjoy ___ video games.", "playing", [["play", "Après enjoy, le verbe prend obligatoirement la forme -ing."], ["to play", "enjoy n'accepte pas l'infinitif avec to."], ["plays", "Après enjoy, le verbe prend la forme -ing."]], "enjoy est toujours suivi d'un verbe en -ing."],
    ["Do you like ___ comics?", "reading", [["reads", "Après like, le verbe prend la forme -ing."], ["is reading", "Après like, on emploie la forme -ing seule."], ["readed", "read est irrégulier, et après like on emploie -ing."]], "like, love, hate, enjoy + verbe en -ing."],
  ],
  "en:comparatives": [
    ["London is ___ than Oxford.", "bigger", [["more big", "big est un adjectif court : big → bigger."], ["biggest", "C'est le superlatif ; avec than, on emploie le comparatif."], ["big", "Avec than, l'adjectif se met au comparatif."]], "Adjectif court : -er + than (bigger than). Adjectif long : more + adjectif + than."],
    ["This film is ___ than the book.", "more interesting", [["interestinger", "interesting est un adjectif long : more interesting."], ["most interesting", "C'est le superlatif ; avec than, on emploie le comparatif."], ["as interesting", "as… as exprime l'égalité, et on ne le combine pas avec than."]], "Adjectif long : more + adjectif + than."],
    ["Ben is the ___ boy in the class.", "tallest", [["taller", "the + adjectif : c'est le superlatif."], ["most tall", "tall est court : the tallest."], ["more tall", "tall est court, et ici il faut le superlatif."]], "Superlatif : the + adjectif court en -est, ou the most + adjectif long."],
    ["My bag is ___ than yours.", "heavier", [["heavyer", "Le y final devient i : heavier."], ["more heavy", "heavy est court : heavier."], ["heaviest", "C'est le superlatif ; avec than, on emploie le comparatif."]], "Adjectif terminé par -y : -y devient -ier (heavy → heavier)."],
    ["This is the ___ day of my life!", "best", [["goodest", "good est irrégulier : good, better, best."], ["better", "the + … of : c'est le superlatif, best."], ["most good", "good est irrégulier : best."]], "Comparatifs irréguliers : good → better → best ; bad → worse → worst."],
    ["Maths is ___ than English for me.", "easier", [["more easy", "easy est court : easier."], ["easyer", "Le y final devient i : easier."], ["easiest", "C'est le superlatif ; avec than, on emploie le comparatif."]], "Adjectif terminé par -y : -y devient -ier (easy → easier)."],
    ["My sister is as tall ___ me.", "as", [["than", "L'égalité s'exprime avec as… as."], ["that", "L'égalité s'exprime avec as… as."], ["like", "L'égalité s'exprime avec as… as."]], "Comparatif d'égalité : as + adjectif + as."],
  ],
  "en:present-continuous": [
    ["Look! It ___.", "is raining", [["rains", "Look! : l'action se déroule maintenant, be + -ing."], ["rain", "Il faut be + -ing pour une action en cours."], ["raining", "Il manque l'auxiliaire be."]], "Action en cours : be + verbe en -ing."],
    ["Be quiet, the baby ___.", "is sleeping", [["sleeps", "L'action se déroule maintenant : be + -ing."], ["are sleeping", "the baby est singulier : is."], ["sleeping", "Il manque l'auxiliaire be."]], "Action en cours : be + verbe en -ing."],
    ["What ___ you doing right now?", "are", [["do", "Right now : be + -ing, donc are you doing."], ["is", "Avec you, be se conjugue are."], ["does", "Right now : be + -ing, donc are you doing."]], "Question au présent en be + -ing : Are you doing…?"],
    ["She usually walks to school, but today she ___ the bus.", "is taking", [["takes", "Today, exceptionnellement : be + -ing."], ["take", "Il faut be + -ing, et un -s à la 3e personne n'est pas la bonne forme ici."], ["taking", "Il manque l'auxiliaire be."]], "Habitude : présent simple ; action exceptionnelle ou en cours : be + -ing."],
    ["We ___ TV at the moment.", "aren't watching", [["don't watch", "At the moment : be + -ing."], ["isn't watching", "Avec we : aren't."], ["not watching", "Il manque l'auxiliaire be."]], "Négation en be + -ing : am not, isn't, aren't + verbe en -ing."],
    ["I ___ chocolate. It's my favourite!", "love", [["am loving", "love est un verbe d'état : il s'emploie au présent simple."], ["loves", "Avec I, pas de -s."], ["loving", "Il manque un verbe conjugué."]], "Les verbes d'état (love, like, know, want) s'emploient au présent simple."],
  ],
  "en:modals": [
    ["You ___ wear a helmet when you ride a bike. It's the law.", "must", [["can", "C'est une obligation, pas une capacité : must."], ["mustn't", "mustn't exprime l'interdiction, le contraire du sens voulu."], ["should to", "should n'est jamais suivi de to."]], "must : obligation ; mustn't : interdiction ; can : capacité ou permission."],
    ["You ___ use your phone in class: it's forbidden.", "mustn't", [["don't have to", "don't have to signifie « ce n'est pas obligatoire », pas « c'est interdit »."], ["must", "C'est une interdiction : mustn't."], ["can", "C'est une interdiction : mustn't."]], "mustn't : interdiction ; don't have to : absence d'obligation."],
    ["She ___ speak three languages.", "can", [["cans", "Un modal ne prend jamais de -s."], ["can to", "Un modal n'est jamais suivi de to."], ["is can", "Un modal ne se combine pas avec be."]], "Les modaux (can, must, should) sont invariables et suivis de la base verbale."],
    ["You look tired. You ___ go to bed earlier.", "should", [["should to", "should n'est jamais suivi de to."], ["shoulds", "Un modal ne prend jamais de -s."], ["must to", "must n'est jamais suivi de to."]], "should exprime un conseil : You should + base verbale."],
    ["Tomorrow is Sunday: I ___ get up early.", "don't have to", [["mustn't", "mustn't serait une interdiction ; ici, ce n'est simplement pas obligatoire."], ["doesn't have to", "Avec I : don't have to."], ["haven't to", "have to se met à la forme négative avec do : don't have to."]], "don't have to : absence d'obligation."],
    ["___ I open the window, please?", "Can", [["Do", "Pour demander une permission, on emploie can (ou may)."], ["Am", "Pour demander une permission, on emploie can (ou may)."], ["Does", "Pour demander une permission, on emploie can (ou may)."]], "Demander la permission : Can I…? (ou May I…?)."],
  ],
  "en:preterit-irregular": [
    ["Last summer we ___ to Scotland.", "went", [["goed", "go est irrégulier : go, went, gone."], ["go", "Last summer : prétérit."], ["gone", "gone est le participe passé ; au prétérit : went."]], "Verbes irréguliers : base, prétérit, participe passé (go, went, gone)."],
    ["She ___ a strange noise in the night.", "heard", [["heared", "hear est irrégulier : hear, heard, heard."], ["hear", "Le récit est au passé : prétérit."], ["hears", "Le récit est au passé : prétérit."]], "hear, heard, heard."],
    ["I ___ my keys yesterday.", "lost", [["losed", "lose est irrégulier : lose, lost, lost."], ["lose", "Yesterday : prétérit."], ["loosed", "lose est irrégulier : lost."]], "lose, lost, lost."],
    ["They ___ a cake for my birthday.", "made", [["maked", "make est irrégulier : make, made, made."], ["make", "L'action est passée : prétérit."], ["makes", "L'action est passée : prétérit."]], "make, made, made."],
    ["He ___ the bus this morning.", "caught", [["catched", "catch est irrégulier : catch, caught, caught."], ["catch", "L'action est passée : prétérit."], ["catches", "L'action est passée : prétérit."]], "catch, caught, caught."],
    ["We ___ pizza at the restaurant last night.", "ate", [["eated", "eat est irrégulier : eat, ate, eaten."], ["eat", "Last night : prétérit."], ["eaten", "eaten est le participe passé ; au prétérit : ate."]], "eat, ate, eaten."],
    ["Did you ___ the news yesterday?", "see", [["saw", "Après did, le verbe reste à la base verbale."], ["seen", "Après did, le verbe reste à la base verbale."], ["seed", "Après did, le verbe reste à la base verbale : see."]], "Question au prétérit : Did + sujet + base verbale (did you see)."],
    ["She ___ me a postcard from Rome.", "sent", [["sended", "send est irrégulier : send, sent, sent."], ["send", "L'action est passée : prétérit."], ["sends", "L'action est passée : prétérit."]], "send, sent, sent."],
  ],
  "en:future": [
    ["Look at the clouds! It ___ rain.", "is going to", [["will to", "will n'est jamais suivi de to."], ["going to", "Il manque be : it is going to."], ["is going", "Il manque to : it is going to rain."]], "be going to : prédiction fondée sur un indice présent (les nuages)."],
    ["I think robots ___ do most jobs one day.", "will", [["wills", "will est invariable."], ["will to", "will n'est jamais suivi de to."], ["are", "Il faut un auxiliaire du futur : will."]], "will + base verbale : prédiction, avis sur l'avenir."],
    ["Next year I ___ 15.", "will be", [["will", "Il manque le verbe be : I will be 15."], ["am going", "Il manque to be : I am going to be 15."], ["be", "Il faut un auxiliaire du futur : will be."]], "Futur : will + base verbale (I will be)."],
    ["We ___ visit our cousins next weekend: we've already bought the tickets.", "are going to", [["will to", "will n'est jamais suivi de to."], ["going to", "Il manque be : we are going to."], ["goes to", "be going to se conjugue avec be."]], "be going to : projet déjà décidé."],
    ["___ you help me, please?", "Will", [["Do will", "will ne se combine pas avec do."], ["Are", "Il faut un auxiliaire du futur : Will you…?"], ["Wills", "will est invariable."]], "Question au futur : Will + sujet + base verbale."],
    ["She ___ come to the party: she's ill.", "won't", [["willn't", "La forme contractée de will not est won't."], ["doesn't will", "will ne se combine pas avec do."], ["not will", "La négation se place après will : won't (will not)."]], "Négation du futur : won't (will not) + base verbale."],
  ],
  "en:passive": [
    ["This bridge ___ in 1894.", "was built", [["built", "Le pont ne construit pas : il est construit, voix passive."], ["is built", "1894 est une date passée : was built."], ["was build", "Après be, au passif, on emploie le participe passé : built."]], "Voix passive : be + participe passé (was built)."],
    ["English ___ in many countries.", "is spoken", [["speaks", "L'anglais ne parle pas : il est parlé, voix passive."], ["is speaking", "be + -ing n'est pas le passif."], ["is speak", "Au passif, on emploie le participe passé : spoken."]], "Voix passive au présent : am/is/are + participe passé."],
    ["The letters ___ every morning.", "are delivered", [["is delivered", "The letters est pluriel : are."], ["deliver", "Les lettres ne livrent pas : elles sont livrées."], ["are deliver", "Au passif, on emploie le participe passé : delivered."]], "Voix passive au présent : am/is/are + participe passé."],
    ["The thief ___ by the police yesterday.", "was arrested", [["arrested", "Le voleur ne fait pas l'action : il la subit, voix passive."], ["is arrested", "Yesterday : prétérit, was arrested."], ["were arrested", "The thief est singulier : was."]], "Voix passive au prétérit : was/were + participe passé."],
    ["Harry Potter ___ by J. K. Rowling.", "was written", [["was wrote", "Au passif, on emploie le participe passé : written."], ["wrote", "Le livre n'écrit pas : il a été écrit."], ["is writing", "be + -ing n'est pas le passif."]], "Voix passive : be + participe passé ; l'auteur de l'action est introduit par by."],
    ["Smartphones ___ all over the world.", "are used", [["use", "Les smartphones n'utilisent pas : ils sont utilisés."], ["are using", "be + -ing n'est pas le passif."], ["is used", "Smartphones est pluriel : are."]], "Voix passive au présent : am/is/are + participe passé."],
  ],
  "en:causative": [
    ["I ___ my hair cut yesterday.", "had", [["did", "Faire faire quelque chose : have + objet + participe passé."], ["made", "make + objet + participe passé ne s'emploie pas pour un service rendu."], ["was", "Faire faire quelque chose : have something done."]], "Faire faire : have + objet + participe passé (I had my hair cut)."],
    ["She is having her car ___.", "repaired", [["repair", "Après have + objet, on emploie le participe passé."], ["repairing", "Après have + objet, on emploie le participe passé."], ["to repair", "Après have + objet, on emploie le participe passé."]], "have something done : have + objet + participe passé."],
    ["We are going to have our house ___.", "painted", [["paint", "Après have + objet, on emploie le participe passé."], ["painting", "Après have + objet, on emploie le participe passé."], ["to paint", "Après have + objet, on emploie le participe passé."]], "have something done : have + objet + participe passé."],
  ],
  "en:present-perfect": [
    ["I have never ___ to Japan.", "been", [["went", "Present perfect : have + participe passé (been)."], ["go", "Present perfect : have + participe passé."], ["was", "Present perfect : have + participe passé."]], "Present perfect : have/has + participe passé ; expérience : I have never been."],
    ["She ___ in London since 2020.", "has lived", [["lives", "since + point de départ : present perfect."], ["is living", "since + point de départ : present perfect."], ["lived", "L'action dure encore : present perfect, pas prétérit."]], "since + point de départ, for + durée : present perfect pour une action qui dure encore."],
    ["We ___ our homework yet.", "haven't finished", [["didn't finish", "yet accompagne le present perfect."], ["hasn't finished", "Avec we : haven't."], ["don't finish", "yet accompagne le present perfect."]], "yet (pas encore, déjà dans une question) accompagne le present perfect."],
    ["Have you ever ___ sushi?", "eaten", [["ate", "Après have : participe passé, eaten."], ["eat", "Après have : participe passé, eaten."], ["eated", "eat est irrégulier : eat, ate, eaten."]], "Expérience : Have you ever + participe passé ?"],
    ["He ___ his leg last year.", "broke", [["has broken", "last year est une date passée précise : prétérit."], ["has broke", "last year : prétérit, broke."], ["breaks", "L'action est passée et datée : prétérit."]], "Moment passé précis (yesterday, last year, in 2010) : prétérit, jamais present perfect."],
    ["They have known each other ___ ten years.", "for", [["since", "ten years est une durée : for."], ["during", "Avec le present perfect, la durée s'exprime avec for."], ["ago", "ago s'emploie avec le prétérit."]], "for + durée (for ten years), since + point de départ (since 2015)."],
    ["I moved here three years ___.", "ago", [["for", "ago situe un moment passé : three years ago."], ["since", "since s'emploie avec le present perfect et un point de départ."], ["during", "« Il y a trois ans » se dit three years ago."]], "ago (il y a) s'emploie avec le prétérit : three years ago."],
  ],
  "en:used-to": [
    ["When I was a child, I ___ live in Wales.", "used to", [["use to", "À la forme affirmative : used to."], ["was used to", "be used to signifie « être habitué à »."], ["used", "Il manque to : used to live."]], "used to + base verbale : habitude passée, révolue."],
    ["Did you ___ play with dolls?", "use to", [["used to", "Après did, on emploie use to."], ["using to", "Après did, on emploie use to."], ["uses to", "Après did, on emploie use to."]], "Question : Did you use to…? (après did, use sans -d)."],
    ["My grandparents ___ have a TV.", "didn't use to", [["don't use to", "C'est une habitude passée : didn't use to."], ["aren't used to", "be used to signifie « être habitué à »."], ["didn't used to", "Après didn't, on emploie use to."]], "Négation : didn't use to + base verbale."],
    ["Life ___ be harder in the 19th century.", "used to", [["uses to", "used to ne se conjugue pas au présent."], ["was use to", "La forme est used to."], ["is used to", "is used to signifie « est habitué à »."]], "used to décrit une situation passée qui n'existe plus."],
    ["People ___ write letters instead of emails.", "used to", [["use to", "À la forme affirmative : used to."], ["were used", "La forme est used to + base verbale."], ["using to", "La forme est used to + base verbale."]], "used to + base verbale : habitude passée."],
  ],
  "en:past-perfect": [
    ["When we arrived, the film had already ___.", "started", [["start", "Après had : participe passé."], ["starts", "Après had : participe passé."], ["starting", "Après had : participe passé."]], "Past perfect : had + participe passé, pour une action antérieure à une autre action passée."],
    ["She was sad because she ___ her cat.", "had lost", [["has lost", "L'action est antérieure à un moment passé : had lost."], ["had lose", "Après had : participe passé, lost."], ["was lost", "was lost est un passif, avec un autre sens."]], "Past perfect : had + participe passé."],
    ["I had never ___ snow before that trip.", "seen", [["saw", "Après had : participe passé, seen."], ["see", "Après had : participe passé, seen."], ["seed", "see est irrégulier : see, saw, seen."]], "Past perfect : had + participe passé."],
    ["By the time the police arrived, the thieves ___.", "had escaped", [["have escaped", "Antériorité dans le passé : had escaped."], ["escape", "Antériorité dans le passé : had escaped."], ["had escape", "Après had : participe passé, escaped."]], "By the time + prétérit, past perfect dans la principale."],
    ["After she ___ her homework, she went out.", "had finished", [["has finished", "Antériorité dans le passé : had finished."], ["had finish", "Après had : participe passé, finished."], ["finishes", "Le récit est au passé."]], "Action antérieure à une autre action passée : past perfect."],
  ],
  "en:reported": [
    ["She said: \"I am tired.\" → She said that she ___ tired.", "was", [["were", "Avec she : was."], ["has been", "Concordance des temps : le présent devient prétérit."], ["be", "Il faut un verbe conjugué au prétérit."]], "Discours indirect après un verbe au passé : le présent devient prétérit.", "Rapporte au discours indirect, en appliquant la concordance des temps."],
    ["\"I will call you,\" he said. → He said he ___ call me.", "would", [["will", "Concordance des temps : will devient would."], ["can", "will devient would."], ["is going", "will devient would."]], "Discours indirect : will devient would.", "Rapporte au discours indirect, en appliquant la concordance des temps."],
    ["\"We live in Leeds.\" → They told me they ___ in Leeds.", "lived", [["live", "Concordance des temps : le présent devient prétérit."], ["living", "Il faut un verbe conjugué."], ["have lived", "Le présent simple devient prétérit."]], "Discours indirect : le présent simple devient prétérit.", "Rapporte au discours indirect, en appliquant la concordance des temps."],
    ["\"Where do you live?\" → She asked me where I ___.", "lived", [["did live", "Dans une question indirecte, pas de do ni d'inversion."], ["do live", "Dans une question indirecte, pas de do."], ["live", "Concordance des temps : prétérit."]], "Question indirecte : ordre sujet + verbe, sans do.", "Rapporte au discours indirect, en appliquant la concordance des temps."],
    ["\"Don't touch it!\" → He told me ___ touch it.", "not to", [["don't", "Un ordre négatif rapporté : tell somebody not to + base verbale."], ["not", "Il manque to : not to touch."], ["no to", "La négation de l'infinitif est not to."]], "Ordre rapporté : tell somebody (not) to + base verbale.", "Rapporte au discours indirect."],
    ["\"Are you ready?\" → He asked me ___ I was ready.", "if", [["that", "Question fermée rapportée : if (ou whether)."], ["what", "Question fermée (oui ou non) : if."], ["are", "Il faut un mot de liaison : if."]], "Question fermée rapportée : ask if (ou whether) + sujet + verbe.", "Rapporte au discours indirect."],
  ],
  "en:concession": [
    ["___ it was raining, they went out.", "Although", [["However", "however est un adverbe : il ne relie pas deux propositions ainsi."], ["Despite", "despite est suivi d'un nom ou d'un verbe en -ing."], ["Because", "Il s'agit d'une opposition, pas d'une cause."]], "although + proposition ; despite + nom ou -ing ; however, en tête de phrase, suivi d'une virgule."],
    ["The film was long. ___, I enjoyed it.", "However", [["Although", "although introduit une proposition subordonnée, pas une phrase indépendante."], ["Despite", "despite est suivi d'un nom."], ["Because", "Il s'agit d'une opposition."]], "however (cependant) relie deux phrases ; il est suivi d'une virgule."],
    ["___ the rain, the match was not cancelled.", "Despite", [["Although", "although est suivi d'une proposition (sujet + verbe)."], ["However", "however ne s'emploie pas devant un nom."], ["Even though", "even though est suivi d'une proposition."]], "despite + nom : despite the rain."],
    ["He passed the exam ___ he hadn't worked much.", "even though", [["despite", "despite est suivi d'un nom ou d'un verbe en -ing."], ["however", "however ne relie pas une subordonnée à la principale."], ["in spite", "in spite of est suivi d'un nom."]], "even though / although + proposition."],
    ["In spite ___ the cold, we swam in the lake.", "of", [["to", "L'expression est in spite of."], ["that", "L'expression est in spite of."], ["from", "L'expression est in spite of."]], "in spite of + nom = despite + nom."],
    ["She is rich. ___, she is not happy.", "Nevertheless", [["Although", "although introduit une subordonnée, pas une phrase indépendante."], ["Despite", "despite est suivi d'un nom."], ["Because", "Il s'agit d'une opposition."]], "nevertheless (néanmoins), en tête de phrase, suivi d'une virgule."],
  ],
  "en:purpose": [
    ["She saved money ___ buy a bike.", "to", [["for", "Le but devant un verbe s'exprime avec to (ou in order to)."], ["for to", "On ne combine pas for et to."], ["that", "that ne s'emploie pas devant un infinitif."]], "But : to (ou in order to) + base verbale."],
    ["I'm studying hard ___ I can get into a good university.", "so that", [["for", "Devant sujet + verbe, le but s'exprime avec so that."], ["to", "to est suivi d'un verbe, pas d'un sujet."], ["such", "such s'emploie devant un nom."]], "So that + sujet + verbe (souvent can ou could) : pour que."],
    ["He got up early ___ miss the train.", "so as not to", [["for not", "La forme correcte est so as not to (ou in order not to)."], ["to don't", "La négation de l'infinitif est not to."], ["for don't", "La forme correcte est so as not to."]], "But négatif : so as not to (ou in order not to) + base verbale."],
    ["It rained all day, ___ the match was cancelled.", "so", [["so that", "so that exprime le but ; ici, c'est une conséquence."], ["because", "La pluie est la cause : la suite est une conséquence, so."], ["to", "to exprime le but devant un verbe."]], "Conséquence : so (donc) ; but : so that (pour que)."],
    ["The road was ___ icy that we stayed at home.", "so", [["such", "such s'emploie devant un nom ; devant un adjectif seul, so."], ["too", "too… to, pas too… that."], ["very", "very… that ne s'emploie pas."]], "so + adjectif + that : si… que."],
    ["It was ___ a good film that I watched it twice.", "such", [["so", "so s'emploie devant un adjectif seul ; devant un groupe nominal, such."], ["too", "too ne s'emploie pas devant a + nom."], ["very", "very… that ne s'emploie pas."]], "such + (a) + adjectif + nom + that : un tel… que."],
  ],
  "en:hypothesis": [
    ["If it rains tomorrow, we ___ stay at home.", "will", [["would", "Condition réalisable (if + présent) : will dans la principale."], ["would have", "Condition réalisable : will."], ["stayed", "Condition réalisable : will + base verbale."]], "If + présent, will + base verbale : condition réalisable."],
    ["If I ___ rich, I would travel around the world.", "were", [["am", "Hypothèse irréelle : if + prétérit (were)."], ["will be", "On ne met jamais will après if dans une hypothèse."], ["would be", "would se place dans la principale, pas après if."]], "If + prétérit, would + base verbale : hypothèse irréelle dans le présent."],
    ["If she had studied, she ___ the exam.", "would have passed", [["would pass", "Irréel du passé : would have + participe passé."], ["will pass", "Irréel du passé : would have + participe passé."], ["had passed", "Irréel du passé : would have + participe passé."]], "If + past perfect, would have + participe passé : regret, irréel du passé."],
    ["What would you do if you ___ a million euros?", "won", [["win", "Hypothèse irréelle : if + prétérit."], ["would win", "would ne se place pas après if."], ["will win", "Hypothèse irréelle : if + prétérit."]], "If + prétérit, would + base verbale."],
    ["I ___ help you if I had more time.", "would", [["will", "if + prétérit (had) : would dans la principale."], ["had", "Il faut would dans la principale."], ["am", "Il faut would dans la principale."]], "If + prétérit, would + base verbale."],
    ["If you heat ice, it ___.", "melts", [["melted", "Vérité générale : présent dans les deux propositions."], ["would melt", "Vérité générale : présent dans les deux propositions."], ["melt", "it : -s à la 3e personne du singulier."]], "Vérité générale : if + présent, présent."],
  ],
  "en:nuance": [
    ["Take an umbrella: it ___ rain later.", "might", [["must", "must exprimerait une quasi-certitude ou une obligation ; ici, c'est une possibilité."], ["mights", "Un modal ne prend jamais de -s."], ["might to", "Un modal n'est jamais suivi de to."]], "may, might, could : possibilité ; must : forte probabilité ; can't : impossibilité."],
    ["He has been working all day. He ___ be exhausted.", "must", [["can't", "can't exprime l'impossibilité, le contraire du sens voulu."], ["mustn't", "mustn't exprime l'interdiction, pas la déduction."], ["should to", "should n'est jamais suivi de to."]], "must : déduction presque certaine."],
    ["That ___ be Tom: he's in Paris this week!", "can't", [["mustn't", "mustn't exprime l'interdiction, pas l'impossibilité."], ["must", "Il est à Paris : c'est impossible, can't."], ["doesn't", "Il faut un modal de probabilité : can't."]], "can't : déduction négative (c'est impossible)."],
    ["She ___ be at home, but I'm not sure.", "may", [["must", "must exprimerait une quasi-certitude ; or tu n'es pas sûr."], ["can't", "can't exprimerait l'impossibilité."], ["mays", "Un modal ne prend jamais de -s."]], "may / might : possibilité incertaine."],
    ["We ___ go to the beach tomorrow, if the weather is nice.", "could", [["coulds", "Un modal ne prend jamais de -s."], ["could to", "Un modal n'est jamais suivi de to."], ["must to", "Un modal n'est jamais suivi de to."]], "could : possibilité, suggestion."],
  ],
  "en:emphasis": [
    ["___ was in 1969 that men first walked on the Moon.", "It", [["This", "La mise en relief se construit avec it : It was… that."], ["There", "La mise en relief se construit avec it : It was… that."], ["That", "La mise en relief se construit avec it : It was… that."]], "Mise en relief : It is / It was + élément + that (ou who)."],
    ["What I need ___ a holiday.", "is", [["it is", "What I need est le sujet : il est suivi directement de is."], ["are", "What I need est singulier : is."], ["that", "Il manque le verbe : What I need is…"]], "Phrase clivée : What + sujet + verbe + is + élément mis en relief."],
    ["She ___ like you, I promise!", "does", [["do", "3e personne du singulier : does."], ["is", "L'insistance se fait avec do/does + base verbale."], ["doesn't", "La phrase affirme, elle ne nie pas."]], "Insistance : do/does/did + base verbale (She does like you!)."],
    ["Never ___ seen such a beautiful place.", "have I", [["I have", "Après never en tête de phrase, on inverse le sujet et l'auxiliaire."], ["I've", "Après never en tête de phrase, on inverse."], ["did I have", "Le present perfect s'inverse avec have : have I seen."]], "Never, rarely, seldom en tête de phrase : inversion sujet-auxiliaire."],
    ["It was Marie Curie ___ discovered radium, with Pierre Curie.", "who", [["which", "Pour une personne, on emploie who."], ["what", "La mise en relief se construit avec who ou that."], ["she", "Il faut un relatif : who."]], "Mise en relief d'une personne : It was + nom + who."],
  ],
  "en:wish": [
    ["I wish I ___ taller.", "were", [["am", "Souhait irréel dans le présent : prétérit (were)."], ["will be", "Après wish, pas de will."], ["would be", "Pour soi-même, wish + prétérit, pas would."]], "wish + prétérit : regret ou souhait irréel dans le présent."],
    ["I wish I ___ spoken to her yesterday.", "had", [["have", "Regret sur le passé : wish + past perfect (had + participe passé)."], ["would", "Regret sur le passé : wish + had + participe passé."], ["did", "Regret sur le passé : wish + had + participe passé."]], "wish + past perfect : regret sur le passé."],
    ["If only you ___ here now!", "were", [["are", "If only + prétérit : souhait irréel dans le présent."], ["will be", "Après if only, pas de will."], ["be", "Il faut le prétérit : were."]], "If only + prétérit : si seulement…"],
    ["She wishes she ___ play the piano.", "could", [["can", "Souhait irréel : prétérit, could."], ["will", "Après wish, pas de will."], ["is able", "Il manque to, et le sens demande le prétérit : could."]], "wish + could : regret d'une capacité qu'on n'a pas."],
    ["I wish it ___ stop raining!", "would", [["will", "Souhait qu'une situation change : wish + would."], ["does", "Souhait qu'une situation change : wish + would."], ["is", "Souhait qu'une situation change : wish + would."]], "wish + would : souhait qu'une situation agaçante change."],
  ],
};

const ES: Record<string, Item[]> = {
  "es:gustar": [
    ["A mí me ___ el chocolate.", "gusta", [["gusto", "Le sujet de gustar est el chocolate : gusta."], ["gustan", "el chocolate est singulier : gusta."], ["gustas", "Le sujet de gustar est el chocolate (3e personne)."]], "Avec gustar, le sujet est la chose aimée : me gusta + singulier, me gustan + pluriel."],
    ["¿Te ___ los videojuegos?", "gustan", [["gusta", "los videojuegos est pluriel : gustan."], ["gustas", "Le sujet est los videojuegos : gustan."], ["gusto", "Le sujet est los videojuegos : gustan."]], "me/te/le gustan + nom pluriel."],
    ["A mis padres ___ gusta viajar.", "les", [["le", "a mis padres est pluriel : les."], ["se", "Avec gustar, on emploie me, te, le, nos, os, les."], ["los", "Le pronom de gustar est un complément indirect : les."]], "Pronoms de gustar : me, te, le, nos, os, les."],
    ["A nosotros nos ___ bailar.", "encanta", [["encantamos", "Le sujet est bailar (un infinitif) : encanta."], ["encantan", "Un infinitif sujet est singulier : encanta."], ["encanto", "Le sujet est bailar : encanta."]], "Un infinitif sujet de gustar ou encantar est singulier : nos encanta bailar."],
    ["A Lucía ___ gustan los gatos.", "le", [["la", "Le pronom de gustar est un complément indirect : le."], ["les", "a Lucía est singulier : le."], ["se", "Avec gustar, on emploie le pour la 3e personne du singulier."]], "Pronoms de gustar : me, te, le, nos, os, les."],
    ["No me ___ nada las verduras.", "gustan", [["gusta", "las verduras est pluriel : gustan."], ["gusto", "Le sujet est las verduras : gustan."], ["gustas", "Le sujet est las verduras : gustan."]], "me gustan + nom pluriel."],
  ],
  "es:presente": [
    ["Yo ___ dieciséis años.", "tengo", [["tieno", "La diphtongue ne touche pas la 1re personne : tengo."], ["tiene", "Avec yo : tengo."], ["tenemos", "Avec yo : tengo."]], "tener au présent : tengo, tienes, tiene, tenemos, tenéis, tienen."],
    ["¿A qué hora ___ (tú) a casa?", "vuelves", [["volves", "volver diphtongue : o devient ue (vuelves)."], ["vuelve", "Avec tú : vuelves."], ["vuelvo", "Avec tú : vuelves."]], "Verbes à diphtongue : o → ue (volver : vuelvo, vuelves…)."],
    ["Mi hermano ___ al fútbol los sábados.", "juega", [["jugas", "jugar diphtongue : u devient ue (juega)."], ["juego", "Avec mi hermano : 3e personne, juega."], ["jugamos", "Avec mi hermano : 3e personne, juega."]], "jugar : juego, juegas, juega, jugamos, jugáis, juegan."],
    ["Yo no ___ dónde está.", "sé", [["sabo", "saber est irrégulier à la 1re personne : sé."], ["sabe", "Avec yo : sé."], ["se", "Sans accent, se est un pronom ; le verbe s'écrit sé."]], "saber : sé, sabes, sabe, sabemos, sabéis, saben."],
    ["Nosotros ___ en el centro.", "vivimos", [["vivemos", "Verbe en -ir : -imos à la 1re personne du pluriel."], ["viven", "Avec nosotros : vivimos."], ["vivo", "Avec nosotros : vivimos."]], "Verbes en -ir : -o, -es, -e, -imos, -ís, -en."],
    ["Yo ___ los deberes por la tarde.", "hago", [["haco", "hacer est irrégulier à la 1re personne : hago."], ["hace", "Avec yo : hago."], ["hacemos", "Avec yo : hago."]], "Verbes en -go à la 1re personne : hago, tengo, pongo, salgo, digo."],
  ],
  "es:obligacion": [
    ["Mañana (yo) ___ que levantarme temprano.", "tengo", [["hay", "hay que est impersonnel ; pour une obligation personnelle (yo), tener que."], ["tiene", "Avec yo : tengo."], ["debo", "deber s'emploie sans que : debo levantarme."]], "Obligation personnelle : tener que + infinitif ; impersonnelle : hay que + infinitif."],
    ["En la biblioteca, ___ que hablar en voz baja.", "hay", [["es", "L'obligation impersonnelle se dit hay que."], ["está", "L'obligation impersonnelle se dit hay que."], ["hace", "L'obligation impersonnelle se dit hay que."]], "hay que + infinitif : il faut (obligation générale)."],
    ["Los alumnos ___ llevar uniforme.", "deben", [["debe", "Los alumnos est pluriel : deben."], ["deben que", "deber se construit sans que."], ["hay", "hay que est impersonnel et demande que."]], "deber + infinitif (sans que) : devoir."],
    ["Para aprobar, (vosotros) ___ trabajar mucho.", "tenéis que", [["tenéis", "Il manque que : tener que + infinitif."], ["tienen que", "Avec vosotros : tenéis que."], ["hay de", "L'obligation impersonnelle se dit hay que."]], "tener que + infinitif : tengo que, tienes que, tenéis que…"],
    ["¿Qué ___ (tú) que hacer para viajar a México?", "tienes", [["tiene", "Avec tú : tienes."], ["tengo", "Avec tú : tienes."], ["tenéis", "Avec tú : tienes."]], "tener que + infinitif : tengo que, tienes que, tiene que…"],
  ],
  "es:pronominales": [
    ["Yo ___ a las siete.", "me levanto", [["levanto", "levantarse est pronominal : me levanto."], ["se levanto", "Avec yo, le pronom est me."], ["me levanta", "Avec yo : levanto."]], "Verbes pronominaux : me levanto, te levantas, se levanta, nos levantamos…"],
    ["¿A qué hora ___ (tú)?", "te acuestas", [["te acostas", "acostarse diphtongue : o devient ue."], ["acuestas", "acostarse est pronominal : te acuestas."], ["me acuesto", "Avec tú : te acuestas."]], "acostarse : me acuesto, te acuestas, se acuesta…"],
    ["Mis hermanos ___ en el río.", "se bañan", [["se baña", "Mis hermanos est pluriel : se bañan."], ["bañan", "bañarse est pronominal : se bañan."], ["nos bañan", "Avec mis hermanos (3e personne), le pronom est se."]], "Le pronom réfléchi s'accorde avec le sujet : se pour la 3e personne."],
    ["Nosotros ___ los dientes.", "nos lavamos", [["se lavamos", "Avec nosotros, le pronom est nos."], ["nos lavan", "Avec nosotros : lavamos."], ["os lavamos", "os correspond à vosotros."]], "Pronoms réfléchis : me, te, se, nos, os, se."],
    ["Ella ___ Marta.", "se llama", [["llama", "llamarse est pronominal : se llama."], ["me llama", "Avec ella, le pronom est se."], ["se llaman", "Ella est singulier : se llama."]], "llamarse : me llamo, te llamas, se llama…"],
  ],
  "es:ser-estar": [
    ["Madrid ___ la capital de España.", "es", [["está", "L'identité et la définition s'expriment avec ser."], ["son", "Madrid est singulier : es."], ["hay", "Il faut un verbe d'identité : ser."]], "ser : identité, définition, origine, profession, caractère."],
    ["Hoy ___ muy cansado.", "estoy", [["soy", "Un état passager s'exprime avec estar."], ["es", "Avec yo (sous-entendu) : estoy."], ["está", "Avec yo : estoy."]], "estar : état passager (cansado, enfermo, contento)."],
    ["La biblioteca ___ cerca del instituto.", "está", [["es", "La localisation d'un lieu ou d'un objet s'exprime avec estar."], ["son", "La biblioteca est singulier, et la localisation demande estar."], ["hay", "Pour situer un élément déjà connu (la biblioteca), on emploie estar."]], "estar : localisation (estar cerca, estar en)."],
    ["Mi padre ___ médico.", "es", [["está", "La profession s'exprime avec ser."], ["estoy", "Mi padre : 3e personne, et la profession demande ser."], ["son", "Mi padre est singulier : es."]], "ser : profession (es médico)."],
    ["Las ventanas ___ abiertas.", "están", [["son", "Un état résultant d'une action s'exprime avec estar."], ["está", "Las ventanas est pluriel : están."], ["es", "Las ventanas est pluriel, et l'état demande estar."]], "estar + participe : état résultant (la puerta está cerrada)."],
    ["El concierto ___ en el teatro.", "es", [["está", "Le lieu où se déroule un événement s'exprime avec ser."], ["son", "El concierto est singulier : es."], ["hay", "Pour dire où a lieu un événement, on emploie ser."]], "Lieu d'un événement : ser (la fiesta es en mi casa)."],
    ["Mis amigos ___ simpáticos.", "son", [["están", "Le caractère s'exprime avec ser."], ["es", "Mis amigos est pluriel : son."], ["sois", "sois correspond à vosotros."]], "ser : caractère (son simpáticos)."],
  ],
  "es:imperfecto": [
    ["Cuando era niño, ___ en el campo.", "vivía", [["vivió", "Une habitude passée s'exprime à l'imparfait."], ["vivo", "Le contexte est passé (cuando era niño)."], ["vivaba", "Les verbes en -ir font -ía à l'imparfait."]], "Imparfait : -aba pour les verbes en -ar, -ía pour les verbes en -er et -ir."],
    ["Antes, mis abuelos ___ cartas.", "escribían", [["escribieron", "antes (autrefois) : habitude passée, imparfait."], ["escribaban", "Les verbes en -ir font -ían à l'imparfait."], ["escriben", "Le contexte est passé (antes)."]], "Habitude passée : imparfait."],
    ["De pequeña, (yo) ___ al fútbol todos los días.", "jugaba", [["jugué", "todos los días : habitude, imparfait."], ["jugía", "Les verbes en -ar font -aba à l'imparfait."], ["juego", "Le contexte est passé (de pequeña)."]], "Habitude passée (todos los días, siempre) : imparfait."],
    ["La casa ___ grande y antigua.", "era", [["fue", "Une description dans le passé se fait à l'imparfait."], ["estaba", "La description d'une caractéristique emploie ser : era."], ["eraba", "ser est irrégulier à l'imparfait : era."]], "Imparfait de ser : era, eras, era, éramos, erais, eran."],
    ["Nosotros ___ a la playa cada verano.", "íbamos", [["fuimos", "cada verano : habitude, imparfait."], ["ibamos", "íbamos porte un accent."], ["vamos", "Le contexte est passé."]], "Imparfait de ir : iba, ibas, iba, íbamos, ibais, iban."],
  ],
  "es:indefinido": [
    ["Ayer (yo) ___ al cine.", "fui", [["iba", "ayer : action ponctuelle, passé simple."], ["fue", "Avec yo : fui."], ["voy", "ayer situe l'action dans le passé."]], "Passé simple de ir : fui, fuiste, fue, fuimos, fuisteis, fueron."],
    ["En 1492, Colón ___ a América.", "llegó", [["llegaba", "Une action ponctuelle et datée s'exprime au passé simple."], ["llegué", "Avec Colón : 3e personne, llegó."], ["llega", "1492 est une date passée."]], "Action passée, ponctuelle et datée : pretérito indefinido."],
    ["El año pasado (nosotros) ___ a Portugal.", "viajamos", [["viajábamos", "el año pasado, voyage unique : passé simple."], ["viajemos", "C'est un subjonctif."], ["viajaron", "Avec nosotros : viajamos."]], "Passé simple des verbes en -ar : -é, -aste, -ó, -amos, -asteis, -aron."],
    ["¿Qué ___ (tú) el fin de semana pasado?", "hiciste", [["hacías", "Action terminée et datée : passé simple."], ["hizo", "Avec tú : hiciste."], ["haciste", "hacer est irrégulier : hice, hiciste, hizo."]], "Passé simple de hacer : hice, hiciste, hizo, hicimos, hicisteis, hicieron."],
    ["Mis padres ___ en 2005.", "se casaron", [["se casaban", "Événement ponctuel et daté : passé simple."], ["se casó", "Mis padres est pluriel : se casaron."], ["casaron", "casarse est pronominal : se casaron."]], "Événement daté : pretérito indefinido."],
    ["Ayer ella me ___ la verdad.", "dijo", [["dició", "decir est irrégulier : dije, dijiste, dijo."], ["dije", "Avec ella : dijo."], ["decía", "Action ponctuelle (ayer) : passé simple."]], "Passé simple de decir : dije, dijiste, dijo, dijimos, dijisteis, dijeron."],
    ["Anoche (yo) ___ muy bien.", "dormí", [["durmió", "Avec yo : dormí."], ["dormía", "anoche : une nuit précise, passé simple."], ["dormo", "Le contexte est passé (anoche)."]], "Passé simple de dormir : dormí, dormiste, durmió, dormimos, dormisteis, durmieron."],
  ],
  "es:futuro": [
    ["Mañana ___ sol.", "hará", [["hacerá", "hacer a un radical irrégulier au futur : har-."], ["hizo", "mañana : futur."], ["haría", "C'est le conditionnel."]], "Futurs irréguliers : hacer → haré, tener → tendré, salir → saldré, poder → podré."],
    ["En el futuro, los coches ___ solos.", "conducirán", [["conduciran", "Le futur porte un accent : conducirán."], ["condujeron", "C'est un passé simple."], ["conduzcan", "C'est un subjonctif."]], "Futur : infinitif + -é, -ás, -á, -emos, -éis, -án."],
    ["El próximo año (yo) ___ quince años.", "tendré", [["teneré", "tener a un radical irrégulier au futur : tendr-."], ["tenré", "Le radical du futur de tener est tendr-."], ["tuve", "C'est un passé simple."]], "tener au futur : tendré, tendrás, tendrá…"],
    ["El año que viene, ¿qué ___ (tú) después del instituto?", "harás", [["hacerás", "hacer a un radical irrégulier au futur : har-."], ["hiciste", "el año que viene : futur."], ["hacías", "el año que viene : futur."]], "hacer au futur : haré, harás, hará…"],
    ["El verano que viene, nosotros ___ a Barcelona.", "iremos", [["iramos", "Futur de ir : iremos."], ["fuimos", "el verano que viene : futur."], ["íbamos", "el verano que viene : futur."]], "ir au futur : iré, irás, irá, iremos, iréis, irán."],
  ],
  "es:ir-a": [
    ["Mañana (yo) ___ estudiar.", "voy a", [["voy", "Le futur proche se forme avec ir a + infinitif."], ["va a", "Avec yo : voy a."], ["voy de", "La préposition est a : ir a + infinitif."]], "Futur proche : ir a + infinitif (voy a estudiar)."],
    ["¿Qué ___ hacer este fin de semana (vosotros)?", "vais a", [["vais", "Il manque a : ir a + infinitif."], ["van a", "Avec vosotros : vais a."], ["vas a", "Avec vosotros : vais a."]], "ir au présent : voy, vas, va, vamos, vais, van."],
    ["Va ___ llover.", "a", [["de", "La préposition est a : ir a + infinitif."], ["para", "La préposition est a : ir a + infinitif."], ["que", "La préposition est a : ir a + infinitif."]], "Futur proche : ir a + infinitif."],
    ["Esta tarde, mis amigos ___ a jugar al baloncesto.", "van", [["vamos", "Avec mis amigos : van."], ["va", "Mis amigos est pluriel : van."], ["vais", "vais correspond à vosotros."]], "ir au présent : voy, vas, va, vamos, vais, van."],
    ["Nosotros ___ a ver una película.", "vamos", [["van", "Avec nosotros : vamos."], ["vais", "vais correspond à vosotros."], ["va", "Avec nosotros : vamos."]], "ir au présent : voy, vas, va, vamos, vais, van."],
  ],
  "es:adjetivos": [
    ["Mis hermanas son muy ___.", "simpáticas", [["simpáticos", "Mis hermanas est féminin pluriel : simpáticas."], ["simpática", "Mis hermanas est pluriel : simpáticas."], ["simpático", "Mis hermanas est féminin pluriel."]], "L'adjectif s'accorde en genre et en nombre avec le nom."],
    ["Tengo un perro ___.", "negro", [["negra", "perro est masculin : negro."], ["negros", "un perro est singulier : negro."], ["negras", "un perro est masculin singulier."]], "L'adjectif s'accorde en genre et en nombre avec le nom."],
    ["Es una chica muy ___.", "inteligente", [["inteligenta", "Les adjectifs en -e ne changent pas au féminin."], ["inteligentes", "una chica est singulier."], ["inteligento", "Les adjectifs en -e ne changent pas au féminin."]], "Les adjectifs en -e ou en consonne ont la même forme au masculin et au féminin."],
    ["Llevo unos pantalones ___.", "azules", [["azul", "pantalones est pluriel : azules."], ["azuls", "Un adjectif terminé par une consonne prend -es au pluriel."], ["azulas", "azul a la même forme au masculin et au féminin ; pluriel : azules."]], "Pluriel des adjectifs terminés par une consonne : -es (azul → azules)."],
    ["Es un ___ amigo.", "buen", [["bueno", "Devant un nom masculin singulier, bueno devient buen."], ["buena", "amigo est masculin."], ["buenos", "un amigo est singulier."]], "Apocope : bueno → buen, malo → mal devant un nom masculin singulier."],
  ],
  "es:comparar": [
    ["Mi hermano es ___ alto que yo.", "más", [["tan", "tan s'emploie avec como (égalité)."], ["mucho", "La supériorité s'exprime avec más… que."], ["muy", "muy ne sert pas à comparer."]], "Supériorité : más… que ; infériorité : menos… que ; égalité : tan… como."],
    ["Ana es tan alta ___ su madre.", "como", [["que", "tan… como : comparatif d'égalité."], ["de", "tan… como : comparatif d'égalité."], ["como que", "tan… como, sans que."]], "Égalité : tan + adjectif + como."],
    ["Este libro es ___ que el otro.", "mejor", [["más mejor", "mejor est déjà un comparatif : on n'ajoute pas más."], ["bien", "bien est un adverbe ; le comparatif de bueno est mejor."], ["mejores", "Este libro est singulier : mejor."]], "Comparatifs irréguliers : bueno → mejor, malo → peor."],
    ["Es el chico ___ simpático de la clase.", "más", [["muy", "Le superlatif relatif se forme avec el más… de."], ["tan", "tan s'emploie pour l'égalité."], ["mejor", "mejor ne se place pas devant un adjectif."]], "Superlatif : el / la más + adjectif + de."],
    ["Tengo menos libros ___ tú.", "que", [["como", "menos… que : comparatif d'infériorité."], ["de", "Devant un pronom, on emploie que : menos… que tú."], ["de que", "menos… que, sans de."]], "Infériorité : menos + nom ou adjectif + que."],
  ],
  "es:perfecto": [
    ["Nunca (yo) ___ a México.", "he ido", [["ha ido", "Avec yo : he."], ["he iba", "Après haber : participe passé (ido)."], ["he yendo", "Après haber : participe passé, pas gérondif."]], "Passé composé : haber au présent (he, has, ha…) + participe passé."],
    ["¿___ (tú) el último libro de esta autora?", "Has leído", [["Ha leído", "Avec tú : has."], ["Has leer", "Après haber : participe passé."], ["Has leyendo", "Après haber : participe passé, pas gérondif."]], "Passé composé : haber + participe passé (leído)."],
    ["Mis padres ___ de su viaje.", "han vuelto", [["han volvido", "volver a un participe irrégulier : vuelto."], ["ha vuelto", "Mis padres est pluriel : han."], ["han volvieron", "Après haber : participe passé."]], "Participes irréguliers : vuelto, escrito, hecho, dicho, puesto, visto."],
    ["Nosotros ___ una carta.", "hemos escrito", [["hemos escribido", "escribir a un participe irrégulier : escrito."], ["han escrito", "Avec nosotros : hemos."], ["habemos escrito", "haber avec nosotros : hemos."]], "Participes irréguliers : escrito, vuelto, hecho, dicho."],
    ["¿Qué ___ (vosotros) hoy?", "habéis hecho", [["habéis hacido", "hacer a un participe irrégulier : hecho."], ["habéis hacer", "Après haber : participe passé."], ["habéis haciendo", "Après haber : participe passé, pas gérondif."]], "hacer : participe passé hecho."],
    ["Ella ___ la verdad.", "ha dicho", [["ha decido", "decir a un participe irrégulier : dicho."], ["he dicho", "Avec ella : ha."], ["ha diciendo", "Après haber : participe passé, pas gérondif."]], "decir : participe passé dicho."],
  ],
  "es:indef-imperf": [
    ["Cuando (yo) ___ en la calle, empezó a llover.", "estaba", [["estuve", "L'action en cours, interrompue par une autre, est à l'imparfait."], ["estoy", "Le récit est au passé."], ["estaré", "Le récit est au passé."]], "Récit : imparfait pour le décor et l'action en cours, passé simple pour l'événement qui survient."],
    ["Ayer, de repente, ___ el teléfono.", "sonó", [["sonaba", "de repente : événement soudain, passé simple."], ["suena", "Le récit est au passé (ayer)."], ["sonará", "Le récit est au passé (ayer)."]], "Événement soudain (de repente) : passé simple."],
    ["Cuando era pequeño, (yo) ___ al colegio a pie todos los días.", "iba", [["fui", "todos los días : habitude, imparfait."], ["voy", "Le contexte est passé."], ["iré", "Le contexte est passé."]], "Habitude passée : imparfait."],
    ["Ayer (yo) ___ las llaves.", "perdí", [["perdía", "ayer, un seul événement : passé simple."], ["pierdo", "Le contexte est passé (ayer)."], ["perdo", "Le contexte est passé, et perder diphtongue au présent."]], "Action unique et terminée : passé simple."],
    ["Mientras yo ___, alguien llamó a la puerta.", "dormía", [["dormí", "Action en cours, interrompue : imparfait."], ["durmió", "Avec yo, et l'action en cours demande l'imparfait."], ["duermo", "Le récit est au passé."]], "mientras + imparfait : action en cours."],
  ],
  "es:subjuntivo": [
    ["Quiero que (tú) ___ conmigo.", "vengas", [["vienes", "querer que + subjonctif."], ["venga", "Avec tú : vengas."], ["vendrás", "querer que + subjonctif présent."]], "Volonté (querer que, pedir que) : subjonctif."],
    ["Es importante que (nosotros) ___ el planeta.", "protejamos", [["protegemos", "es importante que + subjonctif."], ["protegamos", "Devant -a, le g devient j : protejamos."], ["protejan", "Avec nosotros : protejamos."]], "es importante que + subjonctif ; proteger → proteja (g devient j)."],
    ["Mis padres quieren que yo ___ medicina.", "estudie", [["estudio", "querer que + subjonctif."], ["estudia", "querer que + subjonctif, et avec yo : estudie."], ["estudiar", "Avec deux sujets différents : que + subjonctif conjugué."]], "Subjonctif présent des verbes en -ar : -e, -es, -e, -emos, -éis, -en."],
    ["Espero que ___ buen tiempo mañana.", "haga", [["hace", "esperar que + subjonctif."], ["hará", "esperar que + subjonctif présent."], ["hizo", "esperar que + subjonctif présent."]], "Souhait (esperar que, ojalá) : subjonctif."],
    ["Ojalá (tú) ___ razón.", "tengas", [["tienes", "ojalá + subjonctif."], ["tengues", "Subjonctif de tener : tenga, tengas…"], ["tendrás", "ojalá + subjonctif."]], "ojalá + subjonctif : pourvu que…"],
    ["Te pido que me ___.", "ayudes", [["ayudas", "pedir que + subjonctif."], ["ayuda", "pedir que + subjonctif, avec tú : ayudes."], ["ayudarás", "pedir que + subjonctif."]], "Demande (pedir que) : subjonctif."],
  ],
  "es:imperativo": [
    ["¡___ (tú, escuchar) bien!", "Escucha", [["Escuchas", "L'impératif de tú n'a pas de -s."], ["Escuche", "Escuche correspond à usted, pas à tú."], ["Escuchad", "Escuchad correspond à vosotros."]], "Impératif affirmatif de tú : 3e personne du singulier du présent (escucha)."],
    ["¡No ___ (tú, hablar) tan alto!", "hables", [["hablas", "L'impératif négatif se forme avec le subjonctif."], ["habla", "À la forme négative : no hables."], ["hable", "Avec tú : hables."]], "Impératif négatif : no + subjonctif présent."],
    ["¡___ (vosotros, venir) aquí!", "Venid", [["Venís", "C'est le présent de l'indicatif."], ["Vengáis", "Le subjonctif s'emploie pour l'impératif négatif."], ["Ven", "Ven correspond à tú."]], "Impératif de vosotros : infinitif dont le -r devient -d (venid)."],
    ["¡___ (tú, hacer) los deberes!", "Haz", [["Hace", "hacer a un impératif irrégulier : haz."], ["Haces", "C'est le présent de l'indicatif."], ["Haga", "Haga correspond à usted."]], "Impératifs irréguliers de tú : haz, ven, pon, sal, ten, di, ve, sé."],
    ["¡No ___ (vosotros, comer) en clase!", "comáis", [["coméis", "L'impératif négatif se forme avec le subjonctif."], ["comed", "À la forme négative : no comáis."], ["coman", "Avec vosotros : comáis."]], "Impératif négatif : no + subjonctif présent."],
  ],
  "es:subj-opinion": [
    ["No creo que ___ verdad.", "sea", [["es", "Opinion à la forme négative : subjonctif."], ["esté", "ser verdad : sea."], ["será", "Opinion négative : subjonctif présent."]], "No creo que, no pienso que + subjonctif ; creo que, pienso que + indicatif."],
    ["Creo que ___ verdad.", "es", [["sea", "Opinion à la forme affirmative : indicatif."], ["esté", "ser verdad : es."], ["fuera", "Opinion affirmative : indicatif."]], "Creo que + indicatif."],
    ["No pienso que el proyecto ___ fácil.", "sea", [["es", "Opinion négative : subjonctif."], ["ser", "Il faut un verbe conjugué au subjonctif."], ["está", "Une caractéristique s'exprime avec ser, au subjonctif ici."]], "No pienso que + subjonctif."],
    ["Me parece que (tú) ___ razón.", "tienes", [["tengas", "Me parece que (affirmatif) + indicatif."], ["tenés", "La forme de tú en Espagne est tienes."], ["tienas", "tener : tienes."]], "Me parece que + indicatif ; no me parece que + subjonctif."],
    ["No me parece que (ellos) ___ llegar a tiempo.", "puedan", [["pueden", "Opinion négative : subjonctif."], ["podan", "poder diphtongue au subjonctif : puedan."], ["pudan", "poder au subjonctif : pueda, puedas… puedan."]], "No me parece que + subjonctif."],
  ],
  "es:aunque": [
    ["Aunque ___ mañana (hypothèse), iremos a la playa.", "llueva", [["llueve", "Un fait seulement envisagé : aunque + subjonctif."], ["lluva", "Subjonctif de llover : llueva."], ["llovió", "Le fait est envisagé pour demain."]], "aunque + indicatif : fait réel ; aunque + subjonctif : hypothèse."],
    ["Aunque (yo) ___ cansado ahora mismo (fait réel), voy a terminar el trabajo.", "estoy", [["esté", "Un fait réel : aunque + indicatif."], ["estaba", "ahora mismo : présent."], ["estuve", "ahora mismo : présent."]], "aunque + indicatif : fait réel, constaté."],
    ["___ hace frío, salimos a pasear.", "Aunque", [["Porque", "Il s'agit d'une opposition, pas d'une cause."], ["Si", "Il s'agit d'une opposition, pas d'une condition."], ["Para que", "para que exprime le but et demande le subjonctif."]], "aunque exprime la concession : bien que, même si."],
    ["Seguiré estudiando aunque ___ difícil (hypothèse).", "sea", [["es", "Hypothèse : aunque + subjonctif."], ["ser", "Il faut un verbe conjugué."], ["soy", "Le sujet est la situation (3e personne) : sea."]], "aunque + subjonctif : même si (hypothèse)."],
    ["A pesar ___ cansancio, terminó la carrera.", "del", [["de el", "de + el se contracte en del."], ["que", "a pesar de + nom."], ["por", "a pesar de + nom."]], "a pesar de + nom : malgré."],
  ],
  "es:condicional": [
    ["Algún día me ___ viajar a Perú.", "gustaría", [["gustaba", "Un souhait s'exprime au conditionnel."], ["gustería", "Le conditionnel se forme sur l'infinitif : gustaría."], ["gustarías", "Le sujet est viajar : 3e personne, gustaría."]], "Conditionnel : infinitif + -ía, -ías, -ía, -íamos, -íais, -ían."],
    ["¿___ (tú) ayudarme, por favor?", "Podrías", [["Poderías", "poder a un radical irrégulier : podr-."], ["Podría", "Avec tú : podrías."], ["Pudiste", "Une demande polie se fait au conditionnel."]], "Demande polie : conditionnel (¿Podrías…?)."],
    ["Yo en tu lugar no ___ eso.", "haría", [["hacería", "hacer a un radical irrégulier : har-."], ["hacía", "Un conseil (yo en tu lugar) se donne au conditionnel."], ["hará", "Un conseil (yo en tu lugar) se donne au conditionnel."]], "Conseil : yo en tu lugar + conditionnel."],
    ["Con más tiempo, (nosotros) ___ más libros.", "leeríamos", [["leíamos", "Une hypothèse se formule au conditionnel."], ["leeríais", "Avec nosotros : leeríamos."], ["leyeríamos", "Le conditionnel se forme sur l'infinitif : leer → leeríamos."]], "Conditionnel : infinitif + terminaisons -ía."],
    ["¿Qué ___ (tú) con un millón de euros?", "harías", [["hacerías", "hacer a un radical irrégulier : har-."], ["hacías", "Une situation imaginée s'exprime au conditionnel."], ["haría", "Avec tú : harías."]], "hacer au conditionnel : haría, harías, haría…"],
  ],
  "es:si-subj": [
    ["Si (yo) ___ rico, viajaría por todo el mundo.", "fuera", [["sería", "Après si, jamais de conditionnel : subjonctif imparfait."], ["soy", "Hypothèse irréelle : si + subjonctif imparfait."], ["era", "Hypothèse irréelle : subjonctif imparfait."]], "Si + subjonctif imparfait, conditionnel : hypothèse irréelle."],
    ["Si tuviera tiempo, (yo) ___ más deporte.", "haría", [["hiciera", "Dans la principale, on emploie le conditionnel."], ["hago", "Hypothèse irréelle : conditionnel dans la principale."], ["hacería", "hacer a un radical irrégulier : haría."]], "Si + subjonctif imparfait, conditionnel."],
    ["Si (nosotros) ___ más, aprobaríamos.", "estudiáramos", [["estudiaríamos", "Après si, jamais de conditionnel."], ["estudiamos", "Hypothèse irréelle : subjonctif imparfait."], ["estudiemos", "C'est un subjonctif présent ; il faut l'imparfait."]], "Subjonctif imparfait : radical de la 3e personne du pluriel du passé simple + -ra (estudiaran → estudiáramos)."],
    ["¿Qué harías si (tú) ___ invisible?", "fueras", [["serías", "Après si, jamais de conditionnel."], ["eres", "Hypothèse irréelle : subjonctif imparfait."], ["seas", "C'est un subjonctif présent ; il faut l'imparfait."]], "Si + subjonctif imparfait (fueras), conditionnel (harías)."],
    ["Si (ellos) ___ dinero, comprarían una casa.", "tuvieran", [["tendrían", "Après si, jamais de conditionnel."], ["tienen", "Hypothèse irréelle : subjonctif imparfait."], ["tengan", "C'est un subjonctif présent ; il faut l'imparfait."]], "tener au subjonctif imparfait : tuviera, tuvieras… tuvieran."],
  ],
  "es:para-que": [
    ["Te lo explico para que lo ___.", "entiendas", [["entiendes", "para que + subjonctif."], ["entender", "Deux sujets différents : para que + verbe conjugué."], ["entendas", "entender diphtongue : entiendas."]], "But : para que + subjonctif (sujets différents)."],
    ["Hablo despacio para que todos me ___.", "oigan", [["oyen", "para que + subjonctif."], ["oír", "Deux sujets différents : para que + verbe conjugué."], ["oyan", "Subjonctif de oír : oiga, oigas… oigan."]], "para que + subjonctif."],
    ["Estudio para ___ un buen trabajo (même sujet).", "tener", [["que tenga", "Même sujet : para + infinitif."], ["tengo", "Après para, on emploie l'infinitif."], ["tenga", "Même sujet : para + infinitif."]], "Même sujet : para + infinitif ; sujets différents : para que + subjonctif."],
    ["Mis padres trabajan para que yo ___ estudiar.", "pueda", [["puedo", "para que + subjonctif."], ["poder", "Deux sujets différents : para que + verbe conjugué."], ["poda", "poder diphtongue au subjonctif : pueda."]], "para que + subjonctif."],
    ["Ahorramos para ___ de vacaciones (même sujet).", "irnos", [["que nos vayamos", "Même sujet : para + infinitif."], ["nos vamos", "Après para, on emploie l'infinitif."], ["vayamos", "Même sujet : para + infinitif."]], "Même sujet : para + infinitif."],
  ],
  "es:quizas": [
    ["Puede que ___ mañana.", "llueva", [["llueve", "puede que + subjonctif."], ["lloverá", "puede que + subjonctif."], ["lluva", "Subjonctif de llover : llueva."]], "puede que, es posible que, es probable que + subjonctif."],
    ["Puede que (yo) ___ tarde.", "llegue", [["llego", "puede que + subjonctif."], ["llegaré", "puede que + subjonctif."], ["llegé", "Devant -e, le g devient gu : llegue."]], "puede que + subjonctif ; llegar → llegue (g devient gu)."],
    ["Es posible que (ellos) ___ razón.", "tengan", [["tienen", "es posible que + subjonctif."], ["tendrán", "es posible que + subjonctif."], ["tenguen", "Subjonctif de tener : tengan."]], "es posible que + subjonctif."],
    ["Es probable que (nosotros) ___ ir al concierto.", "podamos", [["podemos", "es probable que + subjonctif."], ["podremos", "es probable que + subjonctif."], ["puedamos", "poder ne diphtongue pas avec nosotros : podamos."]], "es probable que + subjonctif."],
    ["No es seguro que el tren ___ a tiempo.", "llegue", [["llega", "no es seguro que + subjonctif."], ["llegará", "no es seguro que + subjonctif."], ["llegué", "C'est un passé simple."]], "Le doute (no es seguro que) entraîne le subjonctif."],
  ],
  "es:pasiva": [
    ["Aquí ___ libros antiguos.", "se venden", [["se vende", "libros est pluriel : se venden."], ["venden se", "Le pronom se se place avant le verbe conjugué."], ["son vende", "La forme est se venden."]], "Passive avec se : le verbe s'accorde avec le nom (se venden libros)."],
    ["El Quijote ___ por Cervantes.", "fue escrito", [["fue escribido", "escribir a un participe irrégulier : escrito."], ["escribió", "Le livre n'écrit pas : il a été écrit (voix passive)."], ["fue escrita", "El Quijote est masculin : escrito."]], "Voix passive : ser + participe passé accordé + por."],
    ["___ prohibido fumar.", "Está", [["Es", "L'interdiction s'exprime avec estar prohibido."], ["Hay", "L'interdiction s'exprime avec estar prohibido."], ["Se", "Il faut un verbe : está prohibido."]], "Interdiction : está prohibido + infinitif."],
    ["Las cartas ___ por el cartero.", "fueron entregadas", [["fueron entregados", "las cartas est féminin : entregadas."], ["entregaron", "Les lettres ne livrent pas : elles sont livrées."], ["fue entregada", "las cartas est pluriel : fueron entregadas."]], "Voix passive : ser + participe passé accordé avec le sujet."],
  ],
  "es:relieve": [
    ["Fue en 1492 ___ Colón llegó a América.", "cuando", [["que", "En espagnol soutenu, la mise en relief d'un moment se fait avec cuando."], ["donde", "donde met en relief un lieu."], ["quien", "quien met en relief une personne."]], "Mise en relief : fue + moment + cuando ; es + lieu + donde ; es + personne + quien."],
    ["Fue Picasso ___ pintó el Guernica.", "quien", [["que", "Après un nom de personne, la mise en relief se fait avec quien (ou el que)."], ["cual", "cual ne s'emploie pas seul pour la mise en relief."], ["cuando", "cuando met en relief un moment."]], "Mise en relief d'une personne : es / fue + nom + quien."],
    ["Es en Madrid ___ vive mi tía.", "donde", [["que", "En espagnol soutenu, la mise en relief d'un lieu se fait avec donde."], ["cuando", "cuando met en relief un moment."], ["quien", "quien met en relief une personne."]], "Mise en relief d'un lieu : es + lieu + donde."],
    ["Lo que más me gusta ___ la música.", "es", [["son", "la música est singulier : es."], ["está", "La mise en relief se construit avec ser."], ["que", "Il manque le verbe : lo que… es."]], "Lo que + verbe + ser + élément mis en relief."],
  ],
  "es:concordancia": [
    ["Quería que (tú) ___ conmigo.", "vinieras", [["vengas", "Principale au passé : subjonctif imparfait."], ["venías", "querer que + subjonctif."], ["vendrías", "querer que + subjonctif."]], "Concordance : principale au passé → subjonctif imparfait."],
    ["Le pedí que me ___.", "ayudara", [["ayude", "Principale au passé (pedí) : subjonctif imparfait."], ["ayudaba", "pedir que + subjonctif."], ["ayudará", "pedir que + subjonctif."]], "Concordance : pedí que + subjonctif imparfait."],
    ["Era necesario que (nosotros) ___ temprano.", "saliéramos", [["salgamos", "Principale au passé : subjonctif imparfait."], ["salíamos", "era necesario que + subjonctif."], ["saldríamos", "era necesario que + subjonctif."]], "Concordance : era necesario que + subjonctif imparfait."],
    ["Mis padres querían que yo ___ medicina.", "estudiara", [["estudie", "Principale au passé : subjonctif imparfait."], ["estudiaba", "querer que + subjonctif."], ["estudiaría", "querer que + subjonctif."]], "Concordance : querían que + subjonctif imparfait."],
    ["Dijo que (él) ___ cansado.", "estaba", [["estuviera", "decir que (affirmatif) + indicatif."], ["esté", "decir que (affirmatif) + indicatif."], ["estará", "Le verbe introducteur est au passé : imparfait."]], "decir que, pensar que (affirmatifs) + indicatif."],
  ],
};

const DE: Record<string, Item[]> = {
  "de:komparativ": [
    ["Mein Bruder ist ___ als ich.", "größer", [["großer", "groß prend un Umlaut au comparatif : größer."], ["mehr groß", "En allemand, le comparatif se forme avec -er, jamais avec mehr."], ["am größten", "C'est le superlatif ; avec als, on emploie le comparatif."]], "Comparatif : adjectif + -er + als ; souvent avec Umlaut (groß → größer)."],
    ["Der Zug ist ___ als der Bus.", "schneller", [["mehr schnell", "En allemand, le comparatif se forme avec -er."], ["schnellste", "C'est le superlatif."], ["schnell", "Avec als, l'adjectif se met au comparatif."]], "Comparatif de supériorité : -er + als."],
    ["Anna ist so groß ___ ihre Schwester.", "wie", [["als", "L'égalité s'exprime avec so… wie."], ["dass", "L'égalité s'exprime avec so… wie."], ["wenn", "L'égalité s'exprime avec so… wie."]], "Égalité : so + adjectif + wie."],
    ["Ich esse ___ Schokolade als Gemüse.", "lieber", [["gerner", "gern a un comparatif irrégulier : lieber."], ["mehr gern", "gern a un comparatif irrégulier : lieber."], ["am liebsten", "C'est le superlatif."]], "gern → lieber → am liebsten."],
    ["Das ist der ___ Tag des Jahres!", "schönste", [["schönere", "der… des Jahres : superlatif, schönste."], ["schönster", "Après l'article der, l'adjectif prend -e : der schönste Tag."], ["mehr schön", "Le superlatif se forme avec -ste."]], "Superlatif épithète : der / die / das + adjectif + -ste."],
    ["Ich finde Sport ___ als Mathe.", "besser", [["guter", "gut a un comparatif irrégulier : besser."], ["mehr gut", "gut a un comparatif irrégulier : besser."], ["am besten", "C'est le superlatif."]], "gut → besser → am besten."],
  ],
  "de:modalverben": [
    ["Ich ___ heute nicht kommen, ich bin krank.", "kann", [["kannst", "Avec ich : kann."], ["können", "Avec ich : kann."], ["könne", "Avec ich, au présent de l'indicatif : kann."]], "können : ich kann, du kannst, er kann, wir können, ihr könnt, sie können."],
    ["Du ___ deine Hausaufgaben machen.", "musst", [["muss", "Avec du : musst."], ["müsst", "müsst correspond à ihr."], ["mussen", "müssen : du musst."]], "müssen : ich muss, du musst, er muss, wir müssen, ihr müsst, sie müssen."],
    ["Hier ___ man nicht rauchen.", "darf", [["dürft", "Avec man : darf."], ["darfst", "darfst correspond à du."], ["dürfen", "man se conjugue comme er : darf."]], "dürfen (avoir le droit) : ich darf, du darfst, er/man darf…"],
    ["Wir ___ ins Kino gehen.", "wollen", [["will", "Avec wir : wollen."], ["wollt", "wollt correspond à ihr."], ["wollst", "wollen : wir wollen."]], "wollen : ich will, du willst, er will, wir wollen, ihr wollt, sie wollen."],
    ["Ich kann gut ___.", "schwimmen", [["schwimme", "Après un verbe de modalité, le verbe est à l'infinitif."], ["zu schwimmen", "Après un verbe de modalité, l'infinitif s'emploie sans zu."], ["geschwommen", "Après un verbe de modalité, le verbe est à l'infinitif."]], "Verbe de modalité + infinitif sans zu, placé à la fin."],
    ["___ du mir den Weg zeigen?", "Kannst", [["Kann", "Avec du : kannst."], ["Könnt", "Könnt correspond à ihr."], ["Kannt", "können : du kannst."]], "Question : verbe de modalité en tête, infinitif à la fin."],
  ],
  "de:perfekt": [
    ["Ich ___ gestern Fußball gespielt.", "habe", [["bin", "spielen forme son parfait avec haben."], ["hat", "Avec ich : habe."], ["haben", "Avec ich : habe."]], "Parfait : haben ou sein au présent + participe passé (à la fin)."],
    ["Wir ___ nach Berlin gefahren.", "sind", [["haben", "Les verbes de déplacement (fahren, gehen, kommen) forment leur parfait avec sein."], ["seid", "seid correspond à ihr."], ["ist", "Avec wir : sind."]], "Verbes de déplacement ou de changement d'état : parfait avec sein."],
    ["Hast du das Buch ___?", "gelesen", [["gelest", "lesen est un verbe fort : gelesen."], ["lesen", "Au parfait, il faut le participe passé."], ["geliest", "lesen est un verbe fort : gelesen."]], "Participe passé des verbes forts : préfixe ge, radical et terminaison -en (gelesen)."],
    ["Meine Mutter ___ um sieben Uhr aufgestanden.", "ist", [["hat", "aufstehen forme son parfait avec sein."], ["sind", "Meine Mutter est singulier : ist."], ["habe", "aufstehen forme son parfait avec sein."]], "aufstehen, einschlafen, aufwachen : parfait avec sein."],
    ["Er hat mir eine E-Mail ___.", "geschickt", [["geschicken", "schicken est un verbe faible : geschickt."], ["schickt", "Au parfait, il faut le participe passé."], ["geschickte", "Le participe passé est invariable après haben."]], "Participe passé des verbes faibles : préfixe ge, radical et terminaison -t (geschickt)."],
    ["Was ___ ihr am Wochenende gemacht?", "habt", [["seid", "machen forme son parfait avec haben."], ["hat", "Avec ihr : habt."], ["haben", "Avec ihr : habt."]], "haben au présent : ich habe, du hast, er hat, wir haben, ihr habt, sie haben."],
  ],
  "de:perfekt-stark": [
    ["Ich habe einen Brief ___ (schreiben).", "geschrieben", [["geschreibt", "schreiben est un verbe fort : geschrieben."], ["geschriebt", "Les verbes forts ont un participe en -en."], ["schrieb", "C'est le prétérit ; il faut le participe passé."]], "Verbes forts : participe en -en, souvent avec changement de voyelle."],
    ["Wir sind ins Kino ___ (gehen).", "gegangen", [["gegeht", "gehen est un verbe fort : gegangen."], ["gegingen", "gehen : participe passé gegangen."], ["ging", "C'est le prétérit."]], "gehen, ging, gegangen."],
    ["Hast du gut ___ (schlafen)?", "geschlafen", [["geschlaft", "schlafen est un verbe fort : geschlafen."], ["geschliefen", "schlafen : participe passé geschlafen."], ["schlief", "C'est le prétérit."]], "schlafen, schlief, geschlafen."],
    ["Sie hat viel Wasser ___ (trinken).", "getrunken", [["getrinkt", "trinken est un verbe fort : getrunken."], ["getrankt", "trinken : participe passé getrunken."], ["trank", "C'est le prétérit."]], "trinken, trank, getrunken."],
    ["Er ist nach Hause ___ (kommen).", "gekommen", [["gekommt", "kommen est un verbe fort : gekommen."], ["gekamen", "kommen : participe passé gekommen."], ["kam", "C'est le prétérit."]], "kommen, kam, gekommen."],
    ["Ich habe meinen Schlüssel ___ (finden).", "gefunden", [["gefindet", "finden est un verbe fort : gefunden."], ["gefanden", "finden : participe passé gefunden."], ["fand", "C'est le prétérit."]], "finden, fand, gefunden."],
  ],
  "de:werden": [
    ["Morgen ___ es regnen.", "wird", [["werdet", "Avec es : wird."], ["werden", "Avec es : wird."], ["wirst", "wirst correspond à du."]], "Futur : werden + infinitif à la fin (es wird regnen)."],
    ["Ich ___ Ärztin werden.", "werde", [["wird", "Avec ich : werde."], ["werdet", "werdet correspond à ihr."], ["wirst", "wirst correspond à du."]], "werden : ich werde, du wirst, er wird, wir werden, ihr werdet, sie werden."],
    ["___ du mitkommen?", "Wirst", [["Wird", "Avec du : wirst."], ["Werdet", "Werdet correspond à ihr."], ["Werde", "Avec du : wirst."]], "Question au futur : Wirst du… + infinitif ?"],
    ["In Zukunft werden Roboter viele Arbeiten ___.", "machen", [["macht", "Au futur, le verbe principal est à l'infinitif."], ["gemacht", "werden + participe passé formerait un passif ; ici, il faut l'infinitif."], ["zu machen", "Après werden, l'infinitif s'emploie sans zu."]], "Futur : werden + infinitif sans zu, à la fin de la phrase."],
    ["Wir ___ im Sommer nach Spanien fahren.", "werden", [["wird", "Avec wir : werden."], ["werdet", "werdet correspond à ihr."], ["wirst", "wirst correspond à du."]], "werden : wir werden + infinitif."],
  ],
  "de:dativ": [
    ["Ich helfe ___ Mutter.", "meiner", [["meine", "helfen est suivi du datif : meiner Mutter."], ["meinem", "Mutter est féminin : meiner."], ["meinen", "helfen + datif féminin : meiner."]], "Verbes suivis du datif : helfen, danken, gefallen, gehören."],
    ["Er gibt ___ Kind ein Buch.", "dem", [["das", "Le destinataire (à qui ?) est au datif : dem Kind."], ["den", "Kind est neutre : datif dem."], ["der", "Kind est neutre : datif dem."]], "Datif : dem (masculin, neutre), der (féminin), den + -n (pluriel)."],
    ["Wir fahren mit ___ Bus.", "dem", [["den", "mit est toujours suivi du datif."], ["der", "Bus est masculin : dem."], ["des", "mit est suivi du datif, pas du génitif."]], "Prépositions + datif : mit, bei, nach, von, zu, aus, seit."],
    ["Das Geschenk ist für ___ Vater.", "meinen", [["meinem", "für est toujours suivi de l'accusatif."], ["meiner", "Vater est masculin, et für demande l'accusatif."], ["mein", "für + accusatif masculin : meinen."]], "Prépositions + accusatif : für, durch, gegen, ohne, um."],
    ["Ich wohne bei ___ Großeltern.", "meinen", [["meine", "bei est suivi du datif : meinen Großeltern."], ["meiner", "Großeltern est pluriel : datif meinen."], ["meinem", "Großeltern est pluriel : datif meinen."]], "Datif pluriel : den / meinen + nom en -n."],
    ["Das Buch gefällt ___.", "mir", [["mich", "gefallen est suivi du datif : mir."], ["ich", "Le complément est au datif : mir."], ["mein", "Il faut un pronom personnel au datif : mir."]], "Pronoms au datif : mir, dir, ihm, ihr, uns, euch, ihnen."],
  ],
  "de:dass-weil": [
    ["Ich bleibe zu Hause, weil ___.", "ich krank bin", [["ich bin krank", "Après weil, le verbe conjugué se place à la fin."], ["bin ich krank", "Après weil, le verbe conjugué se place à la fin."], ["krank ich bin", "Le sujet vient juste après weil : ich krank bin."]], "Subordonnée (dass, weil, wenn, obwohl) : verbe conjugué à la fin.", "Choisis la fin de phrase correcte."],
    ["Ich weiß, dass ___.", "er heute kommt", [["er kommt heute", "Après dass, le verbe conjugué se place à la fin."], ["kommt er heute", "Après dass, le verbe conjugué se place à la fin."], ["heute er kommt", "Le sujet vient juste après dass : er heute kommt."]], "dass + sujet + … + verbe conjugué à la fin.", "Choisis la fin de phrase correcte."],
    ["Sie lernt Deutsch, weil ___.", "sie in Berlin studieren will", [["sie will in Berlin studieren", "Après weil, le verbe conjugué (will) se place à la fin."], ["will sie in Berlin studieren", "Après weil, le verbe conjugué se place à la fin."], ["sie in Berlin will studieren", "Le verbe conjugué se place après l'infinitif : studieren will."]], "Subordonnée : infinitif puis verbe conjugué, tout à la fin (studieren will).", "Choisis la fin de phrase correcte."],
    ["Ich glaube, dass ___.", "das Wetter morgen schön wird", [["das Wetter wird morgen schön", "Après dass, le verbe conjugué se place à la fin."], ["wird das Wetter morgen schön", "Après dass, le verbe conjugué se place à la fin."], ["das Wetter morgen wird schön", "Le verbe conjugué se place tout à la fin : schön wird."]], "dass + … + verbe conjugué à la fin.", "Choisis la fin de phrase correcte."],
    ["Er ist müde, weil ___.", "er zu spät ins Bett gegangen ist", [["er ist zu spät ins Bett gegangen", "Après weil, l'auxiliaire se place à la fin."], ["er zu spät ins Bett ist gegangen", "L'auxiliaire conjugué se place après le participe : gegangen ist."], ["ist er zu spät ins Bett gegangen", "Après weil, l'auxiliaire se place à la fin."]], "Subordonnée au parfait : participe puis auxiliaire à la fin (gegangen ist).", "Choisis la fin de phrase correcte."],
    ["Weil es regnet, ___.", "bleiben wir zu Hause", [["wir bleiben zu Hause", "Quand la subordonnée est en tête, le verbe conjugué suit immédiatement la virgule."], ["wir zu Hause bleiben", "Dans la principale, le verbe conjugué est en deuxième position."], ["zu Hause wir bleiben", "La subordonnée compte comme premier élément : le verbe vient juste après."]], "Subordonnée en tête : verbe – sujet dans la principale (bleiben wir).", "Choisis la suite correcte."],
  ],
  "de:praeteritum": [
    ["Gestern ___ ich keine Zeit.", "hatte", [["habte", "haben est irrégulier au prétérit : hatte."], ["hat", "gestern : passé, prétérit hatte."], ["hätte", "C'est le subjonctif II."]], "Prétérit de haben : ich hatte, du hattest, er hatte…"],
    ["Als Kind ___ er in Hamburg.", "wohnte", [["wohnt", "als Kind situe l'action dans le passé."], ["wohnten", "Avec er : wohnte."], ["wohnete", "Prétérit des verbes faibles : radical + -te (wohnte)."]], "Prétérit des verbes faibles : radical + -te, -test, -te, -ten, -tet, -ten."],
    ["Es ___ einmal ein König.", "war", [["ist", "Un conte se raconte au prétérit."], ["wurde", "« Il était une fois » se dit es war einmal."], ["wäre", "C'est le subjonctif II."]], "Prétérit de sein : ich war, du warst, er war, wir waren…"],
    ["Nach der Reise ___ wir sehr müde.", "waren", [["war", "Avec wir : waren."], ["wart", "wart correspond à ihr."], ["sind", "Le contexte est passé (nach der Reise)."]], "Prétérit de sein : wir waren."],
    ["Am Abend ___ er ins Kino.", "ging", [["gehte", "gehen est un verbe fort : ging."], ["gang", "gehen : prétérit ging."], ["gingte", "Les verbes forts ne prennent pas -te au prétérit."]], "Prétérit des verbes forts : changement de voyelle, sans -te (gehen → ging)."],
    ["Ich ___ nicht kommen, weil ich krank war.", "konnte", [["könnte", "C'est le subjonctif II, pas le prétérit."], ["kannte", "kannte vient de kennen (connaître)."], ["konnt", "Prétérit de können : ich konnte."]], "Prétérit des verbes de modalité : sans Umlaut (konnte, musste, durfte)."],
  ],
  "de:relativ": [
    ["Der Mann, ___ dort steht, ist mein Lehrer.", "der", [["den", "Le relatif est sujet : nominatif der."], ["die", "Mann est masculin : der."], ["dem", "Le relatif est sujet : nominatif der."]], "Le pronom relatif prend le genre du nom et le cas de sa fonction dans la relative."],
    ["Die Frau, ___ ich gestern gesehen habe, ist Ärztin.", "die", [["der", "Le relatif est complément d'objet (accusatif) : die au féminin."], ["den", "Frau est féminin : accusatif die."], ["dem", "sehen demande l'accusatif : die."]], "Relatif à l'accusatif : den (masculin), die (féminin), das (neutre), die (pluriel)."],
    ["Das Buch, ___ ich lese, ist spannend.", "das", [["dass", "dass est une conjonction ; le relatif neutre s'écrit das."], ["den", "Buch est neutre : das."], ["der", "Buch est neutre : das."]], "Relatif neutre au nominatif et à l'accusatif : das (avec un seul s)."],
    ["Der Freund, ___ ich helfe, heißt Paul.", "dem", [["den", "helfen est suivi du datif : dem."], ["der", "helfen est suivi du datif : dem."], ["das", "Freund est masculin, et helfen demande le datif."]], "Relatif au datif : dem (masculin, neutre), der (féminin), denen (pluriel)."],
    ["Die Kinder, ___ im Garten spielen, sind laut.", "die", [["denen", "Le relatif est sujet : nominatif pluriel die."], ["der", "Kinder est pluriel : die."], ["das", "Kinder est pluriel : die."]], "Relatif pluriel : die (nominatif, accusatif), denen (datif)."],
    ["Der Film, ___ wir gesehen haben, war lustig.", "den", [["der", "Le relatif est complément d'objet : accusatif den."], ["dem", "sehen demande l'accusatif : den."], ["das", "Film est masculin : den."]], "Relatif masculin à l'accusatif : den."],
  ],
  "de:zu-infinitiv": [
    ["Ich habe keine Lust, Hausaufgaben ___.", "zu machen", [["machen", "Après keine Lust haben, l'infinitif est précédé de zu."], ["zu mache", "zu est suivi de l'infinitif : zu machen."], ["machen zu", "zu se place avant l'infinitif."]], "Groupe infinitif : zu + infinitif, à la fin (keine Lust haben, vergessen, versuchen…)."],
    ["Es ist wichtig, die Umwelt ___.", "zu schützen", [["schützen", "Après es ist wichtig, l'infinitif est précédé de zu."], ["zu schützt", "zu est suivi de l'infinitif : zu schützen."], ["schützen zu", "zu se place avant l'infinitif."]], "Es ist wichtig / schön / schwer, … zu + infinitif."],
    ["Er hat vergessen, mich ___.", "anzurufen", [["zu anrufen", "Avec un verbe à particule, zu se glisse entre la particule et le verbe : anzurufen."], ["anrufen", "Après vergessen, l'infinitif est précédé de zu."], ["anzuruft", "zu est suivi de l'infinitif : anzurufen."]], "Verbe à particule séparable : zu entre la particule et le verbe (anzurufen, aufzustehen)."],
    ["Ich kann heute ___.", "kommen", [["zu kommen", "Après un verbe de modalité, l'infinitif s'emploie sans zu."], ["komme", "Après un verbe de modalité, le verbe est à l'infinitif."], ["gekommen", "Après un verbe de modalité, le verbe est à l'infinitif."]], "Pas de zu après un verbe de modalité (können, müssen, wollen…)."],
    ["Sie versucht, früher ___.", "aufzustehen", [["zu aufstehen", "Avec un verbe à particule, zu se glisse entre la particule et le verbe."], ["aufstehen", "Après versuchen, l'infinitif est précédé de zu."], ["aufzustehe", "zu est suivi de l'infinitif complet : aufzustehen."]], "Verbe à particule séparable : aufstehen → aufzustehen."],
  ],
  "de:passiv": [
    ["Das Haus ___ 1900 gebaut.", "wurde", [["wird", "1900 est une date passée : wurde."], ["hat", "Le passif se forme avec werden."], ["würde", "würde est un subjonctif II."]], "Passif : werden + participe passé ; au prétérit : wurde + participe passé."],
    ["In der Schweiz ___ vier Sprachen gesprochen.", "werden", [["wird", "vier Sprachen est pluriel : werden."], ["werdet", "werdet correspond à ihr."], ["sind", "Le passif d'action se forme avec werden."]], "Passif au présent : werden (accordé avec le sujet) + participe passé."],
    ["Der Brief wurde gestern ___.", "geschrieben", [["schreiben", "Au passif, il faut le participe passé."], ["geschreibt", "schreiben est un verbe fort : geschrieben."], ["schrieb", "Au passif, il faut le participe passé."]], "Passif : werden + participe passé, à la fin."],
    ["Die Fenster ___ jeden Tag geputzt.", "werden", [["wird", "Die Fenster est pluriel : werden."], ["haben", "Le passif se forme avec werden."], ["werdet", "werdet correspond à ihr."]], "Passif au présent : werden + participe passé."],
    ["Gestern ___ der Dieb von der Polizei verhaftet.", "wurde", [["wird", "gestern : passé, wurde."], ["hat", "Le passif se forme avec werden."], ["würde", "würde est un subjonctif II."]], "Passif : l'agent est introduit par von + datif."],
  ],
  "de:konj1": [
    ["Der Minister sagt, er ___ zufrieden.", "sei", [["ist", "La consigne demande le subjonctif I."], ["wäre", "wäre est le subjonctif II."], ["seie", "Subjonctif I de sein : er sei."]], "Discours indirect (presse) : subjonctif I (er sei, er habe, er könne).", "Mets le verbe au subjonctif I (discours indirect)."],
    ["Sie sagt, sie ___ keine Zeit.", "habe", [["hat", "La consigne demande le subjonctif I."], ["hätte", "hätte est le subjonctif II."], ["habt", "habt correspond à ihr."]], "Subjonctif I : radical + -e (sie habe).", "Mets le verbe au subjonctif I (discours indirect)."],
    ["Er behauptet, er ___ nichts davon.", "wisse", [["weiß", "La consigne demande le subjonctif I."], ["wüsste", "wüsste est le subjonctif II."], ["wisst", "wisst correspond à ihr."]], "Subjonctif I de wissen : er wisse.", "Mets le verbe au subjonctif I (discours indirect)."],
    ["Die Zeitung schreibt, der Präsident ___ morgen nach Paris.", "reise", [["reist", "La consigne demande le subjonctif I."], ["reiste", "reiste est le prétérit."], ["reisen", "der Präsident est singulier : reise."]], "Subjonctif I à la 3e personne du singulier : radical + -e (er reise).", "Mets le verbe au subjonctif I (discours indirect)."],
    ["Er sagt, er ___ morgen kommen.", "könne", [["kann", "La consigne demande le subjonctif I."], ["könnte", "könnte est le subjonctif II."], ["könnt", "könnt correspond à ihr."]], "Subjonctif I de können : er könne.", "Mets le verbe au subjonctif I (discours indirect)."],
  ],
  "de:obwohl": [
    ["Obwohl es regnet, ___.", "gehen wir spazieren", [["wir gehen spazieren", "La subordonnée en tête compte comme premier élément : le verbe suit immédiatement."], ["wir spazieren gehen", "Dans la principale, le verbe conjugué vient en deuxième position."], ["spazieren wir gehen", "Le verbe conjugué (gehen) suit directement la subordonnée."]], "Subordonnée en tête : verbe conjugué puis sujet dans la principale.", "Choisis la suite correcte."],
    ["Er geht zur Schule, obwohl ___.", "er krank ist", [["er ist krank", "Après obwohl, le verbe conjugué se place à la fin."], ["ist er krank", "Après obwohl, le verbe conjugué se place à la fin."], ["krank er ist", "Le sujet vient juste après obwohl : er krank ist."]], "obwohl + sujet + … + verbe conjugué à la fin.", "Choisis la fin de phrase correcte."],
    ["___ sie müde war, hat sie weitergearbeitet.", "Obwohl", [["Trotzdem", "trotzdem est un adverbe : il ne peut pas introduire une subordonnée."], ["Weil", "Il s'agit d'une opposition, pas d'une cause."], ["Wenn", "Il s'agit d'une opposition, pas d'une condition."]], "obwohl (bien que) introduit une subordonnée ; trotzdem (pourtant) est un adverbe."],
    ["Es war kalt. ___ sind wir schwimmen gegangen.", "Trotzdem", [["Obwohl", "obwohl introduit une subordonnée ; ici, la phrase est indépendante (verbe en 2e position)."], ["Weil", "Il s'agit d'une opposition, pas d'une cause."], ["Dass", "dass introduit une subordonnée, pas une phrase indépendante."]], "trotzdem en tête : inversion verbe – sujet (trotzdem sind wir…)."],
    ["Ich habe gut gelernt. Trotzdem ___.", "habe ich die Prüfung nicht bestanden", [["ich habe die Prüfung nicht bestanden", "Après trotzdem en tête, le verbe conjugué vient juste après."], ["ich die Prüfung nicht bestanden habe", "trotzdem n'introduit pas une subordonnée : le verbe reste en 2e position."], ["habe die Prüfung ich nicht bestanden", "Le sujet suit immédiatement le verbe conjugué."]], "trotzdem + verbe conjugué + sujet.", "Choisis la suite correcte."],
  ],
  "de:konj2": [
    ["Wenn ich reich ___, würde ich die Welt bereisen.", "wäre", [["war", "Hypothèse irréelle : subjonctif II, wäre."], ["bin", "Hypothèse irréelle : subjonctif II."], ["würde", "Le verbe sein a son propre subjonctif II : wäre."]], "Irréel : wenn + subjonctif II (wäre, hätte, könnte, ou würde + infinitif)."],
    ["Wenn ich Zeit ___, käme ich mit.", "hätte", [["hatte", "hatte est le prétérit ; l'irréel demande hätte."], ["habe", "Hypothèse irréelle : subjonctif II."], ["hätten", "Avec ich : hätte."]], "Subjonctif II de haben : ich hätte."],
    ["Ich ___ gern ein neues Fahrrad.", "hätte", [["hatte", "hatte est le prétérit ; pour un souhait, on emploie hätte gern."], ["würde", "würde demande un infinitif ; pour posséder, on dit hätte gern."], ["hättest", "Avec ich : hätte."]], "Souhait poli : ich hätte gern…, ich möchte…"],
    ["An deiner Stelle ___ ich mehr lernen.", "würde", [["wurde", "wurde est le prétérit de werden ; le conseil demande würde."], ["werde", "Un conseil irréel demande le subjonctif II : würde."], ["wird", "Avec ich, et au subjonctif II : würde."]], "Conseil : an deiner Stelle würde ich + infinitif."],
    ["Wenn es nicht regnen ___, gingen wir spazieren.", "würde", [["wurde", "wurde est le prétérit de werden."], ["wird", "Hypothèse irréelle : subjonctif II."], ["werde", "Hypothèse irréelle : subjonctif II."]], "würde + infinitif : subjonctif II des verbes ordinaires."],
  ],
  "de:damit-umzu": [
    ["Ich lerne Deutsch, ___ in Berlin zu studieren.", "um", [["damit", "Même sujet : um … zu + infinitif."], ["dass", "Le but avec un infinitif s'exprime avec um … zu."], ["für", "für + nom ; devant un groupe infinitif, um … zu."]], "But, même sujet : um … zu + infinitif ; sujets différents : damit + verbe conjugué à la fin."],
    ["Ich erkläre es dir, ___ du es verstehst.", "damit", [["um", "Deux sujets différents (ich, du) : damit."], ["für", "Devant une proposition, le but s'exprime avec damit."], ["weil", "Il s'agit d'un but, pas d'une cause."]], "damit + sujet + … + verbe conjugué à la fin."],
    ["Sie spart Geld, um ein Auto ___.", "zu kaufen", [["kaufen", "um … zu : l'infinitif est précédé de zu."], ["kauft", "Après um, il faut zu + infinitif."], ["zu kauft", "zu est suivi de l'infinitif : zu kaufen."]], "um … zu + infinitif à la fin."],
    ["Wir sprechen leise, damit das Baby ___.", "schlafen kann", [["kann schlafen", "Après damit, le verbe conjugué se place à la fin."], ["zu schlafen", "damit est suivi d'une proposition avec un verbe conjugué."], ["schläft kann", "Il faut l'infinitif puis le verbe conjugué : schlafen kann."]], "damit : verbe conjugué à la fin (schlafen kann)."],
    ["Er steht früh auf, ___ den Bus nicht zu verpassen.", "um", [["damit", "Même sujet et groupe infinitif : um … zu."], ["dass", "Le but avec un infinitif s'exprime avec um … zu."], ["ob", "ob introduit une interrogation indirecte."]], "um … zu + infinitif : pour (même sujet)."],
  ],
  "de:nuancieren": [
    ["Vielleicht kommt er morgen.", "peut-être", [["sûrement", "Sûrement se dit sicher."], ["jamais", "Jamais se dit nie."], ["à peine", "À peine se dit kaum."]], "Nuancer : vielleicht (peut-être), wahrscheinlich (probablement), sicher (sûrement), kaum (à peine).", "Que signifie « vielleicht » dans cette phrase : « Vielleicht kommt er morgen » ?"],
    ["Wahrscheinlich regnet es heute.", "probablement", [["peut-être", "Peut-être se dit vielleicht."], ["sûrement", "Sûrement se dit sicher."], ["rarement", "Rarement se dit selten."]], "wahrscheinlich : probablement.", "Que signifie « wahrscheinlich » dans cette phrase : « Wahrscheinlich regnet es heute » ?"],
    ["Sie hat sicher recht.", "sûrement", [["peut-être", "Peut-être se dit vielleicht."], ["à peine", "À peine se dit kaum."], ["jamais", "Jamais se dit nie."]], "sicher : sûrement, certainement.", "Que signifie « sicher » dans cette phrase : « Sie hat sicher recht » ?"],
    ["Ich habe kaum geschlafen.", "à peine", [["beaucoup", "Beaucoup se dit viel."], ["sûrement", "Sûrement se dit sicher."], ["probablement", "Probablement se dit wahrscheinlich."]], "kaum : à peine.", "Que signifie « kaum » dans cette phrase : « Ich habe kaum geschlafen » ?"],
    ["Es ist möglich, dass er zu spät kommt.", "possible", [["certain", "Certain se dit sicher."], ["impossible", "Impossible se dit unmöglich."], ["probable", "Probable se dit wahrscheinlich."]], "möglich : possible ; unmöglich : impossible.", "Que signifie « möglich » dans cette phrase : « Es ist möglich, dass er zu spät kommt » ?"],
  ],
  "de:partizip": [
    ["Das ___ Kind schläft endlich (weinen, participe I).", "weinende", [["weinend", "Placé devant le nom, le participe s'accorde comme un adjectif : das weinende Kind."], ["geweinte", "Il faut le participe I (action en cours) : weinend-."], ["weinenden", "Après das au nominatif neutre : -e."]], "Participe I adjectivé : infinitif + -d + terminaison de l'adjectif (das weinende Kind)."],
    ["Der ___ Brief liegt auf dem Tisch (schreiben, participe II).", "geschriebene", [["geschriebener", "Après der, l'adjectif prend -e : der geschriebene Brief."], ["schreibende", "Il faut le participe II (action accomplie) : geschrieben-."], ["geschrieben", "Placé devant le nom, le participe s'accorde : geschriebene."]], "Participe II adjectivé : participe passé + terminaison de l'adjectif."],
    ["Wir sahen einen ___ Hund (bellen, participe I).", "bellenden", [["bellende", "Après einen (accusatif masculin), l'adjectif prend -en."], ["gebellten", "Il faut le participe I (action en cours) : bellend-."], ["bellend", "Placé devant le nom, le participe s'accorde : bellenden."]], "Participe I adjectivé, accordé comme un adjectif épithète."],
    ["Die ___ Fenster wurden repariert (zerbrechen, participe II).", "zerbrochenen", [["zerbrochene", "Au pluriel après die, l'adjectif prend -en."], ["zerbrechenden", "Il faut le participe II (action accomplie) : zerbrochen-."], ["zerbrecht", "Le participe II de zerbrechen est zerbrochen."]], "Après l'article défini au pluriel : terminaison -en."],
  ],
};

const FR: Record<string, Item[]> = {
  "fr:conj6": [
    ["Demain, nous ___ au musée (aller, futur).", "irons", [["allerons", "aller a un radical irrégulier au futur : ir-."], ["irions", "C'est le conditionnel présent."], ["irrons", "Un seul r : irons."]], "Futur : radical + -ai, -as, -a, -ons, -ez, -ont ; aller → j'irai."],
    ["Hier, ___ mes devoirs (finir, passé composé).", "j'ai fini", [["j'ai finis", "Avec avoir, le participe ne s'accorde pas avec le sujet : fini."], ["je suis fini", "finir se conjugue avec avoir au passé composé."], ["j'ai finit", "Le participe passé de finir est fini."]], "Passé composé : avoir ou être au présent + participe passé."],
    ["Autrefois, les enfants ___ à pied à l'école (aller, imparfait).", "allaient", [["allait", "Le sujet les enfants est pluriel : allaient."], ["allèrent", "C'est le passé simple."], ["alla", "C'est le passé simple, et le sujet est pluriel."]], "Imparfait : -ais, -ais, -ait, -ions, -iez, -aient."],
    ["Soudain, le loup ___ du bois (sortir, passé simple).", "sortit", [["sortait", "C'est l'imparfait."], ["sorta", "Les verbes en -ir font -it au passé simple : sortit."], ["sortut", "sortir fait sortit au passé simple."]], "Passé simple des verbes en -ir : -is, -is, -it, -îmes, -îtes, -irent."],
    ["Tu ___ très bien (chanter, présent).", "chantes", [["chante", "Avec tu, la terminaison est -es."], ["chantent", "Avec tu, la terminaison est -es."], ["chantez", "chantez correspond à vous."]], "Présent des verbes en -er : -e, -es, -e, -ons, -ez, -ent."],
    ["Vous ___ vos affaires (prendre, présent).", "prenez", [["prendez", "prendre : vous prenez."], ["prennez", "Un seul n : vous prenez."], ["prenons", "prenons correspond à nous."]], "prendre : je prends, tu prends, il prend, nous prenons, vous prenez, ils prennent."],
    ["Ils ___ la porte (ouvrir, passé simple).", "ouvrirent", [["ouvrèrent", "ouvrir fait ouvrirent au passé simple."], ["ouvraient", "C'est l'imparfait."], ["ouvrirons", "C'est le futur."]], "ouvrir au passé simple : j'ouvris, il ouvrit, ils ouvrirent."],
    ["Elle ___ partir (vouloir, futur).", "voudra", [["voulera", "vouloir a un radical irrégulier au futur : voudr-."], ["voudrait", "C'est le conditionnel présent."], ["voudras", "Avec elle : voudra."]], "vouloir au futur : je voudrai, tu voudras, elle voudra."],
  ],
  "fr:conj4": [
    ["Quand il ___ fini, il sortira (futur antérieur).", "aura", [["aurait", "C'est le conditionnel."], ["avait", "C'est l'imparfait (plus-que-parfait)."], ["eut", "C'est le passé simple (passé antérieur)."]], "Futur antérieur : auxiliaire au futur + participe passé (il aura fini)."],
    ["Elle ___ déjà partie quand je suis arrivé (plus-que-parfait).", "était", [["est", "C'est le passé composé."], ["avait", "partir se conjugue avec être."], ["fut", "C'est le passé antérieur."]], "Plus-que-parfait : auxiliaire à l'imparfait + participe passé (elle était partie)."],
    ["Si j'avais su, je ___ venu.", "serais", [["serai", "Après si + plus-que-parfait : conditionnel passé (je serais venu)."], ["aurais", "venir se conjugue avec être."], ["étais", "La principale se met au conditionnel passé."]], "Si + plus-que-parfait, conditionnel passé : irréel du passé."],
    ["Je pensais qu'il ___ (venir, futur dans le passé).", "viendrait", [["viendra", "La principale est au passé : le futur devient conditionnel."], ["viendrai", "Le sujet est il : viendrait."], ["venira", "Le futur et le conditionnel de venir se forment sur viendr-."]], "Futur dans le passé : conditionnel présent (je pensais qu'il viendrait)."],
    ["Lorsqu'ils ___ dîné, ils allèrent se coucher (passé antérieur).", "eurent", [["avaient", "C'est le plus-que-parfait."], ["ont", "C'est le passé composé."], ["auront", "C'est le futur antérieur."]], "Passé antérieur : auxiliaire au passé simple + participe passé (ils eurent dîné)."],
    ["Nous ___ nos amis demain (voir, futur).", "verrons", [["voirons", "voir a un radical irrégulier au futur : verr-."], ["verons", "Deux r : verrons."], ["verrions", "C'est le conditionnel présent."]], "voir au futur : je verrai, nous verrons."],
  ],
  "fr:accords": [
    ["Les fleurs que j'ai ___ sont fanées (cueillir).", "cueillies", [["cueilli", "Le COD que (les fleurs) est placé avant avoir : accord au féminin pluriel."], ["cueillis", "Le COD que reprend les fleurs, féminin."], ["cueillie", "Le COD que reprend les fleurs, pluriel."]], "Avec avoir, le participe s'accorde avec le COD s'il est placé avant le verbe."],
    ["Elles sont ___ très tôt (partir).", "parties", [["parti", "Avec être, le participe s'accorde avec le sujet : parties."], ["partis", "Le sujet elles est féminin : parties."], ["partie", "Le sujet elles est pluriel : parties."]], "Avec être, le participe passé s'accorde avec le sujet."],
    ["Nous avons ___ nos devoirs (finir).", "fini", [["finis", "Le COD (nos devoirs) est placé après le verbe : pas d'accord."], ["finit", "Le participe passé de finir est fini."], ["finies", "Avec avoir et un COD placé après, pas d'accord."]], "Avec avoir, pas d'accord avec le sujet ; accord seulement avec un COD placé avant."],
    ["La lettre qu'il a ___ est touchante (écrire).", "écrite", [["écrit", "Le COD qu' (la lettre) est placé avant : accord au féminin."], ["écrits", "Le COD reprend la lettre, féminin singulier."], ["écrites", "Le COD reprend la lettre, singulier."]], "Avec avoir, accord avec le COD placé avant : la lettre qu'il a écrite."],
    ["Ils se sont ___ les mains (laver).", "lavé", [["lavés", "Le COD est les mains, placé après : pas d'accord (se est complément indirect)."], ["lavées", "Le COD les mains est placé après le verbe : pas d'accord."], ["laver", "Il faut le participe passé : lavé."]], "Verbe pronominal : accord avec le COD placé avant ; se laver les mains → ils se sont lavé les mains."],
    ["Les enfants sont ___ dans le jardin (tomber).", "tombés", [["tombé", "Avec être, le participe s'accorde avec le sujet : tombés."], ["tombées", "Le sujet les enfants est masculin."], ["tomber", "Il faut le participe passé : tombés."]], "Avec être, le participe passé s'accorde avec le sujet."],
    ["Elle s'est ___ en tombant (blesser).", "blessée", [["blessé", "se reprend elle et il est COD : accord au féminin."], ["blessés", "Le COD se reprend elle, singulier."], ["blesser", "Il faut le participe passé : blessée."]], "Pronominal dont le pronom est COD (elle a blessé elle-même) : accord."],
    ["Combien de livres as-tu ___ (lire) ?", "lus", [["lu", "Le COD combien de livres est placé avant : accord au masculin pluriel."], ["lue", "livres est masculin pluriel : lus."], ["lues", "livres est masculin : lus."]], "Avec avoir, accord avec le COD placé avant, même dans une question."],
  ],
};

/** Points de grammaire qui n'ont pas leur propre lot : on reprend les lots voisins. */
const ALIAS: Record<string, string[]> = {
  "en:should": ["en:modals"], "en:modals-advanced": ["en:nuance", "en:modals"], "en:will-would": ["en:future", "en:reported"],
  "en:speech-complex": ["en:reported"], "en:conditional": ["en:hypothesis"], "en:causative": ["en:causative", "en:passive"],
  "es:subj-imperfecto": ["es:concordancia", "es:si-subj"],
  "de:passiv-ersatz": ["de:passiv"], "de:konj1-2": ["de:konj1", "de:konj2"],
};
const BANKS: Record<string, Item[]> = { ...EN, ...ES, ...DE, ...FR };
const itemsOf = (key: string): Item[] => (ALIAS[key] ?? [key]).flatMap((k) => BANKS[k] ?? []);

const COMPETENCE: Record<string, CompetenceId> = { en: "en-grammaire", es: "es-grammaire", de: "de-grammaire", fr: "fr-langue" };
const FRENCH_UNITS: Record<string, [key: string, title: string]> = {
  "6e-francais-conjugaison": ["fr:conj6", "Conjuguer aux temps de l'indicatif"],
  "4e-francais-conjugaison": ["fr:conj4", "Temps composés et concordance des temps"],
  "3e-francais-accords": ["fr:accords", "Accorder le participe passé"],
};

/** Phrase complétée. */
const fill = (s: string, word: string) => s.replace("___", word);

function grammarGenerators(unitId: string, key: string, title: string): Generator[] {
  const items = itemsOf(key);
  if (items.length < 3) return [];
  const lang = key.split(":")[0]!;
  const competence = COMPETENCE[lang]!;
  const rules = GRAMMAR_POINTS[key]?.rules ?? [];
  const out: Generator[] = [
    gen({
      id: `g-${unitId}-completer`, unit: unitId, title: `Grammaire : ${title}`, stage: "application", capacity: items.length,
      make: (r, id) => {
        const [s, a, w, rule, q] = r.pick(items);
        return {
          activity: mcq(r, {
            id, stage: "application", competence,
            prompt: q ? (q.includes("«") ? q : `${q} « ${s} »`) : `Quelle forme complète la phrase ? « ${s} »`,
            answer: { text: a, feedback: rule },
            wrong: w.map(([text, feedback]) => ({ text, feedback })),
            hint: rules[0] ?? rule,
            hints: [rule, `La bonne réponse commence par « ${a.charAt(0)} ».`],
            solution: [q?.includes("«") ? `« ${a} ».` : fill(s, a)],
            takeaway: rule,
          }),
          verify: () => w.length === 3 && w.every(([text]) => text.toLowerCase() !== a.toLowerCase()) && new Set(w.map(([text]) => text.toLowerCase())).size === 3 && (q?.includes("«") || s.split("___").length === 2),
        };
      },
    }),
  ];
  const fillable = items.filter(([s, , , , q]) => !q?.includes("«") && s.includes("___"));
  if (fillable.length >= 4) {
    out.push(gen({
      id: `g-${unitId}-correcte`, unit: unitId, title: `Phrase correcte ou non : ${title}`, stage: "application",
      make: (r, id) => {
        const picked = r.sample(fillable, 4);
        const pattern = r.shuffle([true, false, r.chance(0.5), r.chance(0.5)]);
        const lines = picked.map(([s, a, w], i) => {
          const wrong = pattern[i] ? undefined : r.pick(w);
          return { text: fill(s, wrong ? wrong[0] : a), ok: !wrong, feedback: wrong ? `Incorrecte : ${wrong[1]} Il faut « ${a} ».` : "Correcte.", used: wrong ? wrong[0] : a, answer: a };
        });
        return {
          activity: classify(r, {
            id, stage: "application", competence,
            prompt: "Chaque phrase est-elle correcte ?",
            categories: ["Correcte", "Incorrecte"],
            items: lines.map((l) => ({ text: l.text, category: l.ok ? 0 : 1, feedback: l.feedback })),
            hint: "Relis chaque phrase en te demandant quelle règle s'applique.",
            hints: [rules[0] ?? picked[0]![3], `Par exemple : « ${fill(picked[0]![0], picked[0]![1])} » est correcte.`],
            solution: picked.map(([s, a]) => fill(s, a)),
            takeaway: picked[0]![3],
          }),
          verify: () => lines.some((l) => l.ok) && lines.some((l) => !l.ok) && lines.every((l) => l.ok === (l.used === l.answer)) && new Set(lines.map((l) => l.text)).size === 4,
        };
      },
    }));
  }
  return out;
}

/** Générateurs de grammaire : un lot par unité de langue vivante (point de grammaire du cours), plus le français. */
export const GRAMMAIRE: Generator[] = [
  ...Object.entries(UNIT_GRAMMAR).flatMap(([unitId, key]) => (findUnit(unitId) ? grammarGenerators(unitId, key, GRAMMAR_POINTS[key]?.title ?? key) : [])),
  ...Object.entries(FRENCH_UNITS).flatMap(([unitId, [key, title]]) => grammarGenerators(unitId, key, title)),
];
