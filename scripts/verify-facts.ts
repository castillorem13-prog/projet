import { writeFileSync } from "node:fs";
import { FACT_SETS } from "../src/lib/content/bank";
import type { Fact } from "../src/lib/content/bank/types";

/**
 * Recoupement des faits datés et des œuvres avec Wikidata (base ouverte liée à Wikipédia).
 *  - Dates : chaque fait est relié à un article de Wikipédia (ARTICLES ci-dessous) ; on lit les dates de l'élément Wikidata
 *    (date, début, fin, création, publication, découverte, lancement, décès…) et on vérifie que l'année du fait en fait partie.
 *  - Œuvres : on cherche le titre, on vérifie l'auteur (auteur, compositeur ou artiste), puis l'année quand elle est donnée.
 * Usage : npm run bank:faits (connexion Internet nécessaire). Écrit src/lib/content/bank/facts/verification.generated.ts.
 */

const UA = { "User-Agent": "LearnWardFactCheck/1.0 (verification de contenus pedagogiques)" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Une requête à la fois, au moins 1,2 s d'écart, et respect du délai demandé par le serveur (règles d'usage de Wikimedia). */
let last = 0;
async function json(url: string): Promise<any> {
  for (let i = 0; i < 6; i++) {
    await sleep(Math.max(0, last + 1200 - Date.now()));
    last = Date.now();
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    const wait = Number(r.headers.get("retry-after") ?? 0);
    await sleep(Math.max(wait * 1000, 3000 * (i + 1)));
  }
  throw new Error(`Échec : ${url}`);
}

