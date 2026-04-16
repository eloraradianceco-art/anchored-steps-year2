import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { toPng } from "html-to-image";
import Onboarding from "./Onboarding.jsx";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL_Y2 || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY_Y2 || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

const G = {
  bg:"#0D1820",bgCard:"rgba(255,255,255,0.035)",bgMid:"#172330",
  gold:"#A07840",goldL:"#C49A5A",goldF:"rgba(160,120,64,0.12)",goldB:"rgba(160,120,64,0.28)",
  green:"#7C9284",greenF:"rgba(124,146,132,0.12)",greenB:"rgba(124,146,132,0.28)",
  purple:"#A89ACF",purpleF:"rgba(168,154,207,0.08)",purpleB:"rgba(168,154,207,0.22)",
  red:"#D97A7A",redF:"rgba(217,122,122,0.08)",redB:"rgba(217,122,122,0.24)",
  cream:"#F0ECE3",text:"#E0D8CA",muted:"#A0AAB2",dim:"#66737E",border:"rgba(255,255,255,0.06)",
};
const LIGHT = {
  bg:"#F0EAE0",bgCard:"rgba(0,0,0,0.04)",bgMid:"#E4DDCF",
  cream:"#1A1008",text:"#2C1F0E",muted:"#5A4535",dim:"#8A7060",
  border:"rgba(0,0,0,0.10)",gold:"#7A5A28",
};

const ALL_WEEKS = window.__APPDATA_Y2__?.ALL_WEEKS || [];

function SaveBtn({onSave,flash}){
  return (
    <button onClick={onSave} style={{marginTop:12,width:"100%",background:flash?"rgba(124,146,132,0.15)":G.goldF,border:"1px solid "+(flash?G.greenB:G.goldB),color:flash?G.green:G.gold,padding:"11px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",transition:"all .3s"}}>
      {flash ? "✓ Saved" : "Save Entry"}
    </button>
  );
}

