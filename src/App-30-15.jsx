import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Heart, Home, MessageCircleHeart, Calendar, Wallet, Gamepad2, BookOpenText,
  Sparkles, Send, Camera, Gift, Check, Copy, LogOut, Users, Clock3,
  Plus, Trash2, Star, RefreshCw, Lock, ArrowRight, X, BellRing, Settings,
  MapPin, HelpCircle, Lightbulb, Cake, Gem, PartyPopper, ListTodo,
  MessageSquareText, Library, Search, Mail, Pencil, MoreVertical, Reply,
  Compass, Eye, Flame, Music, Ticket
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
  wheelOptions: ["Pizza", "Sushi", "Pâtes", "Salade", "Burger", "Tacos"],
  wheelWinner: null,
  events: [],
  importantDates: [],
  programs: [],
  notes: [],
  goals: [],
  transactions: [],
  score: { you: 0, partner: 0 },
  savedVerses: [],
  quizResults: [],
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
    birthday: {
      tier: "simple", personName: "", date: "", age: "", cardText: "", letterText: "",
      giftIdeas: [], challengesDone: [], reasons: [], song: { title: "", artist: "", link: "" },
      featuredMemoryIds: [], virtualGiftsOpened: [], timeline: []
    },
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

// Séparateur de date façon messagerie moderne : "Aujourd'hui", "Hier", ou une date lisible.
function formatDaySeparator(dateStr) {
  const that = new Date(dateStr); that.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - that) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return that.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long",
    year: that.getFullYear() !== today.getFullYear() ? "numeric" : undefined
  });
}

// Sur iPhone/iPad, on ouvre nativement Apple Plans ; partout ailleurs, Google Maps.
function getMapsUrl(address) {
  if (!address) return "#";
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent || "");
  return isIOS
    ? "https://maps.apple.com/?q=" + encodeURIComponent(address)
    : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
}

function getDailyQuestion(dayKey) {
  const daysSinceEpoch = Math.floor(new Date(dayKey + "T00:00:00").getTime() / 86400000);
  const idx = ((daysSinceEpoch % questions.length) + questions.length) % questions.length;
  return questions[idx];
}

function getDailyTip(dayKey) {
  const daysSinceEpoch = Math.floor(new Date(dayKey + "T00:00:00").getTime() / 86400000);
  const idx = ((daysSinceEpoch % relationshipTips.length) + relationshipTips.length) % relationshipTips.length;
  return relationshipTips[idx];
}

