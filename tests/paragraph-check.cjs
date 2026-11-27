// Every Year 2 week carries the paragraph its key verse comes from, with the key verse marked inside it.
// Run: node tests/paragraph-check.cjs
const fs = require('fs'), path = require('path')
const s = fs.readFileSync(path.join(__dirname, '../public/data_y2.js'), 'utf8')
const d = JSON.parse(s.slice(s.indexOf('{'), s.indexOf('};\n') + 1)); const weeks = [...d.WEEKS_1_26, ...d.WEEKS_27_52]
const norm = (x) => x.toLowerCase().replace(/[^a-z]/g, ''); const bad = []
for (const w of weeks) {
  const p = w.passage
  if (!Array.isArray(p) || p.length < 3) { bad.push(`week ${w.week}: no paragraph, or shorter than three verses`); continue }
  if (!w.passageRef) bad.push(`week ${w.week}: no paragraph reference`)
  const key = p.filter((v) => v.k)
  if (!key.length) bad.push(`week ${w.week}: key verse not marked`)
  if (key.length >= p.length) bad.push(`week ${w.week}: the paragraph is only the key verse`)
  if (p.some((v) => !v.n || !v.t || !v.t.trim())) bad.push(`week ${w.week}: an empty verse`)
  // the verse shown on the card is found in the marked verses (pieces either side of an ellipsis each count)
  const marked = norm(key.map((v) => v.t).join(' '))
  for (const piece of w.verseText.split('…')) if (norm(piece) && !marked.includes(norm(piece))) bad.push(`week ${w.week}: card text not inside the marked verse: "${piece.trim().slice(0, 40)}"`)
}
console.log(bad.length ? bad.join('\n') : `PASS all ${weeks.length} weeks: paragraph present, key verse marked and found inside it (${weeks.reduce((n, w) => n + w.passage.length, 0)} verses)`)
console.log(`\n${bad.length} failed`); process.exit(bad.length ? 1 : 0)
