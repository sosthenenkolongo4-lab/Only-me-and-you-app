import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Heart, Home, MessageCircleHeart, Calendar, Wallet, Gamepad2, BookOpenText,
  Sparkles, Send, Camera, Gift, Check, Copy, LogOut, Users, Clock3,
  Plus, Trash2, Star, RefreshCw, Lock, ArrowRight, X, BellRing
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const EMPTY = {
  couple_id: "",
  names: { you: "", partner: "" },
  startDate: new Date().toISOString().slice(0,10),
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
  ["1 Corinthiens 13:4-7","L'amour est patient, il est plein de bonté ; l'amour ne cherche point son intérêt, ne s'irrite point et supporte tout."],
  ["Ecclésiaste 4:9-12","Deux valent mieux qu'un... et la corde à trois fils ne se rompt pas facilement."],
  ["Colossiens 3:14","Par-dessus tout cela, revêtez-vous de l'amour, qui est le lien de la perfection."],
  ["Cantique des cantiques 8:7","Les grandes eaux ne peuvent éteindre l'amour, et les fleuves ne le submergeraient pas."],
  ["Romains 12:10","Par amour fraternel, soyez pleins d'affection les uns pour les autres."]
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
const fmtDate = d => new Date(d+"T00:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"});
const days = start => Math.max(0, Math.floor((Date.now()-new Date(start+"T00:00:00"))/86400000));

function mergeData(raw) {
  return {
    ...EMPTY, ...raw,
    names: {...EMPTY.names, ...(raw?.names||{})},
    score: {...EMPTY.score, ...(raw?.score||{})},
    settings: {...EMPTY.settings, ...(raw?.settings||{})},
    messages: raw?.messages || [],
    memories: raw?.memories || [],
    events: raw?.events || [],
    notes: raw?.notes || [],
    goals: raw?.goals || [],
    transactions: raw?.transactions || [],
    savedVerses: raw?.savedVerses || []
  };
}

export default function App(){
  const [session,setSession]=useState(null);
  const [room,setRoom]=useState(localStorage.getItem("oamy:room")||"");
  const [name,setName]=useState(localStorage.getItem("oamy:name")||"");
  const [role,setRole]=useState(localStorage.getItem("oamy:role")||"you");
  const [data,setData]=useState(EMPTY);
  const [tab,setTab]=useState("home");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    if(!supabase){ setLoading(false); return; }
    supabase.auth.getSession().then(({data:{session}})=>setSession(session));
    const {data:listener}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>listener.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session || !room){ setLoading(false); return; }
    let channel;
    (async()=>{
      setLoading(true);
      const {data:rows,error:e}=await supabase.from("couple_rooms").select("*").eq("room_code",room).limit(1);
      if(e){setError(e.message);setLoading(false);return;}
      if(rows?.[0]){
        setData(mergeData(rows[0].payload));
        channel=supabase.channel("couple-"+room)
          .on("postgres_changes",{event:"UPDATE",schema:"public",table:"couple_rooms",filter:`room_code=eq.${room}`},
            p=>setData(mergeData(p.new.payload)))
          .subscribe();
      } else {
        const fresh={...EMPTY,couple_id:room,names:{you:name}};
        const {error:ins}=await supabase.from("couple_rooms").insert({room_code:room,payload:fresh});
        if(ins) setError(ins.message); else setData(fresh);
      }
      setLoading(false);
    })();
    return ()=>{if(channel)supabase.removeChannel(channel)};
  },[session,room,name]);

  async function login(){
    setError("");
    if(!supabase){setError("Ajoute les clés Supabase dans .env.local.");return;}
    const {data,error}=await supabase.auth.signInAnonymously();
    if(error)setError(error.message); else setSession(data.session);
  }

  async function join(){
    const r=room.trim().toUpperCase();
    const n=name.trim();
    if(!r||!n){setError("Entre ton prénom et le code du couple.");return;}
    localStorage.setItem("oamy:room",r); localStorage.setItem("oamy:name",n); localStorage.setItem("oamy:role",role);
    setRoom(r); setName(n); await login();
  }

  async function save(next){
    setData(next);
    if(!supabase || !room) return;
    const {error:e}=await supabase.from("couple_rooms").update({payload:next,updated_at:new Date().toISOString()}).eq("room_code",room);
    if(e)setError(e.message);
  }

  function leave(){
    localStorage.removeItem("oamy:room");
    setRoom(""); setData(EMPTY); setTab("home");
  }

  if(!supabase) return <SetupHelp />;
  if(!room || !session) return <Pairing name={name} setName={setName} room={room} setRoom={setRoom} role={role} setRole={setRole} join={join} error={error}/>;
  if(loading) return <Loading/>;

  return <Shell>
    <div className="topbar">
      <div className="brand"><Heart fill="currentColor" size={17}/> Only Me <span>&</span> You</div>
      <div className="sync"><span/> Synchronisé</div>
    </div>
    <main className="main">
      {tab==="home" && <HomeScreen data={data} name={name} role={role} setTab={setTab}/>}
      {tab==="chat" && <Chat data={data} name={name} save={save}/>}
      {tab==="story" && <Story data={data} save={save}/>}
      {tab==="agenda" && <Agenda data={data} save={save}/>}
      {tab==="money" && <Money data={data} save={save}/>}
      {tab==="games" && <Games data={data} save={save}/>}
      {tab==="more" && <More data={data} save={save}/>}
    </main>
    <Nav tab={tab} setTab={setTab}/>
  </Shell>;
}

