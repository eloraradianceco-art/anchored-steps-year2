import { useState } from 'react'

export default function Settings({ profile, session, supabase, entries, wk, ALL_WEEKS, darkMode, onToggleDarkMode, onClose }) {
  const [copiedShare, setCopiedShare] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [exporting, setExporting] = useState(false)

  const T = {
    bg: darkMode ? '#0D1820' : '#F2EDE3',
    bgCard: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
    border: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    cream: darkMode ? '#F0ECE3' : '#1A1209',
    text: darkMode ? '#E0D8CA' : '#3D2E1A',
    muted: darkMode ? '#A0AAB2' : '#7A6A5A',
    dim: darkMode ? '#607080' : '#B0A090',
    gold: darkMode ? '#A07840' : '#8B6A30',
    goldF: darkMode ? 'rgba(160,120,64,0.12)' : 'rgba(139,106,48,0.1)',
    goldB: darkMode ? 'rgba(160,120,64,0.28)' : 'rgba(139,106,48,0.28)',
    green: '#7C9284', greenF: 'rgba(124,146,132,0.15)', greenB: 'rgba(124,146,132,0.4)',
  }

  // Progress stats
  const weeksJournaled = ALL_WEEKS ? ALL_WEEKS.filter(w =>
    entries?.some(e => e.week === w.week && ['study','apply','prayer'].includes(e.field_key) && (e.field_value||'').trim())
  ).length : 0
  const versesMemorized = entries?.filter(e => e.field_key?.startsWith('mem_') && e.field_value === '1').length || 0
  const bookmarks = entries?.filter(e => e.field_key === 'bookmark' && e.field_value === '1').length || 0

  const shareText = `I've been using Anchored Steps Year 2 — deeper Scripture, harder questions, and a faith that doesn't quit. 52 weeks of going further with God.\n\nanchored-steps-y2.vercel.app`

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Anchored Steps Year 2', text: shareText, url: 'https://anchored-steps-y2.vercel.app' }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(shareText); setCopiedShare(true); setTimeout(() => setCopiedShare(false), 2500) } catch {}
    }
  }

  const handleExportTxt = async () => {
    if (!session?.user?.id || exporting) return
    setExporting(true)
    try {
      const { data } = await supabase.from('y2_entries').select('*').eq('user_id', session.user.id)
      const get = (week, key) => data?.find(e => e.week === week && e.field_key === key)?.field_value || ''
      const lines = []
      lines.push('ANCHORED STEPS — YEAR 2 JOURNAL')
      lines.push('Elora Radiance Co. | anchored-steps-y2.vercel.app')
      lines.push(`Exported: ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`)
      lines.push('='.repeat(50))
      if (ALL_WEEKS) {
        for (const w of ALL_WEEKS) {
          const study = get(w.week,'study'), apply = get(w.week,'apply'), prayer = get(w.week,'prayer'), reflect = [0,1,2,3,4].map(i=>get(w.week,'rq'+i)).filter(Boolean).join('\n')
          if (!study && !apply && !prayer && !reflect) continue
          lines.push(''); lines.push(`WEEK ${w.week}: ${(w.theme||w.title||'').toUpperCase()}`); lines.push('-'.repeat(40))
          if (study)   { lines.push(''); lines.push('STUDY:');   lines.push(study) }
          if (reflect) { lines.push(''); lines.push('REFLECT:'); lines.push(reflect) }
          if (apply)   { lines.push(''); lines.push('APPLY:');   lines.push(apply) }
          if (prayer)  { lines.push(''); lines.push('PRAYER:');  lines.push(prayer) }
        }
      }
      lines.push(''); lines.push('='.repeat(50)); lines.push('Walk steadily. Stay anchored.')
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `anchored-steps-y2-${new Date().toISOString().split('T')[0]}.txt`; a.click()
      URL.revokeObjectURL(url)
    } catch(e) { console.error(e) }
    setExporting(false)
  }

  const handlePrintPDF = async () => {
    if (!session?.user?.id) return
    const { data } = await supabase.from('y2_entries').select('*').eq('user_id', session.user.id)
    const get = (week, key) => data?.find(e => e.week === week && e.field_key === key)?.field_value || ''
    const win = window.open('', '_blank')
    let html = `<!DOCTYPE html><html><head><title>Anchored Steps Year 2 Journal</title>
    <style>body{font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#1a1209;line-height:1.8}
    h1{font-size:26px;text-align:center;margin-bottom:4px}
    .sub{text-align:center;color:#8B6A2E;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:36px}
    h2{font-size:17px;border-bottom:1px solid #B08A4E;padding-bottom:6px;margin-top:32px}
    h3{font-size:12px;color:#8B6A2E;letter-spacing:0.1em;text-transform:uppercase;margin:14px 0 5px}
    p{line-height:1.85;margin:0 0 10px}@media print{body{padding:20px}}</style></head><body>
    <h1>Anchored Steps · Year 2</h1>
    <p class="sub">Journal — Exported ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>`
    if (ALL_WEEKS) {
      for (const w of ALL_WEEKS) {
        const study = get(w.week,'study'), apply = get(w.week,'apply'), prayer = get(w.week,'prayer')
        const reflect = [0,1,2,3,4].map(i=>get(w.week,'rq'+i)).filter(Boolean).join('<br/>')
        if (!study && !apply && !prayer && !reflect) continue
        html += `<h2>Week ${w.week} — ${w.theme||w.title||''}</h2>`
        if (study)   html += `<h3>Study</h3><p>${study.split('\n').join('<br/>')}</p>`
        if (reflect) html += `<h3>Reflect</h3><p>${reflect}</p>`
        if (apply)   html += `<h3>Apply</h3><p>${apply.split('\n').join('<br/>')}</p>`
        if (prayer)  html += `<h3>Prayer</h3><p>${prayer.split('\n').join('<br/>')}</p>`
      }
    }
    html += `<hr/><p style="text-align:center;font-size:12px;color:#999">Walk steadily. Stay anchored. — anchored-steps-y2.vercel.app</p></body></html>`
    win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500)
  }

  const handleSignOut = async () => { setSigningOut(true); await supabase.auth.signOut() }

  const Row = ({ icon, label, children, border = true }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 0', borderBottom: border ? `1px solid ${T.border}` : 'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:18, width:26, textAlign:'center' }}>{icon}</span>
        <span style={{ fontSize:16, color:T.text, fontFamily:"'EB Garamond',Georgia,serif" }}>{label}</span>
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, background: darkMode ? '#0D1820' : '#F2EDE3', fontFamily:"'EB Garamond',Georgia,serif", overflowY:'auto' }}>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'0 0 80px' }}>

        {/* Sticky header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${T.border}`, position:'sticky', top:0, zIndex:10, background: darkMode ? '#0D1820' : '#F2EDE3', backdropFilter:'blur(12px)' }}>
          <div>
            <div style={{ fontSize:9, color:T.gold, letterSpacing:'0.16em', textTransform:'uppercase', fontFamily:"'Cinzel',Georgia,serif" }}>Anchored Steps · Year 2</div>
            <div style={{ fontSize:18, fontWeight:700, color:T.cream, fontFamily:"'Cinzel',Georgia,serif" }}>Settings</div>
          </div>
          <button onClick={onClose} style={{ background:T.bgCard, border:`1px solid ${T.border}`, color:T.muted, width:36, height:36, borderRadius:9, cursor:'pointer', fontSize:18 }}>←</button>
        </div>

        <div style={{ padding:'8px 20px' }}>

          {/* Progress */}
          <div style={{ marginTop:24, marginBottom:8 }}>
            <div style={{ fontSize:9, color:T.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'Cinzel',Georgia,serif", marginBottom:4 }}>Your Progress</div>
          </div>
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
              {[[weeksJournaled,'Weeks','📖'],[versesMemorized,'Memorized','✦'],[bookmarks,'Saved','☆']].map(([v,l,icon]) => (
                <div key={l} style={{ background:T.goldF, border:`1px solid ${T.goldB}`, borderRadius:12, padding:'14px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:26, fontWeight:700, color:T.gold, fontFamily:"'Cinzel',Georgia,serif", lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ height:5, background:T.bgCard, borderRadius:3, overflow:'hidden', border:`1px solid ${T.border}` }}>
              <div style={{ height:'100%', background:`linear-gradient(90deg,${T.gold},#C9A96E)`, width:`${Math.round((wk/52)*100)}%`, transition:'width .4s ease' }}/>
            </div>
            <div style={{ fontSize:12, color:T.muted, textAlign:'center', marginTop:8 }}>Week {wk} of 52 · {Math.round((wk/52)*100)}% complete</div>
          </div>

          {/* Account */}
          <div style={{ marginTop:24, marginBottom:8 }}>
            <div style={{ fontSize:9, color:T.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'Cinzel',Georgia,serif", marginBottom:4 }}>Account</div>
          </div>
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'0 16px' }}>
            <Row icon="✉️" label={session?.user?.email || profile?.email || 'Your account'}>
              <span style={{ fontSize:11, color:T.gold, fontFamily:"'Cinzel',Georgia,serif" }}>
                {profile?.plan === 'annual' ? 'Annual ✦' : 'Monthly ✦'}
              </span>
            </Row>
            <Row icon="🚪" label="Sign Out" border={false}>
              <button onClick={handleSignOut} disabled={signingOut} style={{ background:T.goldF, border:`1px solid ${T.goldB}`, color:T.gold, padding:'6px 16px', borderRadius:10, cursor:'pointer', fontSize:12, fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.07em' }}>
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </Row>
          </div>

          {/* Appearance */}
          <div style={{ marginTop:24, marginBottom:8 }}>
            <div style={{ fontSize:9, color:T.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'Cinzel',Georgia,serif", marginBottom:4 }}>Appearance</div>
          </div>
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'0 16px' }}>
            <Row icon={darkMode ? '🌙' : '☀️'} label={darkMode ? 'Dark Mode' : 'Light Mode'} border={false}>
              <div onClick={onToggleDarkMode} style={{ width:48, height:28, borderRadius:14, cursor:'pointer', background: darkMode ? T.gold : T.bgCard, border:`1px solid ${darkMode ? T.goldB : T.border}`, position:'relative', transition:'all .25s' }}>
                <div style={{ position:'absolute', top:3, left: darkMode ? 22 : 3, width:20, height:20, borderRadius:'50%', background: darkMode ? '#fff' : T.muted, transition:'left .25s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
              </div>
            </Row>
          </div>

          {/* Share */}
          <div style={{ marginTop:24, marginBottom:8 }}>
            <div style={{ fontSize:9, color:T.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'Cinzel',Georgia,serif", marginBottom:4 }}>Share & Referral</div>
          </div>
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px' }}>
            <p style={{ fontSize:15, color:T.text, lineHeight:1.75, marginBottom:14 }}>Know someone who finished Year 1 and is ready to go deeper? Share Year 2 with them.</p>
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)', border:`1px solid ${T.border}`, borderRadius:10, padding:'12px 14px', marginBottom:12, fontSize:13, color:T.muted, fontStyle:'italic', lineHeight:1.7 }}>
              "{shareText.split('\n')[0]}"
            </div>
            <button onClick={handleShare} style={{ width:'100%', background: copiedShare ? T.greenF : T.goldF, border:`1px solid ${copiedShare ? T.greenB : T.goldB}`, color: copiedShare ? T.green : T.gold, padding:'13px', borderRadius:12, cursor:'pointer', fontSize:13, fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.08em', transition:'all .25s' }}>
              {copiedShare ? '✓ Copied — Send It to Someone' : '🔗 Share Anchored Steps Year 2'}
            </button>
          </div>

          {/* More from Elora Radiance */}
          <div style={{ marginTop:24, marginBottom:8 }}>
            <div style={{ fontSize:9, color:T.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'Cinzel',Georgia,serif", marginBottom:4 }}>More from Elora Radiance Co.</div>
          </div>
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'12px 16px' }}>
            <p style={{ fontSize:13, color:T.muted, fontStyle:'italic', lineHeight:1.7, marginBottom:14 }}>Scripture-based tools for the believer who is serious about their faith.</p>
            {[
              { label:'Armed & Anchored', desc:'Spiritual warfare training — 23 weapons', url:'https://armedandanchored.vercel.app/', icon:'⚔️' },
              { label:'Anchored Steps · Year 1', desc:'52 weeks of faith in action', url:'https://anchored-steps.vercel.app/', icon:'⚓' },
              { label:'The Red Letters', desc:'Complete words of Jesus by theme — free', url:'https://redletters.vercel.app/', icon:'✦' },
            ].map(app => (
              <a key={app.url} href={app.url} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 14px', borderRadius:12, marginBottom:8, background:T.goldF, border:`1px solid ${T.goldB}`, textDecoration:'none', transition:'all .2s' }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{app.icon}</span>
                <span style={{ flex:1 }}>
                  <span style={{ display:'block', fontSize:13, color:T.cream, fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.05em', marginBottom:2 }}>{app.label}</span>
                  <span style={{ display:'block', fontSize:12, color:T.muted, fontStyle:'italic' }}>{app.desc}</span>
                </span>
                <span style={{ fontSize:13, color:T.gold }}>↗</span>
              </a>
            ))}
          </div>

          {/* About */}
          <div style={{ marginTop:24, marginBottom:8 }}>
            <div style={{ fontSize:9, color:T.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'Cinzel',Georgia,serif", marginBottom:4 }}>About</div>
          </div>
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'0 16px' }}>
            <Row icon="⚓" label="Anchored Steps · Year 2">
              <span style={{ fontSize:11, color:T.dim }}>v1.0</span>
            </Row>
            <Row icon="🌿" label="Elora Radiance Co." border={false}>
              <span style={{ fontSize:11, color:T.dim }}>eloraradiance.com</span>
            </Row>
          </div>

          {/* Export */}
          <div style={{ marginTop:24, marginBottom:8 }}>
            <div style={{ fontSize:9, color:T.muted, letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'Cinzel',Georgia,serif", marginBottom:4 }}>Your Data</div>
          </div>
          <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px' }}>
            <p style={{ fontSize:14, color:T.text, lineHeight:1.7, marginBottom:14 }}>Download all your journal entries as a text file, or print as a formatted PDF.</p>
            <button onClick={handleExportTxt} disabled={exporting} style={{ width:'100%', background: exporting ? 'transparent' : T.goldF, border:`1px solid ${exporting ? T.border : T.goldB}`, color: exporting ? T.muted : T.gold, padding:'13px', borderRadius:12, cursor: exporting ? 'default' : 'pointer', fontSize:13, fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.08em', transition:'all .25s', marginBottom:8 }}>
              {exporting ? 'Preparing Export…' : '📥 Export Journal'}
            </button>
            <button onClick={handlePrintPDF} style={{ width:'100%', padding:'13px', borderRadius:12, cursor:'pointer', background:T.bgCard, border:`1px solid ${T.border}`, color:T.muted, fontSize:12, fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.08em' }}>
              🖨️ Print as PDF
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
