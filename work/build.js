// СМЭШ — полная сборка. Слишком длинно для одного use_figma (лимит 50 000 символов),
// поэтому выполняется вызовами из work/out/call-*.js (их собирает work/assemble.py).
// call-1 пересоздаёт страницу, токены и компоненты (RESET), call-2 находит их по имени и дописывает ряды.

// ===== call-1: отдельный вызов use_figma =====
const RESET=true;
// ===== PRELUDE: общий для всех вызовов use_figma =====
const page = figma.root.children.find(p=>p.name==='СМЭШ') || figma.currentPage;
await figma.setCurrentPageAsync(page); page.name='СМЭШ';
const fonts = await figma.listAvailableFontsAsync();
function pick(fam, prefs, fb){ const st = fonts.filter(f=>f.fontName.family===fam).map(f=>f.fontName.style); for (const p of prefs) if (st.includes(p)) return {family:fam, style:p}; return fb; }
const DB = pick('Unbounded',['Black','ExtraBold','Extra Bold','Bold'],{family:'Inter',style:'Black'});
const DM = pick('Unbounded',['Bold','SemiBold','Semi Bold'],{family:'Inter',style:'Bold'});
const TR = pick('Onest',['Regular'],{family:'Inter',style:'Regular'});
const TM = pick('Onest',['Medium'],{family:'Inter',style:'Medium'});
const TB = pick('Onest',['Bold','SemiBold','Semi Bold'],{family:'Inter',style:'Bold'});
for (const f of [DB,DM,TR,TM,TB]) await figma.loadFontAsync(f);