function NextSectionBtn({current, sections, onNext}){
  const idx = sections.findIndex(s=>s.id===current);
  const next = sections[idx+1];
  if(!next) return null;
  return (
    <button onClick={()=>onNext(next.id)} style={{marginTop:10,width:"100%",background:"transparent",border:"1px solid rgba(160,120,64,0.25)",color:G.gold,padding:"11px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>
      Next: {next.label} &#8594;
    </button>
  );
}

function QuizModal({verse,onClose,onPass,G}){
  const [input,setInput]=useState('');
  const [result,setResult]=useState(null);
  const check=()=>{
    const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
    const aw=norm(input).split(' ');
    const cw=norm(verse.text||verse.verseText||'').split(' ');
    const r=aw.filter(w=>cw.includes(w)).length/cw.length>=0.75?'pass':'fail';
    setResult(r);
    if(r==='pass') onPass();
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={onClose}>
      <div style={{background:"linear-gradient(145deg,#0D1820,#172330)",border:"1px solid rgba(160,120,64,0.4)",borderRadius:20,padding:28,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:10,color:G.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:16}}>Memorize This Verse</div>
        <p style={{fontSize:14,color:G.muted,fontStyle:"italic",lineHeight:1.7,marginBottom:20}}>{verse.ref || verse.verseRef}</p>
        <textarea rows={4} value={input} onChange={e=>setInput(e.target.value)} placeholder="Type the verse from memory..." style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 14px",color:G.text,fontSize:15,fontFamily:"EB Garamond,Georgia,serif",resize:"none",boxSizing:"border-box",outline:"none",lineHeight:1.7,marginBottom:12}}/>
        {result&&<div style={{textAlign:"center",fontSize:15,color:result==='pass'?G.green:G.red,marginBottom:12,fontFamily:"Cinzel,serif"}}>{result==='pass'?"✓ Well done! Marked as memorized.":"Keep practicing — you're getting there."}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button onClick={check} style={{background:"linear-gradient(135deg,rgba(160,120,64,0.3),rgba(160,120,64,0.12))",border:"1px solid rgba(160,120,64,0.45)",color:G.gold,padding:"12px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Check</button>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:G.muted,padding:"12px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ContextModal({ae,onClose}){
  if(!ae) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={onClose}>
      <div style={{background:"linear-gradient(145deg,#0D1820,#172330)",border:"1px solid rgba(160,120,64,0.4)",borderRadius:20,padding:28,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:10,color:G.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.14em",textTransform:"uppercase"}}>Scripture Context</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:G.muted,cursor:"pointer",fontSize:20,lineHeight:1}}>&#215;</button>
        </div>
        {ae.ref&&<div style={{background:"rgba(160,120,64,0.08)",border:"1px solid rgba(160,120,64,0.2)",borderRadius:10,padding:"10px 14px",marginBottom:20}}>
          <span style={{fontSize:11,color:G.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",textTransform:"uppercase"}}>{ae.ref}</span>
        </div>}
        {[["Author",ae.author],["Location",ae.location],["Audience",ae.audience],["Commentary",ae.commentary]].map(([lb,val])=>val?(
          <div key={lb} style={{marginBottom:16,paddingBottom:16,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontSize:10,color:G.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:7}}>{lb}</div>
            <p style={{fontSize:15,color:"#E0D8CA",lineHeight:1.85,margin:0}}>{val}</p>
          </div>
        ):null)}
        <button onClick={onClose} style={{width:"100%",marginTop:4,background:"transparent",border:"1px solid rgba(255,255,255,0.08)",color:G.muted,padding:"11px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"EB Garamond,Georgia,serif"}}>Close</button>
      </div>
    </div>
  );
}

export default function AnchoredStepsY2(){
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(true);
  const [email,setEmail]=useState('');
  const [pw,setPw]=useState('');
  const [authErr,setAuthErr]=useState('');
  const [authMode,setAuthMode]=useState('login');
  const [code,setCode]=useState('');
  const [wk,setWk]=useState(1);
  const [sec,setSec]=useState('passage');
  const [entries,setEntries]=useState([]);
  const [flash,setFlash]=useState(false);
  const [darkMode,setDarkMode]=useState(true);
  const [view,setView]=useState('journal');
  const [animK,setAnimK]=useState(0);
  const [quizVerse,setQuizVerse]=useState(null);
  const [openAuthor,setOpenAuthor]=useState(null);
  const [shareVerse,setShareVerse]=useState(null);
  const [bookmarks,setBookmarks]=useState(()=>{try{return JSON.parse(localStorage.getItem('y2_bookmarks')||'[]')}catch{return []}});
  const [showOnboarding,setShowOnboarding]=useState(()=>!localStorage.getItem('y2_onboarding_complete'));
  const [profile,setProfile]=useState(null);
  const [day,setDay]=useState(-1);
  const [communityInput,setCommunityInput]=useState('');
  const [communityDone,setCommunityDone]=useState(false);
  const shareCardRef=useRef(null);

  const T = darkMode ? G : {...G,...LIGHT};
  const BG_CARD = darkMode ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.04)';
  const BG_MID = darkMode ? '#172330' : '#E4DDCF';
  const week = ALL_WEEKS.find(w=>w.week===wk);
  const LBL = {fontSize:10,color:G.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12,display:"block"};
  const INP = {width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 14px",color:T.text,fontSize:15,fontFamily:"EB Garamond,Georgia,serif",resize:"vertical",boxSizing:"border-box",outline:"none",lineHeight:1.7};

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>{setSession(s);setLoading(false);});
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session) return;
    supabase.from('profiles').select('*').eq('user_id',session.user.id).single().then(({data})=>{if(data)setProfile(data);});
    supabase.from('journal_entries').select('*').eq('user_id',session.user.id).then(({data})=>{if(data)setEntries(data);});
  },[session]);

  const get=useCallback((key)=>{
    const e=entries.find(e=>e.week===wk&&e.field_key===key);
    return e?.field_value||'';
  },[entries,wk]);

  const set=useCallback(async(key,val)=>{
    const existing=entries.find(e=>e.week===wk&&e.field_key===key);
    if(existing){
      await supabase.from('journal_entries').update({field_value:val}).eq('id',existing.id);
      setEntries(prev=>prev.map(e=>e.id===existing.id?{...e,field_value:val}:e));
    } else {
      const{data}=await supabase.from('journal_entries').insert({user_id:session.user.id,week:wk,field_key:key,field_value:val}).select().single();
      if(data)setEntries(prev=>[...prev,data]);
    }
  },[entries,wk,session]);

  const save=useCallback(async()=>{
    setFlash(true);
    setTimeout(()=>setFlash(false),2000);
  },[]);

  const goWk=useCallback((n)=>{
    setWk(Math.max(1,Math.min(52,n)));
    setSec('passage');
    setAnimK(a=>a+1);
    setDay(-1);
    window.scrollTo(0,0);
  },[]);

  const toggleBookmark=(verse,weekNum,secId)=>{
    const key=`${verse.verseRef||verse.ref}_${weekNum}`;
    const exists=bookmarks.find(b=>b.key===key);
    const updated=exists?bookmarks.filter(b=>b.key!==key):[...bookmarks,{key,ref:verse.verseRef||verse.ref,text:verse.verseText||verse.text,week:weekNum,section:secId}];
    setBookmarks(updated);
    localStorage.setItem('y2_bookmarks',JSON.stringify(updated));
  };
  const isBookmarked=(ref,weekNum)=>bookmarks.some(b=>b.key===`${ref}_${weekNum}`);

  const daysComplete=n=>entries.filter(e=>e.week===n&&e.field_key.startsWith('tr_')&&(e.field_value||'').trim()).length;

  const handleShareImage=async()=>{
    if(!shareCardRef.current||!shareVerse) return;
    try{
      const dataUrl=await toPng(shareCardRef.current,{cacheBust:true,pixelRatio:2,backgroundColor:"#0D1820"});
      const res=await fetch(dataUrl);
      const blob=await res.blob();
      const file=new File([blob],"anchored-steps-year2-verse.png",{type:"image/png"});
      const cap="\u201c"+shareVerse.verseText+"\u201d \u2014 "+shareVerse.verseRef+(week?"\n\nThis week: "+week.theme+".":"")+"\n\nAnchored Steps: Year 2 \u2014 Deeper faith. Harder truth. Real growth.\n\nanchored-steps-y2.vercel.app";
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:"Anchored Steps Year 2",text:cap});
      } else {
        const a=document.createElement("a");a.href=dataUrl;a.download="anchored-steps-year2-verse.png";a.click();
      }
    } catch(err){
      const text=(shareVerse.verseText||'')+' \u2014 '+(shareVerse.verseRef||'');
      navigator.clipboard.writeText(text).then(()=>alert("Copied!"));
    }
  };

  if(loading) return <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:G.gold,fontFamily:"Cinzel,serif",fontSize:14,letterSpacing:"0.1em"}}>LOADING...</div></div>;

  if(!session){
    return (
      <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{maxWidth:380,width:"100%"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <img src="/icon2.png" alt="⚓" style={{width:60,height:60,borderRadius:14,marginBottom:14,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}/>
            <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:G.gold,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Anchored Steps</div>
            <div style={{fontFamily:"Cinzel,serif",fontSize:22,color:G.cream,marginBottom:4}}>Year 2</div>
            <div style={{fontSize:13,color:G.muted,fontStyle:"italic"}}>"Now live like it."</div>
          </div>
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:28}}>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={{...INP,marginBottom:12}}/>
            <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password" type="password" style={{...INP,marginBottom:12}}/>
            {authMode==='signup'&&<input value={code} onChange={e=>setCode(e.target.value)} placeholder="Access Code" style={{...INP,marginBottom:12}}/>}
            {authErr&&<div style={{color:G.red,fontSize:13,marginBottom:12,textAlign:"center"}}>{authErr}</div>}
            <button onClick={async()=>{
              setAuthErr('');
              if(authMode==='login'){
                const{error}=await supabase.auth.signInWithPassword({email,password:pw});
                if(error)setAuthErr(error.message);
              } else {
                const{data:codeData}=await supabase.from('access_codes').select('*').eq('code',code.trim().toUpperCase()).eq('used',false).single();
                if(!codeData){setAuthErr('Invalid or already used access code');return;}
                const{error}=await supabase.auth.signUp({email,password:pw});
                if(error){setAuthErr(error.message);return;}
                await supabase.from('access_codes').update({used:true,used_by:email}).eq('code',code.trim().toUpperCase());
              }
            }} style={{width:"100%",background:"linear-gradient(135deg,rgba(160,120,64,0.3),rgba(160,120,64,0.12))",border:"1px solid rgba(160,120,64,0.4)",color:G.gold,padding:"14px",borderRadius:12,cursor:"pointer",fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:"0.1em",marginBottom:14}}>
              {authMode==='login'?'Sign In':'Create Account'}
            </button>
            <div style={{textAlign:"center",fontSize:12,color:G.muted}}>
              {authMode==='login'?<>New here? <span style={{color:G.gold,cursor:"pointer"}} onClick={()=>setAuthMode('signup')}>Sign up with access code</span></>:<><span style={{color:G.gold,cursor:"pointer"}} onClick={()=>setAuthMode('login')}>Already have an account? Sign in</span></>}
            </div>
            <div style={{marginTop:20,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:20}}>
              <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:G.muted,letterSpacing:"0.14em",textTransform:"uppercase",textAlign:"center",marginBottom:14}}>New Subscriber? Choose Your Plan</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <a href="https://buy.stripe.com/YEAR2_MONTHLY" target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"block",background:"rgba(160,120,64,0.07)",border:"1px solid rgba(160,120,64,0.25)",borderRadius:12,padding:"14px 12px",textAlign:"center"}}>
                  <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:G.gold,letterSpacing:"0.08em",marginBottom:4}}>Monthly</div>
                  <div style={{fontSize:22,fontWeight:600,color:G.cream,fontFamily:"Cinzel,serif",marginBottom:2}}>$5.50</div>
                  <div style={{fontSize:10,color:G.muted,marginBottom:10}}>per month</div>
                  <div style={{background:"rgba(160,120,64,0.15)",borderRadius:6,padding:"6px",fontSize:11,color:G.gold,fontFamily:"Cinzel,serif"}}>Subscribe &#8594;</div>
                </a>
                <a href="https://buy.stripe.com/YEAR2_ANNUAL" target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"block",background:"rgba(160,120,64,0.12)",border:"1px solid rgba(160,120,64,0.25)",borderRadius:12,padding:"14px 12px",textAlign:"center",position:"relative"}}>
                  <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:G.gold,color:"#0D1820",fontSize:9,fontFamily:"Cinzel,serif",padding:"2px 10px",borderRadius:20,whiteSpace:"nowrap",fontWeight:600}}>SAVE 50%</div>
                  <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:G.gold,letterSpacing:"0.08em",marginBottom:4}}>Annual</div>
                  <div style={{fontSize:22,fontWeight:600,color:G.cream,fontFamily:"Cinzel,serif",marginBottom:2}}>$39</div>
                  <div style={{fontSize:10,color:G.muted,marginBottom:10}}>per year</div>
                  <div style={{background:"rgba(160,120,64,0.25)",borderRadius:6,padding:"6px",fontSize:11,color:G.gold,fontFamily:"Cinzel,serif"}}>Subscribe &#8594;</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if(showOnboarding){
    return <Onboarding onComplete={()=>{localStorage.setItem('y2_onboarding_complete','1');setShowOnboarding(false);}} darkMode={darkMode} G={G}/>;
  }

  return (
    <div style={{minHeight:"100vh",background:darkMode?G.bg:T.bg,color:T.text,fontFamily:"EB Garamond,Georgia,serif"}}>
      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:100,background:darkMode?"rgba(13,24,32,0.97)":"rgba(242,237,228,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid "+T.border}}>
        <div style={{padding:"12px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <img src="/icon2.png" alt="⚓" style={{width:44,height:44,borderRadius:11,boxShadow:"0 2px 10px rgba(0,0,0,0.3)"}}/>
            <div>
              <div style={{fontFamily:"Cinzel,serif",fontSize:16,color:T.cream,lineHeight:1.1,letterSpacing:"0.04em"}}>Anchored Steps</div>
              <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:G.gold,letterSpacing:"0.12em",textTransform:"uppercase",lineHeight:1.2}}>Year 2</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:T.muted}}>{session?.user?.email?.split('@')[0]}</span>
            <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:T.muted,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif"}}>Sign Out</button>
          </div>
        </div>
        <div style={{display:"flex",gap:0,borderTop:"1px solid "+T.border,overflowX:"auto"}}>
          {['journal','progress','saved','settings'].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{flex:1,background:view===v?"rgba(160,120,64,0.1)":"transparent",borderBottom:"2px solid "+(view===v?G.gold:"transparent"),color:view===v?G.gold:T.muted,padding:"10px 4px",cursor:"pointer",fontSize:11,fontFamily:"Cinzel,serif",letterSpacing:"0.06em",textTransform:"capitalize",whiteSpace:"nowrap",border:"none",borderBottom:"2px solid "+(view===v?G.gold:"transparent")}}>
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
              <button onClick={()=>goWk(Math.max(1,wk-1))} disabled={wk===1} style={{background:G.goldF,border:"1px solid "+G.goldB,color:G.gold,width:36,height:36,borderRadius:9,cursor:"pointer",fontSize:16,flexShrink:0,opacity:wk===1?.3:1}}>&#8249;</button>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:10,color:G.gold,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"Cinzel,serif",marginBottom:4}}>Week {wk} of 52</div>
                <div style={{fontSize:18,color:T.cream,fontFamily:"Cinzel,serif",letterSpacing:"0.02em",lineHeight:1.2}}>{week.theme}</div>
              </div>
              <button onClick={()=>goWk(Math.min(52,wk+1))} disabled={wk===52} style={{background:G.goldF,border:"1px solid "+G.goldB,color:G.gold,width:36,height:36,borderRadius:9,cursor:"pointer",fontSize:16,flexShrink:0,opacity:wk===52?.3:1}}>&#8250;</button>
            </div>

            {/* Progress bar */}
            <div style={{background:"rgba(255,255,255,0.05)",borderRadius:3,height:3,margin:"12px 18px 0",overflow:"hidden"}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,#A07840,#C49A5A)",width:((wk/52)*100)+"%",transition:"width .5s ease"}}/>
            </div>

            {/* Section tabs */}
            <div style={{display:"flex",gap:3,flexWrap:"wrap",padding:"14px 18px 0"}}>
              {SECTIONS.map(s=>(
                <button key={s.id} onClick={()=>{setSec(s.id);setAnimK(a=>a+1);}} style={{background:sec===s.id?"linear-gradient(135deg,rgba(160,120,64,0.15),rgba(160,120,64,0.06))":"transparent",border:"1px solid "+(sec===s.id?"rgba(160,120,64,0.35)":G.border),color:sec===s.id?G.gold:T.muted,padding:"6px 10px",borderRadius:8,cursor:"pointer",fontSize:11,transition:"all .18s"}}>{s.label}</button>
              ))}
            </div>

            {/* Section content */}
            <div key={wk+"-"+sec+"-"+animK} style={{padding:"18px 18px 0"}}>

              {/* PASSAGE */}
              {sec==="passage" && (
                <div>
                  <label style={LBL}>Primary Passage — Week {wk}</label>
                  <div style={{background:"linear-gradient(145deg,rgba(160,120,64,0.14),rgba(160,120,64,0.05))",border:"1px solid rgba(160,120,64,0.3)",borderRadius:16,padding:"22px 24px",marginBottom:14,boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
                    <div style={{display:"flex",gap:10}}>
                      <span style={{color:G.gold,fontSize:32,lineHeight:1,opacity:.3,flexShrink:0,fontFamily:"Georgia,serif"}}>&#8220;</span>
                      <div style={{flex:1}}>
                        <p style={{fontSize:20,lineHeight:1.9,color:T.cream,fontStyle:"italic",marginBottom:14,letterSpacing:"0.01em"}}>{week.verseText}</p>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                          <span style={{fontSize:11,color:G.gold,fontFamily:"Cinzel,serif",fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase"}}>{week.verseRef}</span>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>setQuizVerse({text:week.verseText,ref:week.verseRef})} style={{background:get("mem_"+week.verseRef)?"rgba(124,146,132,0.15)":G.purpleF,border:"1px solid "+(get("mem_"+week.verseRef)?G.greenB:G.purpleB),color:get("mem_"+week.verseRef)?G.green:G.purple,padding:"3px 11px",borderRadius:12,cursor:"pointer",fontSize:11,fontFamily:"Cinzel,serif"}}>
                              {get("mem_"+week.verseRef)?"✓ Memorized":"✦ Memorize"}
                            </button>
                            <button onClick={()=>toggleBookmark({verseRef:week.verseRef,verseText:week.verseText},wk,"passage")} style={{background:isBookmarked(week.verseRef,wk)?"rgba(160,120,64,0.2)":"transparent",border:"1px solid "+(isBookmarked(week.verseRef,wk)?"rgba(160,120,64,0.4)":G.border),color:isBookmarked(week.verseRef,wk)?G.gold:T.muted,padding:"3px 10px",borderRadius:12,cursor:"pointer",fontSize:13}}>
                              {isBookmarked(week.verseRef,wk)?"★":"☆"}
                            </button>
                            <button onClick={()=>setShareVerse({verseText:week.verseText,verseRef:week.verseRef})} style={{background:"transparent",border:"1px solid "+G.border,color:T.muted,padding:"3px 8px",borderRadius:12,cursor:"pointer",fontSize:11}}>&#8599;</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <label style={{...LBL,marginTop:20}}>Read in Context</label>
                  <div style={{background:G.bgCard,border:"1px solid "+G.border,borderRadius:12,padding:"16px 20px",marginBottom:14}}>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.readInContext}</p>
                  </div>
                  <SaveBtn onSave={save} flash={flash}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);}}/>
                </div>
              )}

              {/* CONTEXT - Where Are We + Don't Miss This */}
              {sec==="context" && (
                <div>
                  <label style={LBL}>Where Are We in the Story?</label>
                  <div style={{background:G.bgCard,border:"1px solid "+G.border,borderRadius:12,padding:"16px 20px",marginBottom:18}}>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.whereAreWe}</p>
                  </div>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);}}/>
                </div>
              )}

              {/* DON'T MISS THIS — own section */}
              {sec==="dontmiss" && (
                <div>
                  <label style={LBL}>⚠️ Don't Miss This</label>
                  <div style={{background:"linear-gradient(145deg,rgba(160,120,64,0.07),rgba(160,120,64,0.02))",border:"1px solid rgba(160,120,64,0.2)",borderRadius:12,padding:"16px 20px",marginBottom:18}}>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.dontMissThis}</p>
                  </div>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);}}/>
                </div>
              )}

              {/* STUDY */}
              {sec==="study" && (
                <div>
                  <label style={LBL}>Passage Study Prompt</label>
                  <div style={{background:"rgba(168,154,207,0.06)",border:"1px solid rgba(168,154,207,0.2)",borderRadius:12,padding:"16px 20px",marginBottom:18}}>
                    <div style={{fontSize:10,color:"rgba(168,154,207,0.8)",fontFamily:"Cinzel,serif",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Read: {week.verseRef}</div>
                    <div style={{fontSize:10,color:"rgba(168,154,207,0.8)",fontFamily:"Cinzel,serif",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Ask:</div>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.studyPrompt}</p>
                  </div>
                  <label style={LBL}>Study Notes</label>
                  <div style={{background:G.bgCard,border:"1px solid "+G.border,borderRadius:12,padding:"16px 20px",marginBottom:18}}>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.studyNotes}</p>
                  </div>
                  <label style={LBL}>Your Notes</label>
                  <textarea rows={6} value={get("study")} onChange={e=>set("study",e.target.value)} placeholder="Write your personal study notes here..." style={INP}/>
                  <SaveBtn onSave={save} flash={flash}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);}}/>
                </div>
              )}

              {/* REFLECT */}
              {sec==="reflect" && (
                <div>
                  <label style={LBL}>Reflection Questions</label>
                  {week.reflectionQuestions.map((q,i)=>(
                    <div key={i} style={{marginBottom:18}}>
                      <div style={{background:G.bgCard,border:"1px solid "+G.border,borderRadius:9,padding:"12px 16px",marginBottom:8}}>
                        <p style={{fontSize:16,color:T.cream,fontStyle:"italic",margin:0,lineHeight:1.7}}>{q}</p>
                      </div>
                      <textarea rows={4} value={get("rq"+i)} onChange={e=>set("rq"+i,e.target.value)} placeholder="Reflect honestly..." style={INP}/>
                    </div>
                  ))}
                  <SaveBtn onSave={save} flash={flash}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);}}/>
                </div>
              )}

              {/* APPLY */}
              {sec==="apply" && (
                <div>
                  <label style={LBL}>Application + Action Step</label>
                  <div style={{background:"linear-gradient(145deg,rgba(160,120,64,0.08),rgba(160,120,64,0.03))",border:"1px solid rgba(160,120,64,0.2)",borderRadius:14,padding:"20px 22px",marginBottom:18}}>
                    <p style={{fontSize:16,color:T.text,lineHeight:1.85,margin:0,whiteSpace:"pre-line"}}>{week.application}</p>
                  </div>
                  <label style={LBL}>How Will You Live This Out?</label>
                  <textarea rows={5} value={get("apply")} onChange={e=>set("apply",e.target.value)} placeholder="Write your specific plan here..." style={INP}/>
                  <SaveBtn onSave={save} flash={flash}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);}}/>
                </div>
              )}

              {/* PRAYER */}
              {sec==="prayer" && (
                <div>
                  <label style={LBL}>This Week's Prayer</label>
                  <div style={{background:"linear-gradient(145deg,rgba(168,154,207,0.08),rgba(168,154,207,0.02))",border:"1px solid rgba(168,154,207,0.2)",borderRadius:14,padding:"22px 24px",marginBottom:18}}>
                    <p style={{fontSize:17,color:T.cream,lineHeight:2,fontStyle:"italic",margin:0,whiteSpace:"pre-line"}}>{week.prayer}</p>
                  </div>
                  <label style={LBL}>Your Personal Prayer</label>
                  <textarea rows={6} value={get("prayer")} onChange={e=>set("prayer",e.target.value)} placeholder="Write your own prayer for this week..." style={INP}/>
                  <SaveBtn onSave={save} flash={flash}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);}}/>
                </div>
              )}

              {/* TRACKER */}
              {sec==="tracker" && (
                <div>
                  <label style={LBL}>Daily Tracker — Week {wk}</label>
                  <div style={{display:"grid",gap:8,marginBottom:20}}>
                    {DAYS.map((d,i)=>(
                      <div key={i} style={{background:G.bgCard,border:"1px solid "+G.border,borderRadius:10,padding:"10px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <button onClick={()=>setDay(day===i?-1:i)} style={{background:day===i?G.goldF:"transparent",border:"1px solid "+(day===i?G.goldB:G.border),color:day===i?G.gold:G.muted,padding:"4px 14px",borderRadius:6,cursor:"pointer",fontSize:13,fontFamily:"Cinzel,serif",transition:"all .15s"}}>{d}</button>
                          {(get("tr_"+i)||"").trim()&&<span style={{width:7,height:7,borderRadius:"50%",background:G.green,display:"inline-block"}}/>}
                        </div>
                        {day===i&&<textarea className="fu" rows={3} value={get("tr_"+i)} onChange={e=>set("tr_"+i,e.target.value)} placeholder={d+": Where did you see surrender, growth, or God's faithfulness today?"} style={INP}/>}
                      </div>
                    ))}
                  </div>
                  <label style={LBL}>Gratitude (3 things this week)</label>
                  <textarea rows={3} value={get("gratitude")} onChange={e=>set("gratitude",e.target.value)} placeholder="What are you grateful for this week?" style={{...INP,marginBottom:14}}/>
                  <label style={LBL}>End of Week Reflection</label>
                  <textarea rows={4} value={get("weekreflect")} onChange={e=>set("weekreflect",e.target.value)} placeholder="What changed in you this week?" style={INP}/>
                  <SaveBtn onSave={save} flash={flash}/>
                  <NextSectionBtn current={sec} sections={SECTIONS} onNext={s=>{setSec(s);setAnimK(a=>a+1);}}/>
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
                    await supabase.from('community_notes_y2').insert({user_id:session.user.id,week:wk,text:communityInput.trim(),date:new Date().toLocaleDateString()});
                    setCommunityDone(true);
                    setCommunityInput('');
                    setTimeout(()=>setCommunityDone(false),3000);
                  }} style={{background:communityDone?"rgba(124,146,132,0.15)":G.goldF,border:"1px solid "+(communityDone?G.greenB:G.goldB),color:communityDone?G.green:G.gold,padding:"9px 18px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em",marginBottom:24,transition:"all .3s"}}>
                    {communityDone?"✓ Shared!":"Share with Community"}
                  </button>
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
            <div style={{background:G.bgCard,border:"1px solid "+G.border,borderRadius:14,padding:"18px 20px",marginBottom:20}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,textAlign:"center"}}>
                {[
                  ["Weeks Active",ALL_WEEKS.filter(w=>daysComplete(w.week)>0).length],
                  ["Days Logged",entries.filter(e=>e.field_key.startsWith('tr_')&&(e.field_value||'').trim()).length],
                  ["Prayers Written",entries.filter(e=>e.field_key==='prayer'&&(e.field_value||'').trim()).length],
                ].map(([label,val])=>(
                  <div key={label}>
                    <div style={{fontSize:28,fontWeight:600,color:G.gold,fontFamily:"Cinzel,serif"}}>{val}</div>
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
                  <button key={w.week} onClick={()=>{setWk(w.week);setView('journal');setSec('passage');setAnimK(a=>a+1);}} style={{background:cur?"linear-gradient(145deg,rgba(160,120,64,0.16),rgba(160,120,64,0.06))":done>0?"linear-gradient(145deg,rgba(124,146,132,0.1),rgba(124,146,132,0.03))":G.bgCard,border:"1px solid "+(cur?"rgba(160,120,64,0.4)":done>0?"rgba(124,146,132,0.3)":G.border),borderRadius:10,padding:"10px 12px",cursor:"pointer",textAlign:"left",transition:"all .25s"}}>
                    <div style={{fontSize:9,color:cur?G.gold:G.muted,fontFamily:"Cinzel,serif",letterSpacing:"0.1em",marginBottom:3}}>WEEK {w.week}</div>
                    <div style={{fontSize:11,color:T.text,lineHeight:1.3}}>{w.theme}</div>
                    {done>0&&<div style={{fontSize:9,color:G.green,marginTop:4}}>{done}/7 days</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SAVED VIEW */}
        {view==='saved' && (
          <div className="fi" style={{padding:18}}>
            <h2 style={{fontFamily:"Cinzel,serif",fontSize:20,color:T.cream,marginBottom:4}}>Saved Verses</h2>
            {bookmarks.length===0
              ? <p style={{color:T.muted,fontStyle:"italic"}}>No saved verses yet. Tap ☆ on any verse to save it.</p>
              : bookmarks.map((bm,i)=>(
                <div key={i} style={{background:G.bgCard,border:"1px solid "+G.border,borderRadius:12,padding:"16px 18px",marginBottom:10}}>
                  <p style={{fontSize:16,color:T.text,fontStyle:"italic",lineHeight:1.75,marginBottom:8}}>&#8220;{bm.text}&#8221;</p>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:G.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>{bm.ref}</span>
                    <span style={{fontSize:11,color:T.muted}}>Week {bm.week}</span>
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
              <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:G.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14}}>Appearance</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:15,color:T.text}}>Dark Mode</span>
                <button onClick={()=>setDarkMode(d=>!d)} style={{background:darkMode?G.goldF:"rgba(0,0,0,0.06)",border:"1px solid "+(darkMode?G.goldB:T.border),color:darkMode?G.gold:T.muted,padding:"6px 16px",borderRadius:20,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif"}}>
                  {darkMode?"On":"Off"}
                </button>
              </div>
            </div>

            {/* Refer a Friend */}
            <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:14,padding:"18px 20px",marginBottom:12}}>
              <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:G.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Refer a Friend</div>
              <p style={{fontSize:14,color:T.muted,lineHeight:1.65,marginBottom:14}}>Share Anchored Steps Year 2 with someone ready to go deeper.</p>
              <div style={{background:darkMode?"rgba(160,120,64,0.06)":"rgba(160,120,64,0.08)",border:"1px solid rgba(160,120,64,0.2)",borderRadius:10,padding:"12px 14px",marginBottom:12,fontFamily:"Cinzel,serif",fontSize:12,color:G.gold,letterSpacing:"0.04em"}}>
                anchored-steps-y2.vercel.app
              </div>
              <button onClick={()=>{navigator.clipboard.writeText("anchored-steps-y2.vercel.app").then(()=>alert("Link copied!"));}} style={{width:"100%",background:G.goldF,border:"1px solid "+G.goldB,color:G.gold,padding:"10px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>
                Copy Link
              </button>
            </div>

            {/* Account */}
            <div style={{background:T.bgCard,border:"1px solid "+T.border,borderRadius:14,padding:"18px 20px",marginBottom:12}}>
              <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:G.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14}}>Account</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,color:T.muted}}>Email</span>
                <span style={{fontSize:13,color:T.text}}>{session.user.email}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <span style={{fontSize:13,color:T.muted}}>Plan</span>
                <span style={{fontSize:12,color:G.gold,fontFamily:"Cinzel,serif",background:G.goldF,border:"1px solid "+G.goldB,padding:"3px 10px",borderRadius:12}}>{profile?.plan==='annual'?'Annual Access':'Monthly'}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:14,borderTop:"1px solid "+T.border}}>
                <span style={{fontSize:13,color:T.muted}}>Progress</span>
                <span style={{fontSize:13,color:T.text}}>{ALL_WEEKS.filter(w=>entries.some(e=>e.week===w.week&&(e.field_value||'').trim())).length} / 52 weeks</span>
              </div>
            </div>

            {/* Sign Out */}
            <button onClick={()=>supabase.auth.signOut()} style={{width:"100%",background:"transparent",border:"1px solid rgba(217,122,122,0.3)",color:G.red,padding:"12px",borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"Cinzel,serif",letterSpacing:"0.06em"}}>Sign Out</button>
          </div>
        )}

      </div>

      {/* Quiz Modal */}
      {quizVerse && (
        <QuizModal verse={quizVerse} onClose={()=>setQuizVerse(null)} onPass={()=>set("mem_"+quizVerse.ref,"1")} G={G}/>
      )}

      {/* Context Modal */}
      {openAuthor && <ContextModal ae={openAuthor} onClose={()=>setOpenAuthor(null)}/>}

      {/* Share Verse Modal */}
      {shareVerse && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setShareVerse(null)}>
          <div style={{background:"linear-gradient(145deg,#0D1820,#172330)",border:"1px solid rgba(160,120,64,0.4)",borderRadius:20,padding:28,maxWidth:380,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <img src="/icon2.png" alt="" style={{width:36,height:36,borderRadius:8,marginBottom:8}}/>
              <div style={{fontFamily:"Cinzel,serif",fontSize:11,color:G.gold,letterSpacing:"0.14em",textTransform:"uppercase"}}>Share This Verse</div>
            </div>
            <div ref={shareCardRef} style={{background:"linear-gradient(155deg,#0D1820 0%,#172330 100%)",border:"1px solid rgba(160,120,64,0.25)",borderRadius:18,padding:24,marginBottom:20,textAlign:"center"}}>
              <img src="/icon2.png" alt="" style={{width:42,height:42,borderRadius:10,marginBottom:10}}/>
              <div style={{fontFamily:"Cinzel,serif",fontSize:10,color:"#A07840",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>Anchored Steps · Year 2</div>
              <p style={{fontSize:18,color:"#F0ECE3",fontStyle:"italic",lineHeight:1.85,marginBottom:12,fontFamily:"EB Garamond,Georgia,serif"}}>&#8220;{shareVerse.verseText}&#8221;</p>
              <p style={{fontSize:11,color:"#A07840",fontFamily:"Cinzel,serif",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{shareVerse.verseRef}</p>
              <p style={{fontSize:10,color:"#7a8a96",marginBottom:0}}>Walk steadily. Stay anchored. &mdash; eloraradiance.com</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <button onClick={handleShareImage} style={{background:"linear-gradient(135deg,rgba(160,120,64,0.3),rgba(160,120,64,0.12))",border:"1px solid rgba(160,120,64,0.45)",color:G.gold,padding:"12px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Share Image &#8599;</button>
              <button onClick={()=>{navigator.clipboard.writeText((shareVerse.verseText||'')+' — '+(shareVerse.verseRef||'')).then(()=>alert("Copied!"));}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:G.muted,padding:"12px",borderRadius:10,cursor:"pointer",fontSize:12,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Copy Text</button>
            </div>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
              <div style={{fontSize:10,color:G.gold,fontFamily:"Cinzel,serif",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Suggested Caption</div>
              <p style={{fontSize:13,color:G.muted,lineHeight:1.7,margin:"0 0 10px",fontStyle:"italic"}}>&#8220;{shareVerse.verseText}&#8221; &mdash; {shareVerse.verseRef}{week?"\n\nThis week: "+week.theme+".":""}{"\n\nAnchored Steps: Year 2\neloraradiance.com"}</p>
              <button onClick={()=>{const cap="\u201c"+(shareVerse.verseText||"")+"\u201d \u2014 "+(shareVerse.verseRef||"")+(week?"\n\nThis week: "+week.theme+".":"")+"\n\nAnchored Steps: Year 2 \u2014 Deeper faith. Harder truth. Real growth.\n\nanchored-steps-y2.vercel.app";navigator.clipboard.writeText(cap).then(()=>alert("Caption copied!"));}} style={{width:"100%",background:"transparent",border:"1px solid rgba(160,120,64,0.25)",color:G.gold,padding:"8px",borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"Cinzel,serif",letterSpacing:"0.08em"}}>Copy Caption</button>
            </div>
            <button onClick={()=>setShareVerse(null)} style={{width:"100%",background:"transparent",border:"none",color:G.muted,cursor:"pointer",fontSize:13,fontFamily:"EB Garamond,Georgia,serif"}}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}
