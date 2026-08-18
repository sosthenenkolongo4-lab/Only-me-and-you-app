import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Heart, Home, MessageCircleHeart, Calendar, Wallet, Gamepad2, BookOpenText,
  Sparkles, Send, Camera, Gift, Check, Copy, LogOut, Users, Clock3,
  Plus, Trash2, Star, RefreshCw, Lock, ArrowRight, X, BellRing, Settings
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
    events: raw?.events || [],
    notes: raw?.notes || [],
    goals: raw?.goals || [],
    transactions: raw?.transactions || [],
    savedVerses: raw?.savedVerses || []
  };
}

export default function App() {
  const [session, setSession] = useState(null);
  const [room, setRoom] = useState(localStorage.getItem("oamy:room") || "");
  const [name, setName] = useState(localStorage.getItem("oamy:name") || "");
  const [role, setRole] = useState(localStorage.getItem("oamy:role") || "you");
  const [data, setData] = useState(EMPTY);
  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        // Mettre à jour le nom attribué selon le rôle choisi
        const updatedNames = { ...existingData.names };
        if (role === "you" && !updatedNames.you) updatedNames.you = name;
        if (role === "partner" && !updatedNames.partner) updatedNames.partner = name;

        const updatedPayload = { ...existingData, names: updatedNames };
        setData(updatedPayload);

        // Sauvegarder la mise à jour des noms
        await supabase.from("couple_rooms").update({ payload: updatedPayload, updated_at: new Date().toISOString() }).eq("room_code", roomCode);

        // Synchronisation en temps réel via Supabase realtime
        channel = supabase.channel("couple-" + roomCode)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "couple_rooms", filter: `room_code=eq.${roomCode}` },
            p => setData(mergeData(p.new.payload)))
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
    localStorage.removeItem("oamy:room");
    localStorage.removeItem("oamy:name");
    localStorage.removeItem("oamy:role");
    setRoom("");
    setName("");
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
        {tab === "home" && <HomeScreen data={data} name={name} role={role} setTab={setTab} save={save} />}
        {tab === "chat" && <Chat data={data} name={name} save={save} />}
        {tab === "story" && <Story data={data} save={save} />}
        {tab === "agenda" && <Agenda data={data} save={save} />}
        {tab === "money" && <Money data={data} save={save} />}
        {tab === "games" && <Games data={data} save={save} />}
        {tab === "more" && <More data={data} save={save} logout={logout} room={room} />}
      </main>
      <Nav tab={tab} setTab={setTab} />
    </Shell>
  );
}

function Pairing({ name, setName, join, error }) {
  const [mode, setMode] = useState("join");
  const [code, setCode] = useState("");
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

function HomeScreen({ data, name, role, setTab, save }) {
  const [now, setNow] = useState(new Date());
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(data.startDate);

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

  const handleSaveDate = () => {
    save({ ...data, startDate: tempDate });
    setIsEditingDate(false);
  };

  return (
    <div className="home">
      <div className="hero">
        <div className="floating"><Heart fill="currentColor" /><Heart /><Heart fill="currentColor" /></div>
        <div className="online"><span /> Votre espace est synchronisé</div>

        <div className="couple-name">
          {myName} <b>♡</b> {partnerName}
        </div>

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

function Story({ data, save }) {
  const [note, setNote] = useState(""), [goal, setGoal] = useState("");
  const addNote = () => {
    if (!note.trim()) return;
    save({ ...data, notes: [{ id: uid(), text: note, date: new Date().toISOString() }, ...data.notes] });
    setNote("");
  };
  const addGoal = () => {
    if (!goal.trim()) return;
    save({ ...data, goals: [...data.goals, { id: uid(), text: goal, done: false }] });
    setGoal("");
  };
  const toggle = id => save({ ...data, goals: data.goals.map(g => g.id === id ? { ...g, done: !g.done } : g) });

  return (
    <div>
      <Title title="Notre histoire" sub="Les petits chapitres qui deviennent de grands souvenirs." />
      <div className="timeline">
        {data.notes.map(n => (
          <div className="timeline-item" key={n.id}>
            <div className="dot"><Heart size={12} fill="currentColor" /></div>
            <div className="card">
              <small>{new Date(n.date).toLocaleDateString("fr-FR")}</small>
              <p>{n.text}</p>
            </div>
          </div>
        ))}
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
  const add = () => {
    if (!title || !date) return;
    save({ ...data, events: [...data.events, { id: uid(), title, date }] });
    setTitle(""); setDate("");
  };

  return (
    <div>
      <Title title="Notre agenda" sub="Les dates qui comptent pour nous." />
      <div className="card">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex. Dîner, anniversaire…" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="primary" onClick={add}><Plus size={15} /> Ajouter</button>
      </div>
      <div className="list">
        {data.events.sort((a, b) => a.date.localeCompare(b.date)).map(e => (
          <div className="row card" key={e.id}>
            <Calendar size={18} />
            <div><b>{e.title}</b><small>{fmtDate(e.date)}</small></div>
            <button className="icon" onClick={() => save({ ...data, events: data.events.filter(x => x.id !== e.id) })}><Trash2 size={15} /></button>
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

function Games({ data, save }) {
  const [mode, setMode] = useState("menu");
  const [q, setQ] = useState(questions[0]);
  const [card, setCard] = useState(truthOrDare[0]);
  const [wyr, setWyr] = useState(wouldYouRather[0]);
  const [answer, setAnswer] = useState("");

  const nextQuestion = () => setQ(questions[Math.floor(Math.random() * questions.length)]);
  const nextCard = () => setCard(truthOrDare[Math.floor(Math.random() * truthOrDare.length)]);
  const nextWyr = () => setWyr(wouldYouRather[Math.floor(Math.random() * wouldYouRather.length)]);

  const saveAnswer = (prompt, text) => {
    if (!text || !text.trim()) return;
    save({ ...data, notes: [{ id: uid(), text: "🎮 " + prompt + " — " + text, date: new Date().toISOString() }, ...data.notes] });
    setAnswer("");
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