/** Article de Wikipédia de chaque fait daté (« en: » pour l'anglais). Les faits sans article sont vérifiés à la main. */
const ARTICLES: Record<string, string> = {
  "dt-copernic": "De revolutionibus orbium coelestium", "dt-galilee": "Sidereus nuncius", "dt-newton": "Philosophiæ naturalis principia mathematica",
  "dt-volta": "Pile voltaïque", "dt-mendeleiev": "Tableau périodique des éléments", "dt-becquerel": "Radioactivité", "dt-rutherford": "Expérience de Rutherford",
  "dt-einstein": "Relativité restreinte", "dt-spoutnik": "Spoutnik 1", "dt-lune": "Apollo 11", "dt-hooke": "Micrographia", "dt-darwin": "L'Origine des espèces",
  "dt-pasteur": "Vaccin contre la rage", "dt-wegener": "Dérive des continents", "dt-fleming": "Pénicilline", "dt-adn": "en:Molecular Structure of Nucleic Acids: A Structure for Deoxyribose Nucleic Acid",
  "dt-genome": "Projet génome humain", "dt-lovelace": "en:Note G", "dt-turing": "Machine de Turing", "dt-eniac": "ENIAC", "dt-arpanet": "ARPANET",
  "dt-tcpip": "en:A Protocol for Packet Network Intercommunication", "dt-web": "World Wide Web", "dt-linux": "Noyau Linux", "dt-gps": "Global Positioning System",
  "dt-smartphone": "IPhone (1re génération)", "dt-facebook": "Facebook", "dt-rgpd": "Règlement général sur la protection des données",
  "h-hammurabi": "Code de Hammurabi", "h-jo": "Jeux olympiques antiques", "h-rome-fondation": "Fondation de Rome", "h-marathon": "Bataille de Marathon", "h-alesia": "Siège d'Alésia",
  "h-pompei": "Éruption du Vésuve en 79", "h-caracalla": "Édit de Caracalla", "h-milan": "Édit de Milan", "h-constantinople-fond": "Constantinople", "h-theodose": "Édit de Thessalonique",
  "h-476": "Chute de l'Empire romain d'Occident", "h-hegire": "Hégire", "h-mahomet": "Mahomet", "h-bagdad": "Bagdad", "h-charlemagne": "Couronnement de Charlemagne",
  "h-schisme": "Schisme de 1054", "h-jerusalem": "Siège de Jérusalem (1099)", "h-notre-dame": "Cathédrale Notre-Dame de Paris", "h-1204": "Sac de Constantinople (1204)",
  "h-bouvines": "Bataille de Bouvines", "h-magna-carta": "Magna Carta", "h-peste": "Peste noire", "h-1453": "Chute de Constantinople", "h-cent-ans": "Guerre de Cent Ans",
  "h-gutenberg": "Bible de Gutenberg", "h-colomb": "Premier voyage de Christophe Colomb", "h-tordesillas": "Traité de Tordesillas", "h-gama": "Premier voyage de Vasco de Gama",
  "h-luther": "Quatre-vingt-quinze thèses", "h-charles-quint": "Élection impériale de 1519", "h-magellan": "Expédition de Magellan", "h-tenochtitlan": "Chute de Tenochtitlan",
  "h-villers": "Ordonnance de Villers-Cotterêts", "h-valladolid": "Controverse de Valladolid", "h-st-barth": "Massacre de la Saint-Barthélemy", "h-nantes": "Édit de Nantes",
  "h-fronde": "Fronde (histoire)", "h-westphalie": "Traités de Westphalie", "h-habeas": "Habeas Corpus Act 1679", "h-code-noir": "Code noir", "h-revocation": "Édit de Fontainebleau (1685)",
  "h-bill": "Bill of Rights 1689", "h-mort-louis14": "Louis XIV", "h-encyclopedie": "Encyclopédie ou Dictionnaire raisonné des sciences, des arts et des métiers",
  "h-usa": "Déclaration d'indépendance des États-Unis", "h-bastille": "Prise de la Bastille", "h-st-domingue": "Révolution haïtienne", "h-olympe": "Déclaration des droits de la femme et de la citoyenne",
  "h-republique1": "Première République (France)", "h-louis16": "Louis XVI", "h-abolition1794": "Décret d'abolition de l'esclavage du 4 février 1794", "h-brumaire": "Coup d'État du 18 Brumaire",
  "h-esclavage1802": "Loi du 20 mai 1802", "h-code-civil": "Code civil des Français", "h-haiti": "Haïti", "h-austerlitz": "Bataille d'Austerlitz", "h-waterloo": "Bataille de Waterloo",
  "h-trois-glorieuses": "Trois Glorieuses", "h-alger": "Prise d'Alger", "h-abolition1848": "Décret d'abolition de l'esclavage du 27 avril 1848", "h-coup-1851": "Coup d'État du 2 décembre 1851",
  "h-second-empire": "Second Empire", "h-italie": "Royaume d'Italie (1861-1946)", "h-greve": "Loi Ollivier", "h-sedan": "Bataille de Sedan (1870)", "h-republique3": "Troisième République (France)",
  "h-reich": "Empire allemand", "h-commune": "Commune de Paris", "h-marseillaise": "La Marseillaise", "h-14juillet": "Fête nationale française", "h-camille-see": "Loi Camille Sée",
  "h-ferry-gratuite": "Lois Jules Ferry", "h-ferry-laique": "Lois Jules Ferry", "h-syndicats": "Loi Waldeck-Rousseau", "h-berlin": "Conférence de Berlin", "h-jaccuse": "J'accuse…!",
  "h-associations": "Loi du 1er juillet 1901 relative au contrat d'association", "h-laicite": "Loi de séparation des Églises et de l'État", "h-1914": "Première Guerre mondiale",
  "h-armeniens": "Génocide arménien", "h-verdun": "Bataille de Verdun", "h-armistice": "Armistice du 11 novembre 1918", "h-versailles": "Traité de Versailles", "h-rome-mussolini": "Marche sur Rome",
  "h-krach": "Krach de 1929", "h-nuremberg-lois": "Lois de Nuremberg", "h-front-pop": "Front populaire (France)", "h-cristal": "Nuit de Cristal", "h-1939": "Invasion de la Pologne",
  "h-18juin": "Appel du 18 Juin", "h-pearl": "Attaque de Pearl Harbor", "h-wannsee": "Conférence de Wannsee", "h-vel-hiv": "Rafle du Vélodrome d'Hiver", "h-stalingrad": "Bataille de Stalingrad",
  "h-cnr": "Conseil national de la Résistance", "h-debarquement": "Débarquement de Normandie", "h-8mai": "Capitulation de l'Allemagne nazie", "h-hiroshima": "Bombardements atomiques d'Hiroshima et Nagasaki",
  "h-secu": "Sécurité sociale en France", "h-onu": "Organisation des Nations unies", "h-ive": "Constitution française du 27 octobre 1946", "h-inde": "Indépendance de l'Inde",
  "h-marshall": "Plan Marshall", "h-blocus": "Blocus de Berlin", "h-israel": "Déclaration d'indépendance de l'État d'Israël", "h-otan": "Organisation du traité de l'Atlantique nord",
  "h-rpc": "Proclamation de la république populaire de Chine", "h-schuman": "Déclaration Schuman", "h-ceca": "Traité de Paris (1951)", "h-dienbienphu": "Bataille de Diên Biên Phu",
  "h-algerie-debut": "Guerre d'Algérie", "h-bandung": "Conférence de Bandung", "h-varsovie": "Pacte de Varsovie", "h-suez": "Crise du canal de Suez", "h-rome-traites": "Traités de Rome",
  "h-ve": "Constitution française du 4 octobre 1958", "h-mur": "Mur de Berlin", "h-cuba": "Crise des missiles de Cuba", "h-evian": "Accords d'Évian",
  "h-1962-ref": "Référendum français sur l'élection au suffrage universel du président de la République", "h-neuwirth": "Loi Neuwirth", "h-mai68": "Mai 68", "h-choc1973": "Premier choc pétrolier",
  "h-veil": "Loi Veil", "h-iran": "Révolution iranienne", "h-mitterrand": "Élection présidentielle française de 1981", "h-chute-mur": "Chute du mur de Berlin", "h-urss": "Dislocation de l'URSS",
  "h-maastricht": "Traité de Maastricht", "h-rwanda": "Génocide des Tutsi au Rwanda", "h-quinquennat": "Référendum français sur le quinquennat présidentiel", "h-11sept": "Attentats du 11 septembre 2001",
  "h-euro": "Euro", "h-irak": "Guerre d'Irak", "h-elargissement": "Élargissement de l'Union européenne de 2004", "h-lehman": "Faillite de Lehman Brothers", "h-crimee": "Annexion de la Crimée par la Russie",
  "h-paris-climat": "Accord de Paris sur le climat", "h-brexit": "Brexit", "h-ukraine": "Invasion de l'Ukraine par la Russie", "h-spoutnik": "Spoutnik 1", "h-gagarine": "Vostok 1",
  "h-traite-espace": "Traité de l'espace", "h-lune": "Apollo 11", "h-montego": "Convention des Nations unies sur le droit de la mer", "h-nuremberg-proces": "Procès de Nuremberg",
  "h-unesco-patrimoine": "Convention pour la protection du patrimoine mondial, culturel et naturel", "h-rio": "Sommet de la Terre de Rio de Janeiro", "h-kyoto": "Protocole de Kyoto",
  "h-cpi": "Statut de Rome", "h-wikipedia": "Wikipédia", "e-ddhc-date": "Déclaration des droits de l'homme et du citoyen de 1789", "e-1881": "Loi sur la liberté de la presse du 29 juillet 1881",
  "e-1905": "Loi de séparation des Églises et de l'État", "e-dudh": "Déclaration universelle des droits de l'homme", "e-cedh": "Convention européenne des droits de l'homme",
  "e-1958": "Constitution française du 4 octobre 1958", "e-peine-mort": "Abolition de la peine de mort en France", "e-cide-date": "Convention relative aux droits de l'enfant",
  "e-pacs": "Pacte civil de solidarité", "e-loi-2004": "Loi sur les signes religieux dans les écoles publiques françaises", "e-charte-date": "Charte de l'environnement",
  "e-mariage": "Loi ouvrant le mariage aux couples de personnes de même sexe", "a-republique": "République romaine", "a-punique": "Première guerre punique", "a-cannes": "Bataille de Cannes",
  "a-carthage": "Siège de Carthage (troisième guerre punique)", "a-spartacus": "Troisième guerre servile", "a-cesar": "Assassinat de Jules César", "a-actium": "Bataille d'Actium",
  "a-incendie": "Grand incendie de Rome", "a-salamine": "Bataille de Salamine", "a-peloponnese": "Guerre du Péloponnèse", "a-alexandre": "Alexandre le Grand", "a-marathon": "Bataille de Marathon",
  "a-jo": "Jeux olympiques antiques", "e-jo1896": "Jeux olympiques d'été de 1896", "e-tour": "Tour de France 1903", "e-jo1924": "Jeux olympiques d'été de 1924",
  "e-coupe-monde": "Coupe du monde de football 1930", "e-paralympiques": "Jeux paralympiques d'été de 1960", "e-jo2024": "Jeux olympiques d'été de 2024",
};

