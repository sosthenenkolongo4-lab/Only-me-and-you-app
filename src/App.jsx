import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Heart, Home, MessageCircleHeart, Calendar, Wallet, Gamepad2, BookOpenText,
  Sparkles, Send, Camera, Gift, Check, Copy, LogOut, Users, Clock3,
  Plus, Trash2, Star, RefreshCw, Lock, ArrowRight, X, BellRing, Settings,
  MapPin, Navigation
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
  notes: [],
  goals: [],
  transactions: [],
  score: { you: 0, partner: 0 },
  savedVerses: [],
  settings: { reminders: true, sound: false }
};

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
  return {
    ...EMPTY, ...raw,
    names: { ...EMPTY.names, ...(raw?.names || {}) },
    score: { ...EMPTY.score, ...(raw?.score || {}) },
    settings: { ...EMPTY.settings, ...(raw?.settings || {}) },
    messages: raw?.messages || [],
    memories: raw?.memories || [],
    gameAnswers: raw?.gameAnswers || [],
    location: raw?.location || null,
    events: raw?.events || [],
    notes: raw?.notes || [],
    goals: raw?.goals || [],
    transactions: raw?.transactions || [],
    savedVerses: raw?.savedVerses || []
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

        const updatedNames = { ...existingData.names };
        if (role === "you" && !updatedNames.you) updatedNames.you = name;
        if (role === "partner" && !updatedNames.partner) updatedNames.partner = name;

        const updatedPayload = { ...existingData, names: updatedNames };
        setData(updatedPayload);

        const savedMyName = role === "you" ? updatedNames.you : updatedNames.partner;
        if (savedMyName && savedMyName !== name) {
          setName(savedMyName);
          localStorage.setItem("oamy:name", savedMyName);
        }

        await supabase.from("couple_rooms").update({ payload: updatedPayload, updated_at: new Date().toISOString() }).eq("room_code", roomCode);

        channel = supabase.channel("couple-" + roomCode)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "couple_rooms", filter: `room_code=eq.${roomCode}` },
            p => {
              const incoming = mergeData(p.new.payload);
              notifyIfNew(dataRef.current, incoming, name);
              setData(incoming);
            })
          .subscribe();
      } else {
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
        {tab === "home" && <HomeScreen data={data} name={name} setName={setName} role={role} setTab={setTab} save={save} />}
        {tab === "chat" && <Chat data={data} name={name} save={save} />}
        {tab === "story" && <Story data={data} save={save} name={name} />}
        {tab === "agenda" && <Agenda data={data} save={save} />}
        {tab === "money" && <Money data={data} save={save} />}
        {tab === "games" && <Games data={data} save={save} name={name} />}
        {tab === "more" && <More data={data} save={save} logout={logout} room={room} />}
      </main>
      <Nav tab={tab} setTab={setTab} />
    </Shell>
  );
}

function Pairing({ name, setName, join, error }) {
  const [mode, setMode] = useState("join");
  const [code, setCode] = useState(() => localStorage.getItem("oamy:lastRoom") || "");
  const [copied, setCopied] = useState(false);

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

function Shell({ children }) { return <div className="app">{children}</div>; }

function Nav({ tab, setTab }) {
  const items = [
    ["home", "Nous", Home],
    ["chat", "Messages", MessageCircleHeart],
    ["story", "Histoire", Sparkles],
    ["agenda", "Agenda", Calendar],
    ["games", "Jeux", Gamepad2],
    ["more", "Plus", BookOpenText]
  ];
  return (
    <nav>
      {items.map(([id, l, I]) => (
        <button className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}>
          <I size={17} />
          <span>{l}</span>
        </button>
      ))}
    </nav>
  );
}

function Title({ title, sub }) { return <div className="title"><h2>{title}</h2><p>{sub}</p></div>; }