function Pairing({name,setName,room,setRoom,role,setRole,join,error}){
  const [mode,setMode]=useState("join");
  const newCode=()=>setRoom(Math.random().toString(36).slice(2,8).toUpperCase());
  return <div className="pair-page">
    <div className="pair-glow"/>
    <div className="pair-logo"><Heart fill="currentColor" size={42}/></div>
    <div className="script">Only Me & You</div>
    <h1>Notre petit monde.</h1>
    <p>Un espace privé pour écrire, partager et faire grandir votre histoire à deux.</p>
    <div className="pair-card">
      <div className="seg"><button className={mode==="join"?"on":""} onClick={()=>setMode("join")}>Rejoindre</button><button className={mode==="create"?"on":""} onClick={()=>{setMode("create");newCode()}}>Créer</button></div>
      <label>Ton prénom<input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex. Sosthene"/></label>
      <label>Je suis<select value={role} onChange={e=>setRole(e.target.value)}><option value="you">Moi</option><option value="partner">Mon/ma partenaire</option></select></label>
      <label>Code de notre couple<input value={room} onChange={e=>setRoom(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={12}/></label>
      {mode==="create" && <div className="code-tip"><Lock size={14}/> Garde ce code privé et partage-le uniquement avec ta partenaire.</div>}
      <button className="primary" onClick={join}><Heart size={16}/> Entrer dans notre histoire</button>
      {error && <div className="error">{error}</div>}
    </div>
    <small>Synchronisation en temps réel • Chaque appareil voit les mêmes données</small>
  </div>
}

function SetupHelp(){
 return <div className="setup"><Heart fill="currentColor" size={42}/><h1>Only Me & You</h1><p>Configure Supabase pour activer le couple partagé.</p><pre>{`1. Copie .env.example vers .env.local
2. Mets VITE_SUPABASE_URL
3. Mets VITE_SUPABASE_ANON_KEY
4. Lance: npm install && npm run dev`}</pre></div>
}
function Loading(){return <div className="loading"><Heart fill="currentColor" size={34}/><p>Ouverture de votre petit monde…</p></div>}

function Shell({children}){return <div className="app">{children}</div>}
function Nav({tab,setTab}){
 const items=[["home","Nous",Home],["chat","Messages",MessageCircleHeart],["story","Histoire",Sparkles],["agenda","Agenda",Calendar],["games","Jeux",Gamepad2],["more","Plus",BookOpenText]];
 return <nav>{items.map(([id,l,I])=><button className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}><I size={17}/><span>{l}</span></button>)}</nav>
}
function Title({title,sub}){return <div className="title"><h2>{title}</h2><p>{sub}</p></div>}

function HomeScreen({data,name,setTab}){
 const [now,setNow]=useState(new Date()); useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t)},[]);
 const d=days(data.startDate), h=String(Math.floor((now-new Date(data.startDate+"T00:00:00"))/3600000)%24).padStart(2,"0"),m=String(now.getMinutes()).padStart(2,"0"),s=String(now.getSeconds()).padStart(2,"0");
 const partner=data.names.you===name?data.names.partner:data.names.you;
 const verse=verses[d%verses.length];
 return <div className="home">
  <div className="hero">
   <div className="floating"><Heart fill="currentColor"/><Heart/><Heart fill="currentColor"/></div>
   <div className="online"><span/> Votre espace est synchronisé</div>
   <div className="couple-name">{data.names.you||name} <b>♡</b> {partner||"ta partenaire"}</div>
   <div className="label">ensemble depuis</div><div className="big">{d}</div><div className="days">JOURS</div>
   <div className="timer">{h}h {m}m {s}s</div><div className="since">{fmtDate(data.startDate)}</div>
  </div>
  <div className="today card"><div><Sparkles size={18}/><b>Aujourd'hui pour nous</b></div><p>{questions[d%questions.length]}</p><button onClick={()=>setTab("chat")}>Répondre à deux <ArrowRight size={14}/></button></div>
  <div className="grid4">
   <Quick icon={MessageCircleHeart} text="Écrire" onClick={()=>setTab("chat")}/><Quick icon={Camera} text="Souvenir" onClick={()=>setTab("story")}/><Quick icon={Gift} text="Surprise" onClick={()=>setTab("story")}/><Quick icon={Wallet} text="Projet" onClick={()=>setTab("money")}/>
  </div>
  <div className="card verse"><BookOpenText size={17}/><p>« {verse[1]} »</p><b>{verse[0]}</b></div>
 </div>
}
function Quick({icon:I,text,onClick}){return <button className="quick" onClick={onClick}><I size={19}/><span>{text}</span></button>}

