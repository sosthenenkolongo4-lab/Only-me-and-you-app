import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Heart, Home, MessageCircleHeart, Calendar, Wallet, Gamepad2, BookOpenText,
  Sparkles, Send, Camera, Gift, Check, Copy, LogOut, Users, Clock3,
  Plus, Trash2, Star, RefreshCw, Lock, ArrowRight, X, BellRing, Edit3
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
        const updatedNames = { ...existingData.names };
        
        // Inscription automatique du prénom dans le bon slot (Créateur vs Partenaire)
        if (role === "you") {
          updatedNames.you = name;
        } else {
          updatedNames.partner = name;
        }
        
        const updatedPayload = { ...existingData, names: updatedNames };
        setData(updatedPayload);

        // Sauvegarde de l'association des deux noms
        await supabase.from("couple_rooms").update({ payload: updatedPayload, updated_at: new Date().toISOString() }).eq("room_code", roomCode);

        // Synchronisation temps réel
        channel = supabase.channel("couple-" + roomCode)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "couple_rooms", filter: `room_code=eq.${roomCode}` },
            p => setData(mergeData(p.new.payload)))
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
    if (!r || !n) { setError("Saisis ton prénom et génère/entre un code."); return; }
    
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
          <button onClick={logout} className="logout-mini-btn" title="Déconnexion" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><LogOut size={16} /></button>
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
            <div className="code-tip"><Lock size={14} /> Partage ce code uniquement avec ton/ta partenaire.</div>
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
    </div>
  );
}

function SetupHelp() {
  return (
    <div className="setup">
      <Heart fill="currentColor" size={42} />
      <h1>Only Me & You</h1>
      <p>Configure Supabase pour activer le couple partagé.</p>
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

/* COMPOSANT DU COMPTE À REBOURS AVEC AFFICHAGE DEUX NOMS */
function CountdownCard({ data, save }) {
  const [now, setNow] = useState(new Date());
  const [showEdit, setShowEdit] = useState(false);
  const [selectedDate, setSelectedDate] = useState(data.startDate);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startDateObj = new Date((data.startDate || new Date().toISOString().slice(0, 10)) + "T00:00:00");
  const diffMs = Math.max(0, now - startDateObj);

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  // Extraction propre des deux prénoms
  const firstName = data.names.you || "Partenaire 1";
  const secondName = data.names.partner || "En attente...";

  const handleUpdateDate = () => {
    save({ ...data, startDate: selectedDate });
    setShowEdit(false);
  };

  return (
    <div className="card countdown-section" style={{
      background: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
      color: 'white',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
      boxShadow: '0 8px 20px rgba(255, 117, 140, 0.3)',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.9 }}>
        <Clock3 size={18} />
        <span style={{ fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Notre Compte à Rebours</span>
      </div>

      {/* AFFICHAGE DES DEUX NOMS DU COUPLE */}
      <h2 style={{ margin: '10px 0 4px 0', fontSize: '1.4rem' }}>
        {firstName} <Heart size={16} fill="currentColor" style={{ display: 'inline', margin: '0 4px' }} /> {secondName}
      </h2>

      <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', opacity: 0.9 }}>
        Ensemble depuis le {fmtDate(data.startDate)}
      </p>

      {/* COMPTEUR EN TEMPS RÉEL */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', margin: '15px 0' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '10px', borderRadius: '10px', minWidth: '60px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{days}</div>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Jours</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '10px', borderRadius: '10px', minWidth: '60px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{String(hours).padStart(2, '0')}</div>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Heures</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '10px', borderRadius: '10px', minWidth: '60px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{String(minutes).padStart(2, '0')}</div>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Min</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '10px', borderRadius: '10px', minWidth: '60px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{String(seconds).padStart(2, '0')}</div>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Sec</div>
        </div>
      </div>

      {!showEdit ? (
        <button 
          onClick={() => setShowEdit(true)} 
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            border: 'none',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '5px'
          }}
        >
          <Edit3 size={13} /> Changer la date de début
        </button>
      ) : (
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#333', padding: '12px', borderRadius: '12px', marginTop: '10px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>Date de rencontre / début :</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)} 
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleUpdateDate} className="primary" style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}>Valider</button>
            <button onClick={() => setShowEdit(false)} style={{ flex: 1, padding: '6px', fontSize: '0.8rem', background: '#ccc', border: 'none', borderRadius: '6px' }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeScreen({ data, name, role, setTab, save }) {
  const daysCount = Math.floor(Math.max(0, new Date() - new Date((data.startDate || new Date().toISOString().slice(0, 10)) + "T00:00:00")) / 86400000);
  const verse = verses[daysCount % verses.length];

  return (
    <div className="home">
      <CountdownCard data={data} save={save} />

      <div className="today card">
        <div><Sparkles size={18} /><b>Aujourd'hui pour nous</b></div>
        <p>{questions[daysCount % questions.length]}</p>
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
  const [label, setLabel] = useState(""), [amount, setAmount] = useState("");
  const total = data.transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
  const add = () => {
    const n = Number(amount);
    if (!label || !n) return;
    save({ ...data, transactions: [{ id: uid(), label, amount: n, type: "expense" }, ...data.transactions] });
    setLabel(""); setAmount("");
  };

  return (
    <div>
      <Title title="Nos projets & finances" sub="Construire ensemble, petit à petit." />
      <div className="moneyHero">
        <small>Solde du projet</small>
        <strong>{total.toLocaleString("fr-FR")} $</strong>
        <span>Chaque petit effort compte ❤️</span>
      </div>
      <div className="card">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex. Épargne voyage" />
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant" />
        <button className="primary" onClick={add}><Plus size={15} /> Ajouter une dépense</button>
      </div>
      {data.transactions.map(t => (
        <div className="row card" key={t.id}>
          <Wallet size={18} />
          <div><b>{t.label}</b><small>{t.amount} $</small></div>
        </div>
      ))}
    </div>
  );
}

function Games({ data, save }) {
  const [q, setQ] = useState(questions[0]), [answer, setAnswer] = useState("");
  const next = () => setQ(questions[Math.floor(Math.random() * questions.length)]);
  const saveA = () => {
    if (!answer.trim()) return;
    save({ ...data, notes: [{ id: uid(), text: "🎮 " + q + " — " + answer, date: new Date().toISOString() }, ...data.notes] });
    setAnswer("");
    next();
  };

  return (
    <div>
      <Title title="Jeux à deux" sub="Riez, parlez et découvrez-vous encore." />
      <div className="game card">
        <Sparkles size={22} />
        <div className="tag">QUESTION DU JOUR</div>
        <h3>{q}</h3>
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Votre réponse…" />
        <button className="primary" onClick={saveA}><Check size={15} /> Garder notre réponse</button>
        <button className="secondary" onClick={next}><RefreshCw size={15} /> Nouvelle question</button>
      </div>
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