/** Propriétés Wikidata qui portent une date utile. */
const DATE_PROPS = ["P585", "P580", "P582", "P571", "P577", "P575", "P619", "P570", "P729", "P1191", "P7588", "P1619", "P576"];
function yearsOf(entity: any, props = DATE_PROPS): number[] {
  const out = new Set<number>();
  for (const p of props) {
    for (const c of entity?.claims?.[p] ?? []) {
      const t: string | undefined = c?.mainsnak?.datavalue?.value?.time;
      if (t) out.add(Number(/^([+-]\d+)/.exec(t)![1]));
    }
  }
  return [...out];
}
async function entities(ids: string[]): Promise<Record<string, any>> {
  const out: Record<string, any> = {};
  for (let i = 0; i < ids.length; i += 50) {
    const data = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels&languages=fr|en&ids=${ids.slice(i, i + 50).join("|")}`);
    Object.assign(out, data.entities);
  }
  return out;
}
async function qidsOfArticles(titles: string[], lang: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const data = await json(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(batch.join("|"))}`);
    const back: Record<string, string> = {};
    for (const n of data.query?.normalized ?? []) back[n.to] = n.from;
    for (const r of data.query?.redirects ?? []) back[r.to] = back[r.from] ?? r.from;
    for (const page of Object.values<any>(data.query?.pages ?? {})) {
      const original = back[page.title] ?? page.title;
      if (page.pageprops?.wikibase_item) out[original] = page.pageprops.wikibase_item;
    }
  }
  return out;
}

