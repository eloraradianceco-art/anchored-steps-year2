import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"; // v2.3
import { createClient } from "@supabase/supabase-js";
import { toPng } from "html-to-image";
import Onboarding from "./Onboarding.jsx";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL_Y2 || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY_Y2 || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ───────── Stripe Payment Links ─────────
// TODO: Replace with real Stripe payment link URLs once configured
const STRIPE_LINKS = {
  monthly: "https://buy.stripe.com/YEAR2_MONTHLY",  // ← Update with real URL
  annual:  "https://buy.stripe.com/YEAR2_ANNUAL",   // ← Update with real URL
};

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const SECTIONS = [
  {id:"passage",    label:"📖 Passage"},
  {id:"context",    label:"🧭 Context"},
  {id:"dontmiss",   label:"⚠️ Don't Miss"},
  {id:"study",      label:"🧠 Study"},
  {id:"reflect",    label:"💭 Reflect"},
  {id:"apply",      label:"⚒️ Apply"},
  {id:"prayer",     label:"🙏 Prayer"},
  {id:"tracker",    label:"📊 Tracker"},
  {id:"community",  label:"🌿 Community"},
];

// ───────── Complete Theme System (Dark + Light) ─────────
const DARK_THEME = {
  bg:"#0D1820",bgCard:"rgba(255,255,255,0.035)",bgMid:"#172330",
  gold:"#A07840",goldL:"#C49A5A",goldF:"rgba(160,120,64,0.12)",goldB:"rgba(160,120,64,0.28)",
  green:"#7C9284",greenF:"rgba(124,146,132,0.12)",greenB:"rgba(124,146,132,0.28)",
  purple:"#A89ACF",purpleF:"rgba(168,154,207,0.08)",purpleB:"rgba(168,154,207,0.22)",
  red:"#D97A7A",redF:"rgba(217,122,122,0.08)",redB:"rgba(217,122,122,0.24)",
  cream:"#F0ECE3",text:"#E0D8CA",muted:"#A0AAB2",dim:"#66737E",border:"rgba(255,255,255,0.06)",
};

const LIGHT_THEME = {
  bg:"#F0EAE0",bgCard:"rgba(0,0,0,0.04)",bgMid:"#E4DDCF",
  gold:"#7A5A28",goldL:"#A07840",goldF:"rgba(122,90,40,0.10)",goldB:"rgba(122,90,40,0.30)",
  green:"#5C7264",greenF:"rgba(92,114,100,0.10)",greenB:"rgba(92,114,100,0.30)",
  purple:"#7A6CB0",purpleF:"rgba(122,108,176,0.08)",purpleB:"rgba(122,108,176,0.25)",
  red:"#A85050",redF:"rgba(168,80,80,0.08)",redB:"rgba(168,80,80,0.25)",
  cream:"#1A1008",text:"#2C1F0E",muted:"#5A4535",dim:"#8A7060",border:"rgba(0,0,0,0.10)",
};

const ALL_WEEKS = (typeof window !== 'undefined' && window.__APPDATA_Y2__?.ALL_WEEKS) || [];

