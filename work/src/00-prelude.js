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
