import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Heart, Home, MessageCircleHeart, Calendar, Wallet, Gamepad2, BookOpenText,
  Sparkles, Send, Camera, Gift, Check, Copy, LogOut, Users, Clock3,
  Plus, Trash2, Star, RefreshCw, Lock, ArrowRight, X, BellRing, Settings, CircleHelp, Lightbulb, Drama,
  MapPin, CircleHelp, Lightbulb
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
  wishCards: [],
  moods: {},
  outingsDone: [],
  challengesDone: []
};

const dateIdeasCategories = {
  "Cocooning": ["Soirée pyjama et film", "Cuisiner un dessert ensemble", "Jeux de société sans téléphone", "Bain chaud avec bougies"],
  "Culture": ["Visiter un musée", "Aller à une expo", "Lire un livre à deux voix", "Concert ou spectacle"],
  "Extérieur": ["Pique-nique", "Randonnée", "Balade à vélo", "Regarder le coucher du soleil"],
  "Gourmand": ["Nouveau restaurant", "Atelier cuisine", "Dégustation", "Brunch du dimanche"]
};

const challengesList = [
  "Préparer le petit-déjeuner au lit",
  "Envoyer un selfie rigolo",
  "Écrire 3 choses que j'aime chez toi",
  "Proposer une sortie surprise",
  "Cuisiner le plat préféré de l'autre",
  "Offrir un compliment sincère aujourd'hui",
  "Planifier une soirée sans téléphone"
];

const moodOptions = ["😍", "😊", "😌", "😴", "😢", "😤", "🥳", "😐"];

const verses = [
  ["1 Corinthiens 13:4-7", "L'amour est patient, il est plein de bonté ; l'amour ne cherche point son intérêt, ne s'irrite point et supporte tout."],
  ["Ecclésiaste 4:9-12", "Deux valent mieux qu'un... et la corde à trois fils ne se rompt pas facilement."],
  ["Colossiens 3:14", "Par-dessus tout cela, revêtez-vous de l'amour, qui est le lien de la perfection."],
  ["Cantique des cantiques 8:7", "Les grandes eaux ne peuvent éteindre l'amour, et les fleuves ne le submergeraient pas."],
  ["Romains 12:10", "Par amour fraternel, soyez pleins d'affection les uns pour les autres."]
];

const questions = [
  "Quel souvenir de nous te fait sourire instantanément ?",
  "Qu'est-ce qui te fait te sentir le plus aimé(e) ?",
  "Quel rêve aimerais-tu absolument réaliser avec moi ?",
  "Qu'est-ce que tu aimerais qu'on fasse plus souvent ?",
  "Quel moment de notre histoire voudrais-tu revivre ?",
  "Comment pouvons-nous mieux grandir spirituellement ensemble ?"
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
    wishCards: raw?.wishCards || [],
    moods: raw?.moods || {},
    outingsDone: raw?.outingsDone || [],
    challengesDone: raw?.challengesDone || []
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
  const [room, setRoom] = useState(localStorage.getItem("oamy:room") || "");
  const [name, setName] = useState(localStorage.getItem("oamy:name") || "");
  const [role, setRole] = useState(localStorage.getItem("oamy:role") || "you");
  const [data, setData] = useState(EMPTY);
  const dataRef = React.useRef(EMPTY);
  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
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
              const incoming = mergeData(p.new.payload);
              notifyIfNew(dataRef.current, incoming, name);
              setData(incoming);
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
      setLoading(false);
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [session, room]);

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
  if (!room || !session) return <Pairing name={name} setName={setName} join={join} error={error} />;
  if (loading) return <Loading />;

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
        {tab === "games" && <Games data={data} save={save} name={name} />}
        {tab === "more" && <More data={data} save={save} logout={logout} room={room} name={name} />}
      </main>
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
    ["games", "Action Vérité", CircleHelp],
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

  const verse = verses[totalDays % verses.length];

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
      </div>

      <div className="today card">
        <div><Sparkles size={18} /><b>Aujourd'hui pour nous</b></div>
        <p>{questions[totalDays % questions.length]}</p>
        <button onClick={() => setTab("chat")}>Répondre à deux <ArrowRight size={14} /></button>
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

      <div className="card verse"><BookOpenText size={17} /><p>« {verse[1]} »</p><b>{verse[0]}</b></div>
    </div>
  );
}