// ───────── Error Boundary ─────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('Anchored Steps Y2 crash:', error.message, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",background:DARK_THEME.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{maxWidth:380,textAlign:"center"}}>
            <img src="/icon2.png" alt="⚓" style={{width:50,height:50,borderRadius:12,marginBottom:16,opacity:.6}}/>
            <div style={{fontFamily:"Cinzel,serif",fontSize:14,color:DARK_THEME.gold,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>Something went wrong</div>
            <p style={{fontSize:14,color:DARK_THEME.muted,marginBottom:20,lineHeight:1.7}}>The page hit an unexpected error. Reload to try again.</p>
            <button onClick={()=>window.location.reload()} style={{background:"rgba(160,120,64,0.18)",border:"1px solid rgba(160,120,64,0.4)",color:DARK_THEME.gold,padding:"12px 28px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ───────── Reusable Components ─────────
function SaveBtn({onSave,flash,T}){
  return (
    <button onClick={onSave} style={{marginTop:12,width:"100%",background:flash?T.greenF:T.goldF,border:"1px solid "+(flash?T.greenB:T.goldB),color:flash?T.green:T.gold,padding:"11px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",transition:"all .3s"}}>
      {flash ? "✓ Saved" : "Save Notes"}
    </button>
  );
}

function NextSectionBtn({current, sections, onNext, T}){
  const idx = sections.findIndex(s=>s.id===current);
  const next = sections[idx+1];
  if(!next) return null;
  return (
    <button onClick={()=>onNext(next.id)} style={{marginTop:10,width:"100%",background:"transparent",border:"1px solid "+T.goldB,color:T.gold,padding:"11px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>
      Next: {next.label} &#8594;
    </button>
  );
}

function CopyBtn({text, label="Copy", T, style={}}){
  const [copied,setCopied]=React.useState(false);
  const handle=()=>{ navigator.clipboard.writeText(text||'').then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),1800); }); };
  return (
    <button onClick={handle} style={{background:copied?T.greenF:"transparent",border:"1px solid "+(copied?T.greenB:T.border),color:copied?T.green:T.muted,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"Cinzel,serif",letterSpacing:"0.06em",transition:"all .2s",...style}}>
      {copied?"✓ Copied":label}
    </button>
  );
}

function MemorizeModal({verse,onClose,onPass,T}){
  const [mode,setMode]=useState(null);
  const [revealed,setRevealed]=useState(false);
  const [typed,setTyped]=useState('');
  const [score,setScore]=useState(null);
  const verseText = verse.text||verse.verseText||'';
  const verseRef = verse.ref||verse.verseRef||'';
  const words=verseText.split(' ');
  const blankedWords=words.map((w,i)=>(i+1)%3===0?'___':w);
  const markMemo=()=>{onPass();onClose();};
  const checkScore=()=>{
    const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
    const tw=norm(typed).split(' ').filter(Boolean);
    const ow=norm(verseText).split(' ').filter(Boolean);
    const pct=ow.length?Math.round(tw.filter(w=>ow.includes(w)).length/ow.length*100):0;
    setScore(pct);
    if(pct>=70)onPass();
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}} onClick={()=>{if(!mode)onClose();}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(145deg,"+T.bg+","+T.bgMid+")",border:"1px solid "+T.goldB,borderRadius:20,padding:24,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:11,color:T.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.16em",textTransform:"uppercase"}}>{mode?"← ":""}✦ Memorize</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
        </div>
        <div style={{fontSize:14,color:T.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.1em",marginBottom:16,paddingBottom:14,borderBottom:"1px solid "+T.goldB,textAlign:"center"}}>{verseRef}</div>
        {!mode?(
          <div>
            <p style={{fontSize:14,color:T.muted,textAlign:"center",marginBottom:16,fontStyle:"italic",lineHeight:1.6}}>Choose your memorization method:</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[{id:"recall",icon:"🧠",title:"Read & Recall",desc:"See the reference, recite aloud, then reveal to check"},{id:"blanks",icon:"✏️",title:"Fill the Gaps",desc:"Read the verse with every 3rd word blanked out"},{id:"type",icon:"⌨️",title:"Write it Out",desc:"Type the verse from memory and get a score"}].map(m=>(
                <button key={m.id} onClick={()=>{setMode(m.id);setRevealed(false);setTyped('');setScore(null);}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,cursor:"pointer",textAlign:"left",background:T.goldF,border:"1px solid "+T.goldB,transition:"all .2s"}}>
                  <span style={{fontSize:22,flexShrink:0}}>{m.icon}</span>
                  <span>
                    <span style={{display:"block",fontSize:13,color:T.cream,fontFamily:"Cinzel,serif",letterSpacing:"0.06em",marginBottom:2}}>{m.title}</span>
                    <span style={{display:"block",fontSize:12,color:T.muted,fontStyle:"italic"}}>{m.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ):mode==='recall'?(
          <div>
            {!revealed?(
              <div style={{textAlign:"center"}}>
                <p style={{fontSize:14,color:T.muted,fontStyle:"italic",marginBottom:20,lineHeight:1.7}}>Say the verse aloud from memory, then reveal to check yourself.</p>
                <button onClick={()=>setRevealed(true)} style={{background:T.goldF,border:"1px solid "+T.goldB,color:T.gold,padding:"12px 28px",borderRadius:50,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Reveal Verse</button>
              </div>
            ):(
              <div>
                <p style={{fontSize:17,color:T.cream,fontStyle:"italic",lineHeight:1.85,marginBottom:20,textAlign:"center"}}>"{verseText}"</p>
                <button onClick={markMemo} style={{width:"100%",background:"rgba(124,146,132,0.15)",border:"1px solid rgba(124,146,132,0.4)",color:T.green,padding:"13px",borderRadius:12,cursor:"pointer",fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",marginBottom:10}}>✓ I've Got It — Mark Memorized</button>
                <button onClick={()=>setRevealed(false)} style={{width:"100%",background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:13,fontFamily:"EB Garamond,Georgia,serif"}}>Try Again</button>
              </div>
            )}
          </div>
        ):mode==='blanks'?(
          <div>
            <p style={{fontSize:14,color:T.muted,fontStyle:"italic",marginBottom:14,lineHeight:1.6,textAlign:"center"}}>Read aloud, filling in the blanked words from memory.</p>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:12,padding:"16px",marginBottom:16}}>
              <p style={{fontSize:17,color:T.cream,fontStyle:"italic",lineHeight:2.1,margin:0}}>
                {blankedWords.map((w,i)=>(
                  <span key={i} style={{color:w==='___'?T.gold:T.cream,borderBottom:w==='___'?"1px solid "+T.gold:undefined,padding:w==='___'?"0 4px":undefined,letterSpacing:w==='___'?"0.1em":undefined}}>{w}{i<blankedWords.length-1?" ":""}</span>
                ))}
              </p>
            </div>
            {!revealed?(
              <button onClick={()=>setRevealed(true)} style={{width:"100%",background:T.goldF,border:"1px solid "+T.goldB,color:T.gold,padding:"12px",borderRadius:12,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",marginBottom:10}}>Reveal Missing Words</button>
            ):(
              <div style={{background:"rgba(124,146,132,0.08)",border:"1px solid rgba(124,146,132,0.25)",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                <p style={{fontSize:14,color:T.text,fontStyle:"italic",lineHeight:1.8,margin:0}}>
                  {words.map((w,i)=>(
                    <span key={i} style={{color:(i+1)%3===0?T.green:T.text,fontWeight:(i+1)%3===0?600:400}}>{w}{i<words.length-1?" ":""}</span>
                  ))}
                </p>
              </div>
            )}
            <button onClick={markMemo} style={{width:"100%",background:"rgba(124,146,132,0.15)",border:"1px solid rgba(124,146,132,0.4)",color:T.green,padding:"12px",borderRadius:12,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>✓ Mark as Memorized</button>
          </div>
        ):(
          <div>
            <p style={{fontSize:14,color:T.muted,fontStyle:"italic",marginBottom:12,lineHeight:1.6,textAlign:"center"}}>Type the verse from memory, then check your score.</p>
            {score===null?(
              <div>
                <textarea rows={5} value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Type the verse here from memory..." style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:10,color:T.cream,fontSize:15,padding:"12px",fontFamily:"EB Garamond,Georgia,serif",outline:"none",resize:"none",boxSizing:"border-box",marginBottom:10,lineHeight:1.7}}/>
                <button onClick={checkScore} disabled={!typed.trim()} style={{width:"100%",background:T.goldF,border:"1px solid "+T.goldB,color:T.gold,padding:"12px",borderRadius:12,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",opacity:typed.trim()?1:0.4}}>Check My Score</button>
              </div>
            ):(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:48,fontWeight:700,color:score>=80?T.green:score>=50?T.gold:T.red,fontFamily:"Cinzel,serif",marginBottom:4}}>{score}%</div>
                <div style={{fontSize:13,color:T.muted,marginBottom:16}}>{score>=90?"Nearly perfect!":score>=70?"Great progress!":score>=50?"Good start!":"Keep practicing!"}</div>
                <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:10,padding:"12px",marginBottom:14,textAlign:"left"}}>
                  <p style={{fontSize:14,color:T.text,fontStyle:"italic",lineHeight:1.8,margin:0}}>"{verseText}"</p>
                </div>
                {score>=70&&<button onClick={markMemo} style={{width:"100%",background:"rgba(124,146,132,0.15)",border:"1px solid rgba(124,146,132,0.4)",color:T.green,padding:"12px",borderRadius:12,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",marginBottom:10}}>✓ Mark as Memorized</button>}
                <button onClick={()=>{setTyped('');setScore(null);}} style={{width:"100%",background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:13,fontFamily:"EB Garamond,Georgia,serif"}}>Try Again</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ContextModal({ae,onClose,T}){
  if(!ae) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={onClose}>
      <div style={{background:"linear-gradient(145deg,"+T.bg+","+T.bgMid+")",border:"1px solid "+T.goldB,borderRadius:20,padding:28,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:10,color:T.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.14em",textTransform:"uppercase"}}>Scripture Context</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:20,lineHeight:1}}>&#215;</button>
        </div>
        {ae.ref&&<div style={{background:T.goldF,border:"1px solid "+T.goldB,borderRadius:10,padding:"10px 14px",marginBottom:20}}>
          <span style={{fontSize:11,color:T.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",textTransform:"uppercase"}}>{ae.ref}</span>
        </div>}
        {[["Author",ae.author],["Location",ae.location],["Audience",ae.audience],["Commentary",ae.commentary]].map(([lb,val])=>val?(
          <div key={lb} style={{marginBottom:16,paddingBottom:16,borderBottom:"1px solid "+T.border}}>
            <div style={{fontSize:10,color:T.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:7}}>{lb}</div>
            <p style={{fontSize:15,color:T.text,lineHeight:1.85,margin:0}}>{val}</p>
          </div>
        ):null)}
        <button onClick={onClose} style={{width:"100%",marginTop:4,background:"transparent",border:"1px solid "+T.border,color:T.muted,padding:"11px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"EB Garamond,Georgia,serif"}}>Close</button>
      </div>
    </div>
  );
}

// ───────── Main App ─────────
function AnchoredStepsY2Inner(){
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(true);
  const [email,setEmail]=useState('');
  const [pw,setPw]=useState('');
  const [authErr,setAuthErr]=useState('');
  const [authMode,setAuthMode]=useState('login');
  const [code,setCode]=useState('');
  const [resetMode,setResetMode]=useState(false);
  const [resetSent,setResetSent]=useState(false);

  // Restore last visited week
  const [wk,setWk]=useState(()=>{
    try { return Number(localStorage.getItem('y2_last_week')) || 1; } catch { return 1; }
  });
  const [sec,setSec]=useState('passage');
  const [entries,setEntries]=useState([]);
  const [flash,setFlash]=useState(false);
  const [saveStatus,setSaveStatus]=useState('idle'); // 'idle'|'saving'|'saved'
  const [showWeekJump,setShowWeekJump]=useState(false);
  const [darkMode,setDarkMode]=useState(()=>{
    try { return localStorage.getItem('y2_dark_mode') !== '0'; } catch { return true; }
  });
  const [view,setView]=useState('journal');
  const [animK,setAnimK]=useState(0);
  const [quizVerse,setQuizVerse]=useState(null);
  const [shareVerse,setShareVerse]=useState(null);
  const [shareCardType,setShareCardType]=useState('passage')
  const [shareCardLight,setShareCardLight]=useState(false)
  const [sharingCard,setSharingCard]=useState(false)
  const [bookmarks,setBookmarks]=useState(()=>{try{return JSON.parse(localStorage.getItem('y2_bookmarks')||'[]')}catch{return []}});
  const [showOnboarding,setShowOnboarding]=useState(()=>{
    try { return !localStorage.getItem('y2_onboarding_complete'); } catch { return false; }
  });
  const [profile,setProfile]=useState(null);
  const [day,setDay]=useState(-1);
  const [communityInput,setCommunityInput]=useState('');
  const [communityDone,setCommunityDone]=useState(false);
  const [communityNotes,setCommunityNotes]=useState([]);
  const [showSignOutConfirm,setShowSignOutConfirm]=useState(false);
  const shareCardRef=useRef(null);

  // Debounce timer ref for saves
  const saveTimerRef = useRef({});
  const pendingSavesRef = useRef({});
  const saveStatusTimerRef = useRef(null);

  // Active theme
  const T = darkMode ? DARK_THEME : LIGHT_THEME;

  const week = useMemo(() => ALL_WEEKS.find(w=>w.week===wk), [wk]);

  const LBL = {fontSize:10,color:T.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12,display:"block"};
  const INP = {width:"100%",background:darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",border:"1px solid "+T.border,borderRadius:10,padding:"12px 14px",color:T.text,fontSize:15,fontFamily:"EB Garamond,Georgia,serif",resize:"vertical",boxSizing:"border-box",outline:"none",lineHeight:1.7};

  // Persist last visited week
  useEffect(()=>{
    try { localStorage.setItem('y2_last_week', String(wk)); } catch {}
  }, [wk]);

  // Persist dark mode preference
  useEffect(()=>{
    try { localStorage.setItem('y2_dark_mode', darkMode ? '1' : '0'); } catch {}
  }, [darkMode]);

  // Auth session management
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>{setSession(s);setLoading(false);});
    return ()=>subscription.unsubscribe();
  },[]);

  // Load profile + entries + community notes when session changes
  useEffect(()=>{
    if(!session) return;
    let cancelled = false;

    supabase.from('profiles').select('*').eq('user_id',session.user.id).single().then(({data})=>{
      if(!cancelled && data) setProfile(data);
    });

    // Load entries for current week ± 5 weeks (smarter than loading all 1500+)
    const minWeek = Math.max(1, wk - 5);
    const maxWeek = Math.min(52, wk + 5);
    supabase.from('journal_entries')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('week', minWeek)
      .lte('week', maxWeek)
      .then(({data})=>{
        if(!cancelled && data) setEntries(data);
      });

    // Also load just field_key='tr_*' across all weeks for progress stats
    supabase.from('journal_entries')
      .select('id, week, field_key, field_value, user_id')
      .eq('user_id', session.user.id)
      .like('field_key', 'tr_%')
      .then(({data})=>{
        if(!cancelled && data) {
          setEntries(prev => {
            const existing = new Set(prev.map(e => e.id));
            const newOnes = data.filter(d => !existing.has(d.id));
            return [...prev, ...newOnes];
          });
        }
      });

    // Realtime subscription for entries — sync across devices
    const channel = supabase
      .channel('y2_entries_'+session.user.id)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'journal_entries',
        filter: `user_id=eq.${session.user.id}`,
      }, payload => {
        if(cancelled) return;
        const row = payload.new || payload.old;
        if(!row) return;
        if(payload.eventType === 'DELETE') {
          setEntries(prev => prev.filter(e => e.id !== row.id));
        } else if(payload.eventType === 'UPDATE') {
          setEntries(prev => prev.map(e => e.id === row.id ? row : e));
        } else if(payload.eventType === 'INSERT') {
          setEntries(prev => {
            if(prev.some(e => e.id === row.id)) return prev;
            return [...prev, row];
          });
        }
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  },[session, wk]);

  // Load community notes for current week
  useEffect(()=>{
    if(!session) return;
    supabase.from('community_notes_y2')
      .select('*')
      .eq('week', wk)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({data, error})=>{
        if(!error && data) setCommunityNotes(data);
      });
  }, [session, wk]);

  const get=useCallback((key)=>{
    const e=entries.find(e=>e.week===wk&&e.field_key===key);
    return e?.field_value||'';
  },[entries,wk]);

  // Debounced set — collects rapid changes, writes once per 600ms per key
  const set=useCallback((key,val)=>{
    if(!session) return;
    const fullKey = `${wk}_${key}`;
    pendingSavesRef.current[fullKey] = val;

    // Optimistically update local state immediately
    setEntries(prev => {
      const existing = prev.find(e => e.week===wk && e.field_key===key);
      if(existing) {
        return prev.map(e => e.id === existing.id ? {...e, field_value: val} : e);
      } else {
        return [...prev, { id: 'temp_'+fullKey, week: wk, field_key: key, field_value: val, user_id: session.user.id, _temp: true }];
      }
    });

    // Show saving indicator
    setSaveStatus('saving');
    if(saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);

    // Debounce Supabase write
    if(saveTimerRef.current[fullKey]) clearTimeout(saveTimerRef.current[fullKey]);
    saveTimerRef.current[fullKey] = setTimeout(async () => {
      const valueToSave = pendingSavesRef.current[fullKey];
      delete pendingSavesRef.current[fullKey];
      delete saveTimerRef.current[fullKey];

      // Find existing real row
      const existing = entries.find(e => e.week===wk && e.field_key===key && !e._temp);
      if(existing) {
        await supabase.from('journal_entries').update({field_value:valueToSave}).eq('id',existing.id);
      } else {
        const {data} = await supabase.from('journal_entries')
          .insert({user_id:session.user.id, week:wk, field_key:key, field_value:valueToSave})
          .select().single();
        if(data) {
          setEntries(prev => prev.map(e => e.id === 'temp_'+fullKey ? data : e));
        }
      }
      setSaveStatus('saved');
      if(saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(()=>setSaveStatus('idle'), 2200);
    }, 600);
  },[entries,wk,session]);

  // Save button — flushes pending saves and shows feedback
  const save=useCallback(async()=>{
    // Force-flush any pending debounced saves
    for(const key in saveTimerRef.current) {
      clearTimeout(saveTimerRef.current[key]);
    }
    const pending = {...pendingSavesRef.current};
    pendingSavesRef.current = {};
    saveTimerRef.current = {};

    for(const fullKey in pending) {
      const [wkStr, ...keyParts] = fullKey.split('_');
      const wkNum = Number(wkStr);
      const key = keyParts.join('_');
      const val = pending[fullKey];
      const existing = entries.find(e => e.week===wkNum && e.field_key===key && !e._temp);
      if(existing) {
        await supabase.from('journal_entries').update({field_value:val}).eq('id',existing.id);
      } else if(session) {
        await supabase.from('journal_entries').insert({user_id:session.user.id, week:wkNum, field_key:key, field_value:val});
      }
    }

    setFlash(true);
    setSaveStatus('saved');
    if(saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = setTimeout(()=>{setFlash(false);setSaveStatus('idle');}, 2200);
  },[entries, session]);

  const goWk=useCallback((n)=>{
    setWk(Math.max(1,Math.min(52,n)));
    setSec('passage');
    setAnimK(a=>a+1);
    setDay(-1);
    setShowWeekJump(false);
    window.scrollTo(0,0);
  },[]);

  const toggleBookmark=(verse,weekNum,secId)=>{
    const key=`${verse.verseRef||verse.ref}_${weekNum}`;
    const exists=bookmarks.find(b=>b.key===key);
    const updated=exists?bookmarks.filter(b=>b.key!==key):[...bookmarks,{key,ref:verse.verseRef||verse.ref,text:verse.verseText||verse.text,week:weekNum,section:secId}];
    setBookmarks(updated);
    try { localStorage.setItem('y2_bookmarks',JSON.stringify(updated)); } catch {}
    // Also sync bookmarks to Supabase profile
    if(session) {
      supabase.from('profiles').update({bookmarks: updated}).eq('user_id', session.user.id);
    }
  };

  const isBookmarked=(ref,weekNum)=>bookmarks.some(b=>b.key===`${ref}_${weekNum}`);
  const daysComplete=n=>entries.filter(e=>e.week===n&&e.field_key.startsWith('tr_')&&(e.field_value||'').trim()).length;

  const handleShareImage=async()=>{
    if(!shareCardRef.current||!shareVerse) return
    setSharingCard(true)
    try {
      const bg=shareCardLight?'#F2EDE3':'#0D1820'
      const dataUrl=await toPng(shareCardRef.current,{cacheBust:true,pixelRatio:2,backgroundColor:bg})
      const res=await fetch(dataUrl)
      const blob=await res.blob()
      const file=new File([blob],'anchored-steps-y2-card.png',{type:'image/png'})
      const body=shareCardType==='prayer'?(week?.prayer||'')
               :shareCardType==='dontmiss'?(week?.dontMissThis||'')
               :shareCardType==='apply'?(week?.application||'')
               :(shareVerse.verseText||'')
      const ref=shareCardType==='passage'?(shareVerse.verseRef||null):null
      const caption=[
        '“'+body+'”',
        ref?'— '+ref:'',
        '',
        week?'Week '+wk+': '+week.theme:'',
        '',
        'Anchored Steps: Year 2 — Deeper faith. Harder truth. Real growth.',
        '',
        'anchored-steps-y2.vercel.app',
      ].filter(l=>l!==undefined).join('\n').replace(/\n{3,}/g,'\n\n').trim()
      if(navigator.canShare?.({files:[file]})){
        await navigator.share({files:[file],title:'Anchored Steps Year 2',text:caption})
      } else {
        const a=document.createElement('a');a.href=dataUrl;a.download='anchored-steps-y2-card.png';a.click()
      }
    } catch(err){console.error('Share failed:',err)}
    setSharingCard(false)
  };

  const handlePasswordReset = async () => {
    setAuthErr('');
    if(!email) { setAuthErr('Enter your email first'); return; }
    const {error} = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if(error) setAuthErr(error.message);
    else setResetSent(true);
  };

  const enduringWordUrl = (ref) => {
    if (!ref) return '#';
    const m = ref.match(/^(.+?)\s+(\d+)/);
    if (!m) return 'https://enduringword.com/bible-commentary/';
    let book = m[1].trim().toLowerCase().replace(/\s+/g, '-');
    const chap = m[2];
    if (book === 'psalm') book = 'psalms';
    return 'https://enduringword.com/bible-commentary/' + book + '-' + chap + '/';
  };


  if(loading) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <img src="/icon2.png" alt="⚓" style={{width:50,height:50,borderRadius:12,opacity:.5,animation:"pulse 2s ease-in-out infinite"}}/>
      <div style={{color:T.gold,fontFamily:"Cinzel,serif",fontSize:12,letterSpacing:"0.14em",textTransform:"uppercase"}}>Anchored Steps</div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: .3 } 50% { opacity: .8 } }`}</style>
    </div>
  );

  if(!session){
    return (
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{maxWidth:380,width:"100%"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <img src="/icon2.png" alt="⚓" style={{width:60,height:60,borderRadius:14,marginBottom:14,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}/>
            <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.gold,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Anchored Steps</div>
            <div style={{fontFamily:"Cinzel,serif",fontSize:22,color:T.cream,marginBottom:4}}>Year 2</div>
            <div style={{fontSize:13,color:T.muted,fontStyle:"italic"}}>"Now live like it."</div>
          </div>

          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:28}}>
            {resetMode ? (
              <>
                <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14,textAlign:"center"}}>Reset Password</div>
                {resetSent ? (
                  <>
                    <p style={{fontSize:14,color:T.text,lineHeight:1.7,marginBottom:16,textAlign:"center"}}>Check your email for a reset link.</p>
                    <button onClick={()=>{setResetMode(false);setResetSent(false);}} style={{width:"100%",background:T.goldF,border:"1px solid "+T.goldB,color:T.gold,padding:"12px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Back to Sign In</button>
                  </>
                ) : (
                  <>
                    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={{...INP,marginBottom:12}}/>
                    {authErr&&<div style={{color:T.red,fontSize:13,marginBottom:12,textAlign:"center"}}>{authErr}</div>}
                    <button onClick={handlePasswordReset} style={{width:"100%",background:"linear-gradient(135deg,"+T.goldF+","+T.goldF+")",border:"1px solid "+T.goldB,color:T.gold,padding:"14px",borderRadius:12,cursor:"pointer",fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:"0.1em",marginBottom:14}}>Send Reset Link</button>
                    <div style={{textAlign:"center",fontSize:12,color:T.muted}}>
                      <span style={{color:T.gold,cursor:"pointer"}} onClick={()=>{setResetMode(false);setAuthErr('');}}>Back to Sign In</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={{...INP,marginBottom:12}}/>
                <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password" type="password" style={{...INP,marginBottom:12}}/>
                {authMode==='signup'&&<input value={code} onChange={e=>setCode(e.target.value)} placeholder="Access Code" style={{...INP,marginBottom:12}}/>}
                {authErr&&<div style={{color:T.red,fontSize:13,marginBottom:12,textAlign:"center"}}>{authErr}</div>}
                <button onClick={async()=>{
                  setAuthErr('');
                  if(authMode==='login'){
                    const{error}=await supabase.auth.signInWithPassword({email,password:pw});
                    if(error)setAuthErr(error.message);
                  } else {
                    const{data:codeData,error:codeErr}=await supabase.from('access_codes').select('*').eq('code',code.trim().toUpperCase()).eq('used',false).maybeSingle();
                    if(codeErr || !codeData){setAuthErr('Invalid or already used access code');return;}
                    const{error}=await supabase.auth.signUp({email,password:pw});
                    if(error){setAuthErr(error.message);return;}
                    await supabase.from('access_codes').update({used:true,used_by:email}).eq('code',code.trim().toUpperCase());
                  }
                }} style={{width:"100%",background:"linear-gradient(135deg,"+T.goldF+","+T.goldF+")",border:"1px solid "+T.goldB,color:T.gold,padding:"14px",borderRadius:12,cursor:"pointer",fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:"0.1em",marginBottom:14}}>
                  {authMode==='login'?'Sign In':'Create Account'}
                </button>
                <div style={{textAlign:"center",fontSize:12,color:T.muted,marginBottom:authMode==='login'?8:0}}>
                  {authMode==='login'
                    ?<>New here? <span style={{color:T.gold,cursor:"pointer"}} onClick={()=>setAuthMode('signup')}>Sign up with access code</span></>
                    :<><span style={{color:T.gold,cursor:"pointer"}} onClick={()=>setAuthMode('login')}>Already have an account? Sign in</span></>}
                </div>
                {authMode==='login' && (
                  <div style={{textAlign:"center",fontSize:11,color:T.muted}}>
                    <span style={{color:T.gold,cursor:"pointer"}} onClick={()=>{setResetMode(true);setAuthErr('');}}>Forgot password?</span>
                  </div>
                )}
                <div style={{marginTop:20,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:20}}>
                  <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:T.muted,letterSpacing:"0.14em",textTransform:"uppercase",textAlign:"center",marginBottom:14}}>New Subscriber? Choose Your Plan</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <a href={STRIPE_LINKS.monthly} target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"block",background:T.goldF,border:"1px solid "+T.goldB,borderRadius:12,padding:"14px 12px",textAlign:"center"}}>
                      <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.gold,letterSpacing:"0.08em",marginBottom:4}}>Monthly</div>
                      <div style={{fontSize:22,fontWeight:600,color:T.cream,fontFamily:"Cinzel,serif",marginBottom:2}}>$5.50</div>
                      <div style={{fontSize:10,color:T.muted,marginBottom:10}}>per month</div>
                      <div style={{background:T.goldF,borderRadius:6,padding:"6px",fontSize:11,color:T.gold,fontFamily:"Cinzel,serif"}}>Subscribe &#8594;</div>
                    </a>
                    <a href={STRIPE_LINKS.annual} target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"block",background:T.goldF,border:"1px solid "+T.goldB,borderRadius:12,padding:"14px 12px",textAlign:"center",position:"relative"}}>
                      <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:T.gold,color:T.bg,fontSize:9,fontFamily:"Cinzel,serif",padding:"2px 10px",borderRadius:20,whiteSpace:"nowrap",fontWeight:600}}>SAVE 50%</div>
                      <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.gold,letterSpacing:"0.08em",marginBottom:4}}>Annual</div>
                      <div style={{fontSize:22,fontWeight:600,color:T.cream,fontFamily:"Cinzel,serif",marginBottom:2}}>$39</div>
                      <div style={{fontSize:10,color:T.muted,marginBottom:10}}>per year</div>
                      <div style={{background:T.goldF,borderRadius:6,padding:"6px",fontSize:11,color:T.gold,fontFamily:"Cinzel,serif"}}>Subscribe &#8594;</div>
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if(showOnboarding){
    return <Onboarding onComplete={()=>{try{localStorage.setItem('y2_onboarding_complete','1');}catch{};setShowOnboarding(false);}} darkMode={darkMode} G={T}/>;
  }

  // No week found — show error state instead of crashing
  if(!week && view === 'journal') {
    return (
      <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"EB Garamond,Georgia,serif",padding:24,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",maxWidth:380}}>
          <div style={{fontFamily:"Cinzel,serif",fontSize:14,color:T.gold,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:14}}>Week Not Found</div>
          <p style={{color:T.muted,marginBottom:20,lineHeight:1.7}}>Week {wk} data isn't available. The content may still be loading.</p>
          <button onClick={()=>goWk(1)} style={{background:T.goldF,border:"1px solid "+T.goldB,color:T.gold,padding:"12px 24px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Go to Week 1</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"EB Garamond,Georgia,serif"}}>
      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:100,background:darkMode?"rgba(13,24,32,0.97)":"rgba(240,234,224,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid "+T.border}}>
        <div style={{padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <img src="/icon2.png" alt="⚓" style={{width:44,height:44,borderRadius:11,boxShadow:"0 2px 10px rgba(0,0,0,0.3)"}}/>
            <div>
              <div style={{fontFamily:"Cinzel,serif",fontSize:16,color:T.cream,lineHeight:1.1,letterSpacing:"0.04em"}}>Anchored Steps</div>
              <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.gold,letterSpacing:"0.12em",textTransform:"uppercase",lineHeight:1.2}}>Year 2</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {saveStatus!=='idle'&&(
              <div style={{fontSize:11,fontFamily:"Cinzel,serif",letterSpacing:"0.06em",color:saveStatus==='saved'?T.green:T.muted,transition:"color .3s"}}>
                {saveStatus==='saving'?"Saving…":"✓ Saved"}
              </div>
            )}
            <span style={{fontSize:12,color:T.muted}}>{session?.user?.email?.split('@')[0]}</span>
            <button onClick={()=>setShowSignOutConfirm(true)} style={{background:"transparent",border:"1px solid "+T.border,color:T.muted,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif"}}>Sign Out</button>
          </div>
        </div>
        <div style={{display:"flex",gap:0,borderTop:"1px solid "+T.border,overflowX:"auto"}}>
          {['journal','progress','saved','settings'].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{background:view===v?"linear-gradient(135deg,rgba(176,138,78,0.18),rgba(176,138,78,0.07))":"transparent",border:"1px solid "+(view===v?"rgba(176,138,78,0.4)":"transparent"),color:view===v?T.gold:T.muted,padding:"4px 8px",borderRadius:6,cursor:"pointer",fontSize:10,fontFamily:"Cinzel,serif",letterSpacing:"0.04em",whiteSpace:"nowrap",flexShrink:0,transition:"all .2s"}}>
              {v==='journal'?'📖 Journal':v==='progress'?'📊 Progress':v==='saved'?'☆ Saved':'⚙ Settings'}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"0 0 80px"}}>
        {/* JOURNAL VIEW */}
        {view==='journal' && week && (
          <div className="fi">
            {/* Week nav */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"18px 18px 0"}}>
              <button onClick={()=>goWk(Math.max(1,wk-1))} disabled={wk===1} style={{background:T.goldF,border:"1px solid "+T.goldB,color:T.gold,width:36,height:36,borderRadius:9,cursor:"pointer",fontSize:16,flexShrink:0,opacity:wk===1?.3:1}}>&#8249;</button>
              <div style={{flex:1,textAlign:"center"}}>
                <button onClick={()=>setShowWeekJump(v=>!v)} style={{fontSize:10,color:T.gold,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"Cinzel,serif",marginBottom:4,background:"transparent",border:"none",cursor:"pointer",padding:0}}>
                  Week {wk} of 52 {showWeekJump?"▲":"▼"}
                </button>
                <div style={{fontSize:18,color:T.cream,fontFamily:"Cinzel,serif",letterSpacing:"0.02em",lineHeight:1.2}}>{week.theme}</div>
              </div>
              <button onClick={()=>goWk(Math.min(52,wk+1))} disabled={wk===52} style={{background:T.goldF,border:"1px solid "+T.goldB,color:T.gold,width:36,height:36,borderRadius:9,cursor:"pointer",fontSize:16,flexShrink:0,opacity:wk===52?.3:1}}>&#8250;</button>
            </div>

            {/* Week Jump */}
            {showWeekJump&&(
              <div style={{margin:"8px 18px 0",background:darkMode?"rgba(13,24,32,0.98)":"rgba(240,234,224,0.98)",border:"1px solid "+T.goldB,borderRadius:12,padding:10,maxHeight:190,overflowY:"auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,boxShadow:"0 8px 24px rgba(0,0,0,0.3)"}}>
                {ALL_WEEKS.map(w=>(
                  <button key={w.week} onClick={()=>goWk(w.week)} style={{background:w.week===wk?T.goldF:"transparent",border:"1px solid "+(w.week===wk?T.goldB:T.border),borderRadius:6,padding:"6px 2px",cursor:"pointer",textAlign:"center",color:w.week===wk?T.gold:T.muted,fontSize:11,fontFamily:"Cinzel,serif"}}>
                    {w.week}
                  </button>
                ))}
              </div>
            )}

            {/* Progress bar */}
            <div style={{background:"rgba(255,255,255,0.05)",borderRadius:3,height:3,margin:"12px 18px 0",overflow:"hidden"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,"+T.gold+","+T.goldL+")",width:((wk/52)*100)+"%",transition:"width .5s ease"}}/>
            </div>

            {/* Section tabs */}
            <div style={{display:"flex",gap:3,flexWrap:"wrap",padding:"14px 18px 0"}}>
              {SECTIONS.map(s=>{
                const hasData = (s.id==='study'&&(get('study')||'').trim()) ||
                  (s.id==='reflect'&&[0,1,2,3,4].some(i=>(get('rq'+i)||'').trim())) ||
                  (s.id==='apply'&&(get('apply')||'').trim()) ||
                  (s.id==='prayer'&&(get('prayer')||'').trim()) ||
                  (s.id==='tracker'&&(DAYS.some((_,i)=>(get('tr_'+i)||'').trim())||(get('gratitude')||'').trim())) ||
                  (s.id==='community'&&communityDone);
                return (
                  <button key={s.id} onClick={()=>{setSec(s.id);setAnimK(a=>a+1);window.scrollTo(0,0);}} style={{background:sec===s.id?"linear-gradient(135deg,"+T.goldF+","+T.goldF+")":"transparent",border:"1px solid "+(sec===s.id?T.goldB:T.border),color:sec===s.id?T.gold:T.muted,padding:"6px 10px",borderRadius:8,cursor:"pointer",fontSize:11,transition:"all .18s",position:"relative"}}>
                    {s.label}
                    {hasData&&<span style={{position:"absolute",top:2,right:2,width:5,height:5,borderRadius:"50%",background:T.green,display:"block"}}/>}
                  </button>
                );
              })}
            </div>

            {/* Section content */}
            <div key={wk+"-"+sec+"-"+animK} style={{padding:"18px 18px 0"}}>
              {/* PASSAGE */}
              {sec==="passage" && (
                <div>
                  <label style={LBL}>Primary Passage — Week {wk}</label>
                  <div style={{background:"linear-gradient(145deg,"+T.goldF+","+T.goldF+")",border:"1px solid "+T.goldB,borderRadius:16,padding:"22px 24px",marginBottom:14,boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
                    <div style={{display:"flex",gap:10}}>
                      <span style={{color:T.gold,fontSize:32,lineHeight:1,opacity:.3,flexShrink:0,fontFamily:"Georgia,serif"}}>&#8220;</span>
                      <div style={{flex:1}}>
                        <p style={{fontSize:20,lineHeight:1.9,color:T.cream,fontStyle:"italic",marginBottom:14,letterSpacing:"0.01em"}}>{week.verseText || '(Verse text missing)'}</p>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                          <a href={enduringWordUrl(week.verseRef||'')} target="_blank" rel="noreferrer" style={{fontSize:11,color:T.gold,fontFamily:"Cinzel,serif",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",textDecoration:"none",borderBottom:"1px solid "+T.goldB}}>{week.verseRef || ''} ↗</a>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>setQuizVerse({text:week.verseText,ref:week.verseRef})} style={{background:get("mem_"+week.verseRef)?T.greenF:T.purpleF,border:"1px solid "+(get("mem_"+week.verseRef)?T.greenB:T.purpleB),color:get("mem_"+week.verseRef)?T.green:T.purple,padding:"3px 11px",borderRadius:12,cursor:"pointer",fontSize:11,fontFamily:"Cinzel,serif"}}>
                              {get("mem_"+week.verseRef)?"✓ Memorized":"✦ Memorize"}
                            </button>
                            <button onClick={()=>toggleBookmark({verseRef:week.verseRef,verseText:week.verseText},wk,"passage")} style={{background:isBookmarked(week.verseRef,wk)?T.goldF:"transparent",border:"1px solid "+(isBookmarked(week.verseRef,wk)?T.goldB:T.border),color:isBookmarked(week.verseRef,wk)?T.gold:T.muted,padding:"3px 10px",borderRadius:12,cursor:"pointer",fontSize:13}}>
                              {isBookmarked(week.verseRef,wk)?"★":"☆"}
                            </button>
                            <button onClick={()=>setShareVerse({verseText:week.verseText,verseRef:week.verseRef})} style={{background:"transparent",border:"1px solid "+T.border,color:T.muted,padding:"3px 8px",borderRadius:12,cursor:"pointer",fontSize:11}}>&#8599;</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <label style={{...LBL,marginTop:20}}>Read in Context</label>
                  <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:12,padding:"16px 20px",marginBottom:14}}>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.readInContext || 'No context available for this week.'}</p>
                    <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid "+T.border,display:"flex",justifyContent:"flex-end",gap:8}}>
                      <CopyBtn text={week.readInContext||''} label="Copy Context" T={T}/>
                    </div>
                  </div>
                  <SaveBtn onSave={save} flash={flash} T={T}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);window.scrollTo(0,0);}} T={T}/>
                </div>
              )}

              {/* CONTEXT */}
              {sec==="context" && (
                <div>
                  <label style={LBL}>Where Are We in the Story?</label>
                  <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:12,padding:"16px 20px",marginBottom:18}}>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.whereAreWe || 'Context information not available.'}</p>
                    <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid "+T.border,display:"flex",justifyContent:"flex-end",gap:8}}>
                      <CopyBtn text={week.whereAreWe||''} label="Copy Story Context" T={T}/>
                    </div>
                  </div>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);window.scrollTo(0,0);}} T={T}/>
                </div>
              )}

              {/* DON'T MISS THIS */}
              {sec==="dontmiss" && (
                <div>
                  <label style={LBL}>⚠️ Don't Miss This</label>
                  <div style={{background:"linear-gradient(145deg,"+T.goldF+","+T.goldF+")",border:"1px solid "+T.goldB,borderRadius:12,padding:"16px 20px",marginBottom:18}}>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.dontMissThis || 'No key insight for this week.'}</p>
                    <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid "+T.border,display:"flex",justifyContent:"flex-end",gap:8}}>
                      <CopyBtn text={"\u26a0\ufe0f Don't Miss This — Week "+wk+"\n\n"+(week.dontMissThis||'')} label="Copy Don't Miss This" T={T}/>
                    </div>
                  </div>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);window.scrollTo(0,0);}} T={T}/>
                </div>
              )}

              {/* STUDY */}
              {sec==="study" && (
                <div>
                  <label style={LBL}>Passage Study Prompt</label>
                  <div style={{background:T.purpleF,border:"1px solid "+T.purpleB,borderRadius:12,padding:"16px 20px",marginBottom:18}}>
                    <div style={{fontSize:10,color:T.purple,fontFamily:"Cinzel,serif",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Ask:</div>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:"0 0 20px",whiteSpace:"pre-line"}}>{week.studyPrompt || 'Study prompt not available.'}</p>
                    <div style={{borderTop:"1px solid "+T.purpleB,paddingTop:16}}>
                      <a href={enduringWordUrl(week.verseRef||'')} target="_blank" rel="noreferrer" style={{fontSize:10,color:T.purple,fontFamily:"Cinzel,serif",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10,display:"block",textDecoration:"none"}}>Read full commentary: {week.verseRef || ''} ↗</a>
                      <p style={{fontSize:17,color:T.cream,lineHeight:1.9,fontStyle:"italic",margin:0}}>&#8220;{week.verseText || ''}&#8221;</p>
                    </div>
                  </div>
                  <label style={LBL}>Study Notes</label>
                  <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:12,padding:"16px 20px",marginBottom:18}}>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.studyNotes || 'No study notes for this week.'}</p>
                    <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid "+T.border,display:"flex",justifyContent:"flex-end",gap:8}}>
                      <CopyBtn text={(week.verseRef||'')+" — Study Notes\n\n"+(week.studyNotes||'')} label="Copy Study Notes" T={T}/>
                    </div>
                  </div>
                  <label style={LBL}>Your Notes</label>
                  <textarea rows={6} defaultValue={get("study")} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} onChange={e=>set("study",e.target.value)} placeholder="Write your personal study notes here..." style={INP}/>
                  <SaveBtn onSave={save} flash={flash} T={T}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);window.scrollTo(0,0);}} T={T}/>
                </div>
              )}

              {/* REFLECT */}
              {sec==="reflect" && (
                <div>
                  <label style={LBL}>Reflection Questions</label>
                  {(week.reflectionQuestions || []).map((q,i)=>(
                    <div key={i} style={{marginBottom:18}}>
                      <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:9,padding:"12px 16px",marginBottom:8}}>
                        <p style={{fontSize:16,color:T.cream,fontStyle:"italic",margin:0,lineHeight:1.7}}>{q}</p>
                      </div>
                      <textarea rows={4} defaultValue={get("rq"+i)} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} onChange={e=>set("rq"+i,e.target.value)} placeholder="Reflect honestly..." style={INP}/>
                      {(get("rq"+i)||'').trim()&&(
                        <div style={{marginTop:6,display:"flex",justifyContent:"flex-end"}}>
                          <CopyBtn text={q+"\n\n"+get("rq"+i)} label="Copy Reflection" T={T}/>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!week.reflectionQuestions || week.reflectionQuestions.length === 0) && (
                    <p style={{color:T.muted,fontStyle:"italic",marginBottom:18}}>No reflection questions for this week.</p>
                  )}
                  <SaveBtn onSave={save} flash={flash} T={T}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);window.scrollTo(0,0);}} T={T}/>
                </div>
              )}

              {/* APPLY */}
              {sec==="apply" && (
                <div>
                  <label style={LBL}>Application + Action Step</label>
                  <div style={{background:"linear-gradient(145deg,"+T.goldF+","+T.goldF+")",border:"1px solid "+T.goldB,borderRadius:14,padding:"20px 22px",marginBottom:18}}>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.application || 'No application content this week.'}</p>
                    <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid "+T.border,display:"flex",justifyContent:"flex-end",gap:8}}>
                      <CopyBtn text={"Week "+wk+" Application\n\n"+(week.application||'')} label="Copy Application" T={T}/>
                    </div>
                  </div>
                  <label style={LBL}>How Will You Live This Out?</label>
                  <textarea rows={5} defaultValue={get("apply")} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} onChange={e=>set("apply",e.target.value)} placeholder="Write your specific plan here..." style={INP}/>
                  <SaveBtn onSave={save} flash={flash} T={T}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);window.scrollTo(0,0);}} T={T}/>
                </div>
              )}

              {/* PRAYER */}
              {sec==="prayer" && (
                <div>
                  <label style={LBL}>This Week's Prayer</label>
                  <div style={{background:T.purpleF,border:"1px solid "+T.purpleB,borderRadius:14,padding:"22px 24px",marginBottom:4}}>
                    <p style={{fontSize:17,color:T.cream,lineHeight:1.65,fontStyle:"italic",margin:"0 0 14px",whiteSpace:"pre-line"}}>{week.prayer || 'No prayer text for this week.'}</p>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <CopyBtn text={week.prayer||''} label="Copy Prayer" T={T}/>
                      <button onClick={()=>setShareVerse({verseText:week.prayer,verseRef:"Week "+wk+" — Prayer"})} style={{background:"transparent",border:"1px solid "+T.border,color:T.muted,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"Cinzel,serif",letterSpacing:"0.06em"}}>Share ↗</button>
                    </div>
                  </div>
                  <div style={{marginBottom:18}}/>
                  <label style={LBL}>Your Personal Prayer</label>
                  <textarea rows={6} defaultValue={get("prayer")} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} onChange={e=>set("prayer",e.target.value)} placeholder="Write your own prayer for this week..." style={INP}/>
                  <SaveBtn onSave={save} flash={flash} T={T}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);window.scrollTo(0,0);}} T={T}/>
                </div>
              )}

              {/* TRACKER */}
              {sec==="tracker" && (
                <div>
                  <label style={LBL}>Daily Tracker — Week {wk}</label>
                  <div style={{display:"grid",gap:8,marginBottom:20}}>
                    {DAYS.map((d,i)=>(
                      <div key={i} style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:10,padding:"10px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <button onClick={()=>setDay(day===i?-1:i)} style={{background:day===i?T.goldF:"transparent",border:"1px solid "+(day===i?T.goldB:T.border),color:day===i?T.gold:T.muted,padding:"4px 14px",borderRadius:6,cursor:"pointer",fontSize:13,fontFamily:"Cinzel,serif",transition:"all .15s"}}>{d}</button>
                          {(get("tr_"+i)||"").trim()&&<span style={{width:7,height:7,borderRadius:"50%",background:T.green,display:"inline-block"}}/>}
                        </div>
                        {day===i&&<textarea className="fu" rows={3} defaultValue={get("tr_"+i)} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} onChange={e=>set("tr_"+i,e.target.value)} placeholder={d+": Where did you see surrender, growth, or God's faithfulness today?"} style={INP}/>}
                      </div>
                    ))}
                  </div>
                  <label style={LBL}>Gratitude (3 things this week)</label>
                  <textarea rows={3} defaultValue={get("gratitude")} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} onChange={e=>set("gratitude",e.target.value)} placeholder="What are you grateful for this week?" style={{...INP,marginBottom:14}}/>
                  <label style={LBL}>End of Week Reflection</label>
                  <textarea rows={4} defaultValue={get("weekreflect")} onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} onChange={e=>set("weekreflect",e.target.value)} placeholder="What changed in you this week?" style={INP}/>
                  <SaveBtn onSave={save} flash={flash} T={T}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);window.scrollTo(0,0);}} T={T}/>
                </div>
              )}

              {/* COMMUNITY */}
              {sec==="community" && (
                <div>
                  <label style={LBL}>Community Reflections — Week {wk}</label>
                  <p style={{fontSize:15,color:T.muted,fontStyle:"italic",marginBottom:20,lineHeight:1.75}}>Share one insight, takeaway, or truth God highlighted for you this week.</p>
                  <textarea rows={4} value={communityInput} onChange={e=>setCommunityInput(e.target.value)} placeholder="Share what God revealed to you this week..." style={{...INP,marginBottom:10}}/>
                  <button onClick={async()=>{
                    if(!communityInput.trim()) return;
                    const {data} = await supabase.from('community_notes_y2').insert({user_id:session.user.id,week:wk,text:communityInput.trim(),date:new Date().toLocaleDateString()}).select().single();
                    if(data) setCommunityNotes(prev => [data, ...prev]);
                    setCommunityDone(true);
                    setCommunityInput('');
                    setTimeout(()=>setCommunityDone(false),3000);
                  }} style={{background:communityDone?T.greenF:T.goldF,border:"1px solid "+(communityDone?T.greenB:T.goldB),color:communityDone?T.green:T.gold,padding:"9px 18px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",marginBottom:24,transition:"all .3s"}}>
                    {communityDone?"✓ Shared!":"Share with Community"}
                  </button>

                  {/* Display community notes */}
                  {communityNotes.length > 0 && (
                    <div>
                      <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:T.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>What Others Are Sharing</div>
                      {communityNotes.map((note,i)=>(
                        <div key={note.id || i} style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:10,padding:"12px 16px",marginBottom:8}}>
                          <p style={{fontSize:15,color:T.text,lineHeight:1.7,margin:"0 0 6px",fontStyle:"italic"}}>"{note.text}"</p>
                          <p style={{fontSize:11,color:T.muted,margin:0}}>{note.created_at ? new Date(note.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : note.date}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROGRESS VIEW */}
        {view==='progress' && (
          <div className="fi" style={{padding:18}}>
            <h2 style={{fontFamily:"Cinzel,serif",fontSize:20,color:T.cream,marginBottom:4}}>Your Progress</h2>
            <p style={{fontSize:14,color:T.muted,fontStyle:"italic",marginBottom:20}}>Year 2 — 52 weeks of deeper formation.</p>
            <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:14,padding:"18px 20px",marginBottom:20}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,textAlign:"center"}}>
                {[
                  ["Weeks Active",ALL_WEEKS.filter(w=>daysComplete(w.week)>0).length],
                  ["Days Logged",entries.filter(e=>e.field_key.startsWith('tr_')&&(e.field_value||'').trim()).length],
                  ["Prayers Written",entries.filter(e=>e.field_key==='prayer'&&(e.field_value||'').trim()).length],
                ].map(([label,val])=>(
                  <div key={label}>
                    <div style={{fontSize:28,fontWeight:600,color:T.gold,fontFamily:"Cinzel,serif"}}>{val}</div>
                    <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"Cinzel,serif"}}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:6}}>
              {ALL_WEEKS.map(w=>{
                const done=daysComplete(w.week);
                const cur=w.week===wk;
                return (
                  <button key={w.week} onClick={()=>{setWk(w.week);setView('journal');setSec('passage');setAnimK(a=>a+1);}} style={{background:cur?"linear-gradient(145deg,"+T.goldF+","+T.goldF+")":done>0?"linear-gradient(145deg,"+T.greenF+","+T.greenF+")":T.bgCard,border:"1px solid "+(cur?T.goldB:done>0?T.greenB:T.border),borderRadius:12,padding:"13px 16px",cursor:"pointer",textAlign:"left",transition:"all .25s"}}>
                    <div style={{fontSize:9,color:cur?T.gold:T.muted,fontFamily:"Cinzel,serif",letterSpacing:"0.1em",marginBottom:3}}>WEEK {w.week}</div>
                    <div style={{fontSize:11,color:T.text,lineHeight:1.3}}>{w.theme}</div>
                    {done>0&&<div style={{fontSize:9,color:T.green,marginTop:4}}>{done}/7 days</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SAVED VIEW */}
        {view==='search' && (
          <div style={{padding:"0 0 80px"}}>
            <h2 style={{fontFamily:"Cinzel,serif",fontSize:20,color:T.cream,marginBottom:4}}>Search</h2>
            <p style={{fontSize:14,color:T.muted,fontStyle:"italic",marginBottom:16}}>Search across all 52 weeks of Year 2.</p>
            <input
              autoFocus
              value={searchQuery}
              onChange={e=>doSearch(e.target.value)}
              placeholder="Search verses, themes, prayers, insights..."
              style={{width:"100%",background:T.inputBg,border:"1px solid "+T.goldB,borderRadius:12,color:T.text,fontSize:16,padding:"13px 16px",fontFamily:"EB Garamond,Georgia,serif",outline:"none",boxSizing:"border-box",marginBottom:16}}
            />
            {searchQuery && (
              <div>
                <div style={{fontSize:10,color:T.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>{searchResults.length} weeks found</div>
                {searchResults.length===0&&<p style={{fontSize:15,color:T.muted,fontStyle:"italic"}}>No results. Try a different word.</p>}
                {searchResults.map(({week:w,hits})=>(
                  <button key={w.week} onClick={()=>{setWk(w.week);setView('journal');setSec('passage');setAnimK(a=>a+1);window.scrollTo(0,0);}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,marginBottom:8,cursor:"pointer",textAlign:"left",background:T.cardBg,border:"1px solid "+T.border,transition:"all .2s"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:T.muted,fontFamily:"Cinzel,serif",letterSpacing:"0.1em",marginBottom:2}}>WEEK {w.week}</div>
                      <div style={{fontSize:13,color:T.cream,fontFamily:"Cinzel,serif",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.theme}</div>
                      <div style={{fontSize:12,color:T.muted,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.verseRef}</div>
                      <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                        {hits.map(h=>(<span key={h} style={{fontSize:9,color:T.gold,background:T.goldF,border:"1px solid "+T.goldB,borderRadius:6,padding:"1px 6px",fontFamily:"Cinzel,serif",letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</span>))}
                      </div>
                    </div>
                    <span style={{color:T.gold,fontSize:14}}>›</span>
                  </button>
                ))}
              </div>
            )}
            {!searchQuery&&<div style={{textAlign:"center",padding:"32px 0"}}><div style={{fontSize:32,marginBottom:10}}>⚓</div><p style={{fontSize:14,color:T.muted,fontStyle:"italic"}}>Search all 52 weeks of Year 2.</p></div>}
          </div>
        )}

        {view==='saved' && (
          <div className="fi" style={{padding:18}}>
            <h2 style={{fontFamily:"Cinzel,serif",fontSize:20,color:T.cream,marginBottom:4}}>Saved Verses</h2>
            {bookmarks.length===0
              ? <p style={{color:T.muted,fontStyle:"italic"}}>No saved verses yet. Tap ☆ on any verse to save it.</p>
              : bookmarks.map((bm,i)=>(
                <div key={i} style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:12,padding:"16px 18px",marginBottom:10}}>
                  <p style={{fontSize:16,color:T.text,fontStyle:"italic",lineHeight:1.75,marginBottom:8}}>&#8220;{bm.text}&#8221;</p>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:11,color:T.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>{bm.ref}</span>
                      <button onClick={()=>{setWk(bm.week);setView('journal');setSec(bm.section||'passage');setAnimK(a=>a+1);window.scrollTo(0,0);}} style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:11,textDecoration:"underline"}}>Open</button>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontSize:11,color:T.muted}}>Week {bm.week}</span>
                      <button onClick={()=>{
                        if(window.confirm(`Remove ${bm.ref} from saved?`)) {
                          const updated = bookmarks.filter(b => b.key !== bm.key);
                          setBookmarks(updated);
                          try { localStorage.setItem('y2_bookmarks', JSON.stringify(updated)); } catch {}
                        }
                      }} style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:"2px 6px"}}>✕</button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* SETTINGS VIEW */}
        {view==='settings' && (
          <div className="fi" style={{padding:18}}>
            <h2 style={{fontFamily:"Cinzel,serif",fontSize:20,color:T.cream,marginBottom:20}}>Settings</h2>

            {/* Appearance */}
            <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:14,padding:"18px 20px",marginBottom:12}}>
              <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:T.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14}}>Appearance</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:15,color:T.text}}>Dark Mode</span>
                <button onClick={()=>setDarkMode(d=>!d)} style={{background:darkMode?T.goldF:"transparent",border:"1px solid "+(darkMode?T.goldB:T.border),color:darkMode?T.gold:T.muted,padding:"6px 16px",borderRadius:20,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif"}}>
                  {darkMode?"On":"Off"}
                </button>
              </div>
            </div>

            {/* Refer a Friend */}
            <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:14,padding:"18px 20px",marginBottom:12}}>
              <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:T.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Refer a Friend</div>
              <p style={{fontSize:14,color:T.muted,lineHeight:1.65,marginBottom:14}}>Share Anchored Steps Year 2 with someone ready to go deeper.</p>
              <div style={{background:T.goldF,border:"1px solid "+T.goldB,borderRadius:10,padding:"12px 14px",marginBottom:12,fontFamily:"Cinzel,serif",fontSize:12,color:T.gold,letterSpacing:"0.04em"}}>
                anchored-steps-y2.vercel.app
              </div>
              <button onClick={()=>{navigator.clipboard.writeText("anchored-steps-y2.vercel.app").then(()=>alert("Link copied!"));}} style={{width:"100%",background:T.goldF,border:"1px solid "+T.goldB,color:T.gold,padding:"10px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>
                Copy Link
              </button>
            </div>

            {/* Account */}
            <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:14,padding:"18px 20px",marginBottom:12}}>
              <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:T.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14}}>Account</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,color:T.muted}}>Email</span>
                <span style={{fontSize:13,color:T.text}}>{session.user.email}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <span style={{fontSize:13,color:T.muted}}>Plan</span>
                <span style={{fontSize:12,color:T.gold,fontFamily:"Cinzel,serif",background:T.goldF,border:"1px solid "+T.goldB,padding:"3px 10px",borderRadius:12}}>{profile?.plan==='annual'?'Annual Access':profile?.plan==='monthly'?'Monthly':'Active'}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:14,borderTop:"1px solid "+T.border}}>
                <span style={{fontSize:13,color:T.muted}}>Progress</span>
                <span style={{fontSize:13,color:T.text}}>{ALL_WEEKS.filter(w=>entries.some(e=>e.week===w.week&&(e.field_value||'').trim())).length} / 52 weeks</span>
              </div>
            </div>

            {/* Support */}
            <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:14,padding:"18px 20px",marginBottom:12}}>
              <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:T.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Support</div>
              <p style={{fontSize:14,color:T.muted,lineHeight:1.65,marginBottom:14}}>Questions, feedback, or need to manage your subscription?</p>
              <a href="mailto:support@eloraradiance.com" style={{display:"block",textAlign:"center",width:"100%",boxSizing:"border-box",background:T.goldF,border:"1px solid "+T.goldB,color:T.gold,padding:"10px",borderRadius:10,fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",textDecoration:"none"}}>
                Email Support
              </a>
            </div>

            {/* Sign Out */}
            <button onClick={()=>setShowSignOutConfirm(true)} style={{width:"100%",background:"transparent",border:"1px solid "+T.redB,color:T.red,padding:"12px",borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:"0.06em"}}>Sign Out</button>
          </div>
        )}
      </div>

      {/* Sign Out Confirm Modal */}
      {showSignOutConfirm && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setShowSignOutConfirm(false)}>
          <div style={{background:"linear-gradient(145deg,"+T.bg+","+T.bgMid+")",border:"1px solid "+T.goldB,borderRadius:18,padding:24,maxWidth:340,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:T.gold,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12,textAlign:"center"}}>Sign Out?</div>
            <p style={{fontSize:14,color:T.text,lineHeight:1.7,marginBottom:18,textAlign:"center"}}>Your progress is saved automatically. You can sign back in anytime.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={()=>setShowSignOutConfirm(false)} style={{background:"transparent",border:"1px solid "+T.border,color:T.muted,padding:"11px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Cancel</button>
              <button onClick={()=>supabase.auth.signOut()} style={{background:T.redF,border:"1px solid "+T.redB,color:T.red,padding:"11px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {quizVerse && (
        <MemorizeModal verse={quizVerse} onClose={()=>setQuizVerse(null)} onPass={()=>set("mem_"+quizVerse.ref,"1")} T={T}/>
      )}


      {/* Share Verse Modal */}
      {shareVerse && (()=>{
        const Y2_TYPES=[
          {id:'passage', icon:'Passage',  label:'Passage',    show:!!(week?.verseText)},
          {id:'prayer',  icon:'Prayer',   label:'Prayer',     show:!!(week?.prayer)},
          {id:'dontmiss',icon:'DontMiss', label:"Don't Miss", show:!!(week?.dontMissThis)},
          {id:'apply',   icon:'Apply',    label:'Apply',      show:!!(week?.application)},
        ].filter(t=>t.show)
        const cardContent=shareCardType==='prayer'
          ?{label:'Prayer',body:week?.prayer||'',ref:null}
          :shareCardType==='dontmiss'
          ?{label:"Don't Miss",body:week?.dontMissThis||'',ref:null}
          :shareCardType==='apply'
          ?{label:'Application',body:week?.application||'',ref:null}
          :{label:'This Week',body:shareVerse.verseText||'',ref:shareVerse.verseRef||null}
        const caption2=[
          '“'+cardContent.body+'”',
          cardContent.ref?'— '+cardContent.ref:'',
          '',
          week?'Week '+wk+': '+week.theme:'',
          '',
          'Anchored Steps: Year 2 — Deeper faith. Harder truth. Real growth.',
          '',
          'anchored-steps-y2.vercel.app',
        ].filter(l=>l!==undefined).join('\n').replace(/\n{3,}/g,'\n\n').trim()
        const cBg=shareCardLight?'linear-gradient(155deg,#F2EDE3 0%,#E8E1D4 100%)':'linear-gradient(155deg,#0D1820 0%,#172330 100%)'
        const cBorder=shareCardLight?'rgba(0,0,0,0.1)':'rgba(160,120,64,0.25)'
        const cText=shareCardLight?'#1A1209':'#F0ECE3'
        const cGold=shareCardLight?'#7A5C28':'#A07840'
        const cMuted=shareCardLight?'#7A6248':'#7a8a96'
        const cLabel=shareCardLight?'rgba(0,0,0,0.4)':'rgba(160,120,64,0.6)'
        return (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',zIndex:500,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'16px 16px 48px'}} onClick={()=>setShareVerse(null)}>
            <div style={{background:'linear-gradient(145deg,'+T.bg+','+T.bgMid+')',border:'1px solid '+T.goldB,borderRadius:20,padding:22,width:'100%',maxWidth:420,marginTop:24,boxShadow:'0 20px 60px rgba(0,0,0,0.65)'}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{fontSize:10,color:T.gold,fontFamily:'Cinzel,serif',letterSpacing:'0.18em',textTransform:'uppercase'}}>Share Card</div>
                <button onClick={()=>setShareVerse(null)} style={{background:'transparent',border:'none',color:T.muted,cursor:'pointer',fontSize:20,lineHeight:1,padding:0}}>x</button>
              </div>
              <div style={{display:'flex',gap:5,marginBottom:14,flexWrap:'wrap'}}>
                {Y2_TYPES.map(t=>(
                  <button key={t.id} onClick={()=>setShareCardType(t.id)} style={{flex:'1 1 auto',padding:'7px 5px',borderRadius:9,cursor:'pointer',fontSize:11,fontFamily:'Cinzel,serif',letterSpacing:'0.04em',background:shareCardType===t.id?T.goldF:'rgba(255,255,255,0.04)',border:'1px solid '+(shareCardType===t.id?T.goldB:'rgba(255,255,255,0.07)'),color:shareCardType===t.id?T.gold:T.muted,transition:'all .2s'}}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
                <button onClick={()=>setShareCardLight(!shareCardLight)} style={{background:shareCardLight?'rgba(255,255,255,0.1)':T.goldF,border:'1px solid '+(shareCardLight?'rgba(255,255,255,0.2)':T.goldB),color:shareCardLight?'#F0ECE3':T.gold,padding:'5px 13px',borderRadius:20,cursor:'pointer',fontSize:11,fontFamily:'Cinzel,serif',letterSpacing:'0.06em'}}>
                  {shareCardLight?'Light':'Dark'}
                </button>
              </div>
              <div ref={shareCardRef} style={{background:cBg,border:'1px solid '+cBorder,borderRadius:18,padding:'26px 24px',marginBottom:18,textAlign:'center',fontFamily:'EB Garamond,Georgia,serif'}}>
                <img src="/icon2.png" alt="" style={{width:36,height:36,borderRadius:8,marginBottom:9}}/>
                <div style={{fontSize:9,color:cGold,fontFamily:'Cinzel,serif',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:4}}>Anchored Steps - Year 2</div>
                <div style={{fontSize:9,color:cLabel,fontFamily:'Cinzel,serif',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:14,paddingBottom:14,borderBottom:'1px solid '+cBorder}}>Week {wk} - {week?.theme}</div>
                <div style={{fontSize:9,color:cGold,fontFamily:'Cinzel,serif',letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:11}}>{Y2_TYPES.find(t=>t.id===shareCardType)?.label}</div>
                <p style={{fontSize:17,color:cText,fontStyle:'italic',lineHeight:1.9,margin:'0 0 12px',letterSpacing:'0.01em'}}>
                  {shareCardType==='passage'?'"'+cardContent.body+'"':cardContent.body}
                </p>
                {cardContent.ref&&<p style={{fontSize:10,color:cGold,fontFamily:'Cinzel,serif',letterSpacing:'0.12em',textTransform:'uppercase',margin:'0 0 12px'}}>{cardContent.ref}</p>}
                <p style={{fontSize:9,color:cMuted,margin:0,letterSpacing:'0.05em'}}>Walk steadily. Stay anchored. - eloraradiance.com</p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                <button onClick={handleShareImage} disabled={sharingCard} style={{background:'linear-gradient(135deg,'+T.goldF+','+T.goldF+')',border:'1px solid '+T.goldB,color:T.gold,padding:'12px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:'Cinzel,serif',letterSpacing:'0.08em',opacity:sharingCard?0.6:1}}>
                  {sharingCard?'Saving...':'Share Image'}
                </button>
                <button onClick={()=>navigator.clipboard?.writeText(cardContent.body).then(()=>alert('Copied!'))} style={{background:'transparent',border:'1px solid '+T.border,color:T.muted,padding:'12px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:'Cinzel,serif',letterSpacing:'0.08em'}}>
                  Copy Text
                </button>
              </div>
              <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px 14px',marginBottom:10}}>
                <div style={{fontSize:9,color:T.gold,fontFamily:'Cinzel,serif',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:8}}>Suggested Caption</div>
                <p style={{fontSize:12,color:T.muted,lineHeight:1.7,margin:'0 0 8px',whiteSpace:'pre-line'}}>{caption2}</p>
                <button onClick={()=>navigator.clipboard?.writeText(caption2).then(()=>alert('Caption copied!'))} style={{width:'100%',background:'transparent',border:'1px solid '+T.goldB,color:T.gold,padding:'7px',borderRadius:7,cursor:'pointer',fontSize:10,fontFamily:'Cinzel,serif',letterSpacing:'0.1em'}}>Copy Caption</button>
              </div>
              <button onClick={()=>setShareVerse(null)} style={{width:'100%',background:'transparent',border:'none',color:T.muted,cursor:'pointer',fontSize:13,fontFamily:'EB Garamond,Georgia,serif',paddingTop:4}}>Close</button>
            </div>
          </div>
        )
      })()}
    </div>
  );
}

// Wrap with error boundary
export default function AnchoredStepsY2() {
  return (
    <ErrorBoundary>
      <AnchoredStepsY2Inner />
    </ErrorBoundary>
  );
}
