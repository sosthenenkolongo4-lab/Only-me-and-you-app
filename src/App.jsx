import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Heart, Home, MessageCircleHeart, Calendar, Wallet, Gamepad2, BookOpenText,
  Sparkles, Send, Check, LogOut, Plus, Trash2, Star, RefreshCw, Lock
} from "lucide-react";

// Initialisation sécurisée de Supabase
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Structure de données par défaut
const EMPTY = {
  couple_id: "",
  names: { you: "", partner: "" },
  startDate: new Date().toISOString().slice(0, 10),
  messages: [],
  notes: [],
  events: [],
  goals: [],
  transactions: [],
  savedVerses: []
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

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const days = (start) => Math.max(0, Math.floor((Date.now() - new Date(start + "T00:00:00")) / 86400000));

function mergeData(raw) {
  return {
    ...EMPTY,
    ...raw,
    names: { ...EMPTY.names, ...(raw?.names || {}) },
    messages: raw?.messages || [],
    notes: raw?.notes || [],
    events: raw?.events || [],
    goals: raw?.goals || [],
    transactions: raw?.transactions || [],
    savedVerses: raw?.savedVerses || []
  };
}

/* ===================== CSS ET DESIGN INTÉGRÉS ===================== */
function GlobalStyles() {
  return (
    <style>{`
      :root {
        --bg-main: #0f172a;
        --bg-card: rgba(30, 41, 59, 0.75);
        --border-color: rgba(255, 255, 255, 0.12);
        --accent-pink: #ec4899;
        --accent-rose: #f43f5e;
        --text-light: #f8fafc;
        --text-dim: #94a3b8;
        --radius: 16px;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }

      body {
        background-color: var(--bg-main);
        color: var(--text-light);
        display: flex;
        justify-content: center;
        min-height: 100vh;
      }

      .app-container {
        width: 100%;
        max-width: 480px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%);
        position: relative;
        padding-bottom: 80px;
        box-shadow: 0 0 40px rgba(0,0,0,0.5);
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(12px);
        position: sticky;
        top: 0;
        z-index: 10;
        border-bottom: 1px solid var(--border-color);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 1.1rem;
        color: var(--accent-pink);
      }

      .brand span { color: var(--text-dim); }

      .sync-status {
        font-size: 0.75rem;
        color: #4ade80;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .sync-dot {
        width: 8px;
        height: 8px;
        background-color: #4ade80;
        border-radius: 50%;
        box-shadow: 0 0 8px #4ade80;
      }

      .main-content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 480px;
        height: 65px;
        background: rgba(15, 23, 42, 0.92);
        backdrop-filter: blur(12px);
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 100;
      }

      .bottom-nav button {
        background: none;
        border: none;
        color: var(--text-dim);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.2s ease;
        flex: 1;
      }

      .bottom-nav button.active {
        color: var(--accent-pink);
      }

      .card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        backdrop-filter: blur(8px);
      }

      .page-title h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 4px; }
      .page-title p { font-size: 0.85rem; color: var(--text-dim); }

      input, select, textarea {
        width: 100%;
        padding: 12px 14px;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        color: white;
        font-size: 0.95rem;
        outline: none;
      }

      input:focus, textarea:focus { border-color: var(--accent-pink); }

      button.primary {
        background: linear-gradient(135deg, var(--accent-pink), var(--accent-rose));
        color: white;
        border: none;
        padding: 12px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: opacity 0.2s;
      }

      button.primary:hover { opacity: 0.9; }

      button.secondary {
        background: rgba(255, 255, 255, 0.08);
        color: white;
        border: 1px solid var(--border-color);
        padding: 12px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .pair-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 24px;
        text-align: center;
        gap: 16px;
      }

      .pair-card {
        width: 100%;
        max-width: 360px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        text-align: left;
      }

      .seg {
        display: flex;
        background: rgba(0, 0, 0, 0.3);
        padding: 4px;
        border-radius: 10px;
      }

      .seg button {
        flex: 1;
        padding: 8px;
        background: none;
        border: none;
        color: var(--text-dim);
        border-radius: 8px;
        cursor: pointer;
      }

      .seg button.on {
        background: var(--accent-pink);
        color: white;
      }

      .home-screen {
        display: flex;
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .days-card {
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(244, 63, 94, 0.2));
        border: 1px solid var(--accent-pink);
        border-radius: var(--radius);
        padding: 30px;
        text-align: center;
      }

      .days-num {
        font-size: 3.5rem;
        font-weight: 800;
        color: var(--accent-pink);
      }

      .couple-names { font-size: 1.2rem; font-weight: 600; }
      .days-label { font-size: 0.9rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }

      .chat-box {
        height: 380px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .msg {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .msg.mine { align-self: flex-end; background: var(--accent-pink); color: white; }
      .msg.theirs { align-self: flex-start; background: rgba(255, 255, 255, 0.1); }
      .msg small { font-size: 0.65rem; opacity: 0.7; }

      .composer { display: flex; gap: 8px; margin-top: 12px; }
      .composer button {
        background: var(--accent-pink);
        border: none;
        color: white;
        padding: 0 16px;
        border-radius: 10px;
        cursor: pointer;
      }

      .timeline { display: flex; flex-direction: column; gap: 12px; }
      .timeline-item { display: flex; align-items: flex-start; gap: 12px; }
      .timeline-item .dot {
        background: var(--accent-pink);
        color: white;
        padding: 6px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 4px;
      }
      .timeline-item .card { flex: 1; }

      .inline { display: flex; gap: 8px; }
      .inline input { flex: 1; }
      .inline button {
        background: var(--accent-pink);
        border: none;
        color: white;
        padding: 0 14px;
        border-radius: 10px;
        cursor: pointer;
      }

      .goal-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 12px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        color: white;
        text-align: left;
        cursor: pointer;
      }

      .goal-item.done { opacity: 0.5; text-decoration: line-through; }
      .circle { width: 15px; height: 15px; border: 2px solid var(--text-dim); border-radius: 50%; display: inline-block; }

      .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .money-hero {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .money-hero strong { font-size: 2rem; }

      .list { display: flex; flex-direction: column; gap: 10px; }
      .icon-btn { background: none; border: none; color: #f87171; cursor: pointer; padding: 6px; }
      .empty-state { text-align: center; color: var(--text-dim); font-size: 0.9rem; padding: 12px; }

      .game-card, .verse-card { align-items: center; text-align: center; gap: 14px; }
      .tag {
        background: rgba(236, 72, 153, 0.2);
        color: var(--accent-pink);
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
      }

      .actions { display: flex; gap: 10px; width: 100%; }
      .actions button {
        flex: 1;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--border-color);
        color: white;
        padding: 10px;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .code-input { text-align: center; letter-spacing: 4px; font-weight: bold; }
      .code-tip { font-size: 0.75rem; color: var(--text-dim); display: flex; align-items: center; gap: 6px; }
      .loading-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: var(--accent-pink); }
    `}</style>
  );
}

/* ===================== GESTIONNAIRE D'ERREURS ===================== */
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: "white", background: "#7f1d1d", minHeight: "100vh" }}>
          <h2>Une erreur s'est produite</h2>
          <pre style={{ background: "rgba(0,0,0,0.3)", padding: 16, borderRadius: 8, overflow: "auto", marginTop: 12 }}>
            {this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ===================== APPLICATION PRINCIPALE ===================== */
function App() {
  const [session, setSession] = useState(null);
  const [room, setRoom] = useState(localStorage.getItem("oamy:room") || "");
  const [name, setName] = useState(localStorage.getItem("oamy:name") || "");
  const [data, setData] = useState(EMPTY);
  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !room) {
      setLoading(false);
      return;
    }

    let channel;
    (async () => {
      setLoading(true);
      const { data: rows, error: e } = await supabase
        .from("couple_rooms")
        .select("*")
        .eq("room_code", room)
        .limit(1);

      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }

      if (rows?.[0]) {
        setData(mergeData(rows[0].payload));
        channel = supabase
          .channel("couple-" + room)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "couple_rooms", filter: `room_code=eq.${room}` },
            (p) => setData(mergeData(p.new.payload))
          )
          .subscribe();
      } else {
        const fresh = { ...EMPTY, couple_id: room, names: { you: name } };
        const { error: ins } = await supabase.from("couple_rooms").insert({ room_code: room, payload: fresh });
        if (ins) setError(ins.message);
        else setData(fresh);
      }
      setLoading(false);
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [session, room, name]);

  async function login() {
    setError("");
    if (!supabase) {
      setError("Les clés Supabase ne sont pas configurées.");
      return;
    }
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) setError(error.message);
    else setSession(data.session);
  }

  async function join(overrideRoom) {
    const r = (typeof overrideRoom === "string" ? overrideRoom : room).trim().toUpperCase();
    const n = name.trim();
    if (!r || !n) {
      setError("Remplis ton prénom et le code de couple.");
      return;
    }
    localStorage.setItem("oamy:room", r);
    localStorage.setItem("oamy:name", n);
    setRoom(r);
    setName(n);
    await login();
  }

  async function save(next) {
    setData(next);
    if (!supabase || !room) return;
    const { error: e } = await supabase
      .from("couple_rooms")
      .update({ payload: next, updated_at: new Date().toISOString() })
      .eq("room_code", room);
    if (e) setError(e.message);
  }

  function leave() {
    localStorage.removeItem("oamy:room");
    localStorage.removeItem("oamy:name");
    setRoom("");
    setName("");
    setData(EMPTY);
    setTab("home");
  }

  if (!supabase) return <SetupHelp />;

  if (!room || !session) {
    return (
      <Shell>
        <Pairing
          name={name}
          setName={setName}
          room={room}
          setRoom={setRoom}
          join={join}
          create={join}
          error={error}
        />
      </Shell>
    );
  }

  if (loading) return <Shell><Loading /></Shell>;

  return (
    <Shell>
      <div className="topbar">
        <div className="brand">
          <Heart fill="currentColor" size={18} /> Only Me <span>&</span> You
        </div>
        <div className="sync-status">
          <span className="sync-dot" /> En ligne
        </div>
      </div>

      <main className="main-content">
        {tab === "home" && <HomeScreen data={data} name={name} />}
        {tab === "chat" && <Chat data={data} name={name} save={save} />}
        {tab === "story" && <Story data={data} save={save} />}
        {tab === "agenda" && <Agenda data={data} save={save} />}
        {tab === "money" && <Money data={data} save={save} />}
        {tab === "games" && <Games data={data} save={save} />}
        {tab === "more" && <More data={data} save={save} leave={leave} />}
      </main>

      <Nav tab={tab} setTab={setTab} />
    </Shell>
  );
}