const facts = FACT_SETS.flatMap((s) => s.facts);
const dates = facts.filter((f): f is Extract<Fact, { kind: "date" }> => f.kind === "date");
const works = facts.filter((f): f is Extract<Fact, { kind: "work" }> => f.kind === "work");

const verified: Record<string, { source: string; qid: string; years?: number[] }> = {};
const mismatches: string[] = [];
const missing: string[] = [];

async function main() {
/* ——— Dates ——— */
const byLang: Record<string, string[]> = { fr: [], en: [] };
for (const f of dates) {
  const a = ARTICLES[f.id];
  if (!a) continue;
  if (a.startsWith("en:")) byLang.en!.push(a.slice(3));
  else byLang.fr!.push(a);
}
const qFr = await qidsOfArticles([...new Set(byLang.fr)], "fr");
const qEn = await qidsOfArticles([...new Set(byLang.en)], "en");
const dateQids = [...new Set([...Object.values(qFr), ...Object.values(qEn)])];
const dateEntities = await entities(dateQids);
for (const f of dates) {
  const a = ARTICLES[f.id];
  if (!a) { missing.push(`${f.id} (pas d'article associé) : ${f.label}, ${f.year}`); continue; }
  const qid = a.startsWith("en:") ? qEn[a.slice(3)] : qFr[a];
  if (!qid) { missing.push(`${f.id} : article introuvable « ${a} »`); continue; }
  const years = yearsOf(dateEntities[qid]);
  if (years.includes(f.year)) verified[f.id] = { source: "wikidata", qid, years: [f.year] };
  else mismatches.push(`${f.id} : ${f.label} — banque ${f.year}, Wikidata ${qid} ${years.length ? years.join(", ") : "sans date"}`);
}

/* ——— Œuvres ——— */
const lastName = (name: string) => name.split(/[\s-]+/).filter((w) => /^[A-ZÀ-Ý]/.test(w)).pop()!.toLowerCase();
const CREATOR = ["P50", "P86", "P170", "P87"]; // auteur, compositeur, créateur, librettiste
const creatorsOf = (e: any): string[] => CREATOR.flatMap((p) => (e?.claims?.[p] ?? []).map((c: any) => c?.mainsnak?.datavalue?.value?.id)).filter(Boolean);
// 1. recherche de chaque titre (une requête par œuvre), 2. lecture groupée des éléments trouvés, 3. lecture groupée des auteurs.
const candidates: Record<string, string[]> = {};
for (const w of works) {
  const q = w.title.replace(/ \((premier recueil|Œuvres)\)$/, "");
  const search = await json(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=fr&uselang=fr&limit=8&search=${encodeURIComponent(q)}`);
  candidates[w.id] = (search.search ?? []).map((s: any) => s.id);
}
const ents = await entities([...new Set(Object.values(candidates).flat())]);
const creators = await entities([...new Set(Object.values(ents).flatMap(creatorsOf))]);
const label = (e: any) => [e?.labels?.fr?.value, e?.labels?.en?.value].filter(Boolean).join(" / ").toLowerCase();
for (const w of works) {
  const ids = candidates[w.id] ?? [];
  if (!ids.length) { missing.push(`${w.id} : œuvre introuvable « ${w.title} »`); continue; }
  const surnames = w.author.split(/ et /).map(lastName);
  let ok = false;
  const seen: string[] = [];
  for (const id of ids) {
    if (!creatorsOf(ents[id]).some((c) => surnames.some((s) => label(creators[c]).includes(s)))) continue;
    const years = yearsOf(ents[id], ["P577", "P571", "P1191", "P585", "P2754", "P1319"]);
    seen.push(`${id} ${years.join(", ") || "sans date"}`);
    if (!w.year || years.includes(w.year)) {
      verified[w.id] = { source: "wikidata", qid: id, ...(w.year ? { years: [w.year] } : {}) };
      ok = true;
      break;
    }
  }
  if (!ok) (seen.length ? mismatches : missing).push(`${w.id} : « ${w.title} », ${w.author}${w.year ? `, ${w.year}` : ""}${seen.length ? ` — Wikidata ${seen.join(" ; ")}` : " — auteur non retrouvé"}`);
}

const src = `/* Généré par \`npm run bank:faits\` (recoupement avec Wikidata) le ${new Date().toISOString().slice(0, 10)} : ne pas modifier à la main. */
export const FACT_CHECKS: Record<string, { source: string; qid: string; years?: number[] }> = ${JSON.stringify(verified, null, 1)};
`;
writeFileSync(new URL("../src/lib/content/bank/facts/verification.generated.ts", import.meta.url), src);
console.log(`Recoupés : ${Object.keys(verified).length} faits (dates : ${dates.filter((f) => verified[f.id]).length}/${dates.length}, œuvres : ${works.filter((f) => verified[f.id]).length}/${works.length}).`);
console.log(`\nÉcarts à examiner (${mismatches.length}) :\n${mismatches.join("\n")}`);
console.log(`\nNon recoupés automatiquement (${missing.length}) :\n${missing.join("\n")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
