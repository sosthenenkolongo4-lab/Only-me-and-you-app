import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Heart, Home, MessageCircleHeart, Calendar, Wallet, Gamepad2, BookOpenText,
  Sparkles, Send, Camera, Gift, Check, Copy, LogOut, Users, Clock3,
  Plus, Trash2, Star, RefreshCw, Lock, ArrowRight, X, BellRing, Settings,
  MapPin, HelpCircle, Lightbulb, Cake, Gem, PartyPopper, ListTodo,
  MessageSquareText, Library, Search, Mail, Pencil, MoreVertical, Reply
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const EMPTY = {
  couple_id: "",
  names: { you: "", partner: "" },
  startDate: new Date().toISOString().slice(0, 10),
  messages: [],
  memories: [],
  gameAnswers: [],
  location: null,
  events: [],
  importantDates: [],
  programs: [],
  notes: [],
  goals: [],
  transactions: [],
  score: { you: 0, partner: 0 },
  savedVerses: [],
  settings: { reminders: true, sound: false },
  wishlist: [],
  secrets: [],
  capsules: [],
  moods: {},
  outingsDone: [],
  challengesDone: [],
  challengesWeek: "",
  packs: {
    valentineMessages: [],
    valentineChallengesDone: [],
    proposal: { date: "", place: "", message: "", askedDate: "" },
    birthday: { personName: "", date: "", cardText: "", giftIdeas: [], challengesDone: [] },
    reasons: []
  }
};

const dateIdeasCategories = {
  "Cocooning": ["Soirée pyjama et film", "Cuisiner un dessert ensemble", "Jeux de société sans téléphone", "Bain chaud avec bougies"],
  "Culture": ["Visiter un musée", "Aller à une expo", "Lire un livre à deux voix", "Concert ou spectacle"],
  "Extérieur": ["Pique-nique", "Randonnée", "Balade à vélo", "Regarder le coucher du soleil"],
  "Gourmand": ["Nouveau restaurant", "Atelier cuisine", "Dégustation", "Brunch du dimanche"]
};

const challengesPool = [
  "Préparer le petit-déjeuner au lit",
  "Envoyer un selfie rigolo",
  "Écrire 3 choses que j'aime chez toi",
  "Proposer une sortie surprise",
  "Cuisiner le plat préféré de l'autre",
  "Offrir un compliment sincère aujourd'hui",
  "Planifier une soirée sans téléphone",
  "Envoyer un message d'amour avant midi",
  "Se remémorer un souvenir marquant ensemble",
  "Faire une activité nouvelle à deux cette semaine",
  "Écrire une petite note surprise",
  "Se dire un compliment en personne, les yeux dans les yeux",
  "Regarder un film qui a marqué l'un de vous deux",
  "Préparer un dîner aux chandelles"
];

// Sélectionne une seule question stable pour toute la journée, différente d'un jour à l'autre.
// Choisit automatiquement un verset : change 3 fois par jour (matin / après-midi / soir),
// de façon stable et sans action manuelle.
function getVersePeriod(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return 0;
  if (h < 18) return 1;
  return 2;
}

function getDailyVerseIndex(d = new Date()) {
  const dayKey = getDayKey(d);
  const daysSinceEpoch = Math.floor(new Date(dayKey + "T00:00:00").getTime() / 86400000);
  const idx = daysSinceEpoch * 3 + getVersePeriod(d);
  return ((idx % verses.length) + verses.length) % verses.length;
}

function getDayKey(d = new Date()) {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return day.toISOString().slice(0, 10);
}

function getDailyQuestion(dayKey) {
  const daysSinceEpoch = Math.floor(new Date(dayKey + "T00:00:00").getTime() / 86400000);
  const idx = ((daysSinceEpoch % questions.length) + questions.length) % questions.length;
  return questions[idx];
}
// qui change automatiquement chaque lundi à minuit.
function getWeekKey(d = new Date()) {
  const day = (d.getDay() + 6) % 7; // lundi = 0 ... dimanche = 6
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() - day);
  return monday.toISOString().slice(0, 10);
}

// Sélectionne 5 défis dans le pool, de façon stable pour toute la semaine,
// mais différente d'une semaine à l'autre.
function getWeeklyChallenges(weekKey) {
  const weeksSinceEpoch = Math.floor(new Date(weekKey + "T00:00:00").getTime() / (7 * 86400000));
  const start = ((weeksSinceEpoch % challengesPool.length) + challengesPool.length) % challengesPool.length;
  const count = 5;
  const result = [];
  for (let i = 0; i < count; i++) result.push(challengesPool[(start + i) % challengesPool.length]);
  return result;
}

const moodOptions = ["😍", "😊", "😌", "😴", "😢", "😤", "🥳", "😐", "😩", "🙂", "😥", "😠"];

const verses = [
  // L'amour
  ["1 Corinthiens 13:4-7", "L'amour est patient, il est plein de bonté ; l'amour ne cherche point son intérêt, ne s'irrite point et supporte tout."],
  ["1 Jean 4:7", "Bien-aimés, aimons-nous les uns les autres ; car l'amour est de Dieu, et quiconque aime est né de Dieu et connaît Dieu."],
  ["1 Jean 4:18", "La crainte n'est pas dans l'amour, mais l'amour parfait bannit la crainte."],
  ["Cantique des cantiques 8:7", "Les grandes eaux ne peuvent éteindre l'amour, et les fleuves ne le submergeraient pas."],
  ["Proverbes 10:12", "La haine excite des querelles, mais l'amour couvre toutes les fautes."],
  ["Jean 15:12", "C'est ici mon commandement : Aimez-vous les uns les autres, comme je vous ai aimés."],
  ["1 Corinthiens 16:14", "Que tout ce que vous faites se fasse avec charité !"],
  ["Osée 2:19", "Je serai ton fiancé pour toujours ; je serai ton fiancé par la justice, la droiture, la grâce et la miséricorde."],

  // Le couple et l'unité
  ["Genèse 2:24", "C'est pourquoi l'homme quittera son père et sa mère, et s'attachera à sa femme, et ils deviendront une seule chair."],
  ["Ecclésiaste 4:9-12", "Deux valent mieux qu'un... et la corde à trois fils ne se rompt pas facilement."],
  ["Marc 10:9", "Que l'homme ne sépare donc pas ce que Dieu a uni."],
  ["Amos 3:3", "Deux hommes marchent-ils ensemble, sans en être convenus ?"],
  ["Romains 12:10", "Par amour fraternel, soyez pleins d'affection les uns pour les autres."],
  ["1 Pierre 3:7", "Maris, montrez à votre tour de la sagesse dans vos rapports avec vos femmes, afin que vos prières ne soient pas interrompues."],
  ["Éphésiens 5:33", "Que chacun de vous aime sa femme comme lui-même, et que la femme respecte son mari."],
  ["Philippiens 2:2", "Rendez ma joie parfaite, ayant un même sentiment, un même amour, une même âme, une seule pensée."],
  ["Proverbes 18:22", "Celui qui trouve une femme trouve le bonheur ; c'est une grâce qu'il obtient de l'Éternel."],
  ["Psaume 133:1", "Voici, oh ! qu'il est agréable, qu'il est doux pour des frères de demeurer ensemble !"],

  // La foi et la prière à deux
  ["Matthieu 18:20", "Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux."],
  ["Philippiens 4:6", "Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces."],
  ["Marc 11:24", "Tout ce que vous demanderez en priant, croyez que vous l'avez reçu, et vous le verrez s'accomplir."],
  ["Jacques 5:16", "Priez les uns pour les autres, afin que vous soyez guéris."],
  ["Josué 24:15", "Moi et ma maison, nous servirons l'Éternel."],
  ["Matthieu 7:7", "Demandez, et l'on vous donnera ; cherchez, et vous trouverez ; frappez, et l'on vous ouvrira."],
  ["1 Thessaloniciens 5:17", "Priez sans cesse."],
  ["Psaume 34:4", "J'ai cherché l'Éternel, et il m'a répondu ; il m'a délivré de toutes mes frayeurs."],
  ["2 Corinthiens 5:7", "Car nous marchons par la foi et non par la vue."],

  // Le pardon
  ["Éphésiens 4:32", "Soyez bons les uns envers les autres, compatissants, vous pardonnant réciproquement, comme Dieu vous a pardonné en Christ."],
  ["Colossiens 3:13", "Supportez-vous les uns les autres, et, si l'un a sujet de se plaindre de l'autre, pardonnez-vous réciproquement."],
  ["Matthieu 6:14", "Si vous pardonnez aux hommes leurs offenses, votre Père céleste vous pardonnera aussi."],
  ["Proverbes 17:9", "Celui qui couvre une faute cherche l'amour, et celui qui la rappelle dans ses discours divise les amis."],
  ["Luc 6:37", "Ne jugez point, et vous ne serez point jugés ; ne condamnez point, et vous ne serez point condamnés ; absolvez, et vous serez absous."],
  ["Marc 11:25", "Et quand vous êtes debout faisant votre prière, si vous avez quelque chose contre quelqu'un, pardonnez, afin que votre Père qui est dans les cieux vous pardonne aussi vos offenses."],
  ["Romains 12:18", "S'il est possible, autant que cela dépend de vous, soyez en paix avec tous les hommes."],

  // La patience et la bienveillance
  ["Galates 5:22-23", "Mais le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance."],
  ["Éphésiens 4:2", "En toute humilité et douceur, avec patience, vous supportant les uns les autres avec charité."],
  ["Proverbes 15:1", "Une réponse douce calme la fureur, mais une parole dure excite la colère."],
  ["Colossiens 3:12", "Revêtez-vous donc, comme des élus de Dieu, saints et bien-aimés, d'entrailles de miséricorde, de bonté, d'humilité, de douceur, de patience."],
  ["Jacques 1:19", "Que tout homme soit prompt à écouter, lent à parler, lent à se mettre en colère."],
  ["Proverbes 14:29", "Celui qui est lent à la colère a une grande intelligence, mais celui qui est prompt à s'emporter proclame sa folie."],
  ["1 Thessaloniciens 5:14", "Avertissez ceux qui vivent dans le désordre, consolez ceux qui sont abattus, supportez les faibles, usez de patience envers tous."],

  // La famille et l'avenir
  ["Psaume 127:1", "Si l'Éternel ne bâtit la maison, ceux qui la bâtissent travaillent en vain."],
  ["Proverbes 24:3-4", "C'est par la sagesse qu'une maison s'élève, et par l'intelligence qu'elle s'affermit."],
  ["Deutéronome 6:6-7", "Et ces commandements que je te donne aujourd'hui seront dans ton cœur... tu les inculqueras à tes enfants."],
  ["Proverbes 22:6", "Instruis l'enfant selon la voie qu'il doit suivre ; et quand il sera vieux, il ne s'en détournera pas."],
  ["Psaume 128:3", "Ta femme est comme une vigne fertile dans l'intérieur de ta maison ; tes fils sont comme des plants d'olivier, autour de ta table."],
  ["Malachie 4:6", "Il ramènera le cœur des pères à leurs enfants, et le cœur des enfants à leurs pères."],

  // L'espérance
  ["Jérémie 29:11", "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance."],
  ["Romains 15:13", "Que le Dieu de l'espérance vous remplisse de toute joie et de toute paix dans la foi, pour que vous abondiez en espérance, par la puissance du Saint-Esprit."],
  ["Romains 8:28", "Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu."],
  ["Hébreux 11:1", "Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas."],
  ["Psaume 27:14", "Espère en l'Éternel ! Fortifie-toi et que ton cœur s'affermisse ! Espère en l'Éternel !"],
  ["Ésaïe 40:31", "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles."],
  ["Lamentations 3:25", "L'Éternel a de la bonté pour qui espère en lui, pour l'âme qui le cherche."],
  ["Romains 5:5", "Or, l'espérance ne trompe point, parce que l'amour de Dieu est répandu dans nos cœurs par le Saint-Esprit qui nous a été donné."],

  // La fidélité
  ["Lamentations 3:22-23", "Les bontés de l'Éternel ne sont pas épuisées, ses compassions ne sont pas à leur terme ; elles se renouvellent chaque matin. Oh ! que ta fidélité est grande !"],
  ["Proverbes 3:3-4", "Que la bonté et la fidélité ne t'abandonnent pas ; lie-les à ton cou, écris-les sur la table de ton cœur."],
  ["1 Corinthiens 4:2", "Du reste, ce qu'on demande des dispensateurs, c'est que chacun soit trouvé fidèle."],
  ["Malachie 2:15", "Prenez donc garde en votre esprit, et qu'aucun ne soit infidèle à la femme de sa jeunesse !"]
];