// ---------- токены: при RESET пересоздаём, иначе находим по имени ----------
const C = {ink:'#111210', chalk:'#F1EEE4', paper:'#FBFAF5', muted:'#6E6C63', line:'#D8D3C4', ball:'#CCFF00'};
const hex = h => ({r:parseInt(h.slice(1,3),16)/255, g:parseInt(h.slice(3,5),16)/255, b:parseInt(h.slice(5,7),16)/255});
let col = (await figma.variables.getLocalVariableCollectionsAsync()).find(c=>c.name==='СМЭШ tokens');
if (RESET) { for (const n of [...page.children]) n.remove(); if (col) col.remove(); col = null; }
const V = {}, SP = {}, RD = {};
if (!col) {
  col = figma.variables.createVariableCollection('СМЭШ tokens'); const mode = col.modes[0].modeId;
  for (const [k,v] of Object.entries(C)) { const x = figma.variables.createVariable('color/'+k, col, 'COLOR'); x.setValueForMode(mode, hex(v)); x.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR']; V[k]=x; }
  for (const n of [4,8,12,16,20,24,32]) { const x = figma.variables.createVariable('space/'+n, col, 'FLOAT'); x.setValueForMode(mode, n); x.scopes=['GAP']; SP[n]=x; }
  for (const n of [8,12,16,20,999]) { const x = figma.variables.createVariable('radius/'+n, col, 'FLOAT'); x.setValueForMode(mode, n); x.scopes=['CORNER_RADIUS']; RD[n]=x; }
} else {
  for (const x of await figma.variables.getLocalVariablesAsync()) { if (x.variableCollectionId!==col.id) continue; const [g,k]=x.name.split('/'); (g==='color'?V:g==='space'?SP:RD)[k]=x; }
}
const P = (k, op=1) => op<1 ? {type:'SOLID', color:hex(C[k]), opacity:op} : figma.variables.setBoundVariableForPaint({type:'SOLID', color:hex(C[k])}, 'color', V[k]);
const bind = (n, field, val, tbl) => { if (tbl[val]) { try { n.setBoundVariable(field, tbl[val]); } catch(e) {} } };

// ---------- helpers ----------
function setup(f, dir, o={}) {
  f.layoutMode = dir; f.primaryAxisSizingMode='AUTO'; f.counterAxisSizingMode='AUTO';
  f.name = o.name || f.name;
  f.fills = o.fill ? [P(o.fill, o.op ?? 1)] : [];
  f.itemSpacing = o.gap ?? 0; bind(f,'itemSpacing',o.gap,SP);
  let p = o.p ?? 0; if (typeof p==='number') p=[p,p,p,p]; else if (p.length===2) p=[p[0],p[1],p[0],p[1]];
  [f.paddingTop,f.paddingRight,f.paddingBottom,f.paddingLeft]=p;
  ['paddingTop','paddingRight','paddingBottom','paddingLeft'].forEach((k,i)=>bind(f,k,p[i],SP));
  if (o.r!=null) { f.cornerRadius=o.r; ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'].forEach(k=>bind(f,k,o.r,RD)); }
  if (o.align) f.counterAxisAlignItems=o.align;
  if (o.just) f.primaryAxisAlignItems=o.just;
  if (o.stroke) { f.strokes=[P(o.stroke, o.sop ?? 1)]; f.strokeWeight=o.sw||1; f.strokeAlign='INSIDE'; if (o.dash) f.dashPattern=o.dash; }
  f.clipsContent = o.clip ?? false;
  if (o.w) { if (dir==='HORIZONTAL') f.primaryAxisSizingMode='FIXED'; else f.counterAxisSizingMode='FIXED'; f.resize(o.w, Math.max(f.height,1)); }
  if (o.h) { if (dir==='HORIZONTAL') f.counterAxisSizingMode='FIXED'; else f.primaryAxisSizingMode='FIXED'; f.resize(f.width, o.h); }
  f.primaryAxisSizingMode = dir==='HORIZONTAL' ? (o.w?'FIXED':'AUTO') : (o.h?'FIXED':'AUTO');
  f.counterAxisSizingMode = dir==='HORIZONTAL' ? (o.h?'FIXED':'AUTO') : (o.w?'FIXED':'AUTO');
  if (o.wrap) { f.layoutWrap='WRAP'; f.counterAxisSpacing=o.gap ?? 8; }
  return f;
}
const AL = (dir,o) => setup(figma.createFrame(), dir, o);
function add(parent, ...kids) { for (const k of kids) if (k) parent.appendChild(k); return parent; }
function fillW(n){ n.layoutSizingHorizontal='FILL'; return n; }
function T(str, font, size, color='ink', o={}) {
  const t = figma.createText(); t.fontName=font; t.characters=str; t.fontSize=size; t.fills=[P(color, o.op ?? 1)];
  if (o.lh) t.lineHeight={unit:'PIXELS', value:o.lh};
  if (o.ls!=null) t.letterSpacing={unit:'PERCENT', value:o.ls};
  if (o.w) { t.resize(o.w, t.height); t.textAutoResize='HEIGHT'; }
  if (o.align) t.textAlignHorizontal=o.align;
  if (o.strike) t.textDecoration='STRIKETHROUGH';
  if (o.under) t.textDecoration='UNDERLINE';
  t.name = o.name || str.slice(0,24);
  return t;
}
const ICONS = {
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sliders:'<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  pin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  chevronLeft:'<path d="m15 18-6-6 6-6"/>', chevronDown:'<path d="m6 9 6 6 6-6"/>', chevronRight:'<path d="m9 18 6-6-6-6"/>',
  heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  calendarPlus:'<path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="M16 19h6"/><path d="M19 16v6"/>',
  userPlus:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  star:'<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  ticket:'<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  signal:'<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
  wifi:'<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  battery:'<rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/><line x1="6" x2="6" y1="11" y2="13"/><line x1="10" x2="10" y1="11" y2="13"/><line x1="14" x2="14" y1="11" y2="13"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  apple:'<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
  card:'<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  phone:'<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  qr:'<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  settings:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  bell:'<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  list:'<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  repeat:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>',
  trend:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  del:'<path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="m12 9 6 6"/><path d="m18 9-6 6"/>',
  nav:'<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>'
};
function I(name, color='ink', size=24, op=1) {
  const n = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="'+C[color]+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+ICONS[name]+'</svg>');
  n.name='lucide/'+name; n.fills=[];
  n.findAll(c=>'strokes' in c && c.strokes.length>0).forEach(c=>{ c.strokes=[P(color, op)]; });
  if (size!==24) n.rescale(size/24);
  return n;
}
function place(n, cx, cy, deg) { n.rotation = deg; const a = deg*Math.PI/180, c=Math.cos(a), s=Math.sin(a), w=n.width/2, h=n.height/2; n.x = cx - (c*w + s*h); n.y = cy - (-s*w + c*h); }
function rect(w,h,fill,op=1,r=0){ const x=figma.createRectangle(); x.resize(w,h); x.fills=[P(fill,op)]; if(r) x.cornerRadius=r; return x; }
function circ(d, fill, op=1, stroke=null, sw=2, sop=1){ const e=figma.createEllipse(); e.resize(d,d); e.fills=fill?[P(fill,op)]:[]; if (stroke){ e.strokes=[P(stroke,sop)]; e.strokeWeight=sw; } return e; }
function court(L, W, lineOp=1) {
  const g = figma.createFrame(); g.name='court'; g.resize(L,W); g.fills=[]; g.clipsContent=false;
  g.appendChild(rect(L,W,'chalk',0.05));
  const b = figma.createRectangle(); b.resize(L,W); b.fills=[]; b.strokes=[P('chalk',0.85*lineOp)]; b.strokeWeight=2; g.appendChild(b);
  const sx = 0.695*L/2;
  const s1 = rect(2,W,'chalk',0.55*lineOp); s1.x=L/2-sx-1; g.appendChild(s1);
  const s2 = rect(2,W,'chalk',0.55*lineOp); s2.x=L/2+sx-1; g.appendChild(s2);
  const cl = rect(2*sx,2,'chalk',0.55*lineOp); cl.x=L/2-sx; cl.y=W/2-1; g.appendChild(cl);
  const net = rect(4,W+10,'chalk',lineOp,2); net.x=L/2-2; net.y=-5; g.appendChild(net);
  return g;
}
function ball(size, trail=1) {
  const g = figma.createFrame(); g.name='ball'; g.resize(size*(1.1+1.3*trail), size); g.fills=[]; g.clipsContent=false;
  [[0.28,0.5,0.3],[0.5,0.8,0.6],[0.72,0.35,0.3]].forEach(([hh,ww,op])=>{ if(!trail) return; const L=size*ww*trail; const t=rect(L, size*0.08,'ball',op,size*0.04); t.x=size*1.3*trail-L; t.y=size*hh-size*0.04; g.appendChild(t); });
  const b = figma.createFrame(); b.name='ball/body'; b.resize(size,size); b.cornerRadius=size/2; b.fills=[P('ball')]; b.clipsContent=true; b.x=size*(0.1+1.3*trail); b.y=0;
  for (const dx of [-0.7, 0.7]) { const e=figma.createEllipse(); e.resize(size,size); e.fills=[]; e.strokes=[P('ink')]; e.strokeWeight=Math.max(2,size*0.04); e.x=size*dx; e.y=0; b.appendChild(e); }
  g.appendChild(b);
  return g;
}
function statusBar(color) {
  const s = AL('HORIZONTAL',{name:'status bar', p:[0,24], h:44, w:390, align:'CENTER', just:'SPACE_BETWEEN'});
  const icons = AL('HORIZONTAL',{name:'system', gap:8, align:'CENTER'});
  add(icons, I('signal',color,16), I('wifi',color,16), I('battery',color,18));
  add(s, T('9:41', TB, 15, color), icons);
  return s;
}
function chip(str, o={}) { const c = AL('HORIZONTAL',{name:'chip', p:[8,12], r:999, fill:o.fill||'chalk', op:o.op??0.12, align:'CENTER', gap:8}); if (o.icon) add(c, I(o.icon, o.color||'chalk', 14)); add(c, T(str, TM, 13, o.color||'chalk')); return c; }
const comp = n => page.findOne(x=>(x.type==='COMPONENT_SET'||x.type==='COMPONENT') && x.name===n);
const v = (set, nm) => (set.type==='COMPONENT' ? set : set.children.find(c=>c.name===nm)).createInstance();
const setText = (inst, map) => { for (const [k,val] of Object.entries(map)) { const n = inst.findOne(x=>x.type==='TEXT' && x.name===k); if (n) n.characters = val; } };
function scr(name, fill='chalk', h=844){ const f=figma.createFrame(); f.name=name; f.resize(390,h); f.fills=[P(fill)]; f.clipsContent=true; return f; }
function put(p,n,x,y){ p.appendChild(n); n.x=x; n.y=y; return n; }
function round(icon, bg='paper', fg='ink', bop=1){ const b = AL('HORIZONTAL',{name:'btn '+icon, w:44, h:44, r:999, fill:bg, op:bop, align:'CENTER', just:'CENTER'}); add(b, I(icon,fg,20)); return b; }
function col350(gap=20){ return AL('VERTICAL',{name:'content', w:350, gap}); }
function segmented(items, onIdx){ const s = AL('HORIZONTAL',{name:'segmented', p:4, gap:4, r:12, fill:'paper', stroke:'line'}); items.forEach((l,i)=>{ const it=v(comp('Segment'), i===onIdx?'state=on':'state=off'); setText(it,{label:l}); add(s,it); fillW(it); }); return s; }
function btn(kind, label, icon=false){ const b=v(comp('Button'),'type='+kind); setText(b,{label}); if(!icon) b.findOne(x=>x.name==='icon').visible=false; return b; }
function tabBar(active){ return v(comp('TabBar'),'active='+active); }
function dots(n, a, dark=false){ const d=AL('HORIZONTAL',{name:'pagination', gap:8, align:'CENTER'}); for(let i=0;i<n;i++){ const x=rect(i===a?24:8, 8, i===a?(dark?'chalk':'ink'):(dark?'chalk':'line'), i===a?1:(dark?0.3:1), 4); add(d,x);} return d; }
function getBoard(){ return page.children.find(n=>n.name==='СМЭШ — полный флоу'); }
function makeRow(key, title, note){
  const board=getBoard(); const old = board.children.find(n=>n.name===key); if (old) old.remove();
  const row = AL('VERTICAL',{name:key, gap:40}); const h = AL('VERTICAL',{name:'row head', gap:8});
  add(h, T(title, DB, 40,'ink',{ls:-3}), T(note, TM, 17,'ink',{op:0.7})); const s = AL('HORIZONTAL',{name:'screens', gap:64, align:'MIN'}); add(row,h,s); add(board,row);
  board.children.filter(n=>n.name.startsWith('Ряд')).sort((a,b)=>a.name.localeCompare(b.name)).forEach((r,i)=>board.insertChild(1+i, r));
  return s;
}
function cell(screens, num, title, note, screen){
  screen.name = num+' '+title;
  const c=AL('VERTICAL',{name:'cell '+num, gap:20}); const lab=AL('VERTICAL',{name:'label', gap:8, w:390});
  const t1=AL('HORIZONTAL',{name:'title', gap:12, align:'CENTER'}); const nb=AL('HORIZONTAL',{name:'no', p:[4,10], r:8, fill:'ink'}); add(nb, T(num, TB, 17,'chalk'));
  add(t1, nb, T(title, TB, 20, 'ink')); add(lab, t1); if (note) add(lab, T(note, TR, 15, 'ink', {op:0.7, w:390}));
  add(c, lab, screen); add(screens, c); return screen;
}
function layoutLib(){ const b=getBoard(), lib=page.children.find(n=>n.name==='Компоненты'); b.x=0; b.y=0; if (lib){ lib.x=0; lib.y=b.height+160; } }
{
// ===== PART 1: компоненты + каркас доски (RESET=true) =====
const lib = AL('HORIZONTAL',{name:'Компоненты', p:60, gap:48, fill:'chalk', align:'MIN', wrap:true, w:3200});
lib.itemSpacing=48; lib.counterAxisSpacing=48;
const libHead = AL('VERTICAL',{name:'head', gap:8, w:3080}); add(libHead, T('Компоненты', DB, 40, 'ink', {ls:-3}), T('Все экраны собраны из этих компонентов. Значения цветов, отступов и радиусов — из коллекции СМЭШ tokens.', TM, 17, 'ink', {op:0.7}));
add(lib, libHead);
function setOf(nodes, name, desc, dir='HORIZONTAL'){ const s = figma.combineAsVariants(nodes, lib); setup(s, dir, {name, p:24, gap:16, fill:'paper', r:16, stroke:'line'}); if (desc) s.description=desc; return s; }

// Button
const BTN = {primary:['ball','ink',null,'userPlus','Забронировать'], secondary:[null,'chalk','chalk','calendarPlus','Добавить в календарь'], outline:[null,'ink','ink','send','Войти через Telegram'], dark:['ink','chalk',null,'apple','Войти с Apple']};
const bv = Object.entries(BTN).map(([k,[bg,fg,st,ic,lb]])=>{ const c=figma.createComponent(); setup(c,'HORIZONTAL',{name:'type='+k, h:56, p:[0,24], gap:8, r:16, align:'CENTER', just:'CENTER', fill:bg, stroke:st, sop:k==='secondary'?0.5:1, sw:1.5}); const i=I(ic,fg,20); i.name='icon'; add(c,i,T(lb,TB,17,fg,{name:'label'})); add(lib,c); return c; });
const Button = setOf(bv,'Button','primary: заливка ball, одна на экран. secondary: контур на тёмном. outline: контур на светлом. dark: чернильная заливка, второстепенное действие на светлом.');
Button.fills=[P('muted')];

// Slot
const slv = ['free','selected','busy'].map(state=>{ const c=figma.createComponent();
  setup(c,'VERTICAL',{name:'state='+state, w:81, h:56, r:8, gap:4, align:'CENTER', just:'CENTER', fill: state==='selected'?'ball': state==='free'?'paper':null, stroke: state==='selected'?null:'line', dash: state==='busy'?[4,4]:null});
  add(c, T('19:00', TB, 15, state==='busy'?'muted':'ink', {name:'time', strike: state==='busy'}), T(state==='busy'?'занято':'3 200 ₽', TM, 13, state==='selected'?'ink':'muted', {name:'price'})); add(lib,c); return c; });
setOf(slv,'Slot','Слот времени. selected — единственный ball на сетке; busy — тихий, зачёркнутый.');

// DateChip
const dcv = ['default','selected'].map(state=>{ const c=figma.createComponent(); setup(c,'VERTICAL',{name:'state='+state, w:56, h:64, r:12, gap:4, align:'CENTER', just:'CENTER', fill: state==='selected'?'ball':'paper', stroke: state==='selected'?null:'line'});
  add(c, T('Ср', TM, 13, state==='selected'?'ink':'muted', {name:'day'}), T('14', TB, 17, 'ink', {name:'num'})); add(lib,c); return c; });
setOf(dcv,'DateChip');

// Segment
const sgv = ['on','off'].map(st=>{ const c=figma.createComponent(); setup(c,'HORIZONTAL',{name:'state='+st, h:44, p:[0,12], r:8, fill:st==='on'?'ink':null, align:'CENTER', just:'CENTER'}); add(c, T('90 мин', TB, 15, st==='on'?'chalk':'ink', {name:'label'})); add(lib,c); return c; });
setOf(sgv,'Segment','Пункт сегментированного переключателя и табов. Контейнер: paper, обводка line, padding 4, радиус 12.');

// Chip (светлый фон, множественный выбор)
const chv = ['default','selected'].map(st=>{ const on=st==='selected'; const c=figma.createComponent(); setup(c,'HORIZONTAL',{name:'state='+st, h:40, p:[0,16], gap:6, r:999, fill:on?'ink':'paper', stroke:on?null:'line', align:'CENTER'}); if (on){ const i=I('check','chalk',16); i.name='icon'; add(c,i); } add(c, T('Хамовники', TM, 15, on?'chalk':'ink', {name:'label'})); add(lib,c); return c; });
setOf(chv,'Chip','Фильтр и выбор района на светлом фоне. Выбранный — чернильный, не ball.');

// Input
const inv = ['default','focused'].map(st=>{ const f=st==='focused'; const c=figma.createComponent(); setup(c,'VERTICAL',{name:'state='+st, w:350, gap:8});
  const fld=AL('HORIZONTAL',{name:'field', h:56, p:[0,16], gap:12, r:16, fill:'paper', stroke:f?'ink':'line', sw:f?2:1, align:'CENTER'});
  add(fld, T('+7', TB, 17, 'ink', {name:'prefix'}), rect(1,24,'line'), T(f?'916 245-18-07':'Номер телефона', TM, 17, f?'ink':'muted', {name:'value'}));
  if (f) add(fld, rect(2,24,'ink',1,1));
  add(c, T('Телефон', TM, 13, 'muted', {name:'label'}), fld); fillW(fld); add(lib,c); return c; });
setOf(inv,'Input',null,'VERTICAL');

// OtpCell
const otv = ['empty','active','filled'].map(st=>{ const c=figma.createComponent(); setup(c,'HORIZONTAL',{name:'state='+st, w:64, h:72, r:16, fill:'paper', stroke: st==='active'?'ink':'line', sw: st==='active'?2:1, align:'CENTER', just:'CENTER'});
  if (st==='filled') add(c, T('4', DM, 24, 'ink', {name:'digit'})); if (st==='active') add(c, rect(2,28,'ink',1,1)); add(lib,c); return c; });
setOf(otv,'OtpCell');

// PlayerAvatar
const pav = ['filled','open','you'].map(st=>{ const c=figma.createComponent(); setup(c,'HORIZONTAL',{name:'state='+st, w:44, h:44, r:999, fill: st==='filled'?'ink': st==='you'?'paper':null, stroke: st==='open'?'muted':(st==='filled'?'chalk':'ink'), sw: st==='open'?1.5:2, dash: st==='open'?[4,4]:null, align:'CENTER', just:'CENTER'});
  if (st==='open') add(c, I('plus','muted',18)); else add(c, T('ДС', TB, 15, st==='filled'?'chalk':'ink', {name:'initials'})); add(lib,c); return c; });
setOf(pav,'PlayerAvatar','filled — игрок; you — вы; open — свободное место, пунктир.');

// MapPin
function tail(color){ const t=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7"><path d="M0 0h12L6 7z" fill="#000"/></svg>'); t.name='tail'; t.findAll(n=>'fills' in n && n.type!=='FRAME').forEach(n=>n.fills=[P(color)]); t.fills=[]; return t; }
const mpv = ['default','selected'].map(st=>{ const on=st==='selected'; const c=figma.createComponent(); setup(c,'VERTICAL',{name:'state='+st, align:'CENTER'});
  const b=AL('HORIZONTAL',{name:'body', p:on?[8,12]:[6,10], r:8, fill:on?'ball':'paper'}); add(b, T('2 400 ₽', TB, on?15:13, 'ink', {name:'price'})); add(c, b, tail(on?'ball':'paper')); add(lib,c); return c; });
setOf(mpv,'MapPin','Пин корта с ценой за час. selected — ball.').fills=[P('ink')];

// SheetHeader
const sh = figma.createComponent(); setup(sh,'VERTICAL',{name:'SheetHeader', w:390, p:[8,20,12,20], gap:12, align:'CENTER'});
const shRow = AL('HORIZONTAL',{name:'row', just:'SPACE_BETWEEN', align:'CENTER'}); add(sh, rect(40,5,'line',1,3), shRow); fillW(shRow);
const shAct = AL('HORIZONTAL',{name:'action', gap:6, align:'CENTER'}); const shI=I('list','ink',18); shI.name='icon'; add(shAct, shI, T('Списком', TM, 15, 'ink', {name:'action'}));
add(shRow, T('18 кортов', DM, 24, 'ink', {ls:-2, name:'title'}), shAct); add(lib, sh);
sh.description='Шапка нижнего шита: ручка, заголовок, действие. Шит — chalk, верхние радиусы 24.';

// PayOption
const pov=[]; for (const [m,ic,nm,hint] of [['СБП','qr','СБП','Без комиссии'],['Карта','card','Карта Мир 4417','Сохранена'],['Apple Pay','phone','Apple Pay','Карта в Wallet']]) for (const st of ['on','off']) {
  const on=st==='on'; const c=figma.createComponent(); setup(c,'HORIZONTAL',{name:'method='+m+', state='+st, w:350, h:68, p:[0,16], gap:12, r:16, fill:'paper', stroke:on?'ink':'line', sw:on?2:1, align:'CENTER'});
  const ib=AL('HORIZONTAL',{name:'icon box', w:40, h:40, r:8, fill:'chalk', align:'CENTER', just:'CENTER'}); add(ib, I(ic,'ink',20));
  const tx=AL('VERTICAL',{name:'text', gap:2}); add(tx, T(nm, TB, 15, 'ink', {name:'name'}), T(hint, TR, 13, 'muted', {name:'hint'}));
  const rd=AL('HORIZONTAL',{name:'radio', w:22, h:22, r:999, fill:on?'ink':null, stroke:on?null:'line', sw:2, align:'CENTER', just:'CENTER'}); if (on) add(rd, circ(8,'paper'));
  add(c, ib, tx, rd); tx.layoutGrow=1; add(lib,c); pov.push(c); }
setOf(pov,'PayOption',null,'VERTICAL');

// LevelOption
const lvv = ['default','selected'].map(st=>{ const on=st==='selected'; const c=figma.createComponent(); setup(c,'VERTICAL',{name:'state='+st, w:350, p:16, gap:12, r:16, fill:on?'ink':'paper', stroke:on?null:'line'});
  const r=AL('HORIZONTAL',{name:'row', gap:12, align:'CENTER'}); add(c,r); fillW(r);
  const tx=AL('VERTICAL',{name:'text', gap:2}); add(tx, T('Любитель', TB, 17, on?'chalk':'ink', {name:'title'}), T('Держу розыгрыш, играю пару раз в месяц', TR, 13, on?'chalk':'muted', {op:on?0.65:1, name:'desc', w:230}));
  add(r, tx, T('2,5–3,5', TB, 15, on?'ball':'ink', {name:'range'})); tx.layoutGrow=1;
  if (on){ const sc=AL('HORIZONTAL',{name:'scale', gap:4, align:'CENTER'}); add(sc, T('1,0', TM, 13, 'chalk', {op:0.6}));
    for (let i=0;i<13;i++){ const lv=1+i*0.5; const s=rect(16,6,lv>=2.5&&lv<=3.5?'ball':'chalk', lv>=2.5&&lv<=3.5?1:0.18, 3); s.name='tick '+lv; add(sc,s); }
    add(sc, T('7,0', TM, 13, 'chalk', {op:0.6})); add(c, sc); }
  add(lib,c); return c; });
setOf(lvv,'LevelOption','Уровень по шкале падел-рейтинга 1,0–7,0. В выбранном — шкала, диапазон подсвечен ball.',"VERTICAL");

// TabBar
const TABS=[['home','Корты'],['ticket','Брони'],['users','Игроки'],['user','Профиль']];
const tbv = TABS.map(([_,lab])=>{ const c=figma.createComponent(); setup(c,'HORIZONTAL',{name:'active='+lab, w:350, h:64, p:[0,8], r:999, fill:'ink', align:'CENTER', just:'SPACE_BETWEEN'});
  for (const [ic,l] of TABS){ const on=l===lab; const it=AL('HORIZONTAL',{name:'tab '+l, p:[12,16], gap:8, r:999, fill:on?'chalk':null, align:'CENTER'}); add(it, I(ic,on?'ink':'chalk',20,on?1:0.7)); if(on) add(it,T(l,TB,15,'ink')); add(c,it); }
  add(lib,c); return c; });
setOf(tbv,'TabBar','Один таб-бар на все основные экраны. Плавает: 20 от краёв, 30 от низа.','VERTICAL');

// CourtCard
const card = figma.createComponent(); setup(card,'VERTICAL',{name:'CourtCard', w:350, r:16, fill:'paper', clip:true});
const ill = figma.createFrame(); ill.name='court art'; ill.resize(350,120); ill.fills=[P('ink')]; ill.clipsContent=true;
const cg = court(260,130); ill.appendChild(cg); place(cg, 175, 62, 14);
const bl = ball(34); ill.appendChild(bl); place(bl, 262, 70, 22);
const dist = chip('1,2 км', {icon:'pin'}); dist.name='dist'; dist.children[1].name='dist'; ill.appendChild(dist); dist.x=12; dist.y=12;
const price = AL('HORIZONTAL',{name:'price tag', p:[8,12], r:8, fill:'ball'}); add(price, T('2 400 ₽/ч', TB, 15, 'ink', {name:'price'})); ill.appendChild(price); price.x=350-12-price.width; price.y=12;
add(card, ill);
const info = AL('VERTICAL',{name:'info', p:16, gap:12}); add(card, info); fillW(info);
const head = AL('VERTICAL',{name:'head', gap:4}); add(info, head); fillW(head);
const nameRow = AL('HORIZONTAL',{name:'name row', just:'SPACE_BETWEEN', align:'CENTER'}); add(head, nameRow); fillW(nameRow);
const rate = AL('HORIZONTAL',{name:'rating', gap:4, align:'CENTER'}); add(rate, I('star','ink',14), T('4,9', TB, 13, 'ink', {name:'rating'}));
add(nameRow, T('Лужники Падел', TB, 17, 'ink', {name:'name'}), rate);
add(head, T('Хамовники, м. Спортивная', TR, 13, 'muted', {name:'district'}));
const slotsRow = AL('HORIZONTAL',{name:'slots today', gap:8, align:'CENTER'}); add(info, slotsRow);
add(slotsRow, T('Сегодня', TM, 13, 'muted', {name:'today'}));
for (const [k,val] of [['s1','16:00'],['s2','19:00'],['s3','22:00']]) { const pl = AL('HORIZONTAL',{name:k, p:[8,12], r:8, stroke:'ink', sw:1.5}); add(pl, T(val, TB, 13, 'ink', {name:k})); add(slotsRow, pl); }
add(slotsRow, T('+2', TM, 13, 'muted', {name:'more'}));
add(lib, card); card.description='Карточка корта. Цена — единственный ball. Схема корта вместо фото.';

// MatchCard
const mc = figma.createComponent(); setup(mc,'VERTICAL',{name:'MatchCard', w:350, p:16, gap:14, r:16, fill:'paper', stroke:'line'});
const mTop = AL('HORIZONTAL',{name:'top', just:'SPACE_BETWEEN', align:'MIN'}); add(mc, mTop); fillW(mTop);
const mL = AL('VERTICAL',{name:'when', gap:2}); add(mL, T('20:30', DM, 24, 'ink', {ls:-2, name:'time'}), T('Сегодня, 90 мин', TM, 13, 'muted', {name:'date'}));
const mR = AL('VERTICAL',{name:'price', gap:4, align:'MAX'}); const mP=AL('HORIZONTAL',{name:'price tag', p:[6,10], r:8, fill:'ball'}); add(mP, T('1 200 ₽', TB, 15, 'ink', {name:'price'})); add(mR, mP, T('с игрока', TM, 13, 'muted', {name:'per'}));
add(mTop, mL, mR);
const mClub = AL('VERTICAL',{name:'club', gap:2}); add(mClub, T('Сетка Сокольники', TB, 17, 'ink', {name:'club'}), T('Сокольники, корт 2, крытый', TR, 13, 'muted', {name:'place'})); add(mc, mClub);
const mBot = AL('HORIZONTAL',{name:'seats row', just:'SPACE_BETWEEN', align:'CENTER'}); add(mc, mBot); fillW(mBot);
const seats = AL('HORIZONTAL',{name:'seats', gap:6}); for (let i=0;i<4;i++){ const a=v(comp('PlayerAvatar'), i<3?'state=filled':'state=open'); a.name='seat '+(i+1); add(seats,a); }
const need = AL('VERTICAL',{name:'need', gap:2, align:'MAX'}); add(need, T('Нужен 1 игрок', TB, 15, 'ink', {name:'need'}), T('Уровень 3,0–3,5', TM, 13, 'muted', {name:'level'}));
add(mBot, seats, need);
const mBtn = AL('HORIZONTAL',{name:'join', h:48, r:12, fill:'ink', gap:8, align:'CENTER', just:'CENTER'}); add(mBtn, I('userPlus','chalk',18), T('Присоединиться', TB, 15, 'chalk', {name:'cta'})); add(mc, mBtn); fillW(mBtn);
add(lib, mc); mc.description='Открытый матч: время, цена с игрока (ball), места, уровень, кнопка. В списке кнопка чернильная, ball — только у цены.';

// Ticket (Мои брони)
const tk = figma.createComponent(); setup(tk,'VERTICAL',{name:'Ticket', w:350, r:20, fill:'paper', clip:true});
const tkT = AL('VERTICAL',{name:'top', p:[16,16,8,16], gap:8}); add(tk, tkT); fillW(tkT);
const tkR = AL('HORIZONTAL',{name:'club row', just:'SPACE_BETWEEN', align:'CENTER'}); add(tkT, tkR); fillW(tkR);
const tkW = AL('HORIZONTAL',{name:'when tag', p:[4,10], r:8, fill:'ink'}); add(tkW, T('Сегодня', TM, 13, 'chalk', {name:'when'}));
add(tkR, T('Лужники Падел', TB, 17, 'ink', {name:'club'}), tkW);
const tkTime = AL('HORIZONTAL',{name:'time', gap:6, align:'BASELINE'}); add(tkTime, T('19:00', DB, 40, 'ink', {lh:44, ls:-3, name:'start'}), T('–20:30', DM, 24, 'muted', {ls:-2, name:'end'})); add(tkT, tkTime);
const tkM = AL('HORIZONTAL',{name:'meta', just:'SPACE_BETWEEN'}); add(tkT, tkM); fillW(tkM);
[['Дата','Ср, 14 окт','date'],['Корт','3, крытый','court'],['Бронь','SM-48217','code']].forEach(([a,b,k])=>{ const m=AL('VERTICAL',{name:a, gap:2}); add(m, T(a, TM, 13, 'muted'), T(b, TB, 15, 'ink', {name:k})); add(tkM, m); });
const perf = figma.createFrame(); perf.name='perforation'; perf.resize(350,24); perf.fills=[]; perf.clipsContent=false; add(tk, perf); fillW(perf);
const ln = figma.createLine(); ln.resize(298,0); ln.strokes=[P('line')]; ln.strokeWeight=2; ln.dashPattern=[6,6]; perf.appendChild(ln); ln.x=26; ln.y=12;
for (const x of [-12, 338]) { const e=circ(24,'chalk'); e.name='notch'; perf.appendChild(e); e.x=x; e.y=0; }
const tkB = AL('HORIZONTAL',{name:'bottom', p:[4,16,16,16], just:'SPACE_BETWEEN', align:'CENTER'}); add(tk, tkB); fillW(tkB);
const tkS = AL('HORIZONTAL',{name:'seats', gap:6}); for (let i=0;i<4;i++){ const a=v(comp('PlayerAvatar'), i===0?'state=you':'state=open'); a.name='seat '+(i+1); add(tkS,a); }
add(tkB, tkS, T('1 из 4', TM, 13, 'muted', {name:'count'}));
add(lib, tk); tk.description='Бронь в «Моих бронях»: билет с перфорацией, как на экране подтверждения.';

// ---------- каркас доски ----------
const board = AL('VERTICAL',{name:'СМЭШ — полный флоу', p:80, gap:120, fill:'line'});
const bh = AL('VERTICAL',{name:'board head', gap:12}); add(bh, T('СМЭШ — полный флоу', DB, 64, 'ink', {ls:-3}), T('Бронирование падел-кортов в Москве. Экраны 390 × 844, в каждом ряду — порядок шагов в сценарии слева направо.', TM, 20, 'ink', {op:0.7}));
add(board, bh);

}
{
// ===== ROW 1: Вход и онбординг =====
const R1 = makeRow('Ряд 1 — Вход и онбординг', 'Вход и онбординг', 'Сплэш в трёх ключевых кадрах, две карточки ценности, вход по номеру, код из SMS, уровень игры и районы.');

// ----- 01 Сплэш: 3 кадра -----
function splashBase(courtOp){ const f=scr('Сплэш','ink'); put(f, statusBar('chalk'), 0, 0); const c=court(520,260,courtOp); f.appendChild(c); place(c, 195, 470, -16); return f; }
const sp1 = splashBase(0.35);
const fly = ball(56, 2.6); sp1.appendChild(fly); place(fly, 120, 300, -32);
cell(R1,'01a','Сплэш, 0–500 мс','Линии корта прорисовываются, мяч влетает сверху слева с длинным шлейфом и ускоряется к линии подачи.', sp1);

const sp2 = splashBase(1);
for (const [d,op,sw] of [[96,1,3],[176,0.45,2],[260,0.18,2]]){ const e=circ(d,null,1,'ball',sw,op); put(sp2, e, 195-d/2, 470-d/2); }
for (let k=0;k<8;k++){ const a=k*45+22; const r=rect(22,4,'ball',1,2); const rad=a*Math.PI/180; sp2.appendChild(r); place(r, 195+Math.cos(rad)*66, 470-Math.sin(rad)*66, a); }
const hit = figma.createFrame(); hit.name='ball/squash'; hit.resize(76,46); hit.cornerRadius=23; hit.fills=[P('ball')]; hit.clipsContent=true;
for (const dx of [-0.7,0.7]) { const e=figma.createEllipse(); e.resize(76,46); e.fills=[]; e.strokes=[P('ink')]; e.strokeWeight=2.5; e.x=76*dx; e.y=0; hit.appendChild(e); }
put(sp2, hit, 195-38, 470-23);
cell(R1,'01b','Удар, 500–800 мс','Мяч бьёт в линию: сплющивается, от точки расходятся два кольца и искры, линии корта вспыхивают. Лёгкая вибрация.', sp2);

const sp3 = splashBase(0.2);
const logo = AL('HORIZONTAL',{name:'logo lockup', gap:10, align:'MAX'}); add(logo, T('смэш', DB, 64, 'chalk', {ls:-4, name:'logo'}));
const dot = ball(22, 0); add(logo, dot); put(sp3, logo, 0, 0); logo.x = 195 - logo.width/2; logo.y = 400;
put(sp3, T('Падел-корты Москвы', TM, 15, 'chalk', {op:0.6, align:'CENTER', w:350}), 20, 492);
cell(R1,'01c','Логотип, 800–1600 мс','Мяч становится точкой после «смэш», буквы поднимаются по очереди. Дальше — онбординг или главная, если вход уже был.', sp3);

// ----- 02–03 Онбординг -----
function onb(title, bodyTxt, page, cta, art){
  const f=scr('Онбординг','chalk'); const top=figma.createFrame(); top.name='art'; top.resize(390,500); top.fills=[P('ink')]; top.clipsContent=true; top.bottomLeftRadius=32; top.bottomRightRadius=32; put(f, top, 0, 0);
  art(top); put(top, statusBar('chalk'), 0, 0);
  const skip = T('Пропустить', TM, 15, 'chalk', {op:0.7}); put(top, skip, 370-skip.width, 56);
  const tx = col350(12); add(tx, T(title, DB, 40, 'ink', {lh:42, ls:-3}), T(bodyTxt, TR, 15, 'muted', {w:350, lh:20})); put(f, tx, 20, 532);
  put(f, dots(2, page), 20, 844-34-56-36);
  const b=btn('primary',cta); b.resize(350,56); put(f, b, 20, 844-34-56); return f;
}
const o1 = onb('Корт\nза 30 секунд','Свободное время во всех клубах Москвы обновляется в реальном времени. Выбрали слот, оплатили, идёте играть.',0,'Дальше', top=>{
  const cg=court(460,230,0.5); top.appendChild(cg); place(cg, 200, 300, -16);
  const pane = AL('VERTICAL',{name:'slots preview', p:16, gap:12, r:20, fill:'paper'}); 
  const ph = AL('HORIZONTAL',{name:'head', gap:8, align:'CENTER'}); add(ph, circ(8,'ink'), T('Обновлено 2 секунды назад', TM, 13, 'muted')); add(pane, ph);
  for (const rowT of [['17:30','19:00','20:30'],['22:00','23:30','07:00']]){ const r=AL('HORIZONTAL',{name:'row', gap:8}); rowT.forEach(t=>{ const i=v(comp('Slot'), t==='19:00'?'state=selected': t==='20:30'?'state=busy':'state=free'); setText(i,{time:t, price:t==='20:30'?'занято':'3 200 ₽'}); add(r,i); }); add(pane,r); }
  top.appendChild(pane); place(pane, 195, 300, 4);
  const b=ball(48); top.appendChild(b); place(b, 300, 150, 24);
});
cell(R1,'02','Онбординг 1','Ценность: бронь за полминуты и живые слоты. Сетка — те же компоненты Slot, что на экране корта.', o1);

const o2 = onb('Соберите\nчетвёрку','Не хватает игрока? Откройте матч, и к вам присоединятся люди вашего уровня. Оплата сразу делится на всех.',1,'Начать', top=>{
  const cg=court(360,180,1); top.appendChild(cg); place(cg, 195, 290, 0);
  const pos=[[105,245,'filled','АК'],[105,335,'filled','ДС'],[285,245,'filled','ОВ'],[285,335,'open']];
  for (const [x,y,st,ini] of pos){ const a=v(comp('PlayerAvatar'),'state='+st); if(ini) setText(a,{initials:ini}); a.rescale(56/44); top.appendChild(a); a.x=x-28; a.y=y-28; }
  const ring=circ(76,null,1,'ball',2); put(top, ring, 285-38, 335-38); ring.dashPattern=[6,6];
  const need = chip('Нужен 1 игрок', {fill:'ball', op:1, color:'ink'}); put(top, need, 285-need.width/2, 390);
  const b=ball(40); top.appendChild(b); place(b, 210, 140, -20);
});
cell(R1,'03','Онбординг 2','Ценность: найти недостающих игроков. На схеме корта три места заняты, четвёртое ждёт.', o2);

// ----- 04 Вход -----
const s4 = scr('Вход','chalk'); put(s4, statusBar('ink'), 0, 0);
put(s4, T('смэш', DB, 24, 'ink', {ls:-2}), 20, 60);
const lc = col350(24); put(s4, lc, 20, 132);
const lh = col350(12); add(lh, T('Вход\nпо номеру', DB, 40, 'ink', {lh:42, ls:-3}), T('Пришлём код в SMS. Пароль не нужен.', TR, 15, 'muted')); add(lc, lh);
const inp = v(comp('Input'),'state=focused'); add(lc, inp);
const gb = btn('primary','Получить код'); add(lc, gb); fillW(gb);
const orr = AL('HORIZONTAL',{name:'or', gap:12, align:'CENTER'}); const l1=rect(10,1,'line'), l2=rect(10,1,'line'); add(orr, l1, T('или', TM, 13, 'muted'), l2); l1.layoutGrow=1; l2.layoutGrow=1; add(lc, orr); fillW(orr);
const alt = col350(12); add(lc, alt); const tg = btn('outline','Войти через Telegram',true), ap = btn('dark','Войти с Apple',true); add(alt, tg, ap); fillW(tg); fillW(ap);
put(s4, T('Продолжая, вы принимаете условия сервиса и политику обработки данных', TR, 13, 'muted', {w:350, align:'CENTER'}), 20, 778);
cell(R1,'04','Вход','Телефон, Telegram или Apple. Главное действие одно — «Получить код».', s4);

// ----- 05 Код из SMS -----
const s5 = scr('Код из SMS','chalk'); put(s5, statusBar('ink'), 0, 0); put(s5, round('chevronLeft'), 20, 52);
const kc = col350(24); put(s5, kc, 20, 124);
const kh = col350(12); const ksub = AL('HORIZONTAL',{name:'sent to', gap:8, align:'CENTER'}); add(ksub, T('На +7 916 245-18-07', TR, 15, 'muted'), T('Изменить', TB, 15, 'ink', {under:true}));
add(kh, T('Код\nиз SMS', DB, 40, 'ink', {lh:42, ls:-3}), ksub); add(kc, kh);
const otp = AL('HORIZONTAL',{name:'otp', gap:12}); [['filled','4'],['filled','8'],['active'],['empty']].forEach(([st,d])=>{ const c=v(comp('OtpCell'),'state='+st); if(d) setText(c,{digit:d}); add(otp,c); }); add(kc, otp);
const tmr = AL('HORIZONTAL',{name:'timer', gap:8, align:'CENTER'}); add(tmr, I('clock','muted',18), T('Новый код можно запросить через 0:42', TM, 15, 'muted')); add(kc, tmr);
const kb = AL('VERTICAL',{name:'keyboard', w:390, p:[8,8,34,8], gap:8, fill:'line'}); 
for (const row of [['1','2','3'],['4','5','6'],['7','8','9'],['','0','del']]){ const r=AL('HORIZONTAL',{name:'keys', gap:8}); add(kb,r); fillW(r);
  for (const k of row){ const key=AL('HORIZONTAL',{name:'key '+k, h:48, r:8, fill:(k===''||k==='del')?null:'paper', align:'CENTER', just:'CENTER'}); add(key, k==='del'?I('del','ink',22): k?T(k, TM, 24, 'ink'):null); add(r,key); fillW(key); } }
put(s5, kb, 0, 844-kb.height);
cell(R1,'05','Код из SMS','Четыре ячейки, код подставляется из SMS автоматически. Таймер вместо мёртвой кнопки «Отправить ещё раз».', s5);

// ----- 06 Уровень -----
function stepHead(f, n){ put(f, statusBar('ink'), 0, 0); const r=AL('HORIZONTAL',{name:'progress', w:350, gap:12, align:'CENTER'}); const b=round('chevronLeft'); const bars=AL('HORIZONTAL',{name:'bars', gap:6});
  for (let i=0;i<2;i++){ const x=rect(10,6,i<n?'ink':'line',1,3); add(bars,x); x.layoutGrow=1; } add(r,b,bars,T(n+' из 2', TM, 13, 'muted')); bars.layoutGrow=1; put(f, r, 20, 52); }
const s6 = scr('Уровень игры','chalk'); stepHead(s6,1);
const lv = col350(8); put(s6, lv, 20, 116);
const lvh = col350(8); add(lvh, T('Ваш уровень', DB, 40, 'ink', {lh:44, ls:-3}), T('По нему подбираем матчи и соперников. Поменять можно в профиле.', TR, 15, 'muted', {w:350})); add(lv, lvh); lvh.paddingBottom=12;
[['Новичок','Только начинаю, учусь держать мяч в игре','1,0–2,0'],['Любитель','Держу розыгрыш, играю пару раз в месяц','2,5–3,5',1],['Продвинутый','Уверенная подача, играю у стекла','4,0–5,0'],['Турнирный','Играю турниры клубов','5,5–6,5'],['Профи','Рейтинг федерации','7,0']]
 .forEach(([t,d,rg,on])=>{ const o=v(comp('LevelOption'), on?'state=selected':'state=default'); setText(o,{title:t, desc:d, range:rg}); add(lv,o); });
const lb = btn('primary','Дальше'); lb.resize(350,56); put(s6, lb, 20, 844-34-56);
cell(R1,'06','Уровень игры','Шкала падел-рейтинга 1,0–7,0 простыми словами. У выбранного уровня шкала показывает, где вы на ней.', s6);

// ----- 07 Районы и клубы -----
const s7 = scr('Районы и клубы','chalk'); stepHead(s7,2);
const dc = col350(20); put(s7, dc, 20, 116);
const dh = col350(8); add(dh, T('Где играете?', DB, 40, 'ink', {lh:44, ls:-3}), T('Покажем корты и матчи рядом. Можно выбрать несколько районов.', TR, 15, 'muted', {w:350})); add(dc, dh);
const dch = AL('HORIZONTAL',{name:'districts', w:350, gap:8, wrap:true});
[['Хамовники',1],['Раменки',1],['Пресня',1],['Сокольники'],['Таганка'],['Крылатское'],['Строгино'],['Марьина Роща'],['Митино'],['Нагатино']].forEach(([l,on])=>{ const c=v(comp('Chip'), on?'state=selected':'state=default'); setText(c,{label:l}); add(dch,c); }); add(dc, dch);
const fav = col350(0); add(fav, T('Любимые клубы', TB, 17, 'ink')); fav.itemSpacing=4; add(dc, fav);
[['Лужники Падел','Хамовники, 1,2 км',1],['Падел Раменки','Раменки, 3,1 км',1],['Сетка Сокольники','Сокольники, 4,8 км',0]].forEach(([n,d,on])=>{
  const r=AL('HORIZONTAL',{name:n, h:64, gap:12, align:'CENTER', stroke:'line'}); r.strokeTopWeight=0; r.strokeLeftWeight=0; r.strokeRightWeight=0;
  const tx=AL('VERTICAL',{name:'text', gap:2}); add(tx, T(n, TB, 15, 'ink'), T(d, TR, 13, 'muted')); const h=I('heart','ink',22); if(on) h.findAll(c=>c.type==='VECTOR').forEach(c=>c.fills=[P('ink')]);
  add(r, tx, h); tx.layoutGrow=1; add(fav, r); fillW(r); });
const db2 = btn('primary','Готово'); db2.resize(350,56); put(s7, db2, 20, 844-34-56);
cell(R1,'07','Районы и клубы','Мультивыбор районов чипами, любимые клубы сердечком. После — главная.', s7);

}
layoutLib();
await page.children.find(n=>n.name==='Компоненты').screenshot({scale:0.5});
await getBoard().children.find(n=>n.name==='Ряд 1 — Вход и онбординг').screenshot({scale:0.5});
return {ok:true, board:{w:getBoard().width,h:getBoard().height}};

// ===== call-2: отдельный вызов use_figma =====
const RESET=false;
// ===== PRELUDE: общий для всех вызовов use_figma =====
const page = figma.root.children.find(p=>p.name==='СМЭШ') || figma.currentPage;
await figma.setCurrentPageAsync(page); page.name='СМЭШ';
const fonts = await figma.listAvailableFontsAsync();
function pick(fam, prefs, fb){ const st = fonts.filter(f=>f.fontName.family===fam).map(f=>f.fontName.style); for (const p of prefs) if (st.includes(p)) return {family:fam, style:p}; return fb; }
const DB = pick('Unbounded',['Black','ExtraBold','Extra Bold','Bold'],{family:'Inter',style:'Black'});
const DM = pick('Unbounded',['Bold','SemiBold','Semi Bold'],{family:'Inter',style:'Bold'});
const TR = pick('Onest',['Regular'],{family:'Inter',style:'Regular'});
const TM = pick('Onest',['Medium'],{family:'Inter',style:'Medium'});
const TB = pick('Onest',['Bold','SemiBold','Semi Bold'],{family:'Inter',style:'Bold'});
for (const f of [DB,DM,TR,TM,TB]) await figma.loadFontAsync(f);

// ---------- токены: при RESET пересоздаём, иначе находим по имени ----------
const C = {ink:'#111210', chalk:'#F1EEE4', paper:'#FBFAF5', muted:'#6E6C63', line:'#D8D3C4', ball:'#CCFF00'};
const hex = h => ({r:parseInt(h.slice(1,3),16)/255, g:parseInt(h.slice(3,5),16)/255, b:parseInt(h.slice(5,7),16)/255});
let col = (await figma.variables.getLocalVariableCollectionsAsync()).find(c=>c.name==='СМЭШ tokens');
if (RESET) { for (const n of [...page.children]) n.remove(); if (col) col.remove(); col = null; }
const V = {}, SP = {}, RD = {};
if (!col) {
  col = figma.variables.createVariableCollection('СМЭШ tokens'); const mode = col.modes[0].modeId;
  for (const [k,v] of Object.entries(C)) { const x = figma.variables.createVariable('color/'+k, col, 'COLOR'); x.setValueForMode(mode, hex(v)); x.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR']; V[k]=x; }
  for (const n of [4,8,12,16,20,24,32]) { const x = figma.variables.createVariable('space/'+n, col, 'FLOAT'); x.setValueForMode(mode, n); x.scopes=['GAP']; SP[n]=x; }
  for (const n of [8,12,16,20,999]) { const x = figma.variables.createVariable('radius/'+n, col, 'FLOAT'); x.setValueForMode(mode, n); x.scopes=['CORNER_RADIUS']; RD[n]=x; }
} else {
  for (const x of await figma.variables.getLocalVariablesAsync()) { if (x.variableCollectionId!==col.id) continue; const [g,k]=x.name.split('/'); (g==='color'?V:g==='space'?SP:RD)[k]=x; }
}
const P = (k, op=1) => op<1 ? {type:'SOLID', color:hex(C[k]), opacity:op} : figma.variables.setBoundVariableForPaint({type:'SOLID', color:hex(C[k])}, 'color', V[k]);
const bind = (n, field, val, tbl) => { if (tbl[val]) { try { n.setBoundVariable(field, tbl[val]); } catch(e) {} } };

// ---------- helpers ----------
function setup(f, dir, o={}) {
  f.layoutMode = dir; f.primaryAxisSizingMode='AUTO'; f.counterAxisSizingMode='AUTO';
  f.name = o.name || f.name;
  f.fills = o.fill ? [P(o.fill, o.op ?? 1)] : [];
  f.itemSpacing = o.gap ?? 0; bind(f,'itemSpacing',o.gap,SP);
  let p = o.p ?? 0; if (typeof p==='number') p=[p,p,p,p]; else if (p.length===2) p=[p[0],p[1],p[0],p[1]];
  [f.paddingTop,f.paddingRight,f.paddingBottom,f.paddingLeft]=p;
  ['paddingTop','paddingRight','paddingBottom','paddingLeft'].forEach((k,i)=>bind(f,k,p[i],SP));
  if (o.r!=null) { f.cornerRadius=o.r; ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'].forEach(k=>bind(f,k,o.r,RD)); }
  if (o.align) f.counterAxisAlignItems=o.align;
  if (o.just) f.primaryAxisAlignItems=o.just;
  if (o.stroke) { f.strokes=[P(o.stroke, o.sop ?? 1)]; f.strokeWeight=o.sw||1; f.strokeAlign='INSIDE'; if (o.dash) f.dashPattern=o.dash; }
  f.clipsContent = o.clip ?? false;
  if (o.w) { if (dir==='HORIZONTAL') f.primaryAxisSizingMode='FIXED'; else f.counterAxisSizingMode='FIXED'; f.resize(o.w, Math.max(f.height,1)); }
  if (o.h) { if (dir==='HORIZONTAL') f.counterAxisSizingMode='FIXED'; else f.primaryAxisSizingMode='FIXED'; f.resize(f.width, o.h); }
  f.primaryAxisSizingMode = dir==='HORIZONTAL' ? (o.w?'FIXED':'AUTO') : (o.h?'FIXED':'AUTO');
  f.counterAxisSizingMode = dir==='HORIZONTAL' ? (o.h?'FIXED':'AUTO') : (o.w?'FIXED':'AUTO');
  if (o.wrap) { f.layoutWrap='WRAP'; f.counterAxisSpacing=o.gap ?? 8; }
  return f;
}
const AL = (dir,o) => setup(figma.createFrame(), dir, o);
function add(parent, ...kids) { for (const k of kids) if (k) parent.appendChild(k); return parent; }
function fillW(n){ n.layoutSizingHorizontal='FILL'; return n; }
function T(str, font, size, color='ink', o={}) {
  const t = figma.createText(); t.fontName=font; t.characters=str; t.fontSize=size; t.fills=[P(color, o.op ?? 1)];
  if (o.lh) t.lineHeight={unit:'PIXELS', value:o.lh};
  if (o.ls!=null) t.letterSpacing={unit:'PERCENT', value:o.ls};
  if (o.w) { t.resize(o.w, t.height); t.textAutoResize='HEIGHT'; }
  if (o.align) t.textAlignHorizontal=o.align;
  if (o.strike) t.textDecoration='STRIKETHROUGH';
  if (o.under) t.textDecoration='UNDERLINE';
  t.name = o.name || str.slice(0,24);
  return t;
}
const ICONS = {
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sliders:'<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  pin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  chevronLeft:'<path d="m15 18-6-6 6-6"/>', chevronDown:'<path d="m6 9 6 6 6-6"/>', chevronRight:'<path d="m9 18 6-6-6-6"/>',
  heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  calendarPlus:'<path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="M16 19h6"/><path d="M19 16v6"/>',
  userPlus:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  star:'<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  ticket:'<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  signal:'<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
  wifi:'<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  battery:'<rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/><line x1="6" x2="6" y1="11" y2="13"/><line x1="10" x2="10" y1="11" y2="13"/><line x1="14" x2="14" y1="11" y2="13"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  apple:'<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
  card:'<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  phone:'<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  qr:'<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  settings:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  bell:'<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  list:'<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  repeat:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>',
  trend:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  del:'<path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="m12 9 6 6"/><path d="m18 9-6 6"/>',
  nav:'<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>'
};
function I(name, color='ink', size=24, op=1) {
  const n = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="'+C[color]+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+ICONS[name]+'</svg>');
  n.name='lucide/'+name; n.fills=[];
  n.findAll(c=>'strokes' in c && c.strokes.length>0).forEach(c=>{ c.strokes=[P(color, op)]; });
  if (size!==24) n.rescale(size/24);
  return n;
}
function place(n, cx, cy, deg) { n.rotation = deg; const a = deg*Math.PI/180, c=Math.cos(a), s=Math.sin(a), w=n.width/2, h=n.height/2; n.x = cx - (c*w + s*h); n.y = cy - (-s*w + c*h); }
function rect(w,h,fill,op=1,r=0){ const x=figma.createRectangle(); x.resize(w,h); x.fills=[P(fill,op)]; if(r) x.cornerRadius=r; return x; }
function circ(d, fill, op=1, stroke=null, sw=2, sop=1){ const e=figma.createEllipse(); e.resize(d,d); e.fills=fill?[P(fill,op)]:[]; if (stroke){ e.strokes=[P(stroke,sop)]; e.strokeWeight=sw; } return e; }
function court(L, W, lineOp=1) {
  const g = figma.createFrame(); g.name='court'; g.resize(L,W); g.fills=[]; g.clipsContent=false;
  g.appendChild(rect(L,W,'chalk',0.05));
  const b = figma.createRectangle(); b.resize(L,W); b.fills=[]; b.strokes=[P('chalk',0.85*lineOp)]; b.strokeWeight=2; g.appendChild(b);
  const sx = 0.695*L/2;
  const s1 = rect(2,W,'chalk',0.55*lineOp); s1.x=L/2-sx-1; g.appendChild(s1);
  const s2 = rect(2,W,'chalk',0.55*lineOp); s2.x=L/2+sx-1; g.appendChild(s2);
  const cl = rect(2*sx,2,'chalk',0.55*lineOp); cl.x=L/2-sx; cl.y=W/2-1; g.appendChild(cl);
  const net = rect(4,W+10,'chalk',lineOp,2); net.x=L/2-2; net.y=-5; g.appendChild(net);
  return g;
}
function ball(size, trail=1) {
  const g = figma.createFrame(); g.name='ball'; g.resize(size*(1.1+1.3*trail), size); g.fills=[]; g.clipsContent=false;
  [[0.28,0.5,0.3],[0.5,0.8,0.6],[0.72,0.35,0.3]].forEach(([hh,ww,op])=>{ if(!trail) return; const L=size*ww*trail; const t=rect(L, size*0.08,'ball',op,size*0.04); t.x=size*1.3*trail-L; t.y=size*hh-size*0.04; g.appendChild(t); });
  const b = figma.createFrame(); b.name='ball/body'; b.resize(size,size); b.cornerRadius=size/2; b.fills=[P('ball')]; b.clipsContent=true; b.x=size*(0.1+1.3*trail); b.y=0;
  for (const dx of [-0.7, 0.7]) { const e=figma.createEllipse(); e.resize(size,size); e.fills=[]; e.strokes=[P('ink')]; e.strokeWeight=Math.max(2,size*0.04); e.x=size*dx; e.y=0; b.appendChild(e); }
  g.appendChild(b);
  return g;
}
function statusBar(color) {
  const s = AL('HORIZONTAL',{name:'status bar', p:[0,24], h:44, w:390, align:'CENTER', just:'SPACE_BETWEEN'});
  const icons = AL('HORIZONTAL',{name:'system', gap:8, align:'CENTER'});
  add(icons, I('signal',color,16), I('wifi',color,16), I('battery',color,18));
  add(s, T('9:41', TB, 15, color), icons);
  return s;
}
function chip(str, o={}) { const c = AL('HORIZONTAL',{name:'chip', p:[8,12], r:999, fill:o.fill||'chalk', op:o.op??0.12, align:'CENTER', gap:8}); if (o.icon) add(c, I(o.icon, o.color||'chalk', 14)); add(c, T(str, TM, 13, o.color||'chalk')); return c; }
const comp = n => page.findOne(x=>(x.type==='COMPONENT_SET'||x.type==='COMPONENT') && x.name===n);
const v = (set, nm) => (set.type==='COMPONENT' ? set : set.children.find(c=>c.name===nm)).createInstance();
const setText = (inst, map) => { for (const [k,val] of Object.entries(map)) { const n = inst.findOne(x=>x.type==='TEXT' && x.name===k); if (n) n.characters = val; } };
function scr(name, fill='chalk', h=844){ const f=figma.createFrame(); f.name=name; f.resize(390,h); f.fills=[P(fill)]; f.clipsContent=true; return f; }
function put(p,n,x,y){ p.appendChild(n); n.x=x; n.y=y; return n; }
function round(icon, bg='paper', fg='ink', bop=1){ const b = AL('HORIZONTAL',{name:'btn '+icon, w:44, h:44, r:999, fill:bg, op:bop, align:'CENTER', just:'CENTER'}); add(b, I(icon,fg,20)); return b; }
function col350(gap=20){ return AL('VERTICAL',{name:'content', w:350, gap}); }
function segmented(items, onIdx){ const s = AL('HORIZONTAL',{name:'segmented', p:4, gap:4, r:12, fill:'paper', stroke:'line'}); items.forEach((l,i)=>{ const it=v(comp('Segment'), i===onIdx?'state=on':'state=off'); setText(it,{label:l}); add(s,it); fillW(it); }); return s; }
function btn(kind, label, icon=false){ const b=v(comp('Button'),'type='+kind); setText(b,{label}); if(!icon) b.findOne(x=>x.name==='icon').visible=false; return b; }
function tabBar(active){ return v(comp('TabBar'),'active='+active); }
function dots(n, a, dark=false){ const d=AL('HORIZONTAL',{name:'pagination', gap:8, align:'CENTER'}); for(let i=0;i<n;i++){ const x=rect(i===a?24:8, 8, i===a?(dark?'chalk':'ink'):(dark?'chalk':'line'), i===a?1:(dark?0.3:1), 4); add(d,x);} return d; }
function getBoard(){ return page.children.find(n=>n.name==='СМЭШ — полный флоу'); }
function makeRow(key, title, note){
  const board=getBoard(); const old = board.children.find(n=>n.name===key); if (old) old.remove();
  const row = AL('VERTICAL',{name:key, gap:40}); const h = AL('VERTICAL',{name:'row head', gap:8});
  add(h, T(title, DB, 40,'ink',{ls:-3}), T(note, TM, 17,'ink',{op:0.7})); const s = AL('HORIZONTAL',{name:'screens', gap:64, align:'MIN'}); add(row,h,s); add(board,row);
  board.children.filter(n=>n.name.startsWith('Ряд')).sort((a,b)=>a.name.localeCompare(b.name)).forEach((r,i)=>board.insertChild(1+i, r));
  return s;
}
function cell(screens, num, title, note, screen){
  screen.name = num+' '+title;
  const c=AL('VERTICAL',{name:'cell '+num, gap:20}); const lab=AL('VERTICAL',{name:'label', gap:8, w:390});
  const t1=AL('HORIZONTAL',{name:'title', gap:12, align:'CENTER'}); const nb=AL('HORIZONTAL',{name:'no', p:[4,10], r:8, fill:'ink'}); add(nb, T(num, TB, 17,'chalk'));
  add(t1, nb, T(title, TB, 20, 'ink')); add(lab, t1); if (note) add(lab, T(note, TR, 15, 'ink', {op:0.7, w:390}));
  add(c, lab, screen); add(screens, c); return screen;
}
function layoutLib(){ const b=getBoard(), lib=page.children.find(n=>n.name==='Компоненты'); b.x=0; b.y=0; if (lib){ lib.x=0; lib.y=b.height+160; } }
{
// ===== Правки компонентов, уже созданных call-1 (идемпотентно) =====
comp('Ticket').findOne(n=>n.name==='count').characters='1 из 4';
comp('PayOption').children.filter(c=>c.name.startsWith('method=СБП')).forEach(c=>{ c.findOne(n=>n.name==='hint').characters='Без комиссии'; });

}
{
// ===== ROW 2: Поиск и бронь =====
const R2 = makeRow('Ряд 2 — Поиск и бронь', 'Поиск и бронь', 'Главная, карта с фильтрами, корт, оплата с разделением на четверых, подтверждение.');
const DateChip = comp('DateChip'), Slot = comp('Slot'), CourtCard = comp('CourtCard');

// ----- 08 Главная (как было, таб-бар — компонент) -----
const s1 = AL('VERTICAL',{name:'Главная', w:390, h:844, fill:'chalk', clip:true});
const top = AL('VERTICAL',{name:'hero', fill:'ink', clip:true, p:[0,0,24,0]}); add(s1, top); fillW(top);
const hb = ball(100); top.appendChild(hb); hb.layoutPositioning='ABSOLUTE'; place(hb, 259, 128, 18);
add(top, statusBar('chalk'));
const hdr = AL('HORIZONTAL',{name:'header', p:[4,20], just:'SPACE_BETWEEN', align:'CENTER'}); add(top, hdr); fillW(hdr);
add(hdr, T('смэш', DB, 24, 'chalk', {ls:-2, name:'logo'}), round('bell','chalk','chalk',0.1));
const greet = AL('VERTICAL',{name:'greeting', p:[12,20,0,20], gap:8}); add(top, greet); fillW(greet);
add(greet, T('Привет, Аня', TM, 15, 'chalk', {op:0.65}), T('Корт\nна вечер?', DB, 40, 'chalk', {lh:42, ls:-3, name:'display'}));
const srow = AL('HORIZONTAL',{name:'search row', p:[20,20,0,20], gap:8, align:'CENTER'}); add(top, srow); fillW(srow);
const sf = AL('HORIZONTAL',{name:'search', h:52, p:[0,16], gap:10, r:16, fill:'chalk', op:0.1, align:'CENTER'}); add(srow, sf); fillW(sf);
add(sf, I('search','chalk',20), T('Район, метро или клуб', TR, 15, 'chalk', {op:0.6}));
const fb = AL('HORIZONTAL',{name:'filters', w:52, h:52, r:16, fill:'chalk', op:0.1, align:'CENTER', just:'CENTER'}); add(fb, I('sliders','chalk',20)); add(srow, fb);
const body = AL('VERTICAL',{name:'content', p:[20,0,0,0], gap:20}); add(s1, body); fillW(body);
const dates = AL('HORIZONTAL',{name:'dates', p:[0,20], gap:8}); add(body, dates); fillW(dates);
[['Ср','14',1],['Чт','15'],['Пт','16'],['Сб','17'],['Вс','18'],['Пн','19']].forEach(([d,n,sel])=>{ const i=v(DateChip, sel?'state=selected':'state=default'); setText(i,{day:d,num:n}); add(dates,i); });
const sec = AL('HORIZONTAL',{name:'section title', p:[0,20], just:'SPACE_BETWEEN', align:'MAX'}); add(body, sec); fillW(sec);
const onMap = AL('HORIZONTAL',{name:'map link', gap:6, align:'CENTER'}); add(onMap, I('pin','ink',16), T('На карте', TM, 15, 'ink'));
add(sec, T('Рядом с вами', DM, 24, 'ink', {lh:28, ls:-2}), onMap);
const list = AL('VERTICAL',{name:'courts', p:[0,20], gap:12}); add(body, list); fillW(list);
[{name:'Лужники Падел', district:'Хамовники, м. Спортивная', price:'2 400 ₽/ч', rating:'4,9', dist:'1,2 км'},
 {name:'Сетка Сокольники', district:'Сокольники, м. Сокольники', price:'2 900 ₽/ч', rating:'4,7', s1:'17:00', s2:'20:30', s3:'22:00', more:'+1', dist:'4,8 км'}]
 .forEach(d=>{ const ci = CourtCard.createInstance(); setText(ci, d); add(list, ci); fillW(ci); });
const nav1 = tabBar('Корты'); s1.appendChild(nav1); nav1.layoutPositioning='ABSOLUTE'; nav1.x=20; nav1.y=750;
cell(R2,'08','Главная','Свободные корты на сегодня рядом. Поиск ведёт на карту, карточка — на корт.', s1);

// ----- карта (общая для 09 и 10) -----
function mapLayer(f){
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844" fill="none">'
   +'<path d="M250 150c40 10 70 40 60 80-8 30-50 40-70 20-22-22-30-90 10-100z" fill="#F1EEE4" fill-opacity=".06"/>'
   +'<path d="M20 600c40-20 90-10 100 30 8 40-50 70-90 50-30-14-40-64-10-80z" fill="#F1EEE4" fill-opacity=".06"/>'
   +'<path d="M-30 470C40 420 110 520 180 480 260 434 220 330 300 300 350 282 380 320 430 300" stroke="#F1EEE4" stroke-opacity=".1" stroke-width="30" stroke-linecap="round"/>'
   +'<circle cx="220" cy="300" r="190" stroke="#F1EEE4" stroke-opacity=".16" stroke-width="3"/>'
   +'<circle cx="220" cy="300" r="330" stroke="#F1EEE4" stroke-opacity=".1" stroke-width="2"/>'
   +'<path d="M220 300L-40 120M220 300L120 -20M220 300L420 60M220 300L430 420M220 300L60 860M220 300L330 860M0 250L390 230M40 0L120 844" stroke="#F1EEE4" stroke-opacity=".1" stroke-width="2"/>'
   +'</svg>';
  const m = figma.createNodeFromSvg(svg); m.name='map art'; m.fills=[]; put(f, m, 0, 0);
  for (const [t,x,y] of [['Хамовники',40,300],['Раменки',24,360],['Пресня',60,150],['Таганка',300,250],['Сокольники',262,160]]) put(f, T(t, TM, 13, 'chalk', {op:0.5}), x, y);
  const pins=[['2 900 ₽',190,176,0],['3 200 ₽',296,190,0],['2 100 ₽',34,240,0],['2 400 ₽',180,332,1],['2 700 ₽',300,360,0],['2 600 ₽',96,388,0]];
  for (const [p,x,y,on] of pins){ const i=v(comp('MapPin'), on?'state=selected':'state=default'); setText(i,{price:p}); put(f,i,x,y); }
  const me=figma.createFrame(); me.name='вы здесь'; me.resize(40,40); me.fills=[]; me.cornerRadius=20; put(f,me,232,262);
  put(me, circ(40,'chalk',0.15),0,0); put(me, circ(16,'chalk',1,'ink',3),12,12);
}
function mapTop(f){
  put(f, statusBar('chalk'), 0, 0);
  const srow = AL('HORIZONTAL',{name:'search row', w:350, gap:8, align:'CENTER'});
  const back = round('chevronLeft','chalk','chalk',0.1);
  const sf = AL('HORIZONTAL',{name:'search', h:52, p:[0,16], gap:10, r:16, fill:'chalk', op:0.1, align:'CENTER'}); add(sf, I('search','chalk',20), T('Хамовники и рядом', TR, 15, 'chalk'));
  const fb = AL('HORIZONTAL',{name:'filters', w:52, h:52, r:16, fill:'paper', align:'CENTER', just:'CENTER'}); add(fb, I('sliders','ink',20));
  add(srow, sf, fb); sf.layoutGrow=1; put(f, srow, 20, 52);
  const chips = AL('HORIZONTAL',{name:'active filters', gap:8}); add(chips, chip('Сегодня, с 19:00',{icon:'clock'}), chip('до 3 000 ₽'), chip('Крытый')); put(f, chips, 20, 116);
}

// ----- 09 Карта -----
const s9 = scr('Карта','ink'); mapLayer(s9); mapTop(s9);
const sheet = AL('VERTICAL',{name:'bottom sheet', w:390, h:420, fill:'chalk', align:'CENTER'}); sheet.topLeftRadius=24; sheet.topRightRadius=24;
const shh = comp('SheetHeader').createInstance(); setText(shh,{title:'18 кортов'}); add(sheet, shh);
const cc = CourtCard.createInstance(); setText(cc,{dist:'0,9 км'}); add(sheet, cc);
put(s9, sheet, 0, 424);
put(s9, tabBar('Корты'), 20, 750);
cell(R2,'09','Карта','Карта нарисована: река, кольца, парки. Пины с ценой за час, выбранный — ball. В шите карточка выбранного корта, свайп вверх — список.', s9);

// ----- 10 Фильтры -----
const s10 = scr('Фильтры','ink'); mapLayer(s10); mapTop(s10);
put(s10, rect(390,844,'ink',0.6), 0, 0);
const fs = AL('VERTICAL',{name:'filters sheet', w:390, h:784, fill:'chalk'}); fs.topLeftRadius=24; fs.topRightRadius=24;
const fsh = comp('SheetHeader').createInstance(); setText(fsh,{title:'Фильтры'}); const fa=fsh.findOne(n=>n.name==='action'&&n.type==='FRAME'); fa.visible=false;
add(fs, fsh); fillW(fsh);
const fc = AL('VERTICAL',{name:'sections', p:[4,20,0,20], gap:24}); add(fs, fc); fillW(fc);
function fsec(title, right){ const s=AL('VERTICAL',{name:title, gap:12}); const h=AL('HORIZONTAL',{name:'head', just:'SPACE_BETWEEN', align:'CENTER'}); add(h, T(title, TB, 17, 'ink'), right?T(right, TB, 15, 'ink'):null); add(s,h); add(fc,s); fillW(s); fillW(h); return s; }
const fd = fsec('Дата'); const fdr = AL('HORIZONTAL',{name:'dates', gap:8}); [['Ср','14',1],['Чт','15'],['Пт','16'],['Сб','17'],['Вс','18']].forEach(([d,n,sel])=>{ const i=v(DateChip, sel?'state=selected':'state=default'); setText(i,{day:d,num:n}); add(fdr,i); }); add(fd, fdr);
const ft = fsec('Время'); const fts=segmented(['Утро','День','Вечер','Любое'],2); add(ft, fts); fillW(fts);
const fp = fsec('Цена за час','до 3 000 ₽');
const sl = figma.createFrame(); sl.name='slider'; sl.resize(350,28); sl.fills=[]; sl.clipsContent=false; add(fp, sl);
put(sl, rect(350,4,'line',1,2), 0, 12); put(sl, rect(236,4,'ink',1,2), 0, 12); put(sl, circ(28,'paper',1,'ink',2), 222, 0);
const sll = AL('HORIZONTAL',{name:'scale', just:'SPACE_BETWEEN'}); add(sll, T('1 500 ₽', TM, 13, 'muted'), T('5 000 ₽', TM, 13, 'muted')); add(fp, sll); fillW(sll);
const fk = fsec('Корт'); const fks=segmented(['Любой','Крытый','Открытый'],1); add(fk, fks); fillW(fks);
const fr = fsec('Район'); const frw = AL('HORIZONTAL',{name:'chips', w:350, gap:8, wrap:true});
[['Хамовники',1],['Раменки',1],['Сокольники'],['Пресня'],['Таганка'],['Крылатское']].forEach(([l,on])=>{ const c=v(comp('Chip'), on?'state=selected':'state=default'); setText(c,{label:l}); add(frw,c); }); add(fr, frw);
put(s10, fs, 0, 60); put(s10, round('x'), 326, 60+18);
const fbar = AL('HORIZONTAL',{name:'apply bar', w:390, p:[16,20,34,20], gap:20, fill:'chalk', align:'CENTER', stroke:'line'}); fbar.strokeBottomWeight=0; fbar.strokeLeftWeight=0; fbar.strokeRightWeight=0;
const showB = btn('primary','Показать 18 кортов'); add(fbar, T('Сбросить', TB, 15, 'ink', {under:true}), showB); fillW(showB);
put(s10, fbar, 0, 844-106);
cell(R2,'10','Фильтры','Нижний шит поверх карты. Число на кнопке пересчитывается сразу, без отдельного «применить».', s10);

// ----- 11 Корт (как было) -----
const s2 = AL('VERTICAL',{name:'Корт', w:390, fill:'chalk', clip:true});
const hero = figma.createFrame(); hero.name='hero'; hero.resize(390,280); hero.fills=[P('ink')]; hero.clipsContent=true; add(s2, hero);
const big = T('03', DB, 200, 'chalk', {ls:-6, name:'court number'}); big.fills=[]; big.strokes=[P('chalk',0.28)]; big.strokeWeight=2; hero.appendChild(big); big.x=390-big.width+18; big.y=280-big.height+40;
const hc = court(330,165); hero.appendChild(hc); place(hc, 175, 160, -16);
const hb2 = ball(64); hero.appendChild(hb2); place(hb2, 270, 120, 30);
put(hero, statusBar('chalk'), 0, 0);
put(hero, round('chevronLeft'), 20, 52); put(hero, round('heart'), 326, 52);
const tags = AL('HORIZONTAL',{name:'tags', gap:8}); add(tags, chip('Крытый'), chip('Панорамное стекло'), chip('4,9', {icon:'star'})); hero.appendChild(tags); tags.x=20; tags.y=280-20-tags.height;
const c2 = AL('VERTICAL',{name:'content', p:[20,20,128,20], gap:20}); add(s2, c2); fillW(c2);
const tb = AL('VERTICAL',{name:'title', gap:8}); add(c2, tb); fillW(tb);
add(tb, T('Лужники Падел', DM, 24, 'ink', {lh:28, ls:-2}));
const addr = AL('HORIZONTAL',{name:'address', gap:8, align:'CENTER'}); add(addr, I('pin','muted',16), T('Корт 3, Лужнецкая наб., 24, стр. 8', TR, 15, 'muted')); add(tb, addr);
const slotsBlock = AL('VERTICAL',{name:'slots', gap:12}); add(c2, slotsBlock); fillW(slotsBlock);
const shd = AL('HORIZONTAL',{name:'slots head', just:'SPACE_BETWEEN', align:'CENTER'}); add(slotsBlock, shd); fillW(shd);
const dsel = AL('HORIZONTAL',{name:'date', gap:4, align:'CENTER'}); add(dsel, T('Сегодня, 14 октября', TB, 17, 'ink'), I('chevronDown','ink',18));
add(shd, dsel, T('8 из 12 свободны', TM, 13, 'muted'));
const times = ['07:00','08:30','10:00','11:30','13:00','14:30','16:00','17:30','19:00','20:30','22:00','23:30'];
const busy = new Set(['08:30','13:00','17:30','20:30']);
const grid = AL('VERTICAL',{name:'slot grid', gap:8}); add(slotsBlock, grid); fillW(grid);
for (let r=0;r<3;r++){ const row = AL('HORIZONTAL',{name:'row '+(r+1), gap:8}); add(grid,row); fillW(row);
  for (let k=0;k<4;k++){ const t = times[r*4+k]; const st = t==='19:00'?'state=selected': busy.has(t)?'state=busy':'state=free';
    const i = v(Slot, st); setText(i, {time:t, price: busy.has(t)?'занято':(parseInt(t)>=17?'3 200 ₽':'2 400 ₽')}); add(row,i); fillW(i); } }
const durB = AL('VERTICAL',{name:'duration', gap:12}); add(c2, durB); fillW(durB);
add(durB, T('Длительность', TB, 17, 'ink'));
const seg = segmented(['60 мин','90 мин','120 мин'],1); add(durB, seg); fillW(seg);
const bar = AL('HORIZONTAL',{name:'booking bar', p:[16,20,34,20], gap:16, fill:'ink', align:'CENTER'}); bar.topLeftRadius=24; bar.topRightRadius=24;
const sum = AL('VERTICAL',{name:'summary', gap:2}); add(sum, T('4 800 ₽', TB, 20, 'ball', {name:'total'}), T('19:00–20:30, 90 мин', TM, 13, 'chalk', {op:0.65}));
const cta = btn('primary','Забронировать'); add(bar, sum, cta); fillW(cta);
s2.appendChild(bar); bar.layoutPositioning='ABSOLUTE';
if (s2.height < 844) { s2.primaryAxisSizingMode='FIXED'; s2.resize(390,844); }
bar.resize(390, bar.height); bar.x=0; bar.y=s2.height-bar.height;
cell(R2,'11','Корт','Слоты на день, выбранный — ball, занятые — тихие. Сумма и кнопка закреплены внизу.', s2);

// ----- 12 Оплата -----
const s12 = scr('Оплата','chalk');
put(s12, statusBar('ink'), 0, 0);
const ph = AL('HORIZONTAL',{name:'header', gap:12, align:'CENTER'}); add(ph, round('chevronLeft'), T('Оплата', DM, 24, 'ink', {ls:-2})); put(s12, ph, 20, 48);
const pc = col350(16); put(s12, pc, 20, 104);
const sumC = AL('VERTICAL',{name:'summary', p:16, gap:10, r:16, fill:'paper'}); add(pc, sumC); fillW(sumC);
const sr1 = AL('HORIZONTAL',{name:'club', just:'SPACE_BETWEEN', align:'CENTER'}); add(sr1, T('Лужники Падел', TB, 17, 'ink'), T('Корт 3, крытый', TM, 13, 'muted')); add(sumC, sr1); fillW(sr1);
const sr2 = AL('HORIZONTAL',{name:'time', gap:6, align:'BASELINE'}); add(sr2, T('19:00', DB, 40, 'ink', {lh:44, ls:-3}), T('–20:30', DM, 24, 'muted', {ls:-2})); add(sumC, sr2);
const sr3 = AL('HORIZONTAL',{name:'meta', just:'SPACE_BETWEEN'}); add(sumC, sr3); fillW(sr3);
[['Дата','Ср, 14 октября'],['Длительность','90 мин'],['Стоимость','4 800 ₽']].forEach(([a,b])=>{ const m=AL('VERTICAL',{name:a, gap:2}); add(m, T(a, TM, 13, 'muted'), T(b, TB, 15, 'ink')); add(sr3,m); });
const who = AL('VERTICAL',{name:'who pays', gap:12}); add(pc, who); fillW(who);
add(who, T('Кто платит', TB, 17, 'ink')); const wseg=segmented(['Делим на 4','Плачу целиком'],0); add(who, wseg); fillW(wseg);
const split = AL('VERTICAL',{name:'split', gap:8}); add(who, split); fillW(split);
const sseats = AL('HORIZONTAL',{name:'seats', gap:6}); [['you','АК'],['open'],['open'],['open']].forEach(([st,ini])=>{ const a=v(comp('PlayerAvatar'),'state='+st); if(ini) setText(a,{initials:ini}); add(sseats,a); });
add(split, sseats, T('Вы платите 1 200 ₽ сейчас, троим придёт ссылка на оплату', TR, 13, 'muted', {w:350}));
const pm = AL('VERTICAL',{name:'methods', gap:8}); add(pc, pm); fillW(pm);
add(pm, T('Способ оплаты', TB, 17, 'ink'));
[['СБП','on'],['Карта','off'],['Apple Pay','off']].forEach(([m,st])=>{ const o=v(comp('PayOption'),'method='+m+', state='+st); add(pm,o); fillW(o); });
const pbar = AL('HORIZONTAL',{name:'pay bar', w:390, p:[16,20,34,20], gap:16, fill:'ink', align:'CENTER'}); pbar.topLeftRadius=24; pbar.topRightRadius=24;
const psum = AL('VERTICAL',{name:'summary', gap:2}); add(psum, T('1 200 ₽', TB, 20, 'ball'), T('ваша доля из 4 800 ₽', TM, 13, 'chalk', {op:0.65}));
const pb = btn('primary','Оплатить'); add(pbar, psum, pb); fillW(pb); put(s12, pbar, 0, 844-106);
cell(R2,'12','Оплата','Состав брони, деление на четверых или целиком, способ оплаты. Итог и кнопка — в той же нижней панели, что на экране корта.', s12);

// ----- 13 Бронь подтверждена (как было, суммы под деление) -----
const s3 = AL('VERTICAL',{name:'Бронь подтверждена', w:390, fill:'ink', clip:true});
add(s3, statusBar('chalk'));
const h3 = AL('VERTICAL',{name:'header', p:[16,20,0,20], gap:8}); add(s3, h3); fillW(h3);
const disp = T('Корт\nваш!', DB, 40, 'chalk', {lh:42, ls:-3, name:'display'}); disp.setRangeFills(5, 9, [P('ball')]);
add(h3, disp, T('Бронь подтверждена, чек ушёл на почту', TR, 15, 'chalk', {op:0.65}));
const tw = AL('VERTICAL',{name:'ticket wrap', p:[24,20,0,20]}); add(s3, tw); fillW(tw);
const ticket = AL('VERTICAL',{name:'ticket', r:20, fill:'paper', clip:true}); add(tw, ticket); fillW(ticket);
const tt = AL('VERTICAL',{name:'ticket top', p:20, gap:12}); add(ticket, tt); fillW(tt);
const tr1 = AL('HORIZONTAL',{name:'club', just:'SPACE_BETWEEN', align:'CENTER'}); add(tt, tr1); fillW(tr1);
add(tr1, T('Лужники Падел', TB, 17, 'ink'), T('Корт 3, крытый', TM, 13, 'muted'));
const timeRow = AL('HORIZONTAL',{name:'time', gap:8, align:'BASELINE'}); add(tt, timeRow);
add(timeRow, T('19:00', DB, 40, 'ink', {lh:44, ls:-3}), T('–20:30', DM, 24, 'muted', {ls:-2}));
const meta = AL('HORIZONTAL',{name:'meta', just:'SPACE_BETWEEN'}); add(tt, meta); fillW(meta);
[['Дата','Ср, 14 октября'],['Длительность','90 мин'],['Игроков','4']].forEach(([a,b])=>{ const m = AL('VERTICAL',{name:a, gap:2}); add(m, T(a, TM, 13, 'muted'), T(b, TB, 15, 'ink')); add(meta, m); });
const perf3 = figma.createFrame(); perf3.name='perforation'; perf3.resize(350,24); perf3.fills=[]; perf3.clipsContent=false; add(ticket, perf3); fillW(perf3);
const ln3 = figma.createLine(); ln3.resize(298,0); ln3.strokes=[P('line')]; ln3.strokeWeight=2; ln3.dashPattern=[6,6]; perf3.appendChild(ln3); ln3.x=26; ln3.y=12;
for (const x of [-12, 338]) { const e=circ(24,'ink'); perf3.appendChild(e); e.x=x; e.y=0; }
const tbm = AL('VERTICAL',{name:'ticket bottom', p:[8,20,20,20], gap:8}); add(ticket, tbm); fillW(tbm);
[['Номер брони','SM-48217'],['Вы оплатили','1 200 ₽'],['Ждём от игроков','3 600 ₽']].forEach(([a,b])=>{ const r = AL('HORIZONTAL',{name:a, just:'SPACE_BETWEEN', align:'CENTER'}); add(r, T(a, TR, 15, 'muted'), T(b, TB, 15, 'ink')); add(tbm, r); fillW(r); });
const pl = AL('VERTICAL',{name:'players', p:[24,20,0,20], gap:12}); add(s3, pl); fillW(pl);
const plh = AL('HORIZONTAL',{name:'players head', just:'SPACE_BETWEEN', align:'MAX'}); add(pl, plh); fillW(plh);
add(plh, T('Игроки', DM, 24, 'chalk', {lh:28, ls:-2}), T('1 из 4', TM, 15, 'chalk', {op:0.65}));
const avs = AL('HORIZONTAL',{name:'seats', just:'SPACE_BETWEEN'}); add(pl, avs); fillW(avs);
['Вы','Место 2','Место 3','Место 4'].forEach((nm,i)=>{ const col2 = AL('VERTICAL',{name:'seat '+(i+1), gap:8, align:'CENTER', w:72});
  const c = AL('HORIZONTAL',{name:'avatar', w:56, h:56, r:999, align:'CENTER', just:'CENTER', fill: i===0?'paper':null, stroke: i===0?null:'chalk', sop:0.4, sw:1.5, dash: i===0?null:[4,4]});
  add(c, i===0 ? T('АК', TB, 17, 'ink') : I('plus','chalk',20,0.7));
  add(col2, c, T(nm, TM, 13, 'chalk', {op: i===0?1:0.6})); add(avs, col2); });
const acts = AL('VERTICAL',{name:'actions', p:[24,20,34,20], gap:12, align:'CENTER'}); add(s3, acts); fillW(acts);
const b1 = btn('primary','Позвать друзей',true); add(acts,b1); fillW(b1);
const b2 = btn('secondary','Добавить в календарь',true); add(acts,b2); fillW(b2);
add(acts, T('Бесплатная отмена до 13:00 сегодня', TM, 13, 'chalk', {op:0.6}));
if (s3.height < 844) { s3.primaryAxisSizingMode='FIXED'; s3.resize(390,844); }
cell(R2,'13','Бронь подтверждена','Билет брони. Свободные места можно отдать друзьям или открыть матч для игроков.', s3);

}
{
// ===== ROW 3: Мои брони, игроки, профиль =====
const R3 = makeRow('Ряд 3 — Брони, игроки, профиль', 'Брони, игроки, профиль', 'Мои брони с табами, открытые матчи и детали матча, профиль с ростом рейтинга.');
const PA = comp('PlayerAvatar');
function seatSet(inst, list){ inst.findAll(n=>n.type==='INSTANCE' && n.name.startsWith('seat')).forEach((a,i)=>{ const [st,ini]=list[i]; a.swapComponent(PA.children.find(c=>c.name==='state='+st)); if(ini){ const t=a.findOne(x=>x.type==='TEXT'); if(t) t.characters=ini; } }); }

// ----- 14 Брони: предстоящие -----
function bookingsHead(f, on){ put(f, statusBar('ink'), 0, 0); put(f, T('Брони', DB, 40, 'ink', {ls:-3}), 20, 60); const sg=segmented(['Предстоящие 2','Прошедшие 14'],on); sg.primaryAxisSizingMode='FIXED'; sg.resize(350, sg.height); put(f, sg, 20, 124); }
const s14 = scr('Брони, предстоящие','chalk'); bookingsHead(s14,0);
const bl = col350(16); put(s14, bl, 20, 196);
const t1 = comp('Ticket').createInstance(); add(bl, t1);
const t2 = comp('Ticket').createInstance(); setText(t2,{club:'Сетка Сокольники', when:'Через 3 дня', start:'10:00', end:'–11:30', date:'Сб, 17 окт', court:'2, крытый', code:'SM-48390', count:'Все в сборе'}); add(bl, t2);
seatSet(t2, [['you','АК'],['filled','ДС'],['filled','ОВ'],['filled','МП']]);
put(s14, tabBar('Брони'), 20, 750);
cell(R3,'14','Брони, предстоящие','Каждая бронь — билет. Видно, сколько игроков собралось; пустые места — пунктиром.', s14);

// ----- 15 Брони: прошедшие -----
const s15 = scr('Брони, прошедшие','chalk'); bookingsHead(s15,1);
const pl = col350(8); put(s15, pl, 20, 196);
const past = [['Октябрь'],['12','окт','Лужники Падел','Корт 3, 90 мин','Победа','6:4 6:3'],['08','окт','Падел Раменки','Корт 1, 60 мин','Поражение','4:6 5:7'],['03','окт','Лужники Падел','Корт 2, 90 мин','Победа','7:5 6:2'],['Сентябрь'],['27','сен','Сетка Сокольники','Корт 2, 90 мин','Победа','6:3 6:4'],['21','сен','Лужники Падел','Корт 3, 120 мин','Без счёта','']];
for (const p of past){ if (p.length===1){ const h=T(p[0], TB, 17, 'ink'); add(pl, h); continue; }
  const [d,m,club,sub,res,score]=p; const r=AL('HORIZONTAL',{name:club, p:[12,16], gap:16, r:16, fill:'paper', align:'CENTER'}); add(pl,r); fillW(r);
  const dt=AL('VERTICAL',{name:'date', w:40, align:'CENTER'}); add(dt, T(d, DM, 24, 'ink', {ls:-2}), T(m, TM, 13, 'muted'));
  const tx=AL('VERTICAL',{name:'text', gap:2}); add(tx, T(club, TB, 15, 'ink'), T(res+(score?', '+score:''), TM, 13, res==='Победа'?'ink':'muted'));
  const rp=AL('HORIZONTAL',{name:'repeat', w:44, h:44, r:999, stroke:'ink', sw:1.5, align:'CENTER', just:'CENTER'}); add(rp, I('repeat','ink',18));
  add(r, dt, tx, rp); tx.layoutGrow=1; }
put(s15, tabBar('Брони'), 20, 750);
cell(R3,'15','Брони, прошедшие','История с результатом матча. Круглая кнопка повторяет бронь: тот же корт, то же время, ближайшая дата.', s15);

// ----- 16 Игроки: открытые матчи -----
const s16 = scr('Открытые матчи','chalk');
const h16 = figma.createFrame(); h16.name='hero'; h16.resize(390,610); h16.fills=[P('ink')]; h16.clipsContent=true; put(s16, h16, 0, 0);
put(h16, statusBar('chalk'), 0, 0);
const bb = ball(84); h16.appendChild(bb); place(bb, 300, 110, 16);
put(h16, T('Открытые\nматчи', DB, 40, 'chalk', {lh:42, ls:-3}), 20, 60);
put(h16, round('plus','chalk','chalk',0.1), 326, 52);
const fch = AL('HORIZONTAL',{name:'filters', gap:8}); add(fch, chip('Ваш уровень 2,5–3,5',{icon:'trend'}), chip('Сегодня'), chip('до 5 км',{icon:'pin'})); put(h16, fch, 20, 160);
// featured
const fm = AL('VERTICAL',{name:'match featured', w:350, p:16, gap:14, r:20, fill:'chalk', op:0.08, stroke:'chalk', sop:0.15});
const fmt = AL('HORIZONTAL',{name:'top', just:'SPACE_BETWEEN', align:'MIN'}); add(fm, fmt); fillW(fmt);
const fml = AL('VERTICAL',{name:'when', gap:2}); add(fml, T('19:00', DB, 40, 'chalk', {lh:44, ls:-3}), T('Сегодня, через 2 часа', TM, 13, 'chalk', {op:0.65}));
const fmr = AL('VERTICAL',{name:'price', gap:2, align:'MAX'}); add(fmr, T('1 200 ₽', TB, 20, 'ball'), T('с игрока', TM, 13, 'chalk', {op:0.65})); add(fmt, fml, fmr);
const fart = figma.createFrame(); fart.name='court with players'; fart.resize(318,132); fart.fills=[]; fart.clipsContent=false; add(fm, fart);
const fcg = court(318,132,0.8); put(fart, fcg, 0, 0);
for (const [x,y,st,ini] of [[60,38,'filled','АК'],[60,94,'filled','ДС'],[258,38,'filled','ОВ'],[258,94,'open']]){ const a=v(PA,'state='+st); if(ini) setText(a,{initials:ini}); put(fart, a, x-22, y-22); }
const fr = circ(60,null,1,'ball',2); fr.dashPattern=[5,5]; put(fart, fr, 258-30, 94-30);
const fmi = AL('HORIZONTAL',{name:'info', just:'SPACE_BETWEEN', align:'CENTER'}); add(fm, fmi); fillW(fmi);
const fmc = AL('VERTICAL',{name:'club', gap:2}); add(fmc, T('Лужники Падел, корт 3', TB, 15, 'chalk'), T('Уровень 2,5–3,5, нужен 1 игрок', TM, 13, 'chalk', {op:0.65})); add(fmi, fmc);
const fjb = btn('primary','Присоединиться',true); add(fm, fjb); fillW(fjb);
put(h16, fm, 20, 212);
put(s16, T('Ещё 7 матчей', DM, 24, 'ink', {ls:-2}), 20, 634);
const m2 = comp('MatchCard').createInstance(); put(s16, m2, 20, 680);
put(s16, tabBar('Игроки'), 20, 750);
cell(R3,'16','Открытые матчи','Матчи, где не хватает 1–2 игроков, по вашему уровню. Ближайший — крупно, со схемой корта и свободным местом; ниже список карточек MatchCard.', s16);

// ----- 17 Матч -----
const s17 = scr('Матч','ink'); put(s17, statusBar('chalk'), 0, 0);
put(s17, round('chevronLeft','chalk','chalk',0.1), 20, 52); put(s17, round('share','chalk','chalk',0.1), 326, 52);
const mh = col350(8); add(mh, T('Матч\nв 19:00', DB, 40, 'chalk', {lh:42, ls:-3}), T('Сегодня, 14 октября. Лужники Падел, корт 3', TR, 15, 'chalk', {op:0.65, w:350})); put(s17, mh, 20, 112);
const big = figma.createFrame(); big.name='court with players'; big.resize(350,230); big.fills=[]; big.clipsContent=false; put(s17, big, 20, 236);
put(big, court(350,175,0.9), 0, 0);
const players=[[64,44,'filled','АК','Аня К.','3,4'],[64,131,'filled','ДС','Дима С.','3,1'],[286,44,'filled','ОВ','Олег В.','3,3'],[286,131,'open',null,'Ваше место','2,5–3,5']];
for (const [x,y,st,ini,nm,lvl] of players){ const a=v(PA,'state='+st); if(ini) setText(a,{initials:ini}); a.rescale(52/44); put(big, a, x-26, y-26);
  const lab=AL('VERTICAL',{name:'label '+nm, align:'MIN', gap:0}); add(lab, T(nm, TB, 13, st==='open'?'ball':'chalk'), T(lvl, TM, 13, 'chalk', {op:0.65})); put(big, lab, x>175 ? x-42-lab.width : x+32, y-18); }
const br = circ(68,null,1,'ball',2); br.dashPattern=[5,5]; put(big, br, 286-34, 131-34);
put(big, T('Команда 1', TM, 13, 'chalk', {op:0.5}), 0, 190); const t2l=T('Команда 2', TM, 13, 'chalk', {op:0.5}); put(big, t2l, 350-t2l.width, 190);
const ml = col350(0); put(s17, ml, 20, 460);
[['Уровень матча','2,5–3,5'],['Ваш уровень','3,0, подходит'],['Формат','Дружеский, 90 мин'],['Организатор','Аня К., 38 игр'],['Запись закроется','в 16:00']].forEach(([a,b])=>{
  const r=AL('HORIZONTAL',{name:a, h:52, just:'SPACE_BETWEEN', align:'CENTER', stroke:'chalk', sop:0.12}); r.strokeTopWeight=0; r.strokeLeftWeight=0; r.strokeRightWeight=0;
  add(r, T(a, TR, 15, 'chalk', {op:0.65}), T(b, TB, 15, 'chalk')); add(ml, r); fillW(r); });
const mbar = AL('HORIZONTAL',{name:'join bar', w:390, p:[16,20,34,20], gap:16, fill:'ink', align:'CENTER', stroke:'chalk', sop:0.12}); mbar.strokeBottomWeight=0; mbar.strokeLeftWeight=0; mbar.strokeRightWeight=0;
const msum = AL('VERTICAL',{name:'summary', gap:2}); add(msum, T('1 200 ₽', TB, 20, 'ball'), T('с игрока', TM, 13, 'chalk', {op:0.65}));
const mj = btn('primary','Присоединиться'); add(mbar, msum, mj); fillW(mj); put(s17, mbar, 0, 844-106);
cell(R3,'17','Матч','Кто уже играет и где ваше место на корте, уровень каждого. Оплата доли сразу при входе в матч.', s17);

// ----- 18 Профиль (экран целиком, со скроллом) -----
const s18 = scr('Профиль','chalk',1240);
const h18 = figma.createFrame(); h18.name='hero'; h18.resize(390,470); h18.fills=[P('ink')]; h18.clipsContent=true; put(s18, h18, 0, 0);
put(h18, statusBar('chalk'), 0, 0); put(h18, round('settings','chalk','chalk',0.1), 326, 52);
const me = AL('HORIZONTAL',{name:'me', gap:16, align:'CENTER'}); const ava=AL('HORIZONTAL',{name:'avatar', w:72, h:72, r:999, fill:'paper', align:'CENTER', just:'CENTER'}); add(ava, T('АК', DM, 24, 'ink'));
const mtx = AL('VERTICAL',{name:'name', gap:4}); add(mtx, T('Аня Ковалёва', DM, 24, 'chalk', {ls:-2}), T('Хамовники, в СМЭШ с марта 2024', TM, 13, 'chalk', {op:0.65})); add(me, ava, mtx); put(h18, me, 20, 108);
const rt = AL('HORIZONTAL',{name:'rating', w:350, just:'SPACE_BETWEEN', align:'MAX'});
const rtl = AL('VERTICAL',{name:'value', gap:0}); add(rtl, T('Рейтинг', TM, 13, 'chalk', {op:0.65}), T('3,4', DB, 40, 'ball', {lh:48, ls:-3}));
add(rt, rtl, chip('+0,6 за 3 месяца', {icon:'trend'})); put(h18, rt, 20, 208);
const pts=[[0,92],[48,88],[96,80],[144,82],[192,62],[240,58],[288,40],[336,28]];
const poly=pts.map(p=>p.join(',')).join(' ');
const chartSvg='<svg xmlns="http://www.w3.org/2000/svg" width="350" height="120" viewBox="-7 0 350 120" fill="none"><path d="M-7 30H343M-7 60H343M-7 90H343" stroke="#F1EEE4" stroke-opacity=".1"/><polyline points="'+poly+'" stroke="#CCFF00" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'+pts.slice(0,-1).map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="3.5" fill="#111210" stroke="#CCFF00" stroke-width="2"/>').join('')+'<circle cx="336" cy="28" r="7" fill="#CCFF00"/></svg>';
const ch = figma.createNodeFromSvg(chartSvg); ch.name='rating chart'; ch.fills=[]; put(h18, ch, 20, 280);
const ml2 = AL('HORIZONTAL',{name:'months', w:350, just:'SPACE_BETWEEN'}); ['Июль','Август','Сентябрь','Октябрь'].forEach(m=>add(ml2, T(m, TM, 13, 'chalk', {op:0.55}))); put(h18, ml2, 20, 412);
const pc2 = col350(28); put(s18, pc2, 20, 494);
const st = AL('HORIZONTAL',{name:'stats', gap:8}); add(pc2, st); fillW(st);
[['38','матчей'],['61 %','побед'],['52','часа на корте']].forEach(([a,b])=>{ const c=AL('VERTICAL',{name:b, p:16, gap:4, r:16, fill:'paper'}); add(c, T(a, DM, 24, 'ink', {ls:-2}), T(b, TM, 13, 'muted')); add(st,c); c.layoutGrow=1; });
const hist = col350(8); add(pc2, hist); fillW(hist);
const hh = AL('HORIZONTAL',{name:'head', just:'SPACE_BETWEEN', align:'CENTER'}); add(hh, T('Последние матчи', TB, 17, 'ink'), T('Все 38', TM, 15, 'muted')); add(hist, hh); fillW(hh);
[['Победа','6:4 6:3, Лужники','+0,08'],['Поражение','4:6 5:7, Раменки','−0,05'],['Победа','7:5 6:2, Лужники','+0,06']].forEach(([a,b,d])=>{
  const r=AL('HORIZONTAL',{name:a, p:[12,16], gap:12, r:16, fill:'paper', align:'CENTER'}); const tx=AL('VERTICAL',{name:'text', gap:2}); add(tx, T(a, TB, 15, 'ink'), T(b, TR, 13, 'muted'));
  add(r, tx, T(d, TB, 15, d[0]==='+'?'ink':'muted')); tx.layoutGrow=1; add(hist, r); fillW(r); });
const set = col350(0); add(pc2, set); fillW(set); add(set, T('Настройки', TB, 17, 'ink'));
[['trend','Уровень и районы','2,5–3,5, Хамовники'],['card','Способы оплаты','СБП, Мир 4417'],['bell','Уведомления','Матчи моего уровня'],['logout','Выйти','']].forEach(([ic,a,b])=>{
  const r=AL('HORIZONTAL',{name:a, h:60, gap:12, align:'CENTER', stroke:'line'}); r.strokeTopWeight=0; r.strokeLeftWeight=0; r.strokeRightWeight=0;
  const tx=AL('VERTICAL',{name:'text', gap:2}); add(tx, T(a, TB, 15, 'ink'), b?T(b, TR, 13, 'muted'):null);
  add(r, I(ic,'ink',20), tx, ic==='logout'?null:I('chevronRight','muted',20)); tx.layoutGrow=1; add(set, r); fillW(r); });
put(s18, tabBar('Профиль'), 20, 1240-94);
cell(R3,'18','Профиль','Показан целиком, со скроллом. Рейтинг и его рост за 3 месяца, статистика, последние матчи с изменением рейтинга, настройки.', s18);

}
layoutLib();
await getBoard().children.find(n=>n.name==='Ряд 2 — Поиск и бронь').screenshot({scale:0.5});
await getBoard().children.find(n=>n.name==='Ряд 3 — Брони, игроки, профиль').screenshot({scale:0.5});
await getBoard().screenshot({scale:0.5});
return {ok:true, board:{w:getBoard().width,h:getBoard().height}};