function computeStreak(gameAnswers) {
  const days = new Set(gameAnswers.map(a => (a.date || "").slice(0, 10)));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
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
  const [gamesJump, setGamesJump] = useState(null);
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
        {tab === "home" && <HomeScreen data={data} name={name} role={role} setName={setName} setTab={setTab} save={save} setGamesJump={setGamesJump} />}
        {tab === "chat" && <Chat data={data} name={name} save={save} />}
        {tab === "story" && <Story data={data} save={save} name={name} />}
        {tab === "agenda" && <Agenda data={data} save={save} />}
        {tab === "money" && <Money data={data} save={save} />}
        {tab === "games" && <Games data={data} save={save} name={name} role={role} onOpenPacks={() => setShowPacks(true)} jumpTo={gamesJump} onConsumeJump={() => setGamesJump(null)} />}
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
    ["games", "Découvrir", Compass],
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

function HomeScreen({ data, name, role, setName, setTab, save, setGamesJump }) {
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

      <div className="today card" style={{ cursor: 'pointer' }} onClick={() => { setGamesJump("question"); setTab("games"); }}>
        <div><Sparkles size={18} /><b>Question du jour</b></div>
        <p>{getDailyQuestion(getDayKey())}</p>
        <button onClick={() => { setGamesJump("question"); setTab("games"); }}>Répondre <ArrowRight size={14} /></button>
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
  const msgRefs = React.useRef({});

  // --- Champ de saisie multiligne : grandit jusqu'à une hauteur max, puis défile en interne ---
  const MAX_TEXTAREA_HEIGHT = 100;
  const textareaRef = React.useRef(null);
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = next + "px";
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [text]);

  // --- Scroll : la zone de messages défile seule, le composer ne bouge jamais ---
  const chatScrollRef = React.useRef(null);
  const bottomRef = React.useRef(null);
  const isNearBottomRef = React.useRef(true);
  const prevLenRef = React.useRef(0);
  const firstRenderRef = React.useRef(true);

  const visibleMessages = data.messages.filter(m => !m.deleted && !(m.hiddenFor || []).includes(name));

  const handleScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  React.useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const last = visibleMessages[visibleMessages.length - 1];
    const grew = visibleMessages.length > prevLenRef.current;
    const mineJustSent = grew && last && last.from === name;

    if (firstRenderRef.current) {
      // Ouverture du chat : on saute directement en bas, sans animation.
      el.scrollTop = el.scrollHeight;
      firstRenderRef.current = false;
    } else if (grew && (mineJustSent || isNearBottomRef.current)) {
      // On ne ramène l'utilisateur en bas que s'il vient d'écrire lui-même,
      // ou s'il était déjà proche du bas — jamais s'il relit d'anciens messages.
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    prevLenRef.current = visibleMessages.length;
  }, [visibleMessages.length]);

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

  // Regroupe les messages avec un séparateur de date généré automatiquement dès
  // que le jour change — jamais à saisir à la main.
  let lastDayKey = null;

  return (
    <div>
      <Title title="Notre conversation" sub="Un petit espace rien qu'à vous deux." />

      <style>{`
        .oamy-chat-shell {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          /* Hauteur adaptée au mobile : dvh avec repli progressif pour les
             navigateurs qui ne le supportent pas encore. */
          height: calc(100vh - 230px);
          height: calc(100svh - 230px);
          height: calc(100dvh - 230px);
          min-height: 360px;
        }
        .oamy-chat-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          /* Espace tampon en haut : le fondu se déploie dans cette zone vide
             au repos, pour ne jamais couper le tout premier message. Il ne
             "mange" du vrai contenu qu'une fois qu'on a réellement défilé. */
          padding-top: 22px;
          /* Fondu de défilement : les messages se clippent derrière une
             frontière invisible en haut de la zone, jamais sur le composer. */
          -webkit-mask-image: linear-gradient(to bottom, transparent 0px, #000 22px, #000 100%);
          mask-image: linear-gradient(to bottom, transparent 0px, #000 22px, #000 100%);
        }
        .oamy-chat-composer-wrap {
          flex: 0 0 auto;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .oamy-day-sep {
          text-align: center;
          margin: 12px 0 8px;
          color: #c98ba3;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        /* Bloc de citation ("Répondre") : compact, intégré à la bulle, jamais
           un gros bloc séparé. Classes blindées en !important pour qu'aucun
           style externe (ex. un style générique appliqué aux <span> dans .msg)
           ne puisse plus jamais le déformer. */
        .oamy-quote-box {
          display: block !important;
          background: #fdf2f8 !important;
          border: none !important;
          border-left: 3px solid #C9184A !important;
          box-shadow: none !important;
          border-radius: 7px !important;
          padding: 3px 8px !important;
          margin: 0 0 4px !important;
          cursor: pointer !important;
        }
        .oamy-quote-author, .oamy-quote-text {
          display: block !important;
          background: none !important;
          border: none !important;
          border-radius: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100% !important;
          line-height: 1.3 !important;
        }
        .oamy-quote-author {
          font-size: 0.68rem !important;
          font-weight: 700 !important;
          color: #C9184A !important;
        }
        .oamy-quote-text {
          font-size: 0.74rem !important;
          font-weight: 400 !important;
          color: #6b4657 !important;
        }
        .oamy-reply-banner {
          display: flex !important; align-items: center !important; justify-content: space-between !important;
          background: #fdf2f8 !important; border: 1px solid #f1dbe4 !important; border-left: 3px solid #C9184A !important;
          border-radius: 10px !important; padding: 7px 12px !important; margin: 6px 8px 0 !important;
        }
        .oamy-reply-banner .oamy-quote-author-row {
          display: flex !important; align-items: center !important; gap: 6px !important;
        }
        .oamy-reply-banner .oamy-quote-author, .oamy-reply-banner .oamy-quote-text {
          max-width: none !important;
        }
        @keyframes cardReveal {
          0% { transform: scale(0.6) rotate(-4deg); opacity: 0; }
          60% { transform: scale(1.05) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes popIn { from { opacity:0; transform: translateX(-50%) scale(.92); } to { opacity:1; transform: translateX(-50%) scale(1); } }
      `}</style>

      <div className="chat card oamy-chat-shell">
        <div className="oamy-chat-messages" ref={chatScrollRef} onScroll={handleScroll}>
          {visibleMessages.length === 0 && <div className="empty">Commencez votre conversation ❤️</div>}
          {visibleMessages.map(m => {
            const reactions = m.reactions || [];
            const counts = {};
            reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
            const mine = m.from === name;
            const isCard = m.type === "card";
            const dayKey = (m.date || "").slice(0, 10);
            const showSeparator = dayKey && dayKey !== lastDayKey;
            if (showSeparator) lastDayKey = dayKey;

            return (
              <React.Fragment key={m.id}>
                {showSeparator && <div className="oamy-day-sep">{formatDaySeparator(m.date)}</div>}
                <div
                  ref={el => { msgRefs.current[m.id] = el; }}
                  className={"msg " + (mine ? "mine" : "theirs")}
                  onClick={e => isCard ? openCard(m) : openMenu(e, m)}
                  style={{
                    position: 'relative', marginBottom: Object.keys(counts).length > 0 ? '18px' : '8px',
                    background: isCard ? undefined : (mine ? '#C9184A' : '#f6e1ea'),
                    color: isCard ? undefined : (mine ? '#fff' : '#4a1030')
                  }}
                >
                  {m.replyTo && (
                    <div
                      className="oamy-quote-box"
                      onClick={e => { e.stopPropagation(); scrollToMessage(m.replyTo.id); }}
                    >
                      <div className="oamy-quote-author">
                        {m.replyTo.author === name ? "Vous" : m.replyTo.author}
                      </div>
                      <div className="oamy-quote-text">
                        {m.replyTo.text}
                      </div>
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
              </React.Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="oamy-chat-composer-wrap">
          {editingId && (
            <div className="oamy-reply-banner">
              <div className="oamy-quote-author oamy-quote-author-row">
                <Pencil size={14} /> Modification du message
              </div>
              <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: '#C9184A', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          )}

          {!editingId && replyTo && (
            <div className="oamy-reply-banner">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                <div className="oamy-quote-author oamy-quote-author-row">
                  <Reply size={14} /> {replyTo.from === name ? "Vous" : replyTo.from}
                </div>
                <div className="oamy-quote-text" style={{ color: '#8A5568' }}>
                  {replyTo.type === "card" ? "💌 Carte vœux" : replyTo.text}
                </div>
              </div>
              <button onClick={cancelReply} style={{ background: 'none', border: 'none', color: '#C9184A', cursor: 'pointer', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>
          )}

          <div
            className="composer"
            style={{
              display: 'flex', alignItems: 'flex-end', gap: '8px',
              padding: '6px 8px', margin: '8px',
              background: '#fff', border: '1px solid #f1dbe4', borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(201,24,74,0.06)', minHeight: '44px', boxSizing: 'border-box'
            }}
          >
            <button
              onClick={() => setShowCard(true)}
              title="Carte vœux"
              style={{
                background: '#C9184A', border: 'none', color: '#fff', opacity: 1,
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 6px rgba(201,24,74,0.35)',
                marginBottom: '3px'
              }}
            >
              <Gift size={17} />
            </button>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Message"
              rows={1}
              style={{
                flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                fontSize: '0.92rem', padding: '7px 0', lineHeight: 1.3, color: '#4a1030',
                resize: 'none', fontFamily: 'inherit', maxHeight: MAX_TEXTAREA_HEIGHT + 'px'
              }}
            />
            <button
              onClick={send}
              style={{
                background: '#C9184A', border: 'none', color: '#fff', width: '32px', height: '32px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, marginBottom: '3px'
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {revealCard && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,5,15,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={closeReveal}
        >
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
              href={getMapsUrl(data.location.address)}
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

const relationshipTips = [
  "Un simple « merci » dit à voix haute pour un petit geste du quotidien renforce plus le couple qu'un grand cadeau rare.",
  "Quand vous n'êtes pas d'accord, essayez de reformuler ce que l'autre vient de dire avant de répondre : ça évite bien des malentendus.",
  "Réservez 10 minutes par jour sans téléphone, juste pour parler de votre journée.",
  "Un compliment sincère et précis marque plus qu'un compliment vague — dites exactement ce que vous admirez.",
  "Après une dispute, une main posée sur l'épaule peut désamorcer bien plus vite qu'un long discours.",
  "Demandez « comment puis-je t'aider aujourd'hui ? » une fois par semaine, sans attendre que ce soit la crise.",
  "Se souvenir d'un petit détail que l'autre a mentionné en passant (un souci au travail, une envie) montre qu'on écoute vraiment.",
  "Riez de vos propres erreurs ensemble : l'humour partagé rapproche plus qu'on ne le pense.",
  "Prévoir un rendez-vous à deux dans l'agenda, même simple, l'empêche de disparaître dans le quotidien.",
  "Dire ce qu'on ressent avec « je » plutôt que « tu » désamorce beaucoup de tensions : « je me sens seul·e » plutôt que « tu m'ignores ».",
  "Un câlin de plus de 20 secondes a un effet apaisant mesurable — essayez ce soir.",
  "Célébrez les petites victoires de l'autre, pas seulement les grandes : ça compte tout autant.",
  "Prendre des nouvelles de la famille ou des amis de l'autre montre un intérêt qui compte énormément.",
  "Avant de donner un conseil, demandez si l'autre veut être écouté·e ou aidé·e — ce n'est pas toujours pareil.",
  "Un mot doux glissé dans un message en pleine journée peut changer le ton de toute une soirée."
];


const discoverTopics = [
  {
    key: "communication", label: "Communication", Icon: MessageSquareText, color: "#8b5cf6",
    desc: "Améliore ta façon de communiquer avec ton/ta partenaire.",
    prompts: [
      "Qu'est-ce qui te met le plus à l'aise pour me parler d'un problème ?",
      "Comment préfères-tu recevoir une critique : directement ou en douceur ?",
      "Y a-t-il un sujet qu'on évite et qu'on devrait aborder ensemble ?",
      "Qu'est-ce que je pourrais mieux écouter chez toi ?",
      "Qu'est-ce qui te fait sentir vraiment entendu·e ?",
      "Quel est le meilleur moment pour te parler d'un sujet difficile ?",
      "Qu'est-ce que tu aimerais que je te demande plus souvent ?",
      "Comment sais-tu que je t'ai vraiment compris·e ?"
    ]
  },
  {
    key: "conflit", label: "Conflit", Icon: Heart, color: "#ef4444",
    desc: "Apprends nos secrets pour mieux gérer les conflits et rebondir.",
    prompts: [
      "Qu'est-ce qui t'aide à te calmer pendant une dispute ?",
      "Préfères-tu qu'on prenne une pause ou qu'on règle les choses tout de suite ?",
      "Qu'est-ce que je fais qui n'aide pas quand on est en conflit ?",
      "Comment sais-tu que je me suis vraiment excusé·e ?",
      "Quelle dispute passée nous a le plus appris ?",
      "Qu'est-ce qui t'aide à pardonner plus vite ?",
      "Préfères-tu qu'on écrive nos griefs ou qu'on en parle directement ?",
      "Qu'est-ce qu'on pourrait faire différemment la prochaine fois ?"
    ]
  },
  {
    key: "intimite", label: "Intimité & Complicité", Icon: Flame, color: "#f97316",
    desc: "Rends votre complicité et votre vie intime plus épanouissantes.",
    prompts: [
      "Qu'est-ce qui te fait te sentir désiré·e ?",
      "Quel petit geste au quotidien ravive notre complicité ?",
      "Qu'aimerais-tu qu'on essaie ensemble, qu'on n'a jamais fait ?",
      "Qu'est-ce qui te met le plus dans l'ambiance ?",
      "Comment aimerais-tu qu'on garde la flamme sur le long terme ?",
      "Qu'est-ce qui te fait rire dans notre complicité ?",
      "Quel souvenir intime te fait encore sourire aujourd'hui ?",
      "Qu'aimerais-tu qu'on fasse plus souvent, juste tous les deux ?"
    ]
  },
  {
    key: "connexion", label: "Connexion", Icon: Users, color: "#22c55e",
    desc: "Renforce ta connexion avec ton/ta partenaire.",
    prompts: [
      "Qu'est-ce qui te fait sentir le plus proche de moi ?",
      "Quel moment récent nous a rapprochés ?",
      "Qu'est-ce qu'on pourrait faire plus souvent ensemble ?",
      "Qu'est-ce qui te manque le plus quand on est occupés chacun de son côté ?",
      "Comment aimerais-tu qu'on célèbre nos petites victoires ?",
      "Qu'est-ce qui nous rapproche le plus dans notre routine actuelle ?",
      "Quel projet à deux te ferait plaisir cette année ?",
      "Qu'est-ce que tu admires le plus dans notre relation ?"
    ]
  },
  {
    key: "confiance", label: "Confiance", Icon: Lock, color: "#0ea5e9",
    desc: "Cultive une confiance solide et durable dans votre couple.",
    prompts: [
      "Qu'est-ce qui renforce ta confiance en moi au quotidien ?",
      "Y a-t-il quelque chose que tu n'as jamais osé me dire ?",
      "Comment puis-je te rassurer quand tu doutes de nous ?",
      "Qu'est-ce que la loyauté signifie pour toi dans un couple ?",
      "Qu'est-ce qui t'a fait te sentir en sécurité avec moi la première fois ?",
      "Qu'est-ce que je peux faire pour renforcer encore ta confiance ?",
      "Y a-t-il une promesse qu'on devrait se refaire aujourd'hui ?",
      "Qu'est-ce qui te rassure le plus sur notre avenir ensemble ?"
    ]
  },
  {
    key: "souvenirs", label: "Souvenirs", Icon: Camera, color: "#eab308",
    desc: "Revivez et créez de nouveaux souvenirs ensemble.",
    prompts: [
      "Quel est ton souvenir préféré de nous deux ?",
      "Quel a été notre meilleur voyage ou sortie ?",
      "Quel moment aimerais-tu revivre exactement pareil ?",
      "Quelle photo de nous préfères-tu et pourquoi ?",
      "Quel souvenir aimerais-tu qu'on crée ensemble cette année ?",
      "Quelle chanson te rappelle un souvenir de nous ?",
      "Quel a été notre moment le plus drôle ?",
      "Si on refaisait notre tout premier rendez-vous, qu'est-ce qu'on garderait pareil ?"
    ]
  }
];

const loveLanguages = [
  { key: "mots", label: "Paroles valorisantes", emoji: "💬", desc: "Les mots doux, les compliments sincères et les encouragements sont ce qui te touche le plus." },
  { key: "temps", label: "Moments de qualité", emoji: "⏰", desc: "Rien ne vaut plus pour toi qu'une attention pleine et entière, sans distraction." },
  { key: "cadeaux", label: "Cadeaux", emoji: "🎁", desc: "Les petites attentions matérielles sont pour toi une vraie preuve d'amour." },
  { key: "services", label: "Services rendus", emoji: "🤝", desc: "Ce qu'on fait concrètement pour toi compte plus que ce qu'on te dit." },
  { key: "contact", label: "Contact physique", emoji: "🤗", desc: "La proximité physique est ton langage principal pour ressentir l'amour." }
];

const loveQuizQuestions = [
  {
    text: "Après une longue journée, qu'est-ce qui te ferait le plus de bien ?",
    options: [
      { key: "mots", text: "Que je te dise à quel point je suis fier/fière de toi" },
      { key: "temps", text: "Qu'on passe du temps ensemble, juste tous les deux" },
      { key: "cadeaux", text: "Que je te ramène ta friandise préférée" },
      { key: "services", text: "Que je m'occupe du dîner pour toi" },
      { key: "contact", text: "Un bon câlin qui dure" }
    ]
  },
  {
    text: "Comment préfères-tu être rassuré·e quand tu doutes de toi ?",
    options: [
      { key: "mots", text: "Par des mots sincères et encourageants" },
      { key: "temps", text: "En passant un moment rien que tous les deux pour en parler" },
      { key: "cadeaux", text: "Par un petit geste symbolique" },
      { key: "services", text: "En me voyant t'aider concrètement à avancer" },
      { key: "contact", text: "Par une proximité physique rassurante" }
    ]
  },
  {
    text: "Qu'est-ce qui te touche le plus pour un anniversaire ?",
    options: [
      { key: "mots", text: "Une carte avec des mots qui viennent du cœur" },
      { key: "temps", text: "Une journée entière consacrée à nous deux" },
      { key: "cadeaux", text: "Un cadeau qui montre que j'ai pensé à toi" },
      { key: "services", text: "Que je prenne en charge toute l'organisation" },
      { key: "contact", text: "Des câlins et de la tendresse toute la journée" }
    ]
  },
  {
    text: "Qu'est-ce qui te manque le plus quand on est loin l'un de l'autre ?",
    options: [
      { key: "mots", text: "Entendre ta voix me dire des mots doux" },
      { key: "temps", text: "Nos moments à deux, sans distraction" },
      { key: "cadeaux", text: "Recevoir une petite surprise de ta part" },
      { key: "services", text: "Que tu m'aides dans mon quotidien" },
      { key: "contact", text: "Ton contact physique, tes bras" }
    ]
  },
  {
    text: "Après une dispute, qu'est-ce qui t'aide le plus à te sentir apaisé·e ?",
    options: [
      { key: "mots", text: "Que tu me dises clairement ce que tu ressens et que tu t'excuses" },
      { key: "temps", text: "Qu'on prenne le temps d'en reparler calmement" },
      { key: "cadeaux", text: "Un petit geste de réconciliation" },
      { key: "services", text: "Que tu fasses quelque chose de concret pour arranger les choses" },
      { key: "contact", text: "Un câlin qui referme la dispute" }
    ]
  }
];


function Games({ data, save, name, role, onOpenPacks, jumpTo, onConsumeJump }) {
  const [mode, setMode] = useState("hub");
  const [card, setCard] = useState(truthOrDare[0]);
  const [wyr, setWyr] = useState(wouldYouRather[0]);
  const [answer, setAnswer] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [activeTopic, setActiveTopic] = useState(null);
  const [activePrompt, setActivePrompt] = useState(null);
  const [revealedMissions, setRevealedMissions] = useState([]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizTally, setQuizTally] = useState({ mots: 0, temps: 0, cadeaux: 0, services: 0, contact: 0 });

  useEffect(() => {
    if (jumpTo) {
      setMode(jumpTo);
      onConsumeJump && onConsumeJump();
    }
  }, [jumpTo]);

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


  const nextCard = () => setCard(truthOrDare[Math.floor(Math.random() * truthOrDare.length)]);
  const nextWyr = () => setWyr(wouldYouRather[Math.floor(Math.random() * wouldYouRather.length)]);

  // --- Roue des décisions : options et résultat partagés entre les deux partenaires ---
  const [wheelInput, setWheelInput] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wheelOptions = data.wheelOptions;

  const addWheelOption = () => {
    if (!wheelInput.trim()) return;
    save({ ...data, wheelOptions: [...wheelOptions, wheelInput.trim()] });
    setWheelInput("");
  };
  const removeWheelOption = (i) => save({ ...data, wheelOptions: wheelOptions.filter((_, idx) => idx !== i) });

  const spinWheel = () => {
    if (wheelOptions.length < 2 || spinning) return;
    setSpinning(true);
    let count = 0;
    const totalTicks = 18 + Math.floor(Math.random() * 10);
    const interval = setInterval(() => {
      setHighlighted(h => (h + 1) % wheelOptions.length);
      count++;
      if (count >= totalTicks) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * wheelOptions.length);
        setHighlighted(finalIndex);
        save({ ...data, wheelWinner: { text: wheelOptions[finalIndex], date: new Date().toISOString(), author: name } });
        setSpinning(false);
      }
    }, 90);
  };

  const saveAnswer = (prompt, text, category) => {
    if (!text || !text.trim()) return;
    save({ ...data, gameAnswers: [{ id: uid(), prompt, answer: text, category, date: new Date().toISOString(), author: name, authorRole: role, comments: [] }, ...data.gameAnswers] });
    setAnswer("");
  };

  const deleteAnswer = (id) => {
    save({ ...data, gameAnswers: data.gameAnswers.filter(a => a.id !== id) });
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

  // Fil de réponses propre à une activité (Question du jour, Action ou Vérité,
  // Tu préfères, ou un sujet de Découvrir), avec commentaires et suppression.
  const renderThread = (category) => {
    const items = data.gameAnswers.filter(a => a.category === category);
    if (items.length === 0) return null;
    return (
      <div style={{ marginTop: '18px', textAlign: 'left' }}>
        <h3 style={{ fontSize: '0.9rem', margin: '0 0 10px 4px' }}>Fil de réponses</h3>
        {items.map(p => (
          <div className="card" key={p.id} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <small style={{ opacity: 0.6 }}>{resolveAuthorName(p)} a répondu</small>
                <p style={{ fontWeight: 600, margin: '2px 0 4px' }}>{p.prompt}</p>
                <p style={{ margin: 0 }}>{p.answer}</p>
              </div>
              <button onClick={() => deleteAnswer(p.id)} title="Effacer cette réponse" style={{ background: 'none', border: 'none', color: '#bbb', flexShrink: 0, padding: '2px', cursor: 'pointer' }}>
                <Trash2 size={15} />
              </button>
            </div>
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
    );
  };

  // --- Missions secrètes : les défis de la semaine, présentés floutés à révéler ---
  const weeklyMissions = getWeeklyChallenges(getWeekKey());
  const toggleMission = (text) => {
    const already = data.challengesDone.includes(text);
    save({ ...data, challengesDone: already ? data.challengesDone.filter(t => t !== text) : [...data.challengesDone, text] });
  };
  const revealMission = (text) => {
    if (!revealedMissions.includes(text)) setRevealedMissions([...revealedMissions, text]);
  };

  // --- Quiz du langage de l'amour ---
  const myLastQuiz = [...data.quizResults].reverse().find(isMine);
  const partnerLastQuiz = [...data.quizResults].reverse().find(r => !isMine(r));

  const pickQuizOption = (opt) => {
    const nextTally = { ...quizTally, [opt.key]: quizTally[opt.key] + 1 };
    if (quizStep + 1 < loveQuizQuestions.length) {
      setQuizTally(nextTally);
      setQuizStep(quizStep + 1);
    } else {
      const winnerKey = Object.entries(nextTally).sort((a, b) => b[1] - a[1])[0][0];
      save({ ...data, quizResults: [{ id: uid(), result: winnerKey, date: new Date().toISOString(), author: name, authorRole: role }, ...data.quizResults] });
      setQuizTally(nextTally);
      setMode("quizResult");
    }
  };
  const restartQuiz = () => {
    setQuizStep(0);
    setQuizTally({ mots: 0, temps: 0, cadeaux: 0, services: 0, contact: 0 });
    setMode("quiz");
  };

  const titleFor = () => {
    if (mode === "hub") return { title: "Découvrir", sub: "Des activités pour nourrir votre relation, chaque jour." };
    if (mode === "question") return { title: "Question du jour", sub: "Une nouvelle question chaque jour, à découvrir à deux." };
    if (mode === "menu" || ["truth", "wyr", "wheel"].includes(mode)) return { title: "Jeux à deux", sub: "Riez, parlez et découvrez-vous encore." };
    if (mode === "missions") return { title: "Missions secrètes", sub: "Une mission par semaine, à révéler et à relever à deux." };
    if (mode === "quiz" || mode === "quizResult") return { title: "Quiz de couple", sub: "Découvre ton langage de l'amour." };
    if (mode === "topic") {
      const t = discoverTopics.find(t => t.key === activeTopic);
      return { title: t ? t.label : "Activité", sub: t ? t.desc : "" };
    }
    return { title: "Découvrir", sub: "" };
  };
  const { title, sub } = titleFor();

  return (
    <div>
      <Title title={title} sub={sub} />

      {mode === "hub" && (
        <>
          {computeStreak(data.gameAnswers) > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', background: '#fff7ed', border: '1px solid #fde3c7',
              borderRadius: '12px', padding: '8px 12px', marginBottom: '12px', fontSize: '0.82rem', fontWeight: 700, color: '#c2410c'
            }}>
              <Flame size={17} color="#f97316" /> {computeStreak(data.gameAnswers)} jour{computeStreak(data.gameAnswers) > 1 ? "s" : ""} d'affilée à échanger ensemble 🔥
            </div>
          )}

          <div className="card" style={{ marginBottom: '14px', background: '#fdf2f8', border: '1px solid #f1dbe4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Lightbulb size={16} color="#C9184A" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C9184A', letterSpacing: '0.03em' }}>CONSEIL DU JOUR</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem' }}>{getDailyTip(getDayKey())}</p>
          </div>

          <div className="grid4" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            <button className="quick" onClick={() => setMode("question")}><HelpCircle size={19} /><span>Questions</span></button>
            <button className="quick" onClick={() => setMode("menu")}><Gamepad2 size={19} /><span>Jeux</span></button>
            <button className="quick" onClick={onOpenPacks}><Gift size={19} /><span>Packs</span></button>
            <button className="quick" onClick={() => setMode("missions")}><Eye size={19} /><span>Missions Secrètes</span></button>
            <button className="quick" onClick={() => setMode("quiz")}><Lightbulb size={19} /><span>Quiz</span></button>
          </div>

          <h3 style={{ margin: '20px 0 10px 4px', fontSize: '1rem' }}>Activités par sujet</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {discoverTopics.map(t => (
              <button
                key={t.key}
                className="card"
                onClick={() => { setActiveTopic(t.key); setActivePrompt(null); setMode("topic"); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
                  border: '1px solid #f1dbe4', cursor: 'pointer'
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: t.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.color }}>
                  <t.Icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t.label}</div>
                  <div style={{ fontSize: '0.76rem', color: '#8A5568' }}>{t.desc}</div>
                </div>
                <ArrowRight size={16} style={{ opacity: 0.4 }} />
              </button>
            ))}
          </div>
        </>
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
                <button className="primary" onClick={() => saveAnswer(q, answer, "question")}><Check size={15} /> Garder notre réponse</button>
              </>
            )}
            <button className="secondary" onClick={() => setMode("hub")}>← Retour</button>
            {renderThread("question")}
          </div>
        );
      })()}

      {mode === "menu" && (
        <div className="grid4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button className="quick" onClick={() => { setMode("truth"); nextCard(); }}><span style={{ fontSize: '19px', lineHeight: 1 }}>🎯</span><span>Action ou Vérité</span></button>
          <button className="quick" onClick={() => { setMode("wyr"); nextWyr(); }}><HelpCircle size={19} /><span>Tu préfères… ?</span></button>
          <button className="quick" onClick={() => setMode("wheel")}><RefreshCw size={19} /><span>Roue des décisions</span></button>
        </div>
      )}
      {mode === "menu" && <button className="secondary" onClick={() => setMode("hub")} style={{ marginTop: '10px' }}>← Retour</button>}

      {mode === "truth" && (
        <div className="game card">
          <span style={{ fontSize: '22px', lineHeight: 1 }}>🎯</span>
          <div className="tag">{card.type.toUpperCase()}</div>
          <h3>{card.text}</h3>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Votre réponse ou ressenti…" />
          <button className="primary" onClick={() => saveAnswer(card.text, answer, "truth")}><Check size={15} /> Garder</button>
          <button className="secondary" onClick={nextCard}><RefreshCw size={15} /> Nouvelle carte</button>
          <button className="secondary" onClick={() => setMode("menu")}>← Retour</button>
          {renderThread("truth")}
        </div>
      )}
      {mode === "wyr" && (
        <div className="game card">
          <HelpCircle size={22} />
          <div className="tag">TU PRÉFÈRES…</div>
          <h3>{wyr[0]} <span style={{ opacity: 0.5 }}>ou</span> {wyr[1]}</h3>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Dites ce que vous avez choisi et pourquoi…" />
          <button className="primary" onClick={() => saveAnswer(wyr[0] + " ou " + wyr[1], answer, "wyr")}><Check size={15} /> Garder notre choix</button>
          <button className="secondary" onClick={nextWyr}><RefreshCw size={15} /> Nouveau dilemme</button>
          <button className="secondary" onClick={() => setMode("menu")}>← Retour</button>
          {renderThread("wyr")}
        </div>
      )}

      {mode === "wheel" && (
        <div className="game card">
          <RefreshCw size={22} />
          <div className="tag">ROUE DES DÉCISIONS</div>
          <p style={{ fontSize: '0.76rem', color: '#8A5568', margin: '0 0 8px' }}>Les options et le résultat sont partagés — votre partenaire les voit aussi, sans rien configurer de son côté.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0' }}>
            {wheelOptions.map((opt, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '10px',
                  border: highlighted === i && spinning ? '2px solid #C9184A' : '1px solid #eee',
                  background: data.wheelWinner && data.wheelWinner.text === opt ? '#fdf2f8' : (highlighted === i && spinning ? '#fff7ed' : '#fff'),
                  fontWeight: data.wheelWinner && data.wheelWinner.text === opt ? 700 : 400,
                  transition: 'background 0.1s ease'
                }}
              >
                <span>{data.wheelWinner && data.wheelWinner.text === opt ? "🎉 " : ""}{opt}</span>
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
          {data.wheelWinner && !spinning && (
            <div style={{ fontSize: '0.78rem', color: '#8A5568', marginTop: '8px' }}>
              Dernier tirage : <b>{data.wheelWinner.text}</b> (par {data.wheelWinner.author === name ? "toi" : data.wheelWinner.author})
            </div>
          )}
          <button className="secondary" onClick={() => setMode("menu")}>← Retour</button>
        </div>
      )}

      {mode === "missions" && (
        <div>
          <p style={{ fontSize: '0.8rem', color: '#8A5568', margin: '0 0 12px' }}>Nouvelles missions chaque lundi ✨ Appuyez pour révéler, puis cochez une fois relevée.</p>
          {weeklyMissions.map((c, i) => {
            const revealed = revealedMissions.includes(c);
            const done = data.challengesDone.includes(c);
            return (
              <div key={c} className="card" style={{ marginBottom: '10px', cursor: revealed ? 'default' : 'pointer' }} onClick={() => !revealed && revealMission(c)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f3e4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#C9184A' }}>
                    <Eye size={17} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', opacity: 0.6, marginBottom: '2px' }}>MISSION SECRÈTE #{i + 1}</div>
                    <div style={{
                      fontWeight: 600, fontSize: '0.9rem',
                      filter: revealed ? 'none' : 'blur(5px)',
                      transition: 'filter .3s ease',
                      textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1
                    }}>
                      {c}
                    </div>
                  </div>
                  {revealed && (
                    <button onClick={e => { e.stopPropagation(); toggleMission(c); }} style={{ background: 'none', border: 'none', padding: 0, flexShrink: 0 }}>
                      {done ? <Check size={20} color="#22c55e" /> : <span style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #ccc', display: 'inline-block' }} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <button className="secondary" onClick={() => setMode("hub")}>← Retour</button>
        </div>
      )}

      {mode === "quiz" && (() => {
        const q = loveQuizQuestions[quizStep];
        return (
          <div className="game card">
            <Lightbulb size={22} />
            <div className="tag">QUESTION {quizStep + 1} / {loveQuizQuestions.length}</div>
            <h3>{q.text}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0', width: '100%' }}>
              {q.options.map(opt => (
                <button key={opt.key} className="quick" style={{ textAlign: 'left', justifyContent: 'flex-start' }} onClick={() => pickQuizOption(opt)}>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
            <button className="secondary" onClick={() => setMode("hub")}>← Retour</button>
          </div>
        );
      })()}

      {mode === "quizResult" && (() => {
        const lang = loveLanguages.find(l => l.key === (myLastQuiz && myLastQuiz.result));
        const partnerLang = loveLanguages.find(l => l.key === (partnerLastQuiz && partnerLastQuiz.result));
        return (
          <div className="game card">
            <div style={{ fontSize: '2rem' }}>{lang ? lang.emoji : "💜"}</div>
            <div className="tag">TON LANGAGE DE L'AMOUR</div>
            <h3>{lang ? lang.label : "—"}</h3>
            <p style={{ fontSize: '0.85rem', color: '#8A5568' }}>{lang ? lang.desc : ""}</p>
            <div style={{ background: '#fdf2f8', borderRadius: '10px', padding: '10px 12px', fontSize: '0.85rem', marginTop: '10px', width: '100%', textAlign: 'left' }}>
              <b>{partnerName} :</b> {partnerLang ? `${partnerLang.emoji} ${partnerLang.label}` : "pas encore fait le quiz"}
            </div>
            <button className="primary" onClick={restartQuiz} style={{ marginTop: '10px' }}><RefreshCw size={15} /> Refaire le quiz</button>
            <button className="secondary" onClick={() => setMode("hub")}>← Retour</button>
          </div>
        );
      })()}

      {mode === "topic" && !activePrompt && (() => {
        const t = discoverTopics.find(t => t.key === activeTopic);
        if (!t) return null;
        return (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {t.prompts.map(p => {
                const answered = data.gameAnswers.some(a => a.prompt === p && a.category === t.key && isMine(a));
                return (
                  <button key={p} className="card" style={{ textAlign: 'left', width: '100%', cursor: 'pointer', border: '1px solid #f1dbe4' }} onClick={() => setActivePrompt(p)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ flex: 1, fontSize: '0.88rem' }}>{p}</span>
                      {answered && <Check size={15} color="#22c55e" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <button className="secondary" onClick={() => setMode("hub")} style={{ marginTop: '12px' }}>← Retour</button>
            {renderThread(t.key)}
          </div>
        );
      })()}

      {mode === "topic" && activePrompt && (() => {
        const t = discoverTopics.find(t => t.key === activeTopic);
        const myAnswer = data.gameAnswers.find(a => a.prompt === activePrompt && a.category === activeTopic && isMine(a));
        const partnerAnswer = data.gameAnswers.find(a => a.prompt === activePrompt && a.category === activeTopic && !isMine(a));
        return (
          <div className="game card">
            <div className="tag">{t ? t.label.toUpperCase() : ""}</div>
            <h3>{activePrompt}</h3>
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
                <button className="primary" onClick={() => saveAnswer(activePrompt, answer, activeTopic)}><Check size={15} /> Garder notre réponse</button>
              </>
            )}
            <button className="secondary" onClick={() => setActivePrompt(null)}>← Retour aux questions</button>
          </div>
        );
      })()}

      {mode === "hub" && data.gameAnswers.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: '#8A5568', textAlign: 'center', marginTop: '20px' }}>
          Vos réponses apparaîtront ici, activité par activité, une fois que vous aurez commencé à répondre ✨
        </p>
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
              <PackTile icon={Cake} title="Pack Anniversaire" desc="Carte, défis, idées cadeaux et capsule surprise" onClick={() => setView("birthday")} />
            </div>
          </>
        )}

        {view === "valentine" && <PackValentine data={data} save={save} name={name} setTab={setTab} onClose={onClose} isFeb14={isFeb14} back={() => setView("menu")} />}
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

function BirthdayConfetti() {
  const pieces = React.useMemo(() => {
    const colors = ["#C9184A", "#ffd08a", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"];
    return Array.from({ length: 26 }, (_, i) => ({
      id: i,
      left: Math.round(Math.random() * 100),
      delay: (Math.random() * 0.4).toFixed(2),
      duration: (1.4 + Math.random() * 1.1).toFixed(2),
      color: colors[i % colors.length],
      rotate: Math.round(Math.random() * 360)
    }));
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 'inherit' }}>
      <style>{`
        @keyframes birthdayConfettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(220px) rotate(340deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute', top: 0, left: p.left + '%',
            width: '7px', height: '11px', background: p.color, borderRadius: '2px',
            animation: `birthdayConfettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`
          }}
        />
      ))}
    </div>
  );
}

const birthdayVirtualGifts = [
  { key: "letter", label: "Lettre", Icon: Mail, tier: "romantic" },
  { key: "declaration", label: "Déclaration", Icon: Heart, tier: "romantic" },
  { key: "song", label: "Chanson", Icon: Music, tier: "romantic" },
  { key: "memory", label: "Souvenir", Icon: Camera, tier: "premium" },
  { key: "outing", label: "Sortie", Icon: Ticket, tier: "premium" },
  { key: "secret", label: "Surprise secrète", Icon: Eye, tier: "premium" }
];

const birthdaySecretMessages = [
  "Ce soir, c'est toi qui choisis tout : le film, le repas, la musique. Carte blanche totale 👑",
  "Bon pour un massage offert, sans négociation possible 💆",
  "Le prochain week-end tranquille est pour nous deux, rien que nous 🌙",
  "Une déclaration surprise t'attend au moment où tu t'y attends le moins 💫"
];

const birthdayTimelineDefaults = [
  { time: "09:00", label: "☕ Petit-déjeuner" },
  { time: "12:30", label: "🍽️ Déjeuner" },
  { time: "16:00", label: "📸 Moment à deux" },
  { time: "19:30", label: "❤️ Dîner" },
  { time: "22:00", label: "🎁 Surprise" }
];

const tierRank = { simple: 0, romantic: 1, premium: 2 };
const tierOptions = [
  { key: "simple", emoji: "🎈", label: "Anniversaire simple" },
  { key: "romantic", emoji: "💝", label: "Anniversaire romantique" },
  { key: "premium", emoji: "👑", label: "Anniversaire Premium" }
];

function PackBirthday({ data, save, name, setTab, onClose, back }) {
  const b = data.packs.birthday;
  const [personName, setPersonName] = useState(b.personName || "");
  const [ageVal, setAgeVal] = useState(b.age || "");
  const [dateVal, setDateVal] = useState(b.date || "");
  const [cardText, setCardText] = useState(b.cardText || "");
  const [letterText, setLetterText] = useState(b.letterText || "");
  const [giftInput, setGiftInput] = useState("");
  const [capsuleText, setCapsuleText] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [reasonIdx, setReasonIdx] = useState(0);
  const [songTitle, setSongTitle] = useState(b.song.title || "");
  const [songArtist, setSongArtist] = useState(b.song.artist || "");
  const [songLink, setSongLink] = useState(b.song.link || "");
  const [timeInput, setTimeInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [giftOpened, setGiftOpened] = useState(false);
  const [flippingGift, setFlippingGift] = useState(null);

  const unlocked = (t) => tierRank[b.tier] >= tierRank[t];
  const setTier = (t) => save({ ...data, packs: { ...data.packs, birthday: { ...b, tier: t } } });
  const patch = (fields) => save({ ...data, packs: { ...data.packs, birthday: { ...b, ...fields } } });

  const savePlan = () => patch({ personName, age: ageVal, date: dateVal, cardText });
  const saveLetter = () => patch({ letterText });
  const saveSong = () => patch({ song: { title: songTitle, artist: songArtist, link: songLink } });

  const addGift = () => {
    if (!giftInput.trim()) return;
    patch({ giftIdeas: [...b.giftIdeas, { id: uid(), text: giftInput.trim() }] });
    setGiftInput("");
  };
  const removeGift = (id) => patch({ giftIdeas: b.giftIdeas.filter(g => g.id !== id) });

  const addReason = () => {
    if (!reasonInput.trim()) return;
    patch({ reasons: [...b.reasons, reasonInput.trim()] });
    setReasonInput("");
  };
  const removeReason = (i) => {
    patch({ reasons: b.reasons.filter((_, idx) => idx !== i) });
    setReasonIdx(0);
  };

  const toggleChallenge = (c) => {
    const done = b.challengesDone.includes(c);
    patch({ challengesDone: done ? b.challengesDone.filter(x => x !== c) : [...b.challengesDone, c] });
  };

  const toggleFeaturedMemory = (id) => {
    const already = b.featuredMemoryIds.includes(id);
    patch({ featuredMemoryIds: already ? b.featuredMemoryIds.filter(x => x !== id) : [...b.featuredMemoryIds, id] });
  };

  const addTimelineSlot = (time, label) => {
    if (!time || !label.trim()) return;
    patch({ timeline: [...b.timeline, { id: uid(), time, label: label.trim() }].sort((a, c) => a.time.localeCompare(c.time)) });
    setTimeInput(""); setLabelInput("");
  };
  const removeTimelineSlot = (id) => patch({ timeline: b.timeline.filter(t => t.id !== id) });

  const openVirtualGift = (key) => {
    setFlippingGift(key);
    setTimeout(() => {
      if (!b.virtualGiftsOpened.includes(key)) patch({ virtualGiftsOpened: [...b.virtualGiftsOpened, key] });
      setFlippingGift(null);
    }, 450);
  };
  const virtualGiftContent = (key) => {
    if (key === "letter") return b.letterText || "Une lettre pleine d'amour t'attend — écris-la dans la section Lettre ✍️";
    if (key === "declaration") return b.reasons[Math.floor(Math.random() * b.reasons.length)] || "Je t'aime, tout simplement.";
    if (key === "song") return b.song.title ? `🎵 ${b.song.title} — ${b.song.artist || "?"}` : "Notre chanson n'est pas encore choisie.";
    if (key === "memory") {
      const featured = data.memories.filter(m => b.featuredMemoryIds.includes(m.id));
      return featured.length > 0 ? featured[Math.floor(Math.random() * featured.length)] : null;
    }
    if (key === "outing") return b.giftIdeas[Math.floor(Math.random() * b.giftIdeas.length)]?.text || "Une sortie surprise à organiser ensemble 🎟️";
    if (key === "secret") return birthdaySecretMessages[Math.floor(Math.random() * birthdaySecretMessages.length)];
    return "";
  };

  const sealCapsule = () => {
    if (!capsuleText.trim() || !dateVal) return;
    const nextYear = new Date(dateVal + "T00:00:00"); nextYear.setFullYear(nextYear.getFullYear() + 1);
    save({ ...data, capsules: [{ id: uid(), text: capsuleText.trim(), unlockDate: nextYear.toISOString().slice(0, 10), author: name, tag: "birthday" }, ...data.capsules] });
    setCapsuleText("");
  };

  const now = new Date();
  let daysLeft = null;
  let isToday = false;
  if (dateVal) {
    const [, m, d] = dateVal.split("-").map(Number);
    isToday = now.getMonth() + 1 === m && now.getDate() === d;
    let next = new Date(now.getFullYear(), m - 1, d);
    if (next < now && !isToday) next = new Date(now.getFullYear() + 1, m - 1, d);
    daysLeft = isToday ? 0 : Math.ceil((next - now) / 86400000);
  }

  const cardBox = { title: "16px" };

  return (
    <div>
      <button onClick={back} style={{ background: 'none', border: 'none', color: '#C9184A', marginBottom: '10px', cursor: 'pointer' }}>← Retour</button>
      <h3 style={{ margin: '0 0 4px' }}>🎂 Pack Anniversaire</h3>
      <p style={{ fontSize: '0.78rem', color: '#8A5568', marginTop: 0 }}>Une petite mise en scène pour rendre son jour inoubliable.</p>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {tierOptions.map(t => (
          <button
            key={t.key}
            onClick={() => setTier(t.key)}
            style={{
              flex: 1, borderRadius: '12px', padding: '8px 4px', textAlign: 'center', cursor: 'pointer',
              border: b.tier === t.key ? '2px solid #C9184A' : '1px solid #f1dbe4',
              background: b.tier === t.key ? '#fdf2f8' : '#fff'
            }}
          >
            <div style={{ fontSize: '1.1rem' }}>{t.emoji}</div>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, lineHeight: 1.2, marginTop: '2px' }}>{t.label}</div>
          </button>
        ))}
      </div>

      {!giftOpened && (
        <div className="card" style={{ textAlign: 'center', padding: '30px 16px', background: 'linear-gradient(160deg,#ffe1ea,#ffd08a)' }}>
          <div style={{ fontSize: '2rem' }}>🎁</div>
          <h4 style={{ margin: '10px 0 4px' }}>Un cadeau rien que pour toi</h4>
          <p style={{ fontSize: '0.82rem', color: '#7a3d1a', margin: '0 0 14px' }}>Une petite surprise t'attend à l'intérieur.</p>
          <button className="primary" onClick={() => setGiftOpened(true)}>Ouvrir mon cadeau</button>
        </div>
      )}

      {giftOpened && (
        <>
          <div className="card" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#ffe1ea,#ffd08a)' }}>
            <BirthdayConfetti />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <PartyPopper size={26} />
              <h4 style={{ margin: '8px 0 2px' }}>{personName || "Notre anniversaire"}{ageVal ? ` · ${ageVal} ans` : ""}</h4>
              {dateVal && <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>{dateVal.split("-").reverse().join("/")}</div>}
              {cardText && <p style={{ fontWeight: 600, margin: '12px 0 0', whiteSpace: 'pre-wrap' }}>{cardText}</p>}
            </div>
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 8px' }}>🎉 Infos</h4>
            <input value={personName} onChange={e => setPersonName(e.target.value)} placeholder="Qui fête son anniversaire ?" style={{ marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} style={{ flex: 1 }} />
              <input value={ageVal} onChange={e => setAgeVal(e.target.value)} placeholder="Âge" style={{ width: '80px' }} />
            </div>
            <textarea value={cardText} onChange={e => setCardText(e.target.value)} placeholder="Message de la carte d'anniversaire…" />
            <button className="primary" onClick={savePlan} style={{ marginTop: '6px' }}>Enregistrer</button>
            {daysLeft !== null && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#8A5568', fontWeight: isToday ? 700 : 400 }}>
                {isToday ? "🎉 C'EST AUJOURD'HUI !" : `⏳ Encore ${daysLeft} jour${daysLeft > 1 ? "s" : ""} avant son jour ❤️`}
              </div>
            )}
          </div>

          {unlocked("romantic") && (
            <div className="card">
              <h4 style={{ margin: '0 0 8px' }}>💌 Lettre d'anniversaire</h4>
              <textarea
                value={letterText}
                onChange={e => setLetterText(e.target.value)}
                placeholder="Aujourd'hui n'est pas seulement le jour où tu es né(e)…"
                style={{ minHeight: '120px', fontStyle: 'italic' }}
              />
              <button className="primary" onClick={saveLetter} style={{ marginTop: '6px' }}>Sauvegarder la lettre</button>
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

          {unlocked("romantic") && (
            <div className="card">
              <h4 style={{ margin: '0 0 8px' }}>❤️ Pourquoi je t'aime</h4>
              {b.reasons.length > 0 ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, minHeight: '40px' }}>« {b.reasons[reasonIdx % b.reasons.length]} »</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <button className="secondary" onClick={() => setReasonIdx((reasonIdx - 1 + b.reasons.length) % b.reasons.length)}>← Précédente</button>
                    <button className="secondary" onClick={() => setReasonIdx((reasonIdx + 1) % b.reasons.length)}>Suivante →</button>
                  </div>
                  <button onClick={() => removeReason(reasonIdx % b.reasons.length)} style={{ background: 'none', border: 'none', color: '#bbb', fontSize: '0.75rem', cursor: 'pointer' }}>
                    <Trash2 size={13} /> Retirer cette raison
                  </button>
                </div>
              ) : <p style={{ fontSize: '0.8rem', color: '#8A5568' }}>Ajoute une première raison ci-dessous ✨</p>}
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <input value={reasonInput} onChange={e => setReasonInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addReason()} placeholder="Une raison de l'aimer…" />
                <button onClick={addReason}><Plus size={16} /></button>
              </div>
            </div>
          )}

          {unlocked("romantic") && (
            <div className="card">
              <h4 style={{ margin: '0 0 8px' }}><Music size={16} style={{ verticalAlign: '-3px' }} /> Notre chanson</h4>
              <input value={songTitle} onChange={e => setSongTitle(e.target.value)} placeholder="Titre de la chanson" style={{ marginBottom: '8px' }} />
              <input value={songArtist} onChange={e => setSongArtist(e.target.value)} placeholder="Artiste" style={{ marginBottom: '8px' }} />
              <input value={songLink} onChange={e => setSongLink(e.target.value)} placeholder="Lien (Spotify, YouTube…)" style={{ marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="primary" onClick={saveSong}>Enregistrer</button>
                {b.song.link && <a href={b.song.link} target="_blank" rel="noreferrer" className="secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>🎧 Écouter</a>}
              </div>
            </div>
          )}

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

          {unlocked("premium") && (
            <div className="card">
              <h4 style={{ margin: '0 0 8px' }}>📸 Nos moments</h4>
              {data.memories.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#8A5568' }}>Ajoutez des photos depuis l'onglet Histoire pour les retrouver ici.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {data.memories.slice(0, 12).map(mem => {
                    const featured = b.featuredMemoryIds.includes(mem.id);
                    return (
                      <button
                        key={mem.id}
                        onClick={() => toggleFeaturedMemory(mem.id)}
                        style={{ position: 'relative', padding: 0, border: featured ? '2px solid #C9184A' : '2px solid transparent', borderRadius: '10px', overflow: 'hidden', aspectRatio: '1', cursor: 'pointer' }}
                      >
                        <img src={mem.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {featured && <div style={{ position: 'absolute', top: 2, right: 2, background: '#C9184A', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={9} color="#fff" fill="#fff" /></div>}
                      </button>
                    );
                  })}
                </div>
              )}
              <p style={{ fontSize: '0.7rem', color: '#8A5568', marginTop: '8px' }}>Touchez une photo pour la mettre en avant dans la galerie d'anniversaire.</p>
            </div>
          )}

          {unlocked("premium") && (
            <div className="card">
              <h4 style={{ margin: '0 0 10px' }}>🎁 Cadeaux virtuels</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {birthdayVirtualGifts.filter(g => unlocked(g.tier)).map(g => {
                  const opened = b.virtualGiftsOpened.includes(g.key);
                  const flipping = flippingGift === g.key;
                  return (
                    <div key={g.key} style={{ border: '1px solid #f1dbe4', borderRadius: '12px', padding: '10px', textAlign: 'center', minHeight: '86px' }}>
                      {!opened ? (
                        <button
                          onClick={() => openVirtualGift(g.key)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', opacity: flipping ? 0.3 : 1, transition: 'opacity .3s ease' }}
                        >
                          <g.Icon size={20} color="#C9184A" />
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: '4px' }}>{g.label}</div>
                          <div style={{ fontSize: '0.62rem', color: '#8A5568' }}>Toucher pour ouvrir</div>
                        </button>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#C9184A', marginBottom: '4px' }}>{g.label}</div>
                          {g.key === "memory" && virtualGiftContent("memory") ? (
                            <img src={virtualGiftContent("memory").url} alt="" style={{ width: '100%', borderRadius: '8px', maxHeight: '70px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ fontSize: '0.72rem' }}>{virtualGiftContent(g.key)}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {unlocked("premium") && (
            <div className="card">
              <h4 style={{ margin: '0 0 8px' }}>🥂 Notre journée</h4>
              {b.timeline.map(slot => (
                <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', width: '46px', flexShrink: 0 }}>{slot.time}</span>
                  <span style={{ flex: 1, fontSize: '0.85rem' }}>{slot.label}</span>
                  <button onClick={() => removeTimelineSlot(slot.id)} style={{ background: 'none', border: 'none', color: '#bbb' }}><Trash2 size={14} /></button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '6px', margin: '8px 0' }}>
                <input type="time" value={timeInput} onChange={e => setTimeInput(e.target.value)} style={{ width: '110px' }} />
                <input value={labelInput} onChange={e => setLabelInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTimelineSlot(timeInput, labelInput)} placeholder="Ex. 📸 Moment à deux" style={{ flex: 1 }} />
                <button onClick={() => addTimelineSlot(timeInput, labelInput)}><Plus size={16} /></button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {birthdayTimelineDefaults.map(sug => (
                  <button
                    key={sug.time}
                    onClick={() => addTimelineSlot(sug.time, sug.label)}
                    style={{ fontSize: '0.68rem', padding: '4px 8px', borderRadius: '99px', border: '1px solid #f1dbe4', background: '#fff', cursor: 'pointer' }}
                  >
                    + {sug.time} {sug.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h4 style={{ margin: '0 0 8px' }}>⏳ Capsule à ouvrir l'année prochaine</h4>
            <textarea value={capsuleText} onChange={e => setCapsuleText(e.target.value)} placeholder="Le message pour l'année prochaine…" />
            <button className="primary" onClick={sealCapsule} style={{ marginTop: '6px' }} disabled={!dateVal}><Clock3 size={15} /> Sceller</button>
          </div>

          <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(160deg,#ffe1ea,#ffd08a)' }}>
            <div style={{ fontSize: '1.3rem' }}>🌹</div>
            <h4 style={{ margin: '8px 0 4px' }}>Joyeux anniversaire, mon amour ❤️</h4>
            <div style={{ fontSize: '0.8rem', opacity: 0.75, marginBottom: '12px' }}>{data.names.you || "Toi"} & {data.names.partner || "Moi"}</div>
            <button className="secondary" onClick={() => setGiftOpened(false)}><RefreshCw size={14} /> Rejouer la surprise</button>
          </div>
        </>
      )}
    </div>
  );
}