const questions = [
  "Quel souvenir de nous te fait sourire instantanément ?",
  "Qu'est-ce qui te fait te sentir le plus aimé(e) ?",
  "Quel rêve aimerais-tu absolument réaliser avec moi ?",
  "Qu'est-ce que tu aimerais qu'on fasse plus souvent ?",
  "Quel moment de notre histoire voudrais-tu revivre ?",
  "Comment pouvons-nous mieux grandir spirituellement ensemble ?",
  "Quelle est la première chose qui t'a attiré(e) chez moi ?",
  "Quel est ton souvenir préféré de notre première rencontre ?",
  "Si on pouvait voyager n'importe où ensemble, ce serait où ?",
  "Qu'est-ce que tu admires le plus chez moi ?",
  "Quel petit geste du quotidien te touche le plus ?",
  "Comment imagines-tu notre vie dans 5 ans ?",
  "Quelle tradition aimerais-tu qu'on crée à nous deux ?",
  "Quel est le meilleur conseil qu'on t'ait donné sur l'amour ?",
  "Qu'est-ce qui te fait te sentir en sécurité avec moi ?",
  "Quelle chanson te fait penser à nous ?",
  "Quel est ton endroit préféré quand on est ensemble ?",
  "Qu'est-ce que tu aimerais qu'on apprenne ensemble ?",
  "Quel a été notre plus beau fou rire ?",
  "Comment sais-tu que je pense à toi sans que je le dise ?",
  "Quelle qualité de l'autre t'inspire le plus ?",
  "Quel est ton rêve pour notre famille future ?",
  "Qu'est-ce qui t'aide à te sentir proche de Dieu avec moi ?",
  "Quel petit plaisir simple aimerais-tu qu'on partage plus souvent ?",
  "Quelle a été notre plus belle surprise l'un pour l'autre ?",
  "Comment veux-tu qu'on célèbre notre prochain anniversaire ?",
  "Quel est le plus beau compliment que je t'ai fait ?",
  "Qu'est-ce que tu voudrais qu'on améliore dans notre communication ?",
  "Quelle habitude de moi te fait sourire ?",
  "Quel est ton souvenir de vacances préféré avec moi ?",
  "Comment aimerais-tu qu'on gère les désaccords ?",
  "Quelle valeur est la plus importante pour toi dans notre couple ?",
  "Quel projet à deux te motive le plus en ce moment ?",
  "Qu'est-ce qui te rend fier/fière de notre relation ?",
  "Quel serait ton rendez-vous parfait avec moi ?",
  "Quelle prière aimerais-tu qu'on fasse ensemble ?",
  "Quel est le plus beau cadeau que je t'ai offert ?",
  "Comment aimerais-tu qu'on se soutienne dans les moments difficiles ?",
  "Quel souvenir d'enfance aimerais-tu me raconter à nouveau ?",
  "Quelle nouvelle activité aimerais-tu qu'on essaie ensemble ?",
  "Qu'est-ce qui te fait dire que nous formons une bonne équipe ?",
  "Quel est ton mot d'amour préféré que je te dis ?",
  "Comment vois-tu notre rôle l'un envers l'autre dans 10 ans ?",
  "Quelle est la leçon la plus précieuse que tu as apprise avec moi ?",
  "Quel plat aimerais-tu qu'on cuisine ensemble bientôt ?",
  "Qu'est-ce qui rendrait notre semaine plus douce ?",
  "Quel est ton souvenir préféré de nos débuts ?",
  "Comment aimerais-tu qu'on prie ou médite ensemble ?",
  "Quelle habitude aimerais-tu qu'on développe à deux cette année ?",
  "Qu'est-ce que tu aimerais que je sache sans avoir à le demander ?",
  "Quel est le plus beau souvenir qu'on ait créé récemment ?",
  "Comment aimerais-tu qu'on fête nos petites victoires ?",
  "Quelle est la chose la plus romantique qu'on ait vécue ?",
  "Qu'est-ce qui te donne le plus confiance en notre avenir ?",
  "Quel serait un cadeau simple qui te toucherait beaucoup ?",
  "Comment aimerais-tu qu'on se dise « je t'aime » différemment ?",
  "Quel est ton rêve de maison ou de lieu de vie ensemble ?",
  "Qu'est-ce que tu voudrais qu'on se pardonne plus facilement ?",
  "Quel est le moment où tu as senti qu'on était vraiment unis ?",
  "Quelle chose simple pourrait rendre demain plus beau pour nous deux ?"
];

const truthOrDare = [
  { type: "vérité", text: "Quelle est la chose que tu admires le plus chez moi ?" },
  { type: "action", text: "Fais un compliment sincère à ton/ta partenaire, les yeux dans les yeux." },
  { type: "vérité", text: "Quel a été ton moment de doute le plus honnête dans notre couple ?" },
  { type: "action", text: "Envoie un message vocal doux à ton/ta partenaire maintenant." },
  { type: "vérité", text: "Quel souvenir avec moi voudrais-tu revivre exactement pareil ?" },
  { type: "action", text: "Offre un massage de 2 minutes." }
];

const wouldYouRather = [
  ["Voyager ensemble sans plan", "Voyager avec un itinéraire parfait"],
  ["Une soirée calme à deux", "Une soirée entre amis à deux"],
  ["Recevoir des mots doux", "Recevoir des gestes d'attention"],
  ["Cuisiner ensemble chaque soir", "Découvrir un nouveau resto chaque semaine"]
];

const REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🙏"];

const valentineChallenges = [
  "Écrire une lettre d'amour à la main (ou façon lettre) à l'autre",
  "Se remémorer votre tout premier rendez-vous",
  "Se dire chacun 3 choses qu'on n'a jamais osé dire",
  "Planifier ensemble un rendez-vous surprise",
  "Se prendre en photo tous les deux aujourd'hui"
];

const valentineQuiz = [
  "Quel est mon souvenir préféré de nous deux ?",
  "Qu'est-ce qui t'a fait craquer chez moi au début ?",
  "Si notre amour était une chanson, laquelle serait-ce ?"
];

const birthdayChallenges = [
  "Préparer une surprise pour son réveil",
  "Lui écrire 5 raisons d'être fier/fière d'elle/lui cette année",
  "Organiser un moment rien qu'à deux aujourd'hui",
  "Lui offrir un compliment devant quelqu'un d'autre"
];

const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function mergeData(raw) {
  const safeRaw = { ...(raw || {}) };
  // L'ancienne version stockait la position GPS. On l'ignore désormais
  // pour que cette fonctionnalité soit complètement retirée de l'application.
  delete safeRaw.gpsLocations;

  const legacyEvents = Array.isArray(safeRaw.events) ? safeRaw.events : [];
  const importantDates = Array.isArray(safeRaw.importantDates)
    ? safeRaw.importantDates
    : legacyEvents;

  return {
    ...EMPTY, ...safeRaw,
    names: { ...EMPTY.names, ...(safeRaw.names || {}) },
    score: { ...EMPTY.score, ...(safeRaw.score || {}) },
    settings: { ...EMPTY.settings, ...(safeRaw.settings || {}) },
    messages: safeRaw.messages || [],
    memories: safeRaw.memories || [],
    gameAnswers: safeRaw.gameAnswers || [],
    location: safeRaw.location || null,
    importantDates,
    programs: Array.isArray(safeRaw.programs) ? safeRaw.programs : [],
    // Compatibilité avec les anciennes données : les événements historiques
    // sont désormais considérés comme des dates importantes.
    events: [],
    notes: safeRaw.notes || [],
    goals: raw?.goals || [],
    transactions: raw?.transactions || [],
    savedVerses: raw?.savedVerses || [],
    wishlist: raw?.wishlist || [],
    secrets: raw?.secrets || [],
    capsules: raw?.capsules || [],
    moods: raw?.moods || {},
    outingsDone: raw?.outingsDone || [],
    challengesDone: (raw?.challengesWeek === getWeekKey()) ? (raw?.challengesDone || []) : [],
    challengesWeek: getWeekKey(),
    packs: {
      ...EMPTY.packs,
      ...(safeRaw.packs || {}),
      proposal: { ...EMPTY.packs.proposal, ...((safeRaw.packs || {}).proposal || {}) },
      birthday: { ...EMPTY.packs.birthday, ...((safeRaw.packs || {}).birthday || {}) }
    }
  };
}

function notifyIfNew(prev, next, myName) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const checks = [
    { list: "messages", label: "un nouveau message", appended: true },
    { list: "notes", label: "un nouveau mot doux" },
    { list: "gameAnswers", label: "une nouvelle réponse de jeu" },
    { list: "memories", label: "une nouvelle photo" },
  ];
  checks.forEach(({ list, label, appended }) => {
    const prevArr = prev[list] || [];
    const nextArr = next[list] || [];
    if (nextArr.length > prevArr.length) {
      const latest = appended ? nextArr[nextArr.length - 1] : nextArr[0];
      const author = latest && (latest.from || latest.author);
      if (author && author !== myName) {
        try {
          new Notification("Only Me & You 💗", { body: `${author} a ajouté ${label}` });
        } catch (e) {}
      }
    }
  });
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [room, setRoom] = useState(localStorage.getItem("oamy:room") || "");
  const [name, setName] = useState(localStorage.getItem("oamy:name") || "");
  const [role, setRole] = useState(localStorage.getItem("oamy:role") || "you");
  const [data, setData] = useState(EMPTY);
  const dataRef = React.useRef(EMPTY);
  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPacks, setShowPacks] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); setAuthChecked(true); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !room) { setLoading(false); return; }
    let channel;
    (async () => {
      setLoading(true);
      setError("");
      const roomCode = room.trim().toUpperCase();
      try {
        const { data: rows, error: e } = await supabase.from("couple_rooms").select("*").eq("room_code", roomCode).limit(1);

        if (e) {
          setError(e.message);
          setLoading(false);
          return;
        }

        if (rows?.[0]) {
          const existingData = mergeData(rows[0].payload);

          // Reconnaître automatiquement qui tu es en comparant ton prénom
          // à ceux déjà enregistrés — plutôt que de se fier uniquement au
          // bouton "Créer"/"Rejoindre" (qui ne dit rien sur ton identité réelle).
          const typed = name.trim().toLowerCase();
          const existingYou = (existingData.names.you || "").trim().toLowerCase();
          const existingPartner = (existingData.names.partner || "").trim().toLowerCase();

          let resolvedRole = role;
          if (typed && existingYou && typed === existingYou) resolvedRole = "you";
          else if (typed && existingPartner && typed === existingPartner) resolvedRole = "partner";
          else if (!existingData.names.you) resolvedRole = "you";
          else if (!existingData.names.partner) resolvedRole = "partner";
          // sinon : les deux places sont déjà prises par quelqu'un d'autre —
          // on ne touche à aucun des deux prénoms pour éviter d'écraser une donnée.

          if (resolvedRole !== role) {
            setRole(resolvedRole);
            localStorage.setItem("oamy:role", resolvedRole);
          }

          const updatedNames = { ...existingData.names };
          if (resolvedRole === "you" && !updatedNames.you) updatedNames.you = name;
          if (resolvedRole === "partner" && !updatedNames.partner) updatedNames.partner = name;

          const updatedPayload = { ...existingData, names: updatedNames };
          setData(updatedPayload);

          // Sauvegarder la mise à jour des noms
          await supabase.from("couple_rooms").update({ payload: updatedPayload, updated_at: new Date().toISOString() }).eq("room_code", roomCode);

          // Synchronisation en temps réel via Supabase realtime
          channel = supabase.channel("couple-" + roomCode)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "couple_rooms", filter: `room_code=eq.${roomCode}` },
              p => {
                try {
                  const incoming = mergeData(p.new.payload);
                  notifyIfNew(dataRef.current, incoming, name);
                  setData(incoming);
                } catch (syncErr) {
                  // Une mise à jour reçue était corrompue (coupure réseau côté expéditeur) :
                  // on l'ignore simplement, la prochaine mise à jour valide reprendra le dessus.
                  console.error("Synchronisation ignorée (donnée invalide) :", syncErr);
                }
              })
            .subscribe();
        } else {
          // Création du salon avec initialisation propre des rôles
          const fresh = {
            ...EMPTY,
            couple_id: roomCode,
            names: role === "you" ? { you: name, partner: "" } : { you: "", partner: name }
          };
          const { error: ins } = await supabase.from("couple_rooms").insert({ room_code: roomCode, payload: fresh });
          if (ins) setError(ins.message); else setData(fresh);
        }
      } catch (err) {
        // Connexion coupée en plein téléchargement (réseau faible) : on évite le crash
        // et on propose de réessayer, au lieu de laisser une erreur brute s'afficher.
        setError("Connexion instable : impossible de charger vos données. Vérifie ta connexion et réessaie.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [session, room, retryCount]);

  async function login() {
    setError("");
    if (!supabase) { setError("Ajoute les clés Supabase dans .env.local."); return; }
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) setError(error.message); else setSession(data.session);
  }

  async function join(targetRoom, targetRole) {
    const r = targetRoom.trim().toUpperCase();
    const n = name.trim();
    if (!r || !n) { setError("Saisis ton prénom et assure-toi que le code est généré."); return; }

    localStorage.setItem("oamy:room", r);
    localStorage.setItem("oamy:name", n);
    localStorage.setItem("oamy:role", targetRole);
    localStorage.setItem("oamy:lastRoom", r);

    setRoom(r);
    setName(n);
    setRole(targetRole);
    await login();
  }

  async function save(next) {
    setData(next);
    if (!supabase || !room) return;
    const { error: e } = await supabase.from("couple_rooms").update({ payload: next, updated_at: new Date().toISOString() }).eq("room_code", room);
    if (e) setError(e.message);
  }

  function logout() {
    if (!window.confirm("Se déconnecter ? Vos données restent sauvegardées, il faudra juste retaper le code de votre couple pour revenir.")) return;
    localStorage.removeItem("oamy:room");
    // On garde le prénom et le dernier code utilisé pour faciliter la reconnexion
    setRoom("");
    setData(EMPTY);
    setTab("home");
  }

  if (!supabase) return <SetupHelp />;
  if (!authChecked) return <Loading />;
  if (!room || !session) return <Pairing name={name} setName={setName} join={join} error={error} />;
  if (loading) return <Loading />;
  if (error && data === EMPTY) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center', gap: '14px' }}>
        <BellRing size={32} color="#C9184A" />
        <p style={{ color: '#4a1030', fontWeight: 600 }}>{error}</p>
        <button className="primary" onClick={() => setRetryCount(c => c + 1)}>
          <RefreshCw size={15} /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <Shell>
      <div className="topbar">
        <div className="brand"><Heart fill="currentColor" size={17} /> Only Me <span>&</span> You</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="sync"><span /> Synchronisé</div>
          <button onClick={logout} className="logout-mini-btn" title="Déconnexion"><LogOut size={15} /></button>
        </div>
      </div>
      <main className="main">
        {tab === "home" && <HomeScreen data={data} name={name} role={role} setName={setName} setTab={setTab} save={save} />}
        {tab === "chat" && <Chat data={data} name={name} save={save} />}
        {tab === "story" && <Story data={data} save={save} name={name} />}
        {tab === "agenda" && <Agenda data={data} save={save} />}
        {tab === "money" && <Money data={data} save={save} />}
        {tab === "games" && <Games data={data} save={save} name={name} role={role} />}
        {tab === "more" && <More data={data} save={save} logout={logout} room={room} name={name} onOpenPacks={() => setShowPacks(true)} />}
      </main>
      {showPacks && (
        <PacksModal data={data} save={save} name={name} setTab={setTab} onClose={() => setShowPacks(false)} />
      )}
      <Nav tab={tab} setTab={setTab} />
    </Shell>
  );
}