function Chat({data,name,save}){
 const [text,setText]=useState("");
 const send=()=>{if(!text.trim())return;save({...data,messages:[...data.messages,{id:uid(),from:name,text:text.trim(),date:new Date().toISOString()}]});setText("")};
 return <div><Title title="Notre conversation" sub="Un petit espace rien qu'à vous deux."/><div className="chat card">{data.messages.length===0&&<div className="empty">Commencez votre conversation ❤️</div>}{data.messages.map(m=><div className={"msg "+(m.from===name?"mine":"theirs")} key={m.id}><span>{m.text}</span><small>{m.from} · {new Date(m.date).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</small></div>)}</div><div className="composer"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Écris quelque chose de doux…"/><button onClick={send}><Send size={17}/></button></div></div>
}

function Story({data,save}){
 const [note,setNote]=useState(""),[goal,setGoal]=useState("");
 const addNote=()=>{if(!note.trim())return;save({...data,notes:[{id:uid(),text:note,date:new Date().toISOString()},...data.notes]});setNote("")};
 const addGoal=()=>{if(!goal.trim())return;save({...data,goals:[...data.goals,{id:uid(),text:goal,done:false}]});setGoal("")};
 const toggle=id=>save({...data,goals:data.goals.map(g=>g.id===id?{...g,done:!g.done}:g)});
 return <div><Title title="Notre histoire" sub="Les petits chapitres qui deviennent de grands souvenirs."/>
  <div className="timeline">{data.notes.map(n=><div className="timeline-item" key={n.id}><div className="dot"><Heart size={12} fill="currentColor"/></div><div className="card"><small>{new Date(n.date).toLocaleDateString("fr-FR")}</small><p>{n.text}</p></div></div>)}{!data.notes.length&&<div className="empty card">Votre histoire commence ici. Ajoutez votre premier souvenir.</div>}</div>
  <div className="card"><h3>💌 Lettre / mot doux</h3><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Écris quelque chose que l'autre pourra relire plus tard…"/><button className="primary" onClick={addNote}><Plus size={15}/> Ajouter à notre histoire</button></div>
  <div className="card"><h3>🌱 Nos rêves</h3>{data.goals.map(g=><button className={"goal "+(g.done?"done":"")} key={g.id} onClick={()=>toggle(g.id)}><span>{g.done?<Check size={15}/>:<span className="circle"/>}</span>{g.text}</button>)}<div className="inline"><input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Un rêve à réaliser…"/><button onClick={addGoal}><Plus size={16}/></button></div></div>
 </div>
}

function Agenda({data,save}){
 const [title,setTitle]=useState(""),[date,setDate]=useState("");
 const add=()=>{if(!title||!date)return;save({...data,events:[...data.events,{id:uid(),title,date}]});setTitle("");setDate("")};
 return <div><Title title="Notre agenda" sub="Les dates qui comptent pour nous."/><div className="card"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex. Dîner, anniversaire…"/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/><button className="primary" onClick={add}><Plus size={15}/> Ajouter</button></div><div className="list">{data.events.sort((a,b)=>a.date.localeCompare(b.date)).map(e=><div className="row card" key={e.id}><Calendar size={18}/><div><b>{e.title}</b><small>{fmtDate(e.date)}</small></div><button className="icon" onClick={()=>save({...data,events:data.events.filter(x=>x.id!==e.id)})}><Trash2 size={15}/></button></div>)}</div></div>
}

function Money({data,save}){
 const [label,setLabel]=useState(""),[amount,setAmount]=useState("");
 const total=data.transactions.reduce((s,t)=>s+(t.type==="income"?t.amount:-t.amount),0);
 const add=()=>{const n=Number(amount);if(!label||!n)return;save({...data,transactions:[{id:uid(),label,amount:n,type:"expense"},...data.transactions]});setLabel("");setAmount("")};
 return <div><Title title="Nos projets & finances" sub="Construire ensemble, petit à petit."/><div className="moneyHero"><small>Solde du projet</small><strong>{total.toLocaleString("fr-FR")} $</strong><span>Chaque petit effort compte ❤️</span></div><div className="card"><input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Ex. Épargne voyage"/><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Montant"/><button className="primary" onClick={add}><Plus size={15}/> Ajouter une dépense</button></div>{data.transactions.map(t=><div className="row card" key={t.id}><Wallet size={18}/><div><b>{t.label}</b><small>{t.amount} $</small></div></div>)}</div>
}

function Games({data,save}){
 const [q,setQ]=useState(questions[0]),[answer,setAnswer]=useState("");
 const next=()=>setQ(questions[Math.floor(Math.random()*questions.length)]);
 const saveA=()=>{if(!answer.trim())return;save({...data,notes:[{id:uid(),text:"🎮 "+q+" — "+answer,date:new Date().toISOString()},...data.notes]});setAnswer("");next()};
 return <div><Title title="Jeux à deux" sub="Riez, parlez et découvrez-vous encore."/><div className="game card"><Sparkles size={22}/><div className="tag">QUESTION DU JOUR</div><h3>{q}</h3><textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Votre réponse…"/><button className="primary" onClick={saveA}><Check size={15}/> Garder notre réponse</button><button className="secondary" onClick={next}><RefreshCw size={15}/> Nouvelle question</button></div></div>
}

function More({data,save}){
 const [v,setV]=useState(0);
 const [you,setYou]=useState(data.names.you||"");
 const [partner,setPartner]=useState(data.names.partner||"");
 const [start,setStart]=useState(data.startDate);
 const toggle=()=>save({...data,savedVerses:data.savedVerses.includes(verses[v][0])?data.savedVerses.filter(x=>x!==verses[v][0]):[...data.savedVerses,verses[v][0]]});
 const saveNames=()=>save({...data,names:{you:you.trim(),partner:partner.trim()},startDate:start});
 return <div><Title title="Plus pour nous" sub="Des petits détails qui rendent l'histoire spéciale."/><div className="card"><h3>Vos prénoms &amp; date de début</h3><input value={you} onChange={e=>setYou(e.target.value)} placeholder="Ton prénom"/><input value={partner} onChange={e=>setPartner(e.target.value)} placeholder="Prénom du/de la partenaire"/><input type="date" value={start} onChange={e=>setStart(e.target.value)}/><button className="primary" onClick={saveNames}><Check size={15}/> Enregistrer</button></div><div className="card verse bigVerse"><BookOpenText size={22}/><p>« {verses[v][1]} »</p><b>{verses[v][0]}</b><div className="actions"><button onClick={toggle}><Star size={15} fill={data.savedVerses.includes(verses[v][0])?"currentColor":"none"}/> Favori</button><button onClick={()=>setV((v+1)%verses.length)}><RefreshCw size={15}/> Autre</button></div></div><div className="card settings"><div><BellRing size={16}/> Rappels</div><div><Users size={16}/> Couple synchronisé</div><div><LogOut size={16}/> <span>Pour quitter, efface le code de ce navigateur</span></div></div></div>
}
 const [v,setV]=useState(0);
 const toggle=()=>save({...data,savedVerses:data.savedVerses.includes(verses[v][0])?data.savedVerses.filter(x=>x!==verses[v][0]):[...data.savedVerses,verses[v][0]]});
 return <div><Title title="Plus pour nous" sub="Des petits détails qui rendent l'histoire spéciale."/><div className="card verse bigVerse"><BookOpenText size={22}/><p>« {verses[v][1]} »</p><b>{verses[v][0]}</b><div className="actions"><button onClick={toggle}><Star size={15} fill={data.savedVerses.includes(verses[v][0])?"currentColor":"none"}/> Favori</button><button onClick={()=>setV((v+1)%verses.length)}><RefreshCw size={15}/> Autre</button></div></div><div className="card settings"><div><BellRing size={16}/> Rappels</div><div><Users size={16}/> Couple synchronisé</div><div><LogOut size={16}/> <span>Pour quitter, efface le code de ce navigateur</span></div></div></div>