function Quick({ icon: I, text, onClick }) {
  return <button className="quick" onClick={onClick}><I size={19} /><span>{text}</span></button>;
}

function Chat({ data, name, save }) {
  const [text, setText] = useState("");
  const send = () => {
    if (!text.trim()) return;
    save({
      ...data,
      messages: [...data.messages, { id: uid(), from: name, text: text.trim(), date: new Date().toISOString() }]
    });
    setText("");
  };

  return (
    <div>
      <Title title="Notre conversation" sub="Un petit espace rien qu'à vous deux." />
      <div className="chat card">
        {data.messages.length === 0 && <div className="empty">Commencez votre conversation ❤️</div>}
        {data.messages.map(m => (
          <div className={"msg " + (m.from === name ? "mine" : "theirs")} key={m.id}>
            <span>{m.text}</span>
            <small>{m.from} · {new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</small>
          </div>
        ))}
      </div>
      <div className="composer">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Écris quelque chose de doux…" />
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

function Games({ data, save, name }) {
  const [mode, setMode] = useState("menu");
  const [q, setQ] = useState(questions[0]);
  const [card, setCard] = useState(truthOrDare[0]);
  const [wyr, setWyr] = useState(wouldYouRather[0]);
  const [answer, setAnswer] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});

  const [wheelOptions, setWheelOptions] = useState(["Pizza", "Sushi", "Pâtes", "Salade", "Burger", "Tacos"]);
  const [wheelInput, setWheelInput] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [winner, setWinner] = useState(null);

  const [outCategory, setOutCategory] = useState(null);
  const [outIdea, setOutIdea] = useState(null);

  const nextQuestion = () => setQ(questions[Math.floor(Math.random() * questions.length)]);
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
    save({ ...data, gameAnswers: [{ id: uid(), prompt, answer: text, date: new Date().toISOString(), author: name, comments: [] }, ...data.gameAnswers] });
    setAnswer("");
    setMode("menu");
  };

  const addComment = (postId) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    save({
      ...data,
      gameAnswers: data.gameAnswers.map(p => p.id === postId
        ? { ...p, comments: [...(p.comments || []), { id: uid(), author: name, text }] }
        : p)
    });
    setCommentDrafts({ ...commentDrafts, [postId]: "" });
  };

  return (
    <div>
      <Title title="Jeux à deux" sub="Riez, parlez et découvrez-vous encore." />
      {mode === "menu" && (
        <div className="grid4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button className="quick" onClick={() => { setMode("truth"); nextCard(); }}>
            <CircleHelp size={25} strokeWidth={2.2} />
            <span>Action Vérité</span>
          </button>
          <button className="quick" onClick={() => { setMode("outings"); setOutCategory(null); setOutIdea(null); }}>
            <Lightbulb size={25} strokeWidth={2.2} />
            <span>Idées de sorties</span>
          </button>
        </div>
      )}
      {mode === "question" && (
        <div className="game card">
          <Sparkles size={22} />
          <div className="tag">QUESTION DU JOUR</div>
          <h3>{q}</h3>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Votre réponse…" />
          <button className="primary" onClick={() => saveAnswer(q, answer)}><Check size={15} /> Garder notre réponse</button>
          <button className="secondary" onClick={nextQuestion}><RefreshCw size={15} /> Nouvelle question</button>
          <button className="secondary" onClick={() => setMode("menu")}>← Retour</button>
        </div>
      )}
      {mode === "truth" && (
        <div className="game card">
          <CircleHelp size={25} strokeWidth={2.2} />
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
          <Gift size={22} />
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
          <Lightbulb size={25} strokeWidth={2.2} />
          <div className="tag">IDÉES DE SORTIES</div>
          {!outCategory ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '12px 0' }}>
              {Object.keys(dateIdeasCategories).map(cat => (
                <button key={cat} className="quick" onClick={() => pickOuting(cat)}><Lightbulb size={20} /><span>{cat}</span></button>
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
              <small style={{ opacity: 0.6 }}>{p.author || "Anonyme"} a répondu</small>
              <p style={{ fontWeight: 600, margin: '2px 0 4px' }}>{p.prompt}</p>
              <p style={{ margin: 0 }}>{p.answer}</p>
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                {(p.comments || []).map(c => (
                  <div key={c.id} style={{ fontSize: '0.82rem', marginBottom: '6px' }}>
                    <b>{c.author || "Anonyme"}</b> {c.text}
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

function WishCardStudio({ data, save, name }) {
  const templates = [
    { id: "love", label: "Je t'aime", emoji: "❤️", title: "Pour toi, mon amour", text: "Je voulais simplement te rappeler combien tu comptes pour moi." },
    { id: "birthday", label: "Anniversaire", emoji: "🎂", title: "Joyeux anniversaire", text: "Que cette nouvelle année de ta vie soit remplie de bonheur et de beaux moments à deux." },
    { id: "couple", label: "Notre amour", emoji: "💍", title: "Encore un chapitre de nous", text: "Chaque jour avec toi devient un souvenir que je veux garder pour toujours." },
    { id: "courage", label: "Encouragement", emoji: "🌷", title: "Je crois en toi", text: "Même dans les journées difficiles, souviens-toi que je suis là, avec toi." },
    { id: "surprise", label: "Surprise", emoji: "✨", title: "Une petite surprise", text: "Ouvre cette carte avec ton plus beau sourire… quelque chose de doux t'attend." }
  ];
  const [template, setTemplate] = useState(templates[0]);
  const [message, setMessage] = useState(templates[0].text);
  const [recipient, setRecipient] = useState(data.names.partner || "Mon amour");
  const [musicUrl, setMusicUrl] = useState("");
  const [photo, setPhoto] = useState("");
  const [preview, setPreview] = useState(null);
  const [reply, setReply] = useState("");

  const choose = (item) => {
    setTemplate(item);
    setMessage(item.text);
  };

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const createCard = () => {
    if (!message.trim()) return;
    const card = {
      id: uid(),
      template: template.id,
      emoji: template.emoji,
      title: template.title,
      recipient: recipient.trim() || "Mon amour",
      message: message.trim(),
      photo,
      musicUrl: musicUrl.trim(),
      author: name,
      createdAt: new Date().toISOString(),
      replies: []
    };
    save({ ...data, wishCards: [card, ...(data.wishCards || [])] });
    setPreview(card);
    setReply("");
  };

  const addReply = (card) => {
    if (!reply.trim()) return;
    save({
      ...data,
      wishCards: (data.wishCards || []).map(c => c.id === card.id
        ? { ...c, replies: [...(c.replies || []), { id: uid(), author: name, text: reply.trim(), createdAt: new Date().toISOString() }] }
        : c)
    });
    setReply("");
  };

  const removeCard = (id) => {
    save({ ...data, wishCards: (data.wishCards || []).filter(c => c.id !== id) });
    if (preview?.id === id) setPreview(null);
  };

  return (
    <div className="card wish-card-studio">
      <div style={{display:"flex",alignItems:"center",gap:8}}><Gift size={20}/><h3 style={{margin:0}}>💌 Cartes de vœux</h3></div>
      <p style={{fontSize:".82rem",color:"#8A5568"}}>Crée une petite surprise animée pour ton/ta partenaire.</p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:7,marginBottom:10}}>
        {templates.map(item => (
          <button key={item.id} onClick={() => choose(item)} style={{padding:"9px 7px",borderRadius:13,border: template.id===item.id ? "2px solid #C9184A" : "1px solid #ead9df",background: template.id===item.id ? "#fff0f5" : "#fff",color:"#5b2034"}}>
            <span style={{fontSize:20}}>{item.emoji}</span><br/><small>{item.label}</small>
          </button>
        ))}
      </div>

      <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Pour qui ?" />
      <input value={template.title} readOnly style={{opacity:.75}} />
      <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Écris ton message…" />

      <label className="secondary" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer",marginBottom:8}}>
        <Camera size={15}/> Ajouter une photo
        <input type="file" accept="image/*" onChange={onPhoto} style={{display:"none"}} />
      </label>
      {photo && <img src={photo} alt="Aperçu" style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:14,marginBottom:8}} />}

      <input value={musicUrl} onChange={e=>setMusicUrl(e.target.value)} placeholder="Lien d'une musique (optionnel)" />
      <button className="primary" onClick={createCard}><Gift size={15}/> Créer la carte surprise</button>

      {preview && (
        <div style={{marginTop:14}}>
          <div style={{fontSize:".75rem",letterSpacing:".08em",textTransform:"uppercase",color:"#8A5568",marginBottom:6}}>Aperçu</div>
          <WishCardView card={preview} />
        </div>
      )}

      {(data.wishCards || []).length > 0 && <div style={{marginTop:16}}>
        <h4 style={{margin:"0 0 8px"}}>Nos cartes 💕</h4>
        {(data.wishCards || []).map(card => (
          <div key={card.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #f0e5e9"}}>
            <span style={{fontSize:22}}>{card.emoji}</span><span style={{flex:1,fontSize:".85rem"}}>{card.title}<small style={{display:"block",opacity:.55}}>{card.author || "Anonyme"}</small></span>
            <button className="icon" onClick={()=>setPreview(card)}><Gift size={14}/></button>
            <button className="icon" onClick={()=>removeCard(card.id)}><Trash2 size={14}/></button>
          </div>
        ))}
      </div>}

      {preview && (
        <div style={{marginTop:12}}>
          <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Répondre à cette carte…" />
          <button className="secondary" onClick={()=>addReply(preview)}><MessageCircleHeart size={15}/> Envoyer la réponse</button>
          {(preview.replies || []).map(r => <div key={r.id} style={{marginTop:7,padding:8,borderRadius:10,background:"#fff4f7",fontSize:".8rem"}}><b>{r.author}</b> · {r.text}</div>)}
        </div>
      )}
    </div>
  );
}

function WishCardView({ card }) {
  const [opened, setOpened] = useState(false);
  if (!opened) {
    return (
      <button
        onClick={() => setOpened(true)}
        aria-label="Ouvrir la carte de vœux"
        style={{position:"relative",overflow:"hidden",width:"100%",minHeight:300,border:0,borderRadius:24,padding:24,color:"#fff7fa",background:"linear-gradient(145deg,#7d2744,#3a1224 70%,#1f0a15)",boxShadow:"0 18px 35px rgba(67,15,35,.25)",cursor:"pointer"}}
      >
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 15%,rgba(255,220,230,.22),transparent 35%)"}} />
        <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:250}}>
          <div style={{fontSize:58,animation:"wishFloat 2.2s ease-in-out infinite"}}>💌</div>
          <div style={{fontSize:".7rem",letterSpacing:".2em",textTransform:"uppercase",opacity:.72,marginTop:12}}>Une petite surprise</div>
          <h3 style={{fontFamily:"'Great Vibes','Allura',cursive",fontSize:"2.1rem",fontWeight:400,margin:"12px 0",color:"#f6d6a3"}}>Pour {card.recipient}</h3>
          <div style={{padding:"9px 18px",borderRadius:999,border:"1px solid rgba(255,255,255,.28)",background:"rgba(255,255,255,.08)"}}>Appuie pour ouvrir ✨</div>
        </div>
        <style>{`@keyframes wishFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-7px) scale(1.05)}}`}</style>
      </button>
    );
  }

  return (
    <div className="wish-card-view" style={{position:"relative",overflow:"hidden",borderRadius:24,padding:"24px 18px",minHeight:300,color:"#fff7fa",background:"linear-gradient(145deg,#7d2744,#3a1224 70%,#1f0a15)",boxShadow:"0 18px 35px rgba(67,15,35,.25)",animation:"wishOpen .55s ease-out"}}>
      <div style={{position:"absolute",width:180,height:180,right:-70,top:-70,borderRadius:"50%",background:"radial-gradient(circle,rgba(227,168,87,.35),transparent 70%)"}} />
      <div style={{position:"relative",textAlign:"center"}}>
        <div style={{fontSize:46,animation:"wishFloat 2.2s ease-in-out infinite"}}>{card.emoji}</div>
        <div style={{fontSize:".7rem",letterSpacing:".2em",textTransform:"uppercase",opacity:.72}}>Une carte rien que pour toi</div>
        <h3 style={{fontFamily:"'Great Vibes','Allura',cursive",fontSize:"2.15rem",fontWeight:400,margin:"12px 0 5px",color:"#f6d6a3"}}>{card.title}</h3>
        <div style={{fontSize:".85rem",opacity:.75}}>Pour {card.recipient}</div>
        {card.photo && <img src={card.photo} alt="Souvenir" style={{width:"100%",maxHeight:150,objectFit:"cover",borderRadius:15,margin:"15px 0"}} />}
        <p style={{fontFamily:"Georgia,serif",fontSize:"1.05rem",lineHeight:1.6,margin:"16px 5px"}}>“{card.message}”</p>
        <div style={{fontSize:".8rem",opacity:.65}}>Avec tout mon amour · {card.author}</div>
        {card.musicUrl && <a href={card.musicUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",marginTop:12,color:"#fff",textDecoration:"none",padding:"7px 12px",borderRadius:999,border:"1px solid rgba(255,255,255,.25)"}}>♫ Écouter la musique</a>}
        <button onClick={()=>setOpened(false)} style={{display:"block",margin:"14px auto 0",padding:"7px 12px",borderRadius:999,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"#fff"}}>Refermer 💌</button>
      </div>
      <style>{`@keyframes wishFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-6px) scale(1.05)}} @keyframes wishOpen{0%{opacity:0;transform:scale(.94) translateY(10px)}100%{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

function More({ data, save, logout, room, name }) {
  const [v, setV] = useState(0);
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
      <WishCardStudio data={data} save={save} name={name} />

      <div className="card verse bigVerse">
        <BookOpenText size={22} />
        <p>« {verses[v][1]} »</p>
        <b>{verses[v][0]}</b>
        <div className="actions">
          <button onClick={toggle}>
            <Star size={15} fill={data.savedVerses.includes(verses[v][0]) ? "currentColor" : "none"} /> Favori
          </button>
          <button onClick={() => setV((v + 1) % verses.length)}>
            <RefreshCw size={15} /> Autre
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
        {challengesList.map(c => (
          <div key={c} className="row" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
            <button onClick={() => toggleChallenge(c)} style={{ background: 'none', border: 'none', padding: 0 }}>
              {data.challengesDone.includes(c) ? <Check size={16} color="#22c55e" /> : <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #ccc', display: 'inline-block' }} />}
            </button>
            <span style={{ flex: 1, textDecoration: data.challengesDone.includes(c) ? 'line-through' : 'none', opacity: data.challengesDone.includes(c) ? 0.5 : 1 }}>{c}</span>
          </div>
        ))}
        <div style={{ fontSize: '0.8rem', color: '#8A5568', marginTop: '8px' }}>
          {data.challengesDone.length} / {challengesList.length} défis relevés 🎉
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