function HomeScreen({ data, name, setName, role, setTab, save }) {
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

  const handleSaveDate = () => {
    save({ ...data, startDate: tempDate });
    setIsEditingDate(false);
  };

  const handleSaveNames = () => {
    const you = tempYou.trim();
    const partner = tempPartner.trim();

    const myNewName = role === "you" ? you : partner;

    if (myNewName) {
      setName(myNewName);
      localStorage.setItem("oamy:name", myNewName);
    }

    save({
      ...data,
      names: { you, partner }
    });

    setIsEditingNames(false);
  };

  return (
    <div className="home">
      <div className="hero">
        <div className="floating"><Heart fill="currentColor" /><Heart /><Heart fill="currentColor" /></div>
        <div className="online"><span /> Votre espace est synchronisé</div>

        <div className="couple-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
  const addNote = () => {
    if (!note.trim()) return;
    save({ ...data, notes: [{ id: uid(), text: note, date: new Date().toISOString(), author: name, reactions: [] }, ...data.notes] });
    setNote("");
  };
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
  const [title, setTitle] = useState(""), [date, setDate] = useState("");
  const [editingLoc, setEditingLoc] = useState(false);
  const [locLabel, setLocLabel] = useState(data.location?.label || "");
  const [locAddress, setLocAddress] = useState(data.location?.address || "");
  const [locLat, setLocLat] = useState(data.location?.latitude ?? null);
  const [locLng, setLocLng] = useState(data.location?.longitude ?? null);
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const mapRef = React.useRef(null);
  const leafletMapRef = React.useRef(null);
  const currentMarkerRef = React.useRef(null);
  const destinationMarkerRef = React.useRef(null);
  const routeLayerRef = React.useRef(null);
  const watchIdRef = React.useRef(null);

  useEffect(() => {
    if (!editingLoc) {
      setLocLabel(data.location?.label || "");
      setLocAddress(data.location?.address || "");
      setLocLat(data.location?.latitude ?? null);
      setLocLng(data.location?.longitude ?? null);
    }
  }, [data.location, editingLoc]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (leafletMapRef.current) leafletMapRef.current.remove();
    };
  }, []);

  const add = () => {
    if (!title || !date) return;
    save({ ...data, events: [...data.events, { id: uid(), title, date }] });
    setTitle(""); setDate("");
  };

  const saveLocation = () => {
    if (!locLabel.trim() && !locAddress.trim() && locLat == null) {
      setGpsError("Ajoute un nom, une adresse ou utilise ta position GPS.");
      return;
    }
    save({
      ...data,
      location: {
        label: locLabel.trim() || "Notre destination",
        address: locAddress.trim(),
        latitude: locLat,
        longitude: locLng,
        updatedAt: new Date().toISOString()
      }
    });
    setGpsError("");
    setEditingLoc(false);
  };

  const clearLocation = () => {
    save({ ...data, location: null });
    setLocLabel(""); setLocAddress(""); setLocLat(null); setLocLng(null);
    setGpsError(""); setRoute(null);
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) return;
      const result = await response.json();
      const address = result.display_name || "";
      if (address) setLocAddress(address);
      if (!locLabel.trim()) {
        const a = result.address || {};
        setLocLabel(
          a.amenity || a.shop || a.restaurant || a.hotel || a.road ||
          a.neighbourhood || a.suburb || a.city || "Ma position actuelle"
        );
      }
    } catch (_) {}
  };

  const startGps = (openNavigation = false) => {
    setGpsError("");
    if (!("geolocation" in navigator)) {
      setGpsError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setGpsLoading(true);

    const onSuccess = position => {
      const next = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading
      };
      setGps(next);
      setGpsLoading(false);
      if (openNavigation) setNavOpen(true);
    };

    const onError = err => {
      const messages = {
        1: "Autorisation GPS refusée. Autorise la localisation dans ton navigateur.",
        2: "Position GPS indisponible. Vérifie la localisation de ton téléphone.",
        3: "La récupération GPS a pris trop de temps. Réessaie."
      };
      setGpsError(messages[err.code] || "Impossible de récupérer ta position GPS.");
      setGpsLoading(false);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true, timeout: 15000, maximumAge: 0
    });

    if (watchIdRef.current == null) {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true, timeout: 20000, maximumAge: 3000
      });
    }
  };

  const saveCurrentAsDestination = async () => {
    if (!gps) {
      startGps();
      return;
    }
    setLocLat(gps.latitude);
    setLocLng(gps.longitude);
    await reverseGeocode(gps.latitude, gps.longitude);
    setLocLabel(prev => prev.trim() || "Ma position actuelle");
  };

  const loadLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    const cssId = "oamy-leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const existing = document.getElementById("oamy-leaflet-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "oamy-leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });

  const haversineKm = (a, b) => {
    if (!a || !b) return null;
    const R = 6371;
    const dLat = (b.latitude - a.latitude) * Math.PI / 180;
    const dLon = (b.longitude - a.longitude) * Math.PI / 180;
    const lat1 = a.latitude * Math.PI / 180;
    const lat2 = b.latitude * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const fetchRoute = async (from, to) => {
    if (!from || !to) return;
    setRouteLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("route");
      const json = await response.json();
      const r = json.routes?.[0];
      if (!r) throw new Error("route");
      setRoute({
        distance: r.distance / 1000,
        duration: r.duration / 60,
        geometry: r.geometry,
        steps: r.legs?.[0]?.steps || []
      });
    } catch (_) {
      const distance = haversineKm(from, to);
      setRoute(distance == null ? null : {
        distance,
        duration: distance ? distance / 30 * 60 : 0,
        geometry: null,
        steps: []
      });
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    if (!navOpen || !mapRef.current) return;
    let cancelled = false;
    loadLeaflet().then(L => {
      if (cancelled || !mapRef.current) return;
      if (!leafletMapRef.current) {
        leafletMapRef.current = L.map(mapRef.current, { zoomControl: false, attributionControl: true });
        L.control.zoom({ position: "bottomright" }).addTo(leafletMapRef.current);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(leafletMapRef.current);
      }

      const current = gps;
      const destination = data.location?.latitude != null && data.location?.longitude != null
        ? { latitude: Number(data.location.latitude), longitude: Number(data.location.longitude) }
        : null;

      const center = current || destination || { latitude: -4.325, longitude: 15.322 };
      leafletMapRef.current.setView([center.latitude, center.longitude], current || destination ? 15 : 12);

      if (current) {
        const icon = L.divIcon({
          className: "oamy-gps-marker",
          html: '<div class="oamy-gps-pulse"><div class="oamy-gps-arrow">➤</div></div>',
          iconSize: [48, 48], iconAnchor: [24, 24]
        });
        if (!currentMarkerRef.current) currentMarkerRef.current = L.marker([current.latitude, current.longitude], { icon }).addTo(leafletMapRef.current);
        else currentMarkerRef.current.setLatLng([current.latitude, current.longitude]);
      }

      if (destination) {
        const destIcon = L.divIcon({
          className: "oamy-destination-marker",
          html: '<div class="oamy-destination-pin">♥</div>',
          iconSize: [36, 36], iconAnchor: [18, 34]
        });
        if (!destinationMarkerRef.current) destinationMarkerRef.current = L.marker([destination.latitude, destination.longitude], { icon: destIcon }).addTo(leafletMapRef.current);
        else destinationMarkerRef.current.setLatLng([destination.latitude, destination.longitude]);
      }

      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }
      if (route?.geometry) {
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        routeLayerRef.current = L.polyline(coords, {
          color: "#C9184A", weight: 7, opacity: 0.9, lineCap: "round", lineJoin: "round"
        }).addTo(leafletMapRef.current);
        leafletMapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [45, 45] });
      }
      setTimeout(() => leafletMapRef.current?.invalidateSize(), 100);
    }).catch(() => setGpsError("Impossible de charger la carte. Vérifie ta connexion Internet."));
    return () => { cancelled = true; };
  }, [navOpen, gps, data.location, route]);

  useEffect(() => {
    if (navOpen && gps && data.location?.latitude != null && data.location?.longitude != null) {
      fetchRoute(gps, {
        latitude: Number(data.location.latitude), longitude: Number(data.location.longitude)
      });
    }
  }, [navOpen, gps, data.location?.latitude, data.location?.longitude]);

  const destination = data.location?.latitude != null && data.location?.longitude != null
    ? { latitude: Number(data.location.latitude), longitude: Number(data.location.longitude) }
    : null;
  const straightDistance = haversineKm(gps, destination);
  const distanceKm = route?.distance ?? straightDistance;
  const speedKmh = gps?.speed != null && gps.speed >= 0 ? gps.speed * 3.6 : null;
  const etaMinutes = route?.duration ?? (distanceKm != null ? (distanceKm / 30) * 60 : null);
  const firstStep = route?.steps?.find(s => s.maneuver?.type !== "arrive");
  const nextInstruction = firstStep ? (
    firstStep.maneuver?.type === "turn" || firstStep.maneuver?.type === "end of road"
      ? `${firstStep.maneuver.modifier === "left" ? "Tournez à gauche" : firstStep.maneuver.modifier === "right" ? "Tournez à droite" : "Continuez"}`
      : firstStep.maneuver?.type === "roundabout" ? "Prenez le rond-point" : "Continuez"
  ) : "En route vers notre destination";
  const nextStepDistance = firstStep ? firstStep.distance : null;

  const openMaps = () => {
    if (!destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${destination.latitude},${destination.longitude}`)}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const gpsStyles = `
    .oamy-nav-shell{position:relative;border-radius:22px;overflow:hidden;background:#160b10;box-shadow:0 18px 50px rgba(43,15,26,.25);border:1px solid rgba(227,168,87,.22)}
    .oamy-map{height:430px;background:#171116;filter:saturate(.72) contrast(1.03)}
    .oamy-map:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(22,11,16,.18),rgba(22,11,16,.03) 55%,rgba(22,11,16,.62))}
    .oamy-nav-top{position:absolute;z-index:500;top:12px;left:12px;right:12px;display:flex;gap:8px;align-items:center}
    .oamy-pill{background:rgba(22,11,16,.88);backdrop-filter:blur(12px);color:#FBF3EC;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:8px 11px;font-size:.76rem;box-shadow:0 8px 25px rgba(0,0,0,.2)}
    .oamy-instruction{position:absolute;z-index:500;top:58px;left:12px;right:12px;background:rgba(22,11,16,.94);backdrop-filter:blur(14px);color:#fff;border-radius:16px;padding:12px 14px;display:flex;align-items:center;gap:12px;border:1px solid rgba(227,168,87,.22)}
    .oamy-turn{width:42px;height:42px;border-radius:12px;background:#C9184A;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none}
    .oamy-bottom{position:absolute;z-index:500;left:12px;right:12px;bottom:12px;background:rgba(22,11,16,.95);backdrop-filter:blur(16px);border-radius:18px;padding:13px;border:1px solid rgba(255,255,255,.1);color:#fff}
    .oamy-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:11px}.oamy-stat{padding:6px 4px;text-align:center}.oamy-stat b{display:block;font-size:1.05rem}.oamy-stat span{display:block;color:#DDBBC5;font-size:.68rem;margin-top:2px}
    .oamy-actions{display:flex;gap:8px}.oamy-actions button{flex:1;border:0;border-radius:12px;padding:10px;font-weight:700;cursor:pointer}.oamy-start{background:linear-gradient(135deg,#E3A857,#C9184A);color:#fff}.oamy-secondary{background:rgba(255,255,255,.1);color:#fff}
    .oamy-gps-pulse{width:48px;height:48px;border-radius:50%;background:rgba(201,24,74,.18);border:2px solid #C9184A;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 8px rgba(201,24,74,.08)}.oamy-gps-arrow{width:30px;height:30px;border-radius:50%;background:#C9184A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;transform:rotate(-45deg);box-shadow:0 5px 16px rgba(201,24,74,.5)}
    .oamy-destination-pin{width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#E3A857;color:#2B0F1A;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #FBF3EC;box-shadow:0 5px 18px rgba(0,0,0,.35)}.oamy-destination-pin::first-letter{transform:rotate(45deg)}
    @media(max-width:520px){.oamy-map{height:410px}.oamy-stats{gap:2px}.oamy-stat b{font-size:.95rem}}
  `;

  return (
    <div>
      <style>{gpsStyles}</style>
      <Title title="Notre agenda" sub="Les dates qui comptent pour nous." />

      {data.location && !editingLoc ? (
        <div className="oamy-nav-shell" style={{marginBottom:14}}>
          <div ref={mapRef} className="oamy-map" />
          <div className="oamy-nav-top">
            <div className="oamy-pill"><Navigation size={13} style={{verticalAlign:'middle',marginRight:5}}/> GPS • Only Me & You</div>
            <button onClick={() => startGps(false)} className="oamy-pill" style={{marginLeft:'auto',cursor:'pointer',color:'#F3D9B1'}}>
              {gpsLoading ? "Localisation…" : "Actualiser"}
            </button>
          </div>
          <div className="oamy-instruction">
            <div className="oamy-turn">↖</div>
            <div style={{minWidth:0}}>
              <b style={{display:'block',fontSize:'1rem'}}>{routeLoading ? "Calcul de l'itinéraire…" : nextInstruction}</b>
              <span style={{display:'block',fontSize:'.72rem',color:'#DDBBC5',marginTop:3}}>
                {nextStepDistance != null ? `${Math.round(nextStepDistance)} m` : data.location.label || "Notre destination"}
              </span>
            </div>
          </div>
          <div className="oamy-bottom">
            <div className="oamy-stats">
              <div className="oamy-stat"><b>{distanceKm != null ? `${distanceKm.toFixed(1)} km` : "—"}</b><span>distance</span></div>
              <div className="oamy-stat"><b>{etaMinutes != null ? `${Math.max(1, Math.round(etaMinutes))} min` : "—"}</b><span>arrivée estimée</span></div>
              <div className="oamy-stat"><b>{speedKmh != null ? `${Math.round(speedKmh)} km/h` : "GPS actif"}</b><span>vitesse</span></div>
            </div>
            <div className="oamy-actions">
              <button className="oamy-secondary" onClick={() => setEditingLoc(true)}>Modifier</button>
              <button className="oamy-start" onClick={() => { startGps(true); }}>DÉMARRER</button>
              <button className="oamy-secondary" onClick={openMaps}>Maps</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3>📍 Notre prochaine destination</h3>
          <input value={locLabel} onChange={e => setLocLabel(e.target.value)} placeholder="Ex. Restaurant, chez Maman…" />
          <input value={locAddress} onChange={e => setLocAddress(e.target.value)} placeholder="Adresse ou lieu" />
          <button type="button" onClick={() => startGps(false)} disabled={gpsLoading} style={{width:'100%',marginTop:8,padding:11,borderRadius:10,border:'1px solid #e7b8c5',background:'#fff5f8',color:'#8b2440',cursor:gpsLoading?'wait':'pointer',fontWeight:700}}>
            <Navigation size={16} style={{verticalAlign:'middle',marginRight:6}} /> {gpsLoading ? "Localisation en cours…" : "Utiliser ma position GPS"}
          </button>
          {gps && <button type="button" onClick={saveCurrentAsDestination} className="secondary" style={{width:'100%',marginTop:8}}><MapPin size={15}/> Utiliser cette position comme destination</button>}
          {gps && <div style={{marginTop:8,padding:8,borderRadius:8,background:'#f5faf7',color:'#24734a',fontSize:'.78rem'}}>✓ GPS : {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}{gps.accuracy ? ` • précision ±${Math.round(gps.accuracy)} m` : ''}</div>}
          {gpsError && <div style={{marginTop:8,padding:8,borderRadius:8,background:'#fff0f0',color:'#c53030',fontSize:'.78rem'}}>{gpsError}</div>}
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button className="primary" onClick={saveLocation}><Check size={15}/> Enregistrer</button>
            {data.location && <button className="secondary" onClick={() => setEditingLoc(false)}>Annuler</button>}
            {data.location && <button className="secondary" onClick={clearLocation}><Trash2 size={14}/></button>}
          </div>
        </div>
      )}

      <div className="card">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex. Dîner, anniversaire…" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="primary" onClick={add}><Plus size={15}/> Ajouter</button>
      </div>
      <div className="list">
        {data.events.slice().sort((a,b) => a.date.localeCompare(b.date)).map(e => (
          <div className="row card" key={e.id}>
            <Calendar size={18}/><div><b>{e.title}</b><small>{fmtDate(e.date)}</small></div>
            <button className="icon" onClick={() => save({...data,events:data.events.filter(x => x.id !== e.id)})}><Trash2 size={15}/></button>
          </div>
        ))}
      </div>
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

  const nextQuestion = () => setQ(questions[Math.floor(Math.random() * questions.length)]);
  const nextCard = () => setCard(truthOrDare[Math.floor(Math.random() * truthOrDare.length)]);
  const nextWyr = () => setWyr(wouldYouRather[Math.floor(Math.random() * wouldYouRather.length)]);

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
          <button className="quick" onClick={() => { setMode("question"); nextQuestion(); }}><Sparkles size={19} /><span>Question du jour</span></button>
          <button className="quick" onClick={() => { setMode("truth"); nextCard(); }}><MessageCircleHeart size={19} /><span>Action ou Vérité</span></button>
          <button className="quick" onClick={() => { setMode("wyr"); nextWyr(); }}><Gift size={19} /><span>Tu préfères… ?</span></button>
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
          <MessageCircleHeart size={22} />
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

function More({ data, save, logout, room }) {
  const [v, setV] = useState(0);
  const toggle = () => save({
    ...data,
    savedVerses: data.savedVerses.includes(verses[v][0])
      ? data.savedVerses.filter(x => x !== verses[v][0])
      : [...data.savedVerses, verses[v][0]]
  });

  return (
    <div>
      <Title title="Plus pour nous" sub="Des petits détails qui rendent l'histoire spéciale." />
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

      <div className="card settings">
        <div><BellRing size={16} /> Rappels</div>
        <div><Users size={16} /> Code de votre couple : <b style={{ letterSpacing: '1px' }}>{room}</b></div>

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