function Pairing({ name, setName, join, error }) {
  const [mode, setMode] = useState("join");
  const [code, setCode] = useState(() => localStorage.getItem("oamy:lastRoom") || "");
  const [copied, setCopied] = useState(false);

  // Génération automatique d'un code unique à 6 caractères
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "";
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(res);
  };

  useEffect(() => {
    if (mode === "create" && !code) {
      generateCode();
    }
  }, [mode]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (mode === "create") {
      join(code, "you");
    } else {
      join(code, "partner");
    }
  };

  return (
    <div className="pair-page">
      <div className="pair-glow" />
      <div className="pair-logo"><Heart fill="currentColor" size={42} /></div>
      <div className="script">Only Me & You</div>
      <h1>Notre petit monde.</h1>
      <p>Un espace privé pour écrire, partager et faire grandir votre histoire à deux.</p>

      <div className="pair-card">
        <div className="seg">
          <button className={mode === "join" ? "on" : ""} onClick={() => setMode("join")}>Rejoindre un espace</button>
          <button className={mode === "create" ? "on" : ""} onClick={() => { setMode("create"); generateCode(); }}>Créer un nouvel espace</button>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#a06', background: '#fff0f5', padding: '8px 10px', borderRadius: '8px', marginBottom: '4px' }}>
          ⚠️ Si vous avez déjà un espace ensemble, choisissez toujours <b>"Rejoindre"</b> avec votre code existant — même si c'est vous qui l'aviez créé au départ. "Créer" fabrique un nouvel espace vide.
        </div>

        <label>
          Ton prénom
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Sosthène" />
        </label>

        {mode === "create" ? (
          <div>
            <label>Ton code unique généré :</label>
            <div className="code-box" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input value={code} readOnly style={{ fontWeight: 'bold', letterSpacing: '2px', textAlign: 'center' }} />
              <button type="button" onClick={copyCode} style={{ padding: '0 12px' }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="code-tip"><Lock size={14} /> Partage ce code uniquement avec ton/ta partenaire pour qu'il/elle rejoigne.</div>
          </div>
        ) : (
          <label>
            Entrer le code reçu :
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Ex. K9X2P4"
              maxLength={6}
              style={{ letterSpacing: '2px', textAlign: 'center', fontWeight: 'bold' }}
            />
          </label>
        )}

        <button className="primary" onClick={handleSubmit}>
          <Heart size={16} /> {mode === "create" ? "Créer notre espace" : "Rejoindre mon/ma partenaire"}
        </button>

        {error && <div className="error" style={{ color: '#ff4d4d', marginTop: '10px' }}>{error}</div>}
      </div>
      <small>Connexion sécurisée par code unique • Synchronisation instantanée</small>
    </div>
  );
}

function SetupHelp() {
  return (
    <div className="setup">
      <Heart fill="currentColor" size={42} />
      <h1>Only Me & You</h1>
      <p>Configure Supabase pour activer le couple partagé.</p>
      <pre>{`1. Copie .env.example vers .env.local\n2. Mets VITE_SUPABASE_URL\n3. Mets VITE_SUPABASE_ANON_KEY\n4. Lance: npm install && npm run dev`}</pre>
    </div>
  );
}