/* ===================== SOUS-COMPOSANTS ===================== */

function Shell({ children }) {
  return (
    <div className="app-container">
      <GlobalStyles />
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="loading-screen">
      <Heart fill="currentColor" size={42} />
      <p>Chargement de votre espace...</p>
    </div>
  );
}

function SetupHelp() {
  return (
    <Shell>
      <div className="pair-page">
        <h2>Supabase non configuré</h2>
        <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
          Ajoute tes identifiants dans le fichier <code>.env.local</code> de ton projet :
        </p>
        <div className="card" style={{ width: "100%", fontSize: "0.8rem", textAlign: "left" }}>
          <code>VITE_SUPABASE_URL=ton_url</code><br />
          <code>VITE_SUPABASE_ANON_KEY=ta_cle</code>
        </div>
      </div>
    </Shell>
  );
}

function Title({ title, sub }) {
  return (
    <div className="page-title">
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

function Nav({ tab, setTab }) {
  const items = [
    { id: "home", icon: Home, label: "Accueil" },
    { id: "chat", icon: MessageCircleHeart, label: "Chat" },
    { id: "story", icon: BookOpenText, label: "Histoire" },
    { id: "agenda", icon: Calendar, label: "Agenda" },
    { id: "money", icon: Wallet, label: "Projets" },
    { id: "games", icon: Gamepad2, label: "Jeux" },
    { id: "more", icon: Sparkles, label: "Plus" }
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Pairing({ name, setName, room, setRoom, join, create, error }) {
  const [mode, setMode] = useState("join");
  const [genCode] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());

  return (
    <div className="pair-page">
      <Heart fill="currentColor" size={48} style={{ color: "var(--accent-pink)" }} />
      <h1 style={{ fontSize: "1.8rem" }}>Only Me & You</h1>
      <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>Votre espace intime et partagé pour deux.</p>

      <div className="pair-card">
        <div className="seg">
          <button className={mode === "join" ? "on" : ""} onClick={() => setMode("join")}>Rejoindre</button>
          <button className={mode === "create" ? "on" : ""} onClick={() => setMode("create")}>Créer</button>
        </div>

        <label style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Ton prénom</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Sosthène" />

        {mode === "create" ? (
          <>
            <label style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Code du couple généré</label>
            <input value={genCode} readOnly className="code-input" />
            <div className="code-tip">
              <Lock size={14} /> Partage ce code uniquement à ton partenaire.
            </div>
            <button className="primary" onClick={() => create(genCode)}>
              <Heart size={16} /> Créer notre espace
            </button>
          </>
        ) : (
          <>
            <label style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Code du couple</label>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value.toUpperCase())}
              placeholder="Ex. LOVE123"
            />
            <button className="primary" onClick={join}>
              <Heart size={16} /> Rejoindre l'espace
            </button>
          </>
        )}

        {error && <div style={{ color: "#f87171", fontSize: "0.8rem" }}>{error}</div>}
      </div>
    </div>
  );
}

function HomeScreen({ data, name }) {
  const d = days(data.startDate);
  const partnerName = data.names?.you === name ? data.names?.partner : data.names?.you;

  return (
    <div className="home-screen">
      <div className="days-card">
        <div className="days-num">{d}</div>
        <div className="days-label">Jours d'amour ensemble</div>
      </div>
      <div className="couple-names">
        {name || "Moi"} ❤️ {partnerName || "Partenaire"}
      </div>
    </div>
  );
}

function Chat({ data, name, save }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    save({
      ...data,
      messages: [
        ...data.messages,
        { id: uid(), from: name, text: text.trim(), date: new Date().toISOString() }
      ]
    });
    setText("");
  };

  return (
    <div>
      <Title title="Notre Discussion" sub="Espace de discussion privé." />
      <div className="chat-box card">
        {data.messages.length === 0 && <div className="empty-state">Envoyez votre premier mot doux...</div>}
        {data.messages.map((m) => (
          <div className={"msg " + (m.from === name ? "mine" : "theirs")} key={m.id}>
            <span>{m.text}</span>
            <small>{m.from} • {new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</small>
          </div>
        ))}
      </div>
      <div className="composer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Écris un message..."
        />
        <button onClick={send}><Send size={18} /></button>
      </div>
    </div>
  );
}

function Story({ data, save }) {
  const [note, setNote] = useState("");
  const [goal, setGoal] = useState("");

  const addNote = () => {
    if (!note.trim()) return;
    save({
      ...data,
      notes: [{ id: uid(), text: note, date: new Date().toISOString() }, ...data.notes]
    });
    setNote("");
  };

  const addGoal = () => {
    if (!goal.trim()) return;
    save({
      ...data,
      goals: [...data.goals, { id: uid(), text: goal, done: false }]
    });
    setGoal("");
  };

  const toggleGoal = (id) =>
    save({
      ...data,
      goals: data.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g))
    });

  return (
    <div>
      <Title title="Notre Histoire" sub="Vos souvenirs et objectifs partagés." />

      <div className="timeline">
        {data.notes.map((n) => (
          <div className="timeline-item" key={n.id}>
            <div className="dot"><Heart size={12} fill="currentColor" /></div>
            <div className="card">
              <small style={{ color: "var(--text-dim)" }}>{new Date(n.date).toLocaleDateString("fr-FR")}</small>
              <p>{n.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Nouveau Souvenir</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Écris une note ou un souvenir..."
        />
        <button className="primary" onClick={addNote}><Plus size={16} /> Enregistrer</button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Objectifs & Rêves</h3>
        {data.goals.map((g) => (
          <button className={"goal-item " + (g.done ? "done" : "")} key={g.id} onClick={() => toggleGoal(g.id)}>
            <span>{g.done ? <Check size={14} /> : <span className="circle" />}</span>
            {g.text}
          </button>
        ))}
        <div className="inline" style={{ marginTop: 8 }}>
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ajouter un projet..." />
          <button onClick={addGoal}><Plus size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function Agenda({ data, save }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const add = () => {
    if (!title || !date) return;
    save({
      ...data,
      events: [...data.events, { id: uid(), title, date }]
    });
    setTitle("");
    setDate("");
  };

  return (
    <div>
      <Title title="Agenda" sub="Vos rendez-vous et moments importants." />
      <div className="card">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Événement (ex. Sortie restaurant)" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="primary" onClick={add}><Plus size={16} /> Ajouter à l'agenda</button>
      </div>
      <div className="list" style={{ marginTop: 16 }}>
        {data.events.map((e) => (
          <div className="row card" key={e.id}>
            <Calendar size={18} />
            <div style={{ flex: 1 }}>
              <b>{e.title}</b>
              <div><small style={{ color: "var(--text-dim)" }}>{fmtDate(e.date)}</small></div>
            </div>
            <button className="icon-btn" onClick={() => save({ ...data, events: data.events.filter((x) => x.id !== e.id) })}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Money({ data, save }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("income");

  const total = data.transactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);

  const add = () => {
    const n = Number(amount);
    if (!label.trim() || !n || n <= 0) return;
    save({
      ...data,
      transactions: [{ id: uid(), label: label.trim(), amount: n, type, date: new Date().toISOString() }, ...data.transactions]
    });
    setLabel("");
    setAmount("");
  };

  return (
    <div>
      <Title title="Projets & Budget" sub="Gérez vos dépenses et épargnes communes." />
      <div className="money-hero">
        <small style={{ color: "var(--text-dim)" }}>Solde commun</small>
        <strong style={{ color: total >= 0 ? "#4ade80" : "#f87171" }}>{total.toLocaleString("fr-FR")} $</strong>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="seg">
          <button className={type === "income" ? "on" : ""} onClick={() => setType("income")}>+ Entrée</button>
          <button className={type === "expense" ? "on" : ""} onClick={() => setType("expense")}>− Dépense</button>
        </div>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Description (ex. Épargne)" />
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant" />
        <button className="primary" onClick={add}><Plus size={16} /> Valider</button>
      </div>
      <div className="list" style={{ marginTop: 16 }}>
        {data.transactions.map((t) => (
          <div className="row card" key={t.id}>
            <Wallet size={18} />
            <div style={{ flex: 1 }}>
              <b>{t.label}</b>
              <div><small style={{ color: "var(--text-dim)" }}>{t.type === "income" ? "+" : "-"}{t.amount} $</small></div>
            </div>
            <button className="icon-btn" onClick={() => save({ ...data, transactions: data.transactions.filter((x) => x.id !== t.id) })}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Games({ data, save }) {
  const [q, setQ] = useState(questions[0]);
  const [answer, setAnswer] = useState("");

  const next = () => setQ(questions[Math.floor(Math.random() * questions.length)]);

  const saveA = () => {
    if (!answer.trim()) return;
    save({
      ...data,
      notes: [{ id: uid(), text: "🎮 " + q + " — " + answer, date: new Date().toISOString() }, ...data.notes]
    });
    setAnswer("");
    next();
  };

  return (
    <div>
      <Title title="Jeux & Questions" sub="Pour mieux se découvrir chaque jour." />
      <div className="card game-card">
        <Sparkles size={24} style={{ color: "var(--accent-pink)" }} />
        <div className="tag">QUESTION DU JOUR</div>
        <h3>{q}</h3>
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Ta réponse..." />
        <button className="primary" onClick={saveA}><Check size={16} /> Enregistrer la réponse</button>
        <button className="secondary" onClick={next}><RefreshCw size={16} /> Question suivante</button>
      </div>
    </div>
  );
}

function More({ data, save, leave }) {
  const [v, setV] = useState(0);
  const [you, setYou] = useState(data.names.you || "");
  const [partner, setPartner] = useState(data.names.partner || "");
  const [start, setStart] = useState(data.startDate);

  const saveNames = () =>
    save({
      ...data,
      names: { you: you.trim(), partner: partner.trim() },
      startDate: start
    });

  return (
    <div>
      <Title title="Paramètres" sub="Personnalisation de votre espace." />
      <div className="card">
        <h3>Configuration du couple</h3>
        <input value={you} onChange={(e) => setYou(e.target.value)} placeholder="Ton prénom" />
        <input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="Prénom du partenaire" />
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <button className="primary" onClick={saveNames}><Check size={16} /> Enregistrer</button>
      </div>

      <div className="card verse-card" style={{ marginTop: 16 }}>
        <BookOpenText size={24} style={{ color: "var(--accent-pink)" }} />
        <p>« {verses[v][1]} »</p>
        <b>{verses[v][0]}</b>
        <button className="secondary" onClick={() => setV((v + 1) % verses.length)}>
          <RefreshCw size={15} /> Verset suivant
        </button>
      </div>

      <button className="primary" onClick={leave} style={{ marginTop: 20, background: "#ef4444", width: "100%" }}>
        <LogOut size={16} /> Se déconnecter
      </button>
    </div>
  );
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