function Loading() {
  return (
    <div className="loading">
      <Heart fill="currentColor" size={34} />
      <p>Ouverture de votre petit monde…</p>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Allura&family=Great+Vibes&display=swap');

        /* Navigation style capsule / glassmorphism */
        .app > nav {
          position: fixed !important;
          left: 14px !important;
          right: 14px !important;
          bottom: 14px !important;
          z-index: 1000 !important;
          height: 72px !important;
          padding: 7px !important;
          display: grid !important;
          grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
          align-items: stretch !important;
          gap: 5px !important;
          box-sizing: border-box !important;
          border: 1px solid rgba(255,255,255,.30) !important;
          border-radius: 26px !important;
          background:
            linear-gradient(135deg, rgba(75,25,48,.94), rgba(35,12,25,.96)) !important;
          box-shadow:
            0 18px 45px rgba(55, 10, 30, .28),
            inset 0 1px 0 rgba(255,255,255,.16),
            inset 0 -1px 0 rgba(0,0,0,.20) !important;
          backdrop-filter: blur(18px) saturate(130%) !important;
          -webkit-backdrop-filter: blur(18px) saturate(130%) !important;
        }

        .app > nav button {
          position: relative !important;
          min-width: 0 !important;
          min-height: 58px !important;
          border: 0 !important;
          border-radius: 21px !important;
          background: transparent !important;
          color: rgba(255,236,242,.64) !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 3px !important;
          padding: 5px 2px !important;
          font: inherit !important;
          cursor: pointer !important;
          transition:
            transform .22s ease,
            color .22s ease,
            background .22s ease,
            box-shadow .22s ease !important;
          -webkit-tap-highlight-color: transparent !important;
        }

        .app > nav button svg {
          width: 20px !important;
          height: 20px !important;
          flex: 0 0 auto !important;
          transition: transform .22s ease, filter .22s ease !important;
        }

        .app > nav button span {
          font-size: 10px !important;
          line-height: 1.1 !important;
          white-space: nowrap !important;
          letter-spacing: .1px !important;
        }

        .app > nav button.active {
          color: #fff7fa !important;
          background:
            linear-gradient(145deg, rgba(255,255,255,.18), rgba(255,190,210,.10)) !important;
          border: 1px solid rgba(255,255,255,.22) !important;
          box-shadow:
            0 0 0 1px rgba(255,255,255,.05),
            0 8px 20px rgba(0,0,0,.20),
            inset 0 1px 0 rgba(255,255,255,.25) !important;
        }

        .app > nav button.active::before {
          content: "" !important;
          position: absolute !important;
          inset: 3px !important;
          border-radius: 18px !important;
          pointer-events: none !important;
          box-shadow: 0 0 18px rgba(255,205,220,.16) !important;
        }

        .app > nav button.active svg {
          transform: translateY(-1px) scale(1.06) !important;
          filter: drop-shadow(0 0 7px rgba(255,218,229,.45)) !important;
        }

        .app > nav button:active {
          transform: scale(.94) !important;
        }

        /* Laisse de l'espace au contenu pour la barre flottante */
        .app > main {
          padding-bottom: 105px !important;
        }

        @media (min-width: 700px) {
          .app > nav {
            left: 50% !important;
            right: auto !important;
            width: min(680px, calc(100% - 36px)) !important;
            transform: translateX(-50%) !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}

function Nav({ tab, setTab }) {
  const items = [
    ["home", "Nous", Home],
    ["chat", "Messages", MessageCircleHeart],
    ["story", "Histoire", BookOpenText],
    ["agenda", "Agenda", Calendar],
    ["games", "Jeux", Gamepad2],
    ["more", "Plus", Plus]
  ];

  return (
    <nav aria-label="Navigation principale">
      {items.map(([id, label, Icon]) => (
        <button
          type="button"
          className={tab === id ? "active" : ""}
          onClick={() => setTab(id)}
          key={id}
          aria-label={label}
          aria-current={tab === id ? "page" : undefined}
        >
          <Icon size={20} strokeWidth={2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Title({ title, sub }) { return <div className="title"><h2>{title}</h2><p>{sub}</p></div>; }

function HomeScreen({ data, name, role, setName, setTab, save }) {
  const [now, setNow] = useState(new Date());
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(data.startDate);
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [tempYou, setTempYou] = useState(data.names.you || "");
  const [tempPartner, setTempPartner] = useState(data.names.partner || "");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Calcul dynamique du compte à rebours (jours, heures, minutes, secondes)
  const start = new Date((data.startDate || new Date().toISOString().slice(0, 10)) + "T00:00:00");
  const diffMs = Math.max(0, now - start);

  const totalDays = Math.floor(diffMs / 86400000);
  const hours = String(Math.floor((diffMs / 3600000) % 24)).padStart(2, "0");
  const minutes = String(Math.floor((diffMs / 60000) % 60)).padStart(2, "0");
  const seconds = String(Math.floor((diffMs / 1000) % 60)).padStart(2, "0");

  const partnerName = role === "you"
    ? (data.names.partner || "Ton/Ta Partenaire")
    : (data.names.you || "Ton/Ta Partenaire");

  const myName = name || (role === "you" ? data.names.you : data.names.partner) || "Moi";

  const isAnniversaryToday = totalDays > 0
    && now.getDate() === start.getDate()
    && now.getMonth() === start.getMonth()
    && now.getFullYear() > start.getFullYear();

  const todayStr = new Date().toISOString().slice(0, 10);
  const otherRole = role === "you" ? "partner" : "you";
  const myMood = data.moods?.[role]?.date === todayStr ? data.moods[role].emoji : null;
  const otherMood = data.moods?.[otherRole]?.date === todayStr ? data.moods[otherRole].emoji : null;
  const setMood = (emoji) => {
    save({ ...data, moods: { ...data.moods, [role]: { emoji, date: todayStr } } });
  };

  const handleSaveDate = () => {
    save({ ...data, startDate: tempDate });
    setIsEditingDate(false);
  };

  const handleSaveNames = () => {
    const nextYou = tempYou.trim();
    const nextPartner = tempPartner.trim();
    if (!nextYou || !nextPartner) return;

    // Le prénom affiché par l'accueil doit être synchronisé avec le prénom
    // enregistré localement, sinon l'ancien prénom revenait immédiatement.
    const nextMyName = role === "you" ? nextYou : nextPartner;
    localStorage.setItem("oamy:name", nextMyName);
    setName(nextMyName);

    save({ ...data, names: { you: nextYou, partner: nextPartner } });
    setIsEditingNames(false);
  };

  return (
    <div className="home">
      <div className="hero">
        <div className="floating"><Heart fill="currentColor" /><Heart /><Heart fill="currentColor" /></div>
        <div className="online"><span /> Votre espace est synchronisé</div>

        <div
          className="couple-name"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontFamily: '"Great Vibes", "Allura", "Brush Script MT", cursive',
            fontWeight: 400
          }}
        >
          {myName} <b>♡</b> {partnerName}
          <button
            onClick={() => { setTempYou(data.names.you || ""); setTempPartner(data.names.partner || ""); setIsEditingNames(!isEditingNames); }}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px', opacity: 0.7 }}
            title="Corriger les prénoms"
          >
            <Settings size={14} />
          </button>
        </div>

        {isEditingNames && (
          <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.15)', padding: '10px', borderRadius: '8px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Ton prénom :</label>
            <input value={tempYou} onChange={e => setTempYou(e.target.value)} style={{ color: '#000', padding: '5px', borderRadius: '4px', width: '100%', marginBottom: '8px' }} />
            <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Prénom du/de la partenaire :</label>
            <input value={tempPartner} onChange={e => setTempPartner(e.target.value)} style={{ color: '#000', padding: '5px', borderRadius: '4px', width: '100%' }} />
            <button onClick={handleSaveNames} className="primary" style={{ marginTop: '8px', padding: '4px 8px', fontSize: '0.8rem' }}>Enregistrer</button>
          </div>
        )}

        <div className="label">ensemble depuis</div>
        <div className="big">{totalDays}</div>
        <div className="days">JOURS</div>

        {/* COMPTE À REBOURS PRÉCIS (H:M:S) */}
        <div className="timer" style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '8px 0', letterSpacing: '1px' }}>
          {hours}h {minutes}m {seconds}s
        </div>

        <div className="since" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          Depuis le {fmtDate(data.startDate)}
          <button
            onClick={() => setIsEditingDate(!isEditingDate)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}
            title="Modifier la date de début"
          >
            <Calendar size={14} />
          </button>
        </div>

        {isEditingDate && (
          <div className="card-date-edit" style={{ marginTop: '12px', background: 'rgba(255,255,255,0.15)', padding: '10px', borderRadius: '8px' }}>
            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Date de rencontre :</label>
            <input type="date" value={tempDate} onChange={e => setTempDate(e.target.value)} style={{ color: '#000', padding: '4px', borderRadius: '4px' }} />
            <button onClick={handleSaveDate} className="primary" style={{ marginTop: '6px', padding: '4px 8px', fontSize: '0.8rem' }}>Enregistrer</button>
          </div>
        )}

        {isAnniversaryToday && (
          <div style={{ position: 'relative', marginTop: '14px', overflow: 'visible' }}>
            <style>{`
              @keyframes annivFloat {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                100% { transform: translateY(-46px) scale(1.35); opacity: 0; }
              }
              .anniv-heart {
                position: absolute;
                bottom: 6px;
                font-size: 1.3rem;
                animation: annivFloat 2.4s ease-in infinite;
                pointer-events: none;
              }
            `}</style>
            <div style={{
              background: 'linear-gradient(135deg,#ff9eb5,#ffd08a)', color: '#4a1030',
              padding: '10px 18px', borderRadius: '14px', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(255,120,150,0.35)'
            }}>
              <PartyPopper size={16} /> Joyeux anniversaire de couple !
            </div>
            {[...Array(8)].map((_, i) => (
              <span key={i} className="anniv-heart" style={{ left: `${6 + i * 11}%`, animationDelay: `${i * 0.3}s` }}>
                {i % 2 === 0 ? "💖" : "✨"}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="today card" style={{ cursor: 'pointer' }} onClick={() => setTab("games")}>
        <div><Sparkles size={18} /><b>Question du jour</b></div>
        <p>{getDailyQuestion(getDayKey())}</p>
        <button onClick={() => setTab("games")}>Répondre <ArrowRight size={14} /></button>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 8px' }}>😊 Humeur du jour</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {moodOptions.map(e => (
            <button
              key={e}
              onClick={() => setMood(e)}
              style={{
                fontSize: '1.3rem', padding: '4px 8px', borderRadius: '10px',
                border: myMood === e ? '2px solid #C9184A' : '1px solid #eee',
                background: myMood === e ? '#fdf2f8' : '#fff'
              }}
            >{e}</button>
          ))}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#8A5568' }}>
          {partnerName} : {otherMood ? <span style={{ fontSize: '1.1rem' }}>{otherMood}</span> : "pas encore répondu aujourd'hui"}
        </div>
      </div>

      <div className="grid4">
        <Quick icon={MessageCircleHeart} text="Écrire" onClick={() => setTab("chat")} />
        <Quick icon={Camera} text="Souvenir" onClick={() => setTab("story")} />
        <Quick icon={Gift} text="Surprise" onClick={() => setTab("story")} />
        <Quick icon={Wallet} text="Projet" onClick={() => setTab("money")} />
      </div>
    </div>
  );
}

function Quick({ icon: I, text, onClick }) {
  return <button className="quick" onClick={onClick}><I size={19} /><span>{text}</span></button>;
}

const cardThemes = [
  { emojis: "🔥  💬  😘", bg: "linear-gradient(160deg,#ffe1ea,#ffc2d6)" },
  { emojis: "✨  💌  🎵", bg: "linear-gradient(160deg,#ffe9c7,#ffd08a)" },
  { emojis: "❤️  😍  🌹", bg: "linear-gradient(160deg,#ffd6e0,#ff9eb5)" }
];

function Chat({ data, name, save }) {
  const [text, setText] = useState("");
  const [menuFor, setMenuFor] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState({ top: 0, bottom: 0 });
  const [menuTop, setMenuTop] = useState(100);
  const menuBoxRef = React.useRef(null);
  const [showCard, setShowCard] = useState(false);
  const [cardText, setCardText] = useState("");
  const [cardTheme, setCardTheme] = useState(0);
  const [revealCard, setRevealCard] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [swipe, setSwipe] = useState({ id: null, dx: 0, locked: null });
  const touchStart = React.useRef({ x: 0, y: 0 });
  const msgRefs = React.useRef({});

  const visibleMessages = data.messages.filter(m => !m.deleted && !(m.hiddenFor || []).includes(name));

  const send = () => {
    if (!text.trim()) return;
    if (editingId) {
      save({
        ...data,
        messages: data.messages.map(m => m.id === editingId ? { ...m, text: text.trim(), edited: true } : m)
      });
      setEditingId(null);
      setText("");
      return;
    }
    save({
      ...data,
      messages: [...data.messages, {
        id: uid(), from: name, text: text.trim(), date: new Date().toISOString(), type: "text",
        ...(replyTo ? {
          replyTo: {
            id: replyTo.id,
            author: replyTo.from,
            text: replyTo.type === "card" ? "💌 Carte vœux" : (replyTo.text || "")
          }
        } : {})
      }]
    });
    setText("");
    setReplyTo(null);
  };

  const startReply = (m) => {
    setReplyTo(m);
    setEditingId(null);
    setMenuFor(null);
  };

  const cancelReply = () => setReplyTo(null);

  const scrollToMessage = (id) => {
    const el = msgRefs.current[id];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background-color .3s ease";
      el.style.backgroundColor = "rgba(201,24,74,0.18)";
      setTimeout(() => { el.style.backgroundColor = ""; }, 700);
    }
  };

  // --- Swipe pour répondre (comme WhatsApp / Instagram) ---
  const onTouchStartMsg = (e, m) => {
    const t = e.touches ? e.touches[0] : e;
    touchStart.current = { x: t.clientX, y: t.clientY };
    setSwipe({ id: m.id, dx: 0, locked: null });
  };
  const onTouchMoveMsg = (e, m) => {
    if (swipe.id !== m.id) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    let locked = swipe.locked;
    if (!locked && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (locked === "x") {
      if (e.cancelable) e.preventDefault();
      const clamped = Math.max(0, Math.min(dx, 72));
      setSwipe({ id: m.id, dx: clamped, locked });
    } else if (locked === "y" && swipe.dx !== 0) {
      setSwipe({ id: m.id, dx: 0, locked });
    }
  };
  const onTouchEndMsg = (m) => {
    if (swipe.id === m.id && swipe.dx > 42) startReply(m);
    setSwipe({ id: null, dx: 0, locked: null });
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setText(m.text || "");
    setMenuFor(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setText("");
  };

  const sendCard = () => {
    if (!cardText.trim()) return;
    save({
      ...data,
      messages: [...data.messages, {
        id: uid(), from: name, date: new Date().toISOString(),
        type: "card", cardText: cardText.trim(), theme: cardTheme
      }]
    });
    setCardText("");
    setShowCard(false);
  };

  const openCard = (m) => {
    // Aperçu purement local : rien n'est sauvegardé, donc la carte reste
    // toujours scellée dans le chat pour tout le monde, à chaque fois.
    setRevealCard(m);
    setRevealing(true);
    setTimeout(() => setRevealing(false), 700);
  };

  const closeReveal = () => {
    setRevealCard(null);
  };

  const deleteForMe = (id) => {
    save({
      ...data,
      messages: data.messages.map(m => m.id === id ? { ...m, hiddenFor: [...(m.hiddenFor || []), name] } : m)
    });
    setMenuFor(null);
  };

  const retractMessage = (id) => {
    save({ ...data, messages: data.messages.filter(m => m.id !== id) });
    setMenuFor(null);
  };

  const copyMessage = (m) => {
    const value = m.type === "card" ? m.cardText : m.text;
    if (navigator.clipboard && value) navigator.clipboard.writeText(value).catch(() => {});
    setMenuFor(null);
  };

  const toggleReaction = (id, emoji) => {
    save({
      ...data,
      messages: data.messages.map(m => {
        if (m.id !== id) return m;
        const reactions = m.reactions || [];
        const mineR = reactions.find(r => r.author === name);
        let next;
        if (mineR && mineR.emoji === emoji) next = reactions.filter(r => r.author !== name);
        else if (mineR) next = reactions.map(r => r.author === name ? { ...r, emoji } : r);
        else next = [...reactions, { emoji, author: name }];
        return { ...m, reactions: next };
      })
    });
    setMenuFor(null);
  };

  const openMenu = (e, m) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchor({ top: rect.top, bottom: rect.bottom });
    setMenuFor(m.id);
  };

  const menuMessage = visibleMessages.find(m => m.id === menuFor);

  // Repositionne le menu pour qu'il reste toujours entièrement visible à l'écran :
  // au-dessus du message par défaut, en dessous si pas assez de place au-dessus,
  // avec une marge de sécurité en haut et en bas.
  React.useLayoutEffect(() => {
    if (!menuFor || !menuBoxRef.current) return;
    const menuH = menuBoxRef.current.offsetHeight;
    const vh = window.innerHeight;
    const margin = 16;
    let top = menuAnchor.top - menuH - 10;
    if (top < margin) top = menuAnchor.bottom + 10;
    top = Math.min(top, vh - menuH - margin);
    top = Math.max(top, margin);
    setMenuTop(top);
  }, [menuFor, menuAnchor]);

  return (
    <div>
      <Title title="Notre conversation" sub="Un petit espace rien qu'à vous deux." />
      <div
        className="chat card"
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
          position: 'relative', overflowY: 'auto', overscrollBehavior: 'contain',
          // Masque de défilement : les messages se "clippent" derrière une frontière
          // invisible en haut de la zone, avec un léger fondu pour un rendu progressif.
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, #000 22px, #000 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0px, #000 22px, #000 100%)'
        }}
      >
        {visibleMessages.length === 0 && <div className="empty">Commencez votre conversation ❤️</div>}
        {visibleMessages.map(m => {
          const reactions = m.reactions || [];
          const counts = {};
          reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
          const mine = m.from === name;
          const isCard = m.type === "card";

          const isSwiping = swipe.id === m.id && swipe.dx > 0;

          return (
            <div
              key={m.id}
              style={{ position: 'relative' }}
            >
              {isSwiping && (
                <div style={{
                  position: 'absolute', top: '50%', left: '6px', transform: 'translateY(-50%)',
                  opacity: Math.min(swipe.dx / 42, 1), color: '#C9184A',
                  transition: 'opacity .1s linear', pointerEvents: 'none'
                }}>
                  <Reply size={18} />
                </div>
              )}
              <div
                ref={el => { msgRefs.current[m.id] = el; }}
                className={"msg " + (mine ? "mine" : "theirs")}
                onClick={e => isCard ? openCard(m) : openMenu(e, m)}
                onTouchStart={e => onTouchStartMsg(e, m)}
                onTouchMove={e => onTouchMoveMsg(e, m)}
                onTouchEnd={() => onTouchEndMsg(m)}
                style={{
                  position: 'relative',
                  marginBottom: Object.keys(counts).length > 0 ? '12px' : undefined,
                  transform: swipe.id === m.id ? `translateX(${swipe.dx}px)` : undefined,
                  transition: swipe.id === m.id && swipe.dx > 0 ? 'none' : 'transform .2s ease',
                  touchAction: 'pan-y'
                }}
              >
              {m.replyTo && (
                <div
                  onClick={e => { e.stopPropagation(); scrollToMessage(m.replyTo.id); }}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '1px',
                    borderLeft: '3px solid ' + (mine ? 'rgba(255,255,255,0.75)' : '#C9184A'),
                    background: mine ? 'rgba(255,255,255,0.14)' : 'rgba(201,24,74,0.08)',
                    borderRadius: '6px', padding: '4px 8px', marginBottom: '5px', cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.85 }}>
                    {m.replyTo.author === name ? "Vous" : m.replyTo.author}
                  </span>
                  <span style={{
                    fontSize: '0.76rem', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis', maxWidth: '220px'
                  }}>
                    {m.replyTo.text}
                  </span>
                </div>
              )}
              {isCard ? (
                <div style={{
                  background: cardThemes[m.theme || 0].bg,
                  borderRadius: '14px',
                  padding: '18px 16px',
                  minWidth: '170px',
                  boxShadow: '0 6px 16px rgba(201,24,74,0.18)',
                  color: '#4a1030',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  position: 'relative'
                }}>
                  <button
                    onClick={e => { e.stopPropagation(); openMenu(e, m); }}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', color: '#4a1030', opacity: 0.5, padding: '4px', cursor: 'pointer' }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Mail size={20} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Carte vœux</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Appuie pour ouvrir</div>
                </div>
              ) : (
                <span>{m.text}</span>
              )}
              <small>
                {m.edited && m.type !== "card" && <span style={{ opacity: 0.7, marginRight: '4px' }}>Modifié ·</span>}
                {new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </small>

              {Object.keys(counts).length > 0 && (
                <span style={{
                  position: 'absolute', bottom: '-10px', right: mine ? 'auto' : '10px', left: mine ? '10px' : 'auto',
                  background: '#fff', border: '1px solid #f1dbe4', borderRadius: '99px', padding: '1px 7px',
                  fontSize: '0.72rem', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', whiteSpace: 'nowrap'
                }}>
                  {Object.entries(counts).map(([e, c]) => e + (c > 1 ? c : "")).join(" ")}
                </span>
              )}
              </div>
            </div>
          );
        })}
      </div>

      {revealCard && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,5,15,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={closeReveal}
        >
          <style>{`
            @keyframes cardReveal {
              0% { transform: scale(0.6) rotate(-4deg); opacity: 0; }
              60% { transform: scale(1.05) rotate(1deg); opacity: 1; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
          `}</style>
          <div
            style={{
              maxWidth: '320px', width: '100%', background: cardThemes[revealCard.theme || 0].bg,
              borderRadius: '18px', padding: '26px 20px', textAlign: 'center', color: '#4a1030',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              animation: revealing ? 'cardReveal .6s ease-out' : 'none'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{cardThemes[revealCard.theme || 0].emojis}</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>{revealCard.cardText}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.65, marginTop: '16px' }}>— {revealCard.from}</div>
            <button
              onClick={closeReveal}
              style={{ marginTop: '18px', background: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '10px', padding: '8px 20px', fontSize: '0.85rem', cursor: 'pointer', color: '#4a1030' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {menuMessage && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2500 }}
          onClick={() => setMenuFor(null)}
        >
          <div
            ref={menuBoxRef}
            style={{
              position: 'absolute',
              top: `${menuTop}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '86%',
              maxWidth: '280px',
              animation: 'popIn .14s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`
              @keyframes popIn { from { opacity:0; transform: translateX(-50%) scale(.92); } to { opacity:1; transform: translateX(-50%) scale(1); } }
            `}</style>
            <div style={{
              background: '#1c1c1e', borderRadius: '18px', padding: '10px 14px',
              display: 'flex', justifyContent: 'space-between', marginBottom: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
            }}>
              {REACTIONS.map(em => {
                const myReaction = (menuMessage.reactions || []).find(r => r.author === name);
                const active = myReaction && myReaction.emoji === em;
                return (
                  <button
                    key={em}
                    onClick={() => toggleReaction(menuMessage.id, em)}
                    style={{
                      background: active ? 'rgba(201,24,74,0.35)' : 'none',
                      border: 'none', borderRadius: '99px', fontSize: '1.3rem', cursor: 'pointer', padding: '3px 5px'
                    }}
                  >
                    {em}
                  </button>
                );
              })}
            </div>
            <div style={{ background: '#1c1c1e', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
              <button
                onClick={() => startReply(menuMessage)}
                style={{
                  width: '100%', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
                  padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                  color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                <Reply size={16} /> Répondre
              </button>
              <button
                onClick={() => copyMessage(menuMessage)}
                style={{
                  width: '100%', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
                  padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                  color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                <Copy size={16} /> Copier
              </button>
              {menuMessage.from === name && menuMessage.type !== "card" && (
                <button
                  onClick={() => startEdit(menuMessage)}
                  style={{
                    width: '100%', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
                    padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                    color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', cursor: 'pointer'
                  }}
                >
                  <Pencil size={16} /> Modifier
                </button>
              )}
              <button
                onClick={() => deleteForMe(menuMessage.id)}
                style={{
                  width: '100%', background: 'none', border: 'none', borderBottom: menuMessage.from === name ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                  color: '#ff453a', fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                <Trash2 size={16} /> Supprimer pour moi
              </button>
              {menuMessage.from === name && (
                <button
                  onClick={() => retractMessage(menuMessage.id)}
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                    color: '#ff453a', fontSize: '0.9rem', cursor: 'pointer'
                  }}
                >
                  <X size={16} /> Retirer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCard && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,5,15,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowCard(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '340px', width: '100%', background: cardThemes[cardTheme].bg, position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCard(false)}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#4a1030', opacity: 0.6, cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
            <div style={{ fontSize: '1.5rem', textAlign: 'center', margin: '4px 0 12px' }}>{cardThemes[cardTheme].emojis}</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
              {cardThemes.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setCardTheme(i)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: t.bg, border: cardTheme === i ? '2px solid #C9184A' : '1px solid #fff', cursor: 'pointer' }}
                />
              ))}
            </div>
            <textarea
              value={cardText}
              onChange={e => setCardText(e.target.value)}
              placeholder="Écris ta carte vœux…"
              style={{ minHeight: '100px', background: 'rgba(255,255,255,0.5)' }}
            />
            <div style={{ fontSize: '0.7rem', opacity: 0.6, margin: '4px 0 12px', color: '#4a1030' }}>Signé : {name}</div>
            <button className="primary" onClick={sendCard} style={{ width: '100%' }}>Envoyer</button>
          </div>
        </div>
      )}

      {editingId && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fdf2f8', border: '1px solid #f1dbe4', borderRadius: '10px',
          padding: '8px 12px', margin: '0 0 8px', fontSize: '0.82rem', color: '#C9184A'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Pencil size={14} /> Modification du message
          </span>
          <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: '#C9184A', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {!editingId && replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fdf2f8', border: '1px solid #f1dbe4', borderLeft: '3px solid #C9184A', borderRadius: '10px',
          padding: '8px 12px', margin: '0 0 8px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#C9184A' }}>
              <Reply size={14} /> {replyTo.from === name ? "Vous" : replyTo.from}
            </span>
            <span style={{
              fontSize: '0.82rem', color: '#8A5568', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {replyTo.type === "card" ? "💌 Carte vœux" : replyTo.text}
            </span>
          </div>
          <button onClick={cancelReply} style={{ background: 'none', border: 'none', color: '#C9184A', cursor: 'pointer', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="composer">
        <button onClick={() => setShowCard(true)} title="Carte vœux" style={{ background: 'none', border: 'none', color: '#C9184A', padding: '0 6px', cursor: 'pointer' }}>
          <Gift size={20} />
        </button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Message" />
        <button onClick={send}><Send size={17} /></button>
      </div>
    </div>
  );
}

function Story({ data, save, name }) {
  const [note, setNote] = useState(""), [goal, setGoal] = useState("");
  const [viewPhoto, setViewPhoto] = useState(null);
  const [secretText, setSecretText] = useState("");
  const [revealedIds, setRevealedIds] = useState([]);
  const addNote = () => {
    if (!note.trim()) return;
    save({ ...data, notes: [{ id: uid(), text: note, date: new Date().toISOString(), author: name, reactions: [] }, ...data.notes] });
    setNote("");
  };
  const addSecret = () => {
    if (!secretText.trim()) return;
    save({ ...data, secrets: [{ id: uid(), text: secretText.trim(), date: new Date().toISOString(), author: name }, ...data.secrets] });
    setSecretText("");
  };
  const reveal = (id) => setRevealedIds([...revealedIds, id]);
  const removeSecret = (id) => save({ ...data, secrets: data.secrets.filter(s => s.id !== id) });
  const addGoal = () => {
    if (!goal.trim()) return;
    save({ ...data, goals: [...data.goals, { id: uid(), text: goal, done: false }] });
    setGoal("");
  };
  const toggle = id => save({ ...data, goals: data.goals.map(g => g.id === id ? { ...g, done: !g.done } : g) });

  const toggleReaction = (noteId, emoji) => {
    save({
      ...data,
      notes: data.notes.map(n => {
        if (n.id !== noteId) return n;
        const reactions = n.reactions || [];
        const mine = reactions.find(r => r.author === name);
        let next;
        if (mine && mine.emoji === emoji) next = reactions.filter(r => r.author !== name);
        else if (mine) next = reactions.map(r => r.author === name ? { ...r, emoji } : r);
        else next = [...reactions, { emoji, author: name }];
        return { ...n, reactions: next };
      })
    });
  };

  const [uploading, setUploading] = useState(false);
  const onPhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 900;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        save({ ...data, memories: [{ id: uid(), url: compressed, date: new Date().toISOString(), author: name }, ...data.memories] });
        setUploading(false);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const removePhoto = id => save({ ...data, memories: data.memories.filter(m => m.id !== id) });

  return (
    <div>
      <Title title="Notre histoire" sub="Les petits chapitres qui deviennent de grands souvenirs." />

      <div className="card">
        <h3>📷 Nos souvenirs en photo</h3>
        <label className="primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
          <Camera size={16} /> {uploading ? "Envoi en cours…" : "Ajouter une photo"}
          <input type="file" accept="image/*" onChange={onPhoto} disabled={uploading} style={{ display: 'none' }} />
        </label>
        {data.memories.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '12px' }}>
            {data.memories.map(m => (
              <div key={m.id} style={{ position: 'relative' }}>
                <img
                  src={m.url}
                  alt=""
                  onClick={() => setViewPhoto(m.url)}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                />
                <button
                  onClick={() => removePhoto(m.id)}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >
                  <X size={12} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        )}
        {!data.memories.length && <div className="empty" style={{ marginTop: '10px' }}>Aucune photo pour l'instant.</div>}
      </div>

      {viewPhoto && (
        <div
          onClick={() => setViewPhoto(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <button
            onClick={() => setViewPhoto(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color="#fff" />
          </button>
          <img src={viewPhoto} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '10px' }} />
        </div>
      )}

      <div className="timeline">
        {data.notes.map(n => {
          const reactions = n.reactions || [];
          const mine = reactions.find(r => r.author === name);
          const counts = {};
          reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
          return (
            <div className="timeline-item" key={n.id}>
              <div className="dot"><Heart size={12} fill="currentColor" /></div>
              <div className="card">
                <small><b>{n.author || "Anonyme"}</b> · {new Date(n.date).toLocaleDateString("fr-FR")}</small>
                <p>{n.text}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                  {REACTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => toggleReaction(n.id, e)}
                      style={{
                        border: mine && mine.emoji === e ? '1.5px solid #ec4899' : '1px solid #eee',
                        background: mine && mine.emoji === e ? '#fdf2f8' : '#fff',
                        borderRadius: '100px',
                        padding: '2px 8px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <span>{e}</span>
                      {counts[e] > 0 && <span style={{ fontSize: '0.7rem', color: '#888' }}>{counts[e]}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {!data.notes.length && <div className="empty card">Votre histoire commence ici. Ajoutez votre premier souvenir.</div>}
      </div>

      <div className="card">
        <h3>🔒 Boîte à secrets</h3>
        <p style={{ fontSize: '0.8rem', color: '#8A5568', margin: '0 0 10px' }}>Une note cachée à découvrir en tapant dessus.</p>
        {data.secrets.map(s => {
          const isRevealed = revealedIds.includes(s.id);
          return (
            <div
              key={s.id}
              onClick={() => !isRevealed && reveal(s.id)}
              style={{
                padding: '12px', borderRadius: '10px', marginBottom: '8px',
                background: isRevealed ? '#fdf2f8' : 'linear-gradient(135deg, #6E2338, #2B0F1A)',
                color: isRevealed ? '#4A1B2A' : '#FBF3EC',
                cursor: isRevealed ? 'default' : 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px'
              }}
            >
              {isRevealed ? (
                <div>
                  <small style={{ opacity: 0.6 }}>{s.author || "Anonyme"}</small>
                  <p style={{ margin: '2px 0 0' }}>{s.text}</p>
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem' }}>💌 Un secret t'attend… tape pour révéler</span>
              )}
              {isRevealed && (
                <button onClick={(e) => { e.stopPropagation(); removeSecret(s.id); }} style={{ background: 'none', border: 'none', color: '#bbb', flexShrink: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
        <textarea value={secretText} onChange={e => setSecretText(e.target.value)} placeholder="Écris un secret ou un compliment surprise…" />
        <button className="primary" onClick={addSecret}><Lock size={15} /> Cacher ce secret</button>
      </div>

      <div className="card">
        <h3>💌 Lettre / mot doux</h3>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Écris quelque chose que l'autre pourra relire plus tard…" />
        <button className="primary" onClick={addNote}><Plus size={15} /> Ajouter à notre histoire</button>
      </div>
      <div className="card">
        <h3>🌱 Nos rêves</h3>
        {data.goals.map(g => (
          <button className={"goal " + (g.done ? "done" : "")} key={g.id} onClick={() => toggle(g.id)}>
            <span>{g.done ? <Check size={15} /> : <span className="circle" />}</span>
            {g.text}
          </button>
        ))}
        <div className="inline">
          <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Un rêve à réaliser…" />
          <button onClick={addGoal}><Plus size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function Agenda({ data, save }) {
  const [importantTitle, setImportantTitle] = useState("");
  const [importantDate, setImportantDate] = useState("");

  const [programTitle, setProgramTitle] = useState("");
  const [programDate, setProgramDate] = useState("");
  const [programTime, setProgramTime] = useState("");
  const [programPlace, setProgramPlace] = useState("");
  const [programNote, setProgramNote] = useState("");

  const [editingLoc, setEditingLoc] = useState(false);
  const [locLabel, setLocLabel] = useState(data.location?.label || "");
  const [locAddress, setLocAddress] = useState(data.location?.address || "");

  const importantDates = data.importantDates || [];
  const programs = data.programs || [];

  const addImportantDate = () => {
    if (!importantTitle.trim() || !importantDate) return;
    save({
      ...data,
      importantDates: [
        ...importantDates,
        { id: uid(), title: importantTitle.trim(), date: importantDate }
      ]
    });
    setImportantTitle("");
    setImportantDate("");
  };

  const removeImportantDate = (id) => {
    save({
      ...data,
      importantDates: importantDates.filter(item => item.id !== id)
    });
  };

  const addProgram = () => {
    if (!programTitle.trim() || !programDate) return;

    save({
      ...data,
      programs: [
        ...programs,
        {
          id: uid(),
          title: programTitle.trim(),
          date: programDate,
          time: programTime,
          place: programPlace.trim(),
          note: programNote.trim()
        }
      ]
    });

    setProgramTitle("");
    setProgramDate("");
    setProgramTime("");
    setProgramPlace("");
    setProgramNote("");
  };

  const removeProgram = (id) => {
    save({
      ...data,
      programs: programs.filter(item => item.id !== id)
    });
  };

  const saveLocation = () => {
    if (!locLabel.trim() && !locAddress.trim()) return;
    save({
      ...data,
      location: {
        label: locLabel.trim(),
        address: locAddress.trim(),
        updatedAt: new Date().toISOString()
      }
    });
    setEditingLoc(false);
  };

  const clearLocation = () => {
    save({ ...data, location: null });
    setLocLabel("");
    setLocAddress("");
  };

  const sortedImportantDates = [...importantDates].sort((a, b) =>
    (a.date || "").localeCompare(b.date || "")
  );

  const sortedPrograms = [...programs].sort((a, b) => {
    const aKey = `${a.date || ""} ${a.time || ""}`;
    const bKey = `${b.date || ""} ${b.time || ""}`;
    return aKey.localeCompare(bKey);
  });

  return (
    <div>
      <Title title="Notre agenda" sub="Les dates et les programmes qui comptent pour nous." />

      {/* ==================== DATES IMPORTANTES ==================== */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span style={{ fontSize: "1.2rem" }}>❤️</span>
          <div>
            <h3 style={{ margin: 0 }}>Dates importantes</h3>
            <small style={{ color: "#8A5568" }}>Les anniversaires et les dates à ne jamais oublier.</small>
          </div>
        </div>

        <input
          value={importantTitle}
          onChange={e => setImportantTitle(e.target.value)}
          placeholder="Ex. Notre anniversaire, anniversaire de Joseph…"
        />
        <input
          type="date"
          value={importantDate}
          onChange={e => setImportantDate(e.target.value)}
        />
        <button className="primary" onClick={addImportantDate}>
          <Plus size={15} /> Ajouter une date importante
        </button>
      </div>

      <div className="list">
        {sortedImportantDates.map(item => (
          <div className="row card" key={item.id}>
            <Calendar size={18} />
            <div style={{ flex: 1 }}>
              <b>{item.title}</b>
              <small>{fmtDate(item.date)}</small>
            </div>
            <button
              className="icon"
              onClick={() => removeImportantDate(item.id)}
              title="Supprimer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {!sortedImportantDates.length && (
          <div className="empty card">
            Aucune date importante ajoutée pour l'instant. ❤️
          </div>
        )}
      </div>

      {/* ==================== PROGRAMMES ==================== */}
      <div className="card" style={{ marginTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span style={{ fontSize: "1.2rem" }}>📅</span>
          <div>
            <h3 style={{ margin: 0 }}>Nos programmes</h3>
            <small style={{ color: "#8A5568" }}>Les sorties, rendez-vous et activités prévus ensemble.</small>
          </div>
        </div>

        <input
          value={programTitle}
          onChange={e => setProgramTitle(e.target.value)}
          placeholder="Ex. Dîner, sortie, voyage, rendez-vous…"
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <input
            type="date"
            value={programDate}
            onChange={e => setProgramDate(e.target.value)}
          />
          <input
            type="time"
            value={programTime}
            onChange={e => setProgramTime(e.target.value)}
          />
        </div>

        <input
          value={programPlace}
          onChange={e => setProgramPlace(e.target.value)}
          placeholder="Lieu / adresse (facultatif)"
        />

        <textarea
          value={programNote}
          onChange={e => setProgramNote(e.target.value)}
          placeholder="Détails du programme (facultatif)…"
          rows={3}
        />

        <button className="primary" onClick={addProgram}>
          <Plus size={15} /> Ajouter au programme
        </button>
      </div>

      <div className="list">
        {sortedPrograms.map(item => (
          <div className="row card" key={item.id} style={{ alignItems: "flex-start" }}>
            <Calendar size={18} style={{ marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <b>{item.title}</b>
              <small>
                {fmtDate(item.date)}
                {item.time ? ` · ${item.time}` : ""}
              </small>
              {item.place && (
                <small style={{ marginTop: 3 }}>📍 {item.place}</small>
              )}
              {item.note && (
                <small style={{ marginTop: 3 }}>{item.note}</small>
              )}
            </div>
            <button
              className="icon"
              onClick={() => removeProgram(item.id)}
              title="Supprimer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {!sortedPrograms.length && (
          <div className="empty card">
            Aucun programme prévu pour le moment. 📅
          </div>
        )}
      </div>

      {/* ==================== PROCHAINE DESTINATION ==================== */}
      {!editingLoc && data.location ? (
        <div style={{
          position: "relative",
          borderRadius: "18px",
          padding: "18px",
          background: "linear-gradient(135deg, #6E2338 0%, #4A1626 55%, #2B0F1A 100%)",
          color: "#FBF3EC",
          marginTop: "14px",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(227,168,87,0.35), rgba(227,168,87,0))"
          }} />

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#E9B9C4"
          }}>
            <MapPin size={14} /> Notre prochaine destination
          </div>

          <div style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            marginTop: "8px",
            color: "#F3D9B1"
          }}>
            {data.location.label || "Destination"}
          </div>

          {data.location.address && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
              marginTop: "4px",
              color: "#E9B9C4"
            }}>
              <MapPin size={13} /> {data.location.address}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <a
              href={data.location.address
                ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(data.location.address)
                : "#"}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                textAlign: "center",
                padding: "9px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #E3A857, #C9184A)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none"
              }}
            >
              Ouvrir dans Maps
            </a>

            <button
              onClick={() => {
                setLocLabel(data.location.label || "");
                setLocAddress(data.location.address || "");
                setEditingLoc(true);
              }}
              style={{
                padding: "9px 12px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: "0.85rem"
              }}
            >
              Modifier
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: "14px" }}>
          <h3>📍 Notre prochaine destination</h3>
          <input
            value={locLabel}
            onChange={e => setLocLabel(e.target.value)}
            placeholder="Ex. Restaurant, chez Maman…"
          />
          <input
            value={locAddress}
            onChange={e => setLocAddress(e.target.value)}
            placeholder="Adresse ou lieu"
          />

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button className="primary" onClick={saveLocation}>
              <Check size={15} /> Enregistrer
            </button>
            {data.location && (
              <button className="secondary" onClick={() => setEditingLoc(false)}>
                Annuler
              </button>
            )}
            {data.location && (
              <button className="secondary" onClick={clearLocation}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Money({ data, save }) {
  const [label, setLabel] = useState(""), [amount, setAmount] = useState(""), [type, setType] = useState("expense"), [currency, setCurrency] = useState("USD");

  const calc = (cur) => {
    const list = data.transactions.filter(t => (t.currency || "USD") === cur);
    const income = list.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = list.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, total: income - expense };
  };
  const usd = calc("USD");
  const cdf = calc("CDF");

  const add = () => {
    const n = Number(amount);
    if (!label || !n) return;
    save({ ...data, transactions: [{ id: uid(), label, amount: n, type, currency, date: new Date().toISOString() }, ...data.transactions] });
    setLabel(""); setAmount("");
  };
  const remove = id => save({ ...data, transactions: data.transactions.filter(t => t.id !== id) });

  const fmt = (n, cur) => n.toLocaleString("fr-FR") + " " + (cur === "USD" ? "$" : "FC");

  return (
    <div>
      <Title title="Nos projets & finances" sub="Construire ensemble, petit à petit." />

      <div style={{ display: 'flex', gap: '10px' }}>
        <div className="moneyHero" style={{ flex: 1 }}>
          <small>Solde USD</small>
          <strong>{fmt(usd.total, "USD")}</strong>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px', fontSize: '0.8rem' }}>
            <span style={{ color: '#4ade80' }}>+ {fmt(usd.income, "USD")}</span>
            <span style={{ color: '#f87171' }}>- {fmt(usd.expense, "USD")}</span>
          </div>
        </div>
        <div className="moneyHero" style={{ flex: 1 }}>
          <small>Solde CDF</small>
          <strong>{fmt(cdf.total, "CDF")}</strong>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '8px', fontSize: '0.8rem' }}>
            <span style={{ color: '#4ade80' }}>+ {fmt(cdf.income, "CDF")}</span>
            <span style={{ color: '#f87171' }}>- {fmt(cdf.expense, "CDF")}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex. Épargne voyage, Restaurant…" />
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant" />

        <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
          <button
            onClick={() => setCurrency("USD")}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: currency === "USD" ? '2px solid #6366f1' : '1px solid #ddd', background: currency === "USD" ? '#eef2ff' : '#fff', color: '#3730a3', fontWeight: 'bold' }}
          >USD ($)</button>
          <button
            onClick={() => setCurrency("CDF")}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: currency === "CDF" ? '2px solid #6366f1' : '1px solid #ddd', background: currency === "CDF" ? '#eef2ff' : '#fff', color: '#3730a3', fontWeight: 'bold' }}
          >Franc congolais (FC)</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
          <button
            onClick={() => setType("income")}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: type === "income" ? '2px solid #4ade80' : '1px solid #ddd', background: type === "income" ? '#f0fdf4' : '#fff', color: '#166534', fontWeight: 'bold' }}
          >+ Entrée</button>
          <button
            onClick={() => setType("expense")}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: type === "expense" ? '2px solid #f87171' : '1px solid #ddd', background: type === "expense" ? '#fef2f2' : '#fff', color: '#991b1b', fontWeight: 'bold' }}
          >- Dépense</button>
        </div>

        <button className="primary" onClick={add}><Plus size={15} /> Ajouter</button>
      </div>

      {data.transactions.map(t => (
        <div className="row card" key={t.id}>
          <Wallet size={18} style={{ color: t.type === "income" ? '#22c55e' : '#ef4444' }} />
          <div><b>{t.label}</b><small>{t.currency || "USD"}</small></div>
          <b style={{ color: t.type === "income" ? '#22c55e' : '#ef4444' }}>{t.type === "income" ? "+" : "-"}{fmt(t.amount, t.currency || "USD")}</b>
          <button className="icon" onClick={() => remove(t.id)}><Trash2 size={15} /></button>
        </div>
      ))}
    </div>
  );
}

function Games({ data, save, name, role }) {
  const [mode, setMode] = useState("menu");
  const [card, setCard] = useState(truthOrDare[0]);
  const [wyr, setWyr] = useState(wouldYouRather[0]);
  const [answer, setAnswer] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});

  const typedLower = (name || "").trim().toLowerCase();
  const partnerName = ((data.names.you || "").trim().toLowerCase() === typedLower)
    ? (data.names.partner || "ton/ta partenaire")
    : (data.names.you || "ton/ta partenaire");

  // Résout le nom d'un auteur à partir de son rôle stable (you/partner),
  // pour qu'il reste à jour même si le prénom a changé depuis.
  const resolveAuthorName = (entry) => {
    if (entry.authorRole === "you") return data.names.you || entry.author || "Anonyme";
    if (entry.authorRole === "partner") return data.names.partner || entry.author || "Anonyme";
    return entry.author || "Anonyme";
  };
  const isMine = (entry) => entry.authorRole ? entry.authorRole === role : entry.author === name;


  const [wheelOptions, setWheelOptions] = useState(["Pizza", "Sushi", "Pâtes", "Salade", "Burger", "Tacos"]);
  const [wheelInput, setWheelInput] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [winner, setWinner] = useState(null);

  const [outCategory, setOutCategory] = useState(null);
  const [outIdea, setOutIdea] = useState(null);

  const nextCard = () => setCard(truthOrDare[Math.floor(Math.random() * truthOrDare.length)]);
  const nextWyr = () => setWyr(wouldYouRather[Math.floor(Math.random() * wouldYouRather.length)]);

  const addWheelOption = () => {
    if (!wheelInput.trim()) return;
    setWheelOptions([...wheelOptions, wheelInput.trim()]);
    setWheelInput("");
  };
  const removeWheelOption = (i) => setWheelOptions(wheelOptions.filter((_, idx) => idx !== i));

  const spinWheel = () => {
    if (wheelOptions.length < 2 || spinning) return;
    setSpinning(true);
    setWinner(null);
    let count = 0;
    const totalTicks = 18 + Math.floor(Math.random() * 10);
    const interval = setInterval(() => {
      setHighlighted(h => (h + 1) % wheelOptions.length);
      count++;
      if (count >= totalTicks) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * wheelOptions.length);
        setHighlighted(finalIndex);
        setWinner(wheelOptions[finalIndex]);
        setSpinning(false);
      }
    }, 90);
  };

  const pickOuting = (cat) => {
    const list = dateIdeasCategories[cat];
    setOutCategory(cat);
    setOutIdea(list[Math.floor(Math.random() * list.length)]);
  };
  const anotherOuting = () => pickOuting(outCategory);
  const markOutingDone = () => {
    if (!outIdea) return;
    save({ ...data, outingsDone: [{ id: uid(), idea: outIdea, category: outCategory, date: new Date().toISOString() }, ...data.outingsDone] });
    setOutIdea(null); setOutCategory(null);
    setMode("menu");
  };

  const saveAnswer = (prompt, text) => {
    if (!text || !text.trim()) return;
    save({ ...data, gameAnswers: [{ id: uid(), prompt, answer: text, date: new Date().toISOString(), author: name, authorRole: role, comments: [] }, ...data.gameAnswers] });
    setAnswer("");
    setMode("menu");
  };

  const addComment = (postId) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    save({
      ...data,
      gameAnswers: data.gameAnswers.map(p => p.id === postId
        ? { ...p, comments: [...(p.comments || []), { id: uid(), author: name, authorRole: role, text }] }
        : p)
    });
    setCommentDrafts({ ...commentDrafts, [postId]: "" });
  };

  return (
    <div>
      <Title title="Jeux à deux" sub="Riez, parlez et découvrez-vous encore." />
      {mode === "menu" && (
        <div className="grid4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button className="quick" onClick={() => setMode("question")}><Sparkles size={19} /><span>Question du jour</span></button>
          <button className="quick" onClick={() => { setMode("truth"); nextCard(); }}><span style={{ fontSize: '19px', lineHeight: 1 }}>🎯</span><span>Action ou Vérité</span></button>
          <button className="quick" onClick={() => { setMode("wyr"); nextWyr(); }}><HelpCircle size={19} /><span>Tu préfères… ?</span></button>
          <button className="quick" onClick={() => { setMode("wheel"); setWinner(null); }}><RefreshCw size={19} /><span>Roue des décisions</span></button>
          <button className="quick" onClick={() => { setMode("outings"); setOutCategory(null); setOutIdea(null); }}><Lightbulb size={19} /><span>Idées de sorties</span></button>
        </div>
      )}
      {mode === "question" && (() => {
        const q = getDailyQuestion(getDayKey());
        const myAnswer = data.gameAnswers.find(a => a.prompt === q && isMine(a));
        const partnerAnswer = data.gameAnswers.find(a => a.prompt === q && !isMine(a));
        return (
          <div className="game card">
            <Sparkles size={22} />
            <div className="tag">QUESTION DU JOUR</div>
            <h3>{q}</h3>
            {myAnswer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0', width: '100%' }}>
                <div style={{ background: '#fdf2f8', borderRadius: '10px', padding: '8px 10px', fontSize: '0.85rem', textAlign: 'left' }}>
                  <b>Toi :</b> {myAnswer.answer}
                </div>
                <div style={{ background: '#f7eef2', borderRadius: '10px', padding: '8px 10px', fontSize: '0.85rem', textAlign: 'left' }}>
                  <b>{partnerName} :</b> {partnerAnswer ? partnerAnswer.answer : "pas encore répondu"}
                </div>
              </div>
            ) : (
              <>
                <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Votre réponse…" />
                <button className="primary" onClick={() => saveAnswer(q, answer)}><Check size={15} /> Garder notre réponse</button>
              </>
            )}
            <button className="secondary" onClick={() => setMode("menu")}>← Retour</button>
          </div>
        );
      })()}
      {mode === "truth" && (
        <div className="game card">
          <span style={{ fontSize: '22px', lineHeight: 1 }}>🎯</span>
          <div className="tag">{card.type.toUpperCase()}</div>
          <h3>{card.text}</h3>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Votre réponse ou ressenti…" />
          <button className="primary" onClick={() => saveAnswer(card.text, answer)}><Check size={15} /> Garder</button>
          <button className="secondary" onClick={nextCard}><RefreshCw size={15} /> Nouvelle carte</button>
          <button className="secondary" onClick={() => setMode("menu")}>← Retour</button>
        </div>
      )}
      {mode === "wyr" && (
        <div className="game card">
          <HelpCircle size={22} />
          <div className="tag">TU PRÉFÈRES…</div>
          <h3>{wyr[0]} <span style={{ opacity: 0.5 }}>ou</span> {wyr[1]}</h3>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Dites ce que vous avez choisi et pourquoi…" />
          <button className="primary" onClick={() => saveAnswer(wyr[0] + " ou " + wyr[1], answer)}><Check size={15} /> Garder notre choix</button>
          <button className="secondary" onClick={nextWyr}><RefreshCw size={15} /> Nouveau dilemme</button>
          <button className="secondary" onClick={() => setMode("menu")}>← Retour</button>
        </div>
      )}

      {mode === "wheel" && (
        <div className="game card">
          <RefreshCw size={22} />
          <div className="tag">ROUE DES DÉCISIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '12px 0' }}>
            {wheelOptions.map((opt, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '10px',
                  border: highlighted === i ? '2px solid #C9184A' : '1px solid #eee',
                  background: winner === opt ? '#fdf2f8' : (highlighted === i && spinning ? '#fff7ed' : '#fff'),
                  fontWeight: winner === opt ? 700 : 400,
                  transition: 'background 0.1s ease'
                }}
              >
                <span>{winner === opt ? "🎉 " : ""}{opt}</span>
                {!spinning && <button onClick={() => removeWheelOption(i)} style={{ background: 'none', border: 'none', padding: 0, color: '#bbb' }}><X size={14} /></button>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <input value={wheelInput} onChange={e => setWheelInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addWheelOption()} placeholder="Ajouter un choix…" style={{ flex: 1 }} />
            <button onClick={addWheelOption} style={{ padding: '0 12px' }}><Plus size={16} /></button>
          </div>
          <button className="primary" onClick={spinWheel} disabled={spinning || wheelOptions.length < 2}>
            {spinning ? "Ça tourne…" : "Faire tourner la roue"}
          </button>
          <button className="secondary" onClick={() => setMode("menu")}>← Retour</button>
        </div>
      )}

      {mode === "outings" && (
        <div className="game card">
          <Lightbulb size={22} />
          <div className="tag">IDÉES DE SORTIES</div>
          {!outCategory ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '12px 0' }}>
              {Object.keys(dateIdeasCategories).map(cat => (
                <button key={cat} className="quick" onClick={() => pickOuting(cat)}><span>{cat}</span></button>
              ))}
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.75rem', opacity: 0.6, margin: '10px 0 4px' }}>{outCategory}</div>
              <h3>{outIdea}</h3>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button className="primary" onClick={markOutingDone}><Check size={15} /> On l'a fait !</button>
                <button className="secondary" onClick={anotherOuting}><RefreshCw size={15} /> Une autre idée</button>
              </div>
            </>
          )}
          <button className="secondary" onClick={() => setMode("menu")} style={{ marginTop: '10px' }}>← Retour</button>
          {data.outingsDone.length > 0 && (
            <div style={{ marginTop: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Déjà réalisées ({data.outingsDone.length})</div>
              {data.outingsDone.slice(0, 6).map(o => (
                <div key={o.id} style={{ fontSize: '0.8rem', color: '#8A5568', marginBottom: '3px' }}>✔️ {o.idea}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "menu" && data.gameAnswers.length > 0 && (
        <div style={{ marginTop: '18px' }}>
          <h3 style={{ fontSize: '0.95rem', margin: '0 0 10px 4px' }}>Notre fil de réponses</h3>
          {data.gameAnswers.map(p => (
            <div className="card" key={p.id} style={{ marginBottom: '10px' }}>
              <small style={{ opacity: 0.6 }}>{resolveAuthorName(p)} a répondu</small>
              <p style={{ fontWeight: 600, margin: '2px 0 4px' }}>{p.prompt}</p>
              <p style={{ margin: 0 }}>{p.answer}</p>
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                {(p.comments || []).map(c => (
                  <div key={c.id} style={{ fontSize: '0.82rem', marginBottom: '6px' }}>
                    <b>{resolveAuthorName(c)}</b> {c.text}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    value={commentDrafts[p.id] || ""}
                    onChange={e => setCommentDrafts({ ...commentDrafts, [p.id]: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && addComment(p.id)}
                    placeholder="Ajouter un commentaire…"
                    style={{ flex: 1, fontSize: '0.8rem', padding: '7px 10px' }}
                  />
                  <button onClick={() => addComment(p.id)} style={{ padding: '0 12px' }}><Send size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function More({ data, save, logout, room, name, onOpenPacks }) {
  const v = getDailyVerseIndex();
  const toggle = () => save({
    ...data,
    savedVerses: data.savedVerses.includes(verses[v][0])
      ? data.savedVerses.filter(x => x !== verses[v][0])
      : [...data.savedVerses, verses[v][0]]
  });

  const [wishItem, setWishItem] = useState("");
  const addWish = () => {
    if (!wishItem.trim()) return;
    save({ ...data, wishlist: [{ id: uid(), text: wishItem.trim(), done: false }, ...data.wishlist] });
    setWishItem("");
  };
  const toggleWish = (id) => save({ ...data, wishlist: data.wishlist.map(w => w.id === id ? { ...w, done: !w.done } : w) });
  const removeWish = (id) => save({ ...data, wishlist: data.wishlist.filter(w => w.id !== id) });

  const [capsuleText, setCapsuleText] = useState("");
  const [capsuleDate, setCapsuleDate] = useState("");
  const todayStr = new Date().toISOString().slice(0, 10);
  const addCapsule = () => {
    if (!capsuleText.trim() || !capsuleDate) return;
    save({ ...data, capsules: [{ id: uid(), text: capsuleText.trim(), unlockDate: capsuleDate, author: name }, ...data.capsules] });
    setCapsuleText(""); setCapsuleDate("");
  };
  const removeCapsule = (id) => save({ ...data, capsules: data.capsules.filter(c => c.id !== id) });

  const toggleChallenge = (text) => {
    const already = data.challengesDone.includes(text);
    save({ ...data, challengesDone: already ? data.challengesDone.filter(t => t !== text) : [...data.challengesDone, text] });
  };

  return (
    <div>
      <Title title="Plus pour nous" sub="Des petits détails qui rendent l'histoire spéciale." />

      <button
        onClick={onOpenPacks}
        className="card"
        style={{
          display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
          background: 'linear-gradient(135deg,#fdf2f8,#ffe9c7)', border: '1px solid #f1dbe4', cursor: 'pointer'
        }}
      >
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#C9184A' }}>
          <Sparkles size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>✨ Packs spéciaux</div>
          <div style={{ fontSize: '0.76rem', color: '#8A5568' }}>Saint-Valentin, demande en mariage, anniversaire…</div>
        </div>
        <ArrowRight size={16} style={{ opacity: 0.4 }} />
      </button>

      <div className="card verse bigVerse">
        <BookOpenText size={22} />
        <p>« {verses[v][1]} »</p>
        <b>{verses[v][0]}</b>
        <div className="actions">
          <button onClick={toggle}>
            <Star size={15} fill={data.savedVerses.includes(verses[v][0]) ? "currentColor" : "none"} /> Favori
          </button>
        </div>
      </div>

      <div className="card">
        <h3>🎁 Notre wishlist</h3>
        {data.wishlist.map(w => (
          <div key={w.id} className="row" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
            <button onClick={() => toggleWish(w.id)} style={{ background: 'none', border: 'none', padding: 0 }}>
              {w.done ? <Check size={16} color="#22c55e" /> : <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #ccc', display: 'inline-block' }} />}
            </button>
            <span style={{ flex: 1, textDecoration: w.done ? 'line-through' : 'none', opacity: w.done ? 0.5 : 1 }}>{w.text}</span>
            <button onClick={() => removeWish(w.id)} style={{ background: 'none', border: 'none', color: '#bbb' }}><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="inline" style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          <input value={wishItem} onChange={e => setWishItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addWish()} placeholder="Un cadeau, un voyage, un projet…" />
          <button onClick={addWish}><Plus size={16} /></button>
        </div>
      </div>

      <div className="card">
        <h3>⏳ Capsule temporelle</h3>
        <p style={{ fontSize: '0.8rem', color: '#8A5568', margin: '0 0 10px' }}>Un message qui se déverrouille à une date future.</p>
        {data.capsules.map(c => {
          const unlocked = c.unlockDate <= todayStr;
          return (
            <div key={c.id} style={{ padding: '10px', borderRadius: '10px', marginBottom: '8px', background: unlocked ? '#fdf2f8' : '#f3f0f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              {unlocked ? (
                <div><small style={{ opacity: 0.6 }}>{c.author || "Anonyme"}</small><p style={{ margin: '2px 0 0' }}>{c.text}</p></div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#8A5568' }}>🔒 Se déverrouille le {fmtDate(c.unlockDate)}</div>
              )}
              <button onClick={() => removeCapsule(c.id)} style={{ background: 'none', border: 'none', color: '#bbb', flexShrink: 0 }}><X size={14} /></button>
            </div>
          );
        })}
        <textarea value={capsuleText} onChange={e => setCapsuleText(e.target.value)} placeholder="Le message à découvrir plus tard…" />
        <input type="date" value={capsuleDate} onChange={e => setCapsuleDate(e.target.value)} style={{ marginBottom: '8px' }} />
        <button className="primary" onClick={addCapsule}><Clock3 size={15} /> Sceller la capsule</button>
      </div>

      <div className="card">
        <h3>🏆 Défis de la semaine</h3>
        <p style={{ fontSize: '0.76rem', color: '#8A5568', marginTop: '-6px' }}>Nouveaux défis chaque lundi ✨</p>
        {getWeeklyChallenges(getWeekKey()).map(c => (
          <div key={c} className="row" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
            <button onClick={() => toggleChallenge(c)} style={{ background: 'none', border: 'none', padding: 0 }}>
              {data.challengesDone.includes(c) ? <Check size={16} color="#22c55e" /> : <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #ccc', display: 'inline-block' }} />}
            </button>
            <span style={{ flex: 1, textDecoration: data.challengesDone.includes(c) ? 'line-through' : 'none', opacity: data.challengesDone.includes(c) ? 0.5 : 1 }}>{c}</span>
          </div>
        ))}
        <div style={{ fontSize: '0.8rem', color: '#8A5568', marginTop: '8px' }}>
          {data.challengesDone.length} / {getWeeklyChallenges(getWeekKey()).length} défis relevés cette semaine 🎉
        </div>
      </div>

      <div className="card settings">
        <div><BellRing size={16} /> Rappels</div>
        <div><Users size={16} /> Code de votre couple : <b style={{ letterSpacing: '1px' }}>{room}</b></div>

        {/* BOUTON DÉCONNEXION OFFICIEL */}
        <button
          onClick={logout}
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '8px',
            background: '#fff0f0',
            color: '#e53e3e',
            border: '1px solid #ffa3a3',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          <LogOut size={16} /> Se déconnecter de ce compte
        </button>
      </div>
    </div>
  );
}

function PacksModal({ data, save, name, setTab, onClose }) {
  const [view, setView] = useState("menu");
  const todayObj = new Date();
  const isFeb14 = todayObj.getMonth() === 1 && todayObj.getDate() === 14;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(20,5,15,0.62)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto', borderRadius: '22px 22px 0 0', margin: 0, position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', opacity: 0.6, cursor: 'pointer' }}>
          <X size={20} />
        </button>

        {view === "menu" && (
          <>
            <h2 style={{ marginTop: 0 }}>✨ Packs spéciaux</h2>
            <p style={{ fontSize: '0.85rem', color: '#8A5568', marginTop: '-6px' }}>Des expériences prêtes à l'emploi pour marquer les grandes occasions.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <PackTile icon={Heart} title="Pack Saint-Valentin" desc={isFeb14 ? "Disponible aujourd'hui 💗" : "S'active chaque 14 février"} onClick={() => setView("valentine")} locked={!isFeb14} />
              <PackTile icon={Gem} title="Pack Demande en mariage" desc="Compte à rebours, animation et souvenir de la demande" onClick={() => setView("proposal")} />
              <PackTile icon={Cake} title="Pack Anniversaire" desc="Carte, défis, idées cadeaux et capsule surprise" onClick={() => setView("birthday")} />
            </div>
          </>
        )}

        {view === "valentine" && <PackValentine data={data} save={save} name={name} setTab={setTab} onClose={onClose} isFeb14={isFeb14} back={() => setView("menu")} />}
        {view === "proposal" && <PackProposal data={data} save={save} name={name} setTab={setTab} onClose={onClose} back={() => setView("menu")} />}
        {view === "birthday" && <PackBirthday data={data} save={save} name={name} setTab={setTab} onClose={onClose} back={() => setView("menu")} />}
      </div>
    </div>
  );
}

function PackTile({ icon: I, title, desc, onClick, locked }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', border: '1px solid #f1dbe4', background: locked ? '#faf6f7' : '#fff', textAlign: 'left', cursor: 'pointer' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#C9184A' }}>
        <I size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{title}</div>
        <div style={{ fontSize: '0.76rem', color: '#8A5568' }}>{desc}</div>
      </div>
      <ArrowRight size={16} style={{ opacity: 0.4 }} />
    </button>
  );
}

function PackValentine({ data, save, name, setTab, onClose, isFeb14, back }) {
  const [msg, setMsg] = useState("");
  const [capsuleText, setCapsuleText] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizIdx, setQuizIdx] = useState(0);

  const sendMessage = () => {
    if (!msg.trim()) return;
    save({ ...data, packs: { ...data.packs, valentineMessages: [{ id: uid(), text: msg.trim(), author: name, date: new Date().toISOString() }, ...data.packs.valentineMessages] } });
    setMsg("");
  };

  const toggleChallenge = (c) => {
    const done = data.packs.valentineChallengesDone.includes(c);
    save({ ...data, packs: { ...data.packs, valentineChallengesDone: done ? data.packs.valentineChallengesDone.filter(x => x !== c) : [...data.packs.valentineChallengesDone, c] } });
  };

  const saveQuizAnswer = () => {
    if (!quizAnswer.trim()) return;
    save({ ...data, gameAnswers: [{ id: uid(), prompt: "💗 " + valentineQuiz[quizIdx], answer: quizAnswer, date: new Date().toISOString(), author: name, comments: [] }, ...data.gameAnswers] });
    setQuizAnswer("");
    setQuizIdx((quizIdx + 1) % valentineQuiz.length);
  };

  const sealCapsule = () => {
    if (!capsuleText.trim()) return;
    const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 1);
    save({ ...data, capsules: [{ id: uid(), text: capsuleText.trim(), unlockDate: nextYear.toISOString().slice(0, 10), author: name, tag: "valentine" }, ...data.capsules] });
    setCapsuleText("");
  };

  if (!isFeb14) {
    return (
      <div>
        <button onClick={back} style={{ background: 'none', border: 'none', color: '#C9184A', marginBottom: '10px', cursor: 'pointer' }}>← Retour</button>
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <Heart size={34} color="#C9184A" fill="#C9184A" />
          <h3>Pack Saint-Valentin</h3>
          <p style={{ fontSize: '0.85rem', color: '#8A5568' }}>Ce pack s'active automatiquement chaque 14 février pour une expérience 100% romantique. Revenez ce jour-là 💗</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={back} style={{ background: 'none', border: 'none', color: '#C9184A', marginBottom: '10px', cursor: 'pointer' }}>← Retour</button>
      <h3 style={{ margin: '0 0 4px' }}>💗 Pack Saint-Valentin</h3>
      <p style={{ fontSize: '0.8rem', color: '#8A5568', marginTop: 0 }}>Joyeuse Saint-Valentin ! Voici votre expérience du jour.</p>

      <div className="card">
        <h4 style={{ margin: '0 0 8px' }}>💌 Message d'amour du jour</h4>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Écris un mot doux pour aujourd'hui…" />
        <button className="primary" onClick={sendMessage} style={{ marginTop: '6px' }}>Envoyer</button>
        {data.packs.valentineMessages.slice(0, 4).map(m => (
          <div key={m.id} style={{ fontSize: '0.82rem', marginTop: '8px', borderTop: '1px solid #f3e6ea', paddingTop: '8px' }}>
            <b>{m.author}</b> : {m.text}
          </div>
        ))}
      </div>

      <div className="card">
        <h4 style={{ margin: '0 0 8px' }}>🎯 Défis du couple</h4>
        {valentineChallenges.map(c => (
          <div key={c} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '5px 0' }}>
            <button onClick={() => toggleChallenge(c)} style={{ background: 'none', border: 'none', padding: 0 }}>
              {data.packs.valentineChallengesDone.includes(c) ? <Check size={16} color="#22c55e" /> : <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #ccc', display: 'inline-block' }} />}
            </button>
            <span style={{ flex: 1, fontSize: '0.85rem', textDecoration: data.packs.valentineChallengesDone.includes(c) ? 'line-through' : 'none', opacity: data.packs.valentineChallengesDone.includes(c) ? 0.5 : 1 }}>{c}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h4 style={{ margin: '0 0 8px' }}>🎲 Petit jeu : le quiz de l'amour</h4>
        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{valentineQuiz[quizIdx]}</p>
        <textarea value={quizAnswer} onChange={e => setQuizAnswer(e.target.value)} placeholder="Ta réponse…" />
        <button className="primary" onClick={saveQuizAnswer} style={{ marginTop: '6px' }}>Garder la réponse</button>
      </div>

      <div className="card">
        <h4 style={{ margin: '0 0 8px' }}>⏳ Capsule « ouvre ce message plus tard »</h4>
        <p style={{ fontSize: '0.78rem', color: '#8A5568' }}>Se déverrouille automatiquement le 14 février prochain.</p>
        <textarea value={capsuleText} onChange={e => setCapsuleText(e.target.value)} placeholder="Le message à découvrir l'an prochain…" />
        <button className="primary" onClick={sealCapsule} style={{ marginTop: '6px' }}><Clock3 size={15} /> Sceller</button>
      </div>
    </div>
  );
}

function PackProposal({ data, save, name, setTab, onClose, back }) {
  const p = data.packs.proposal;
  const [dateVal, setDateVal] = useState(p.date || "");
  const [place, setPlace] = useState(p.place || "");
  const [message, setMessage] = useState(p.message || "");
  const [showAnim, setShowAnim] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const savePlan = () => save({ ...data, packs: { ...data.packs, proposal: { ...p, date: dateVal, place, message } } });

  const target = dateVal ? new Date(dateVal + "T00:00:00") : null;
  const diff = target ? Math.max(0, target - now) : 0;
  const days = target ? Math.floor(diff / 86400000) : null;

  const confirmAsked = () => {
    save({
      ...data,
      packs: { ...data.packs, proposal: { ...p, date: dateVal, place, message, askedDate: new Date().toISOString() } },
      notes: [{ id: uid(), text: `💍 Notre demande en mariage — ${place || "un lieu inoubliable"} : ${message || "un oui pour la vie."}`, date: new Date().toISOString(), author: name, reactions: [] }, ...data.notes]
    });
    setShowAnim(false);
  };

  return (
    <div>
      <button onClick={back} style={{ background: 'none', border: 'none', color: '#C9184A', marginBottom: '10px', cursor: 'pointer' }}>← Retour</button>
      <h3 style={{ margin: '0 0 4px' }}>💍 Pack Demande en mariage</h3>
      <p style={{ fontSize: '0.8rem', color: '#8A5568', marginTop: 0 }}>Préparez et gardez le souvenir du grand moment.</p>

      <div className="card">
        <h4 style={{ margin: '0 0 8px' }}>📅 Date, lieu & message</h4>
        <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} style={{ marginBottom: '8px' }} />
        <input value={place} onChange={e => setPlace(e.target.value)} placeholder="Lieu prévu…" style={{ marginBottom: '8px' }} />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Le message que tu veux dire…" />
        <button className="primary" onClick={savePlan} style={{ marginTop: '6px' }}>Enregistrer</button>
      </div>

      {dateVal && !p.askedDate && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 8px' }}>⏳ Compte à rebours</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#C9184A' }}>{days}</div>
          <div style={{ fontSize: '0.75rem', color: '#8A5568' }}>jour(s) avant le grand moment</div>
        </div>
      )}

      {!p.askedDate ? (
        <button className="primary" onClick={() => setShowAnim(true)} style={{ width: '100%', marginTop: '6px' }}><Gem size={16} /> Faire la demande maintenant</button>
      ) : (
        <div className="card" style={{ textAlign: 'center', background: '#fdf2f8' }}>
          <Gem size={26} color="#C9184A" />
          <p style={{ fontWeight: 700 }}>Elle/il a dit oui ! 💍</p>
          <p style={{ fontSize: '0.8rem', color: '#8A5568' }}>Conservé dans votre Histoire.</p>
        </div>
      )}

      {showAnim && (
        <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(160deg,#4a1030,#C9184A)', zIndex: 4000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '24px', textAlign: 'center' }}>
          <style>{`
            @keyframes ringFloat { 0%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-14px) rotate(8deg);} 100%{transform:translateY(0) rotate(0deg);} }
            .ring-anim { animation: ringFloat 1.6s ease-in-out infinite; }
          `}</style>
          <div className="ring-anim"><Gem size={54} /></div>
          <h2 style={{ margin: '16px 0 8px' }}>Un moment inoubliable…</h2>
          <p style={{ maxWidth: '320px', opacity: 0.9 }}>{message || "Ce jour restera gravé pour toujours."}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button className="primary" onClick={confirmAsked}>💍 Oui !</button>
            <button className="secondary" onClick={() => setShowAnim(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PackBirthday({ data, save, name, setTab, onClose, back }) {
  const b = data.packs.birthday;
  const [personName, setPersonName] = useState(b.personName || "");
  const [dateVal, setDateVal] = useState(b.date || "");
  const [cardText, setCardText] = useState(b.cardText || "");
  const [giftInput, setGiftInput] = useState("");
  const [capsuleText, setCapsuleText] = useState("");

  const savePlan = () => save({ ...data, packs: { ...data.packs, birthday: { ...b, personName, date: dateVal, cardText } } });

  const addGift = () => {
    if (!giftInput.trim()) return;
    save({ ...data, packs: { ...data.packs, birthday: { ...b, giftIdeas: [...b.giftIdeas, { id: uid(), text: giftInput.trim() }] } } });
    setGiftInput("");
  };
  const removeGift = (id) => save({ ...data, packs: { ...data.packs, birthday: { ...b, giftIdeas: b.giftIdeas.filter(g => g.id !== id) } } });

  const toggleChallenge = (c) => {
    const done = b.challengesDone.includes(c);
    save({ ...data, packs: { ...data.packs, birthday: { ...b, challengesDone: done ? b.challengesDone.filter(x => x !== c) : [...b.challengesDone, c] } } });
  };

  const sealCapsule = () => {
    if (!capsuleText.trim() || !dateVal) return;
    const nextYear = new Date(dateVal + "T00:00:00"); nextYear.setFullYear(nextYear.getFullYear() + 1);
    save({ ...data, capsules: [{ id: uid(), text: capsuleText.trim(), unlockDate: nextYear.toISOString().slice(0, 10), author: name, tag: "birthday" }, ...data.capsules] });
    setCapsuleText("");
  };

  const now = new Date();
  let daysLeft = null;
  if (dateVal) {
    const [, m, d] = dateVal.split("-").map(Number);
    let next = new Date(now.getFullYear(), m - 1, d);
    if (next < now) next = new Date(now.getFullYear() + 1, m - 1, d);
    daysLeft = Math.ceil((next - now) / 86400000);
  }

  return (
    <div>
      <button onClick={back} style={{ background: 'none', border: 'none', color: '#C9184A', marginBottom: '10px', cursor: 'pointer' }}>← Retour</button>
      <h3 style={{ margin: '0 0 4px' }}>🎂 Pack Anniversaire</h3>

      <div className="card">
        <h4 style={{ margin: '0 0 8px' }}>🎉 Infos</h4>
        <input value={personName} onChange={e => setPersonName(e.target.value)} placeholder="Qui fête son anniversaire ?" style={{ marginBottom: '8px' }} />
        <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} style={{ marginBottom: '8px' }} />
        <textarea value={cardText} onChange={e => setCardText(e.target.value)} placeholder="Message de la carte d'anniversaire…" />
        <button className="primary" onClick={savePlan} style={{ marginTop: '6px' }}>Enregistrer</button>
        {daysLeft !== null && <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#8A5568' }}>⏳ {daysLeft} jour(s) avant le jour J</div>}
      </div>

      {cardText && (
        <div className="card" style={{ background: 'linear-gradient(160deg,#ffe1ea,#ffd08a)' }}>
          <div style={{ fontSize: '1.3rem' }}>🎂 🎈 🎁</div>
          <p style={{ fontWeight: 600, margin: '8px 0 0' }}>{cardText}</p>
        </div>
      )}

      <div className="card">
        <h4 style={{ margin: '0 0 8px' }}>🎁 Idées cadeaux</h4>
        {b.giftIdeas.map(g => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <span style={{ flex: 1, fontSize: '0.85rem' }}>{g.text}</span>
            <button onClick={() => removeGift(g.id)} style={{ background: 'none', border: 'none', color: '#bbb' }}><Trash2 size={14} /></button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          <input value={giftInput} onChange={e => setGiftInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addGift()} placeholder="Ajouter une idée…" />
          <button onClick={addGift}><Plus size={16} /></button>
        </div>
      </div>

      <div className="card">
        <h4 style={{ margin: '0 0 8px' }}>🏆 Défis romantiques</h4>
        {birthdayChallenges.map(c => (
          <div key={c} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '5px 0' }}>
            <button onClick={() => toggleChallenge(c)} style={{ background: 'none', border: 'none', padding: 0 }}>
              {b.challengesDone.includes(c) ? <Check size={16} color="#22c55e" /> : <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #ccc', display: 'inline-block' }} />}
            </button>
            <span style={{ flex: 1, fontSize: '0.85rem', textDecoration: b.challengesDone.includes(c) ? 'line-through' : 'none', opacity: b.challengesDone.includes(c) ? 0.5 : 1 }}>{c}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h4 style={{ margin: '0 0 8px' }}>⏳ Capsule à ouvrir l'année prochaine</h4>
        <textarea value={capsuleText} onChange={e => setCapsuleText(e.target.value)} placeholder="Le message pour l'année prochaine…" />
        <button className="primary" onClick={sealCapsule} style={{ marginTop: '6px' }} disabled={!dateVal}><Clock3 size={15} /> Sceller</button>
      </div>
    </div>
  );
}


