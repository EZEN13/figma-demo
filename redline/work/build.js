// REDLINE: tokens -> icon components -> components -> 10 frames (7 screens, splash in 3 keyframes)
const ALPHA_BIND = true;
for (const n of [...figma.currentPage.children]) n.remove();
for (const c of await figma.variables.getLocalVariableCollectionsAsync()) c.remove();
// ---------- fonts ----------
const fonts = await figma.listAvailableFontsAsync();
const has = fam => fonts.filter(f=>f.fontName.family===fam).map(f=>f.fontName.style);
function pick(c){ for (const [fam,prefs] of c){ const st=has(fam); for (const p of prefs) if (st.includes(p)) return {family:fam, style:p}; } return {family:'Inter', style:'Bold'}; }
const DX = pick([['Tektur',['Bold','SemiBold','Semi Bold','Medium']],['Russo One',['Regular']],['Oswald',['Bold','SemiBold','Semi Bold']]]);
const MB = pick([['JetBrains Mono',['Bold','ExtraBold','Extra Bold']],['Roboto Mono',['Bold']]]);
const MM = pick([['JetBrains Mono',['Medium','Regular']],['Roboto Mono',['Medium','Regular']]]);
const TR = pick([['Manrope',['Medium','Regular']],['Onest',['Medium']]]);
const TS = pick([['Manrope',['SemiBold','Semi Bold','Bold']],['Onest',['SemiBold','Bold']]]);
const TB = pick([['Manrope',['ExtraBold','Extra Bold','Bold']],['Onest',['Bold']]]);
for (const f of [DX,MB,MM,TR,TS,TB]) await figma.loadFontAsync(f);

// ---------- tokens ----------
const C = {bg:'#0A0909', s1:'#141212', s2:'#1D1A1A', s3:'#2A2626', line:'#2E2828', text:'#F3EFEA', muted:'#8F8681', dim:'#5C5551', red:'#FF2D46', mint:'#2BFFA3',
  'text/5':'#F3EFEA0D', 'text/8':'#F3EFEA14', 'text/14':'#F3EFEA24', 'red/10':'#FF2D461A', 'red/14':'#FF2D4624', 'mint/14':'#2BFFA324'};
const hex = h => ({r:parseInt(h.slice(1,3),16)/255, g:parseInt(h.slice(3,5),16)/255, b:parseInt(h.slice(5,7),16)/255});
const alp = h => h.length>7 ? parseInt(h.slice(7,9),16)/255 : 1;
const col = figma.variables.createVariableCollection('REDLINE tokens');
const mode = col.modes[0].modeId; const V = {};
for (const [k,v] of Object.entries(C)) { const x = figma.variables.createVariable('color/'+k, col, 'COLOR'); x.setValueForMode(mode, Object.assign(hex(v),{a:alp(v)})); x.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR']; V[k]=x; }
const SP = {}; for (const n of [4,8,12,16,20,24,32]) { const x = figma.variables.createVariable('space/'+n, col, 'FLOAT'); x.setValueForMode(mode, n); x.scopes=['GAP']; SP[n]=x; }
const RD = {}; for (const n of [8,12,16,20,24,999]) { const x = figma.variables.createVariable('radius/'+n, col, 'FLOAT'); x.setValueForMode(mode, n); x.scopes=['CORNER_RADIUS']; RD[n]=x; }
const P = k => (alp(C[k])<1 && !ALPHA_BIND) ? {type:'SOLID', color:hex(C[k]), opacity:alp(C[k])} : figma.variables.setBoundVariableForPaint({type:'SOLID', color:hex(C[k])}, 'color', V[k]);
const bind = (n, field, val, tbl) => { if (tbl[val]) { try { n.setBoundVariable(field, tbl[val]); } catch(e) {} } };

// ---------- helpers ----------
function setup(f, dir, o={}) {
  f.layoutMode = dir; f.name = o.name || f.name;
  f.fills = o.fill ? [P(o.fill)] : [];
  f.itemSpacing = o.gap ?? 0; bind(f,'itemSpacing',o.gap,SP);
  let p = o.p ?? 0; if (typeof p==='number') p=[p,p,p,p]; else if (p.length===2) p=[p[0],p[1],p[0],p[1]];
  [f.paddingTop,f.paddingRight,f.paddingBottom,f.paddingLeft]=p;
  ['paddingTop','paddingRight','paddingBottom','paddingLeft'].forEach((k,i)=>bind(f,k,p[i],SP));
  if (o.r!=null) { f.cornerRadius=o.r; ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'].forEach(k=>bind(f,k,o.r,RD)); }
  if (o.align) f.counterAxisAlignItems=o.align;
  if (o.just) f.primaryAxisAlignItems=o.just;
  if (o.stroke) { f.strokes=[P(o.stroke)]; f.strokeWeight=o.sw||1; f.strokeAlign='INSIDE'; }
  f.clipsContent = o.clip ?? false;
  f.primaryAxisSizingMode='AUTO'; f.counterAxisSizingMode='AUTO';
  if (o.w || o.h) f.resize(o.w || Math.max(f.width,1), o.h || Math.max(f.height,1));
  f.primaryAxisSizingMode = dir==='HORIZONTAL' ? (o.w?'FIXED':'AUTO') : (o.h?'FIXED':'AUTO');
  f.counterAxisSizingMode = dir==='HORIZONTAL' ? (o.h?'FIXED':'AUTO') : (o.w?'FIXED':'AUTO');
  return f;
}
const AL = (dir,o) => setup(figma.createFrame(), dir, o);
function add(parent, ...kids) { for (const k of kids) parent.appendChild(k); return parent; }
function fillW(n){ n.layoutSizingHorizontal='FILL'; return n; }
function T(str, font, size, color='text', o={}) {
  const t = figma.createText(); t.fontName=font; t.characters=str; t.fontSize=size; t.fills=[P(color)];
  if (o.lh) t.lineHeight={unit:'PIXELS', value:o.lh};
  if (o.ls!=null) t.letterSpacing={unit:'PERCENT', value:o.ls};
  if (o.w) { t.resize(o.w, t.height); t.textAutoResize='HEIGHT'; }
  if (o.align) t.textAlignHorizontal=o.align;
  // Tektur: lowercase Cyrillic uses Bulgarian forms (д→g, п→n) — display text is set in caps
  if (font===DX && !o.keepCase) t.textCase='UPPER';
  t.name = o.name || str.slice(0,24);
  return t;
}
function rect(w,h,fill,r=0){ const x=figma.createRectangle(); x.resize(w,h); x.fills=fill?[P(fill)]:[]; if(r) x.cornerRadius=r; return x; }
function frame(w,h,o={}){ const f=figma.createFrame(); f.resize(w,h); f.fills=o.fill?[P(o.fill)]:[]; f.clipsContent=o.clip??false; if(o.r) f.cornerRadius=o.r; f.name=o.name||'frame'; return f; }
function abs(p, n, x, y, back){ if (back) p.insertChild(0,n); else p.appendChild(n); n.layoutPositioning='ABSOLUTE'; n.x=x; n.y=y; return n; }
function place(n, cx, cy, deg) { n.rotation = deg; const a = deg*Math.PI/180, c=Math.cos(a), s=Math.sin(a), w=n.width/2, h=n.height/2; n.x = cx - (c*w + s*h); n.y = cy - (-s*w + c*h); }

// ---------- icons (Lucide) as components ----------
const ICONS = {
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevronLeft:'<path d="m15 18-6-6 6-6"/>',
  chevronDown:'<path d="m6 9 6 6 6-6"/>',
  ellipsis:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  wifi:'<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  spade:'<path d="M5 9c-1.5 1.5-3 3.2-3 5.5A5.5 5.5 0 0 0 7.5 20c1.8 0 3-.5 4.5-2 1.5 1.5 2.7 2 4.5 2a5.5 5.5 0 0 0 5.5-5.5c0-2.3-1.5-4-3-5.5l-7-7-7 7Z"/><path d="M12 18v4"/>',
  gamepad:'<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
  wallet:'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus:'<path d="M5 12h14"/>',
  send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  gem:'<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  timer:'<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
  rotate:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  bell:'<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  arrowUpRight:'<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  arrowDownLeft:'<path d="M17 7 7 17"/><path d="M17 17H7V7"/>'
};
const lib = AL('HORIZONTAL',{name:'Компоненты', p:40, gap:40, fill:'s3', align:'MIN'});
const icoFrame = AL('HORIZONTAL',{name:'Иконки Lucide', p:16, gap:12, fill:'bg', r:16}); add(lib, icoFrame);
const ICO = {};
for (const [k,svg] of Object.entries(ICONS)) {
  const n = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F3EFEA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+svg+'</svg>');
  const c = figma.createComponentFromNode(n); c.name='icon/'+k; c.fills=[];
  c.findAll(x=>'strokes' in x && x.strokes.length>0).forEach(x=>{ x.strokes=[P('text')]; });
  c.children.forEach(x=>{ x.constraints={horizontal:'SCALE', vertical:'SCALE'}; });
  icoFrame.appendChild(c); ICO[k]=c;
}
function tint(inst, color, size){ inst.findAll(x=>'strokes' in x && x.strokes.length>0).forEach(x=>{ x.strokes=[P(color)]; x.strokeWeight = size<=16 ? 1.75 : 2; }); }
function I(name, color='text', size=24){ const i = ICO[name].createInstance(); i.resize(size,size); tint(i,color,size); i.name='icon'; return i; }
function swapIcon(inst, name, color, size=20){ const ic = inst.findOne(n=>n.name==='icon'); ic.swapComponent(ICO[name]); ic.resize(size,size); tint(ic,color,size); }

// ---------- brand graphics ----------
function grid(w,h,step){ const g=frame(w,h,{name:'grid'}); for(let x=step;x<w;x+=step){ const r=rect(1,h,'text/5'); r.x=x; g.appendChild(r);} for(let y=step;y<h;y+=step){ const r=rect(w,1,'text/5'); r.y=y; g.appendChild(r);} return g; }
function curve(w,h,k,o={}){ const n=48, pad=o.pad??6, sw=o.sw??3, pts=[];
  for(let i=0;i<=n;i++){ const t=i/n; pts.push([t*w, h-(h-pad)*Math.pow(t,k)]); }
  const d='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none"><path d="${d} L${w} ${h} L0 ${h} Z" fill="#FF2D46"/><path d="${d}" stroke="#FF2D46" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const g=figma.createNodeFromSvg(svg); g.name='crash curve'; g.fills=[]; g.clipsContent=false;
  const [a,l]=g.children; a.name='area'; a.fills=[P(o.area||'red/10')]; a.strokes=[]; l.name='line'; l.strokes=[P(o.color||'red')]; l.fills=[];
  if (o.noArea) a.remove();
  const at = t => pts[Math.round(t*n)];
  return {g, tip:pts[n], at, angle:Math.atan((h-pad)*k/w)*180/Math.PI};
}
function plane(len){
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24" viewBox="0 0 48 24"><path d="M2 13C2 11 4 10 8 10L38 9C43 9 47 11 47 12.5C47 14 43 15.5 38 15.5L8 15C4 15 2 14.5 2 13Z" fill="#F3EFEA"/><path d="M31 10.5L22 1H17.5L22.5 10.5Z" fill="#F3EFEA"/><path d="M31 14.5L22 23.5H17.5L22.5 14.5Z" fill="#F3EFEA"/><path d="M9 10L4.5 3H1.5L3.5 11Z" fill="#F3EFEA"/><path d="M38.5 10.4C40.5 10.3 42.5 10.9 44 11.8L38.5 11.9Z" fill="#0A0909"/></svg>';
  const p=figma.createNodeFromSvg(svg); p.name='plane'; p.fills=[];
  p.children.forEach((c,i)=>{ c.fills=[P(i===4?'bg':'text')]; });
  p.rescale(len/48); return p;
}
// put plane so its tail touches the curve tip; parent coords
function flyPlane(parent, cv, gx, gy, len, k=0.8){ const p=plane(len); parent.appendChild(p); if (parent.layoutMode && parent.layoutMode!=='NONE') p.layoutPositioning='ABSOLUTE'; const a=cv.angle*k, r=a*Math.PI/180; place(p, gx+cv.tip[0]+Math.cos(r)*len*0.42, gy+cv.tip[1]-Math.sin(r)*len*0.42, a); return p; }
function chipMark(size){ const f=frame(size,size,{fill:'text', r:size/2, name:'chip mark'}); const e=figma.createEllipse(); e.resize(size*0.62,size*0.62); e.x=size*0.19; e.y=size*0.19; e.fills=[]; e.strokes=[P('bg')]; e.strokeWeight=Math.max(1.5,size*0.08); e.dashPattern=[size*0.14,size*0.1]; f.appendChild(e); return f; }
function markSvg(size, svg){ const f=frame(size,size,{fill:'s3', r:size/2, name:'coin'}); const n=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F3EFEA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+svg+'</svg>'); n.fills=[]; n.findAll(x=>'strokes' in x && x.strokes.length>0).forEach(x=>x.strokes=[P('text')]); n.rescale(size*0.6/24); n.x=size*0.2; n.y=size*0.2; f.appendChild(n); return f; }
const tonMark = s => markSvg(s,'<path d="M6 7.5h12L12 18.5Z"/><path d="M12 7.5v11"/>');
const usdtMark = s => markSvg(s,'<path d="M6 6.5h12"/><path d="M12 6.5V19"/><ellipse cx="12" cy="11.5" rx="6.5" ry="2"/>');
function logo(size, stage=2){
  const g=AL('HORIZONTAL',{name:'logo', gap: size>=32?12:8, align:'CENTER'});
  const m=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20 L9 14 L13 17" stroke="#FF2D46"/><path d="M13 17 L21 5" stroke="#FF2D46"/></svg>');
  m.name='mark'; m.fills=[]; m.children[0].strokes=[P('red')]; m.children[1].strokes=[P(stage===1?'dim':'red')]; if (stage===1) m.children[1].dashPattern=[2,4]; m.rescale(size/24);
  const t=T('REDLINE', DX, size, 'text', {name:'wordmark', ls:-2, keepCase:true}); t.setRangeFills(0,3,[P('red')]); if (stage===1) t.setRangeFills(3,7,[P('dim')]);
  return add(g, m, t);
}
function avatar(init, size=32){ const a=AL('HORIZONTAL',{name:'avatar', w:size, h:size, r:999, fill:'s3', align:'CENTER', just:'CENTER'}); add(a, T(init, TB, 13, 'text')); return a; }
function pill(icon, text){ const p=AL('HORIZONTAL',{name:'pill', h:32, p:[0,12], gap:8, r:999, fill:'text/8', align:'CENTER'}); add(p, I(icon,'muted',16), T(text, MM, 13, 'muted')); return p; }
function statusBar(){
  const s=AL('HORIZONTAL',{name:'status bar', p:[0,28], h:48, w:390, align:'CENTER', just:'SPACE_BETWEEN'});
  const sig=AL('HORIZONTAL',{name:'signal', gap:2, align:'MAX'}); [4,6,8,11].forEach(h=>add(sig, rect(3,h,'text',1)));
  const bat=frame(26,13,{name:'battery'}); const bo=rect(23,13,null,4); bo.strokes=[P('muted')]; bo.strokeWeight=1; bat.appendChild(bo); const bi=rect(19,9,'text',2); bi.x=2; bi.y=2; bat.appendChild(bi); const nub=rect(2,5,'muted',1); nub.x=24; nub.y=4; bat.appendChild(nub);
  const ic=AL('HORIZONTAL',{name:'system', gap:8, align:'CENTER'}); add(ic, sig, I('wifi','text',16), bat);
  return add(s, T('9:41', TB, 15, 'text'), ic);
}

// ---------- components ----------
// Telegram pills
function mkPill(kind){ const c=figma.createComponent();
  setup(c,'HORIZONTAL',{name:'kind='+kind, h:32, p: kind==='menu'?[0,12]:[0,12,0,8], gap: kind==='menu'?16:4, r:999, fill:'text/8', align:'CENTER'});
  if (kind==='menu') add(c, I('chevronDown','text',20), I('ellipsis','text',20));
  else add(c, I(kind==='close'?'x':'chevronLeft','text',20), T(kind==='close'?'Close':'Back', TS, 15, 'text', {name:'label'}));
  return c; }
const pills=['close','back','menu'].map(mkPill); add(lib, ...pills);
const TgPill=figma.combineAsVariants(pills, lib); setup(TgPill,'HORIZONTAL',{name:'TgPill', p:24, gap:16, fill:'bg', r:16, align:'CENTER'});
TgPill.description='Системные пилюли Telegram Mini App: Close на корневых экранах, Back на внутренних, menu справа всегда.';
const pv = (set, nm) => set.children.find(c=>c.name===nm).createInstance();
function tgBar(kind){ const b=AL('HORIZONTAL',{name:'telegram header', w:390, h:44, p:[0,16], align:'CENTER', just:'SPACE_BETWEEN'}); add(b, pv(TgPill,'kind='+kind), pv(TgPill,'kind=menu')); return b; }
// Button
function mkBtn(type){ const c=figma.createComponent(); const fg = type==='secondary'?'text':'bg';
  setup(c,'HORIZONTAL',{name:'type='+type, h:56, p:[0,24], gap:12, r:16, align:'CENTER', just:'CENTER', fill: type==='primary'?'red': type==='win'?'mint':null, stroke: type==='secondary'?'text/14':null, sw:1.5});
  add(c, I({primary:'send', win:'arrowUpRight', secondary:'wallet'}[type], fg, 20), T({primary:'Войти через Telegram', win:'Забрать 1 235', secondary:'Подключить TON-кошелёк'}[type], TB, 15, fg, {name:'label'}));
  return c; }
const btns=['primary','win','secondary'].map(mkBtn); add(lib, ...btns);
const Button=figma.combineAsVariants(btns, lib); setup(Button,'VERTICAL',{name:'Button', p:24, gap:16, fill:'bg', r:16});
Button.description='primary: красный, одно главное действие на экран. win: мятный, только кэшаут/забрать выигрыш. secondary: контур.';
function btn(type, label, icon){ const b=pv(Button,'type='+type); b.findOne(n=>n.name==='label').characters=label; if (icon) swapIcon(b, icon, type==='secondary'?'text':'bg'); else b.findOne(n=>n.name==='icon').visible=false; return b; }
// MultChip
function mkMult(kind){ const c=figma.createComponent(); setup(c,'HORIZONTAL',{name:'kind='+kind, p:[8,12], r:8, fill: kind==='low'?'red/14':'mint/14', align:'CENTER'}); add(c, T(kind==='low'?'x1.32':'x3.10', MB, 13, kind==='low'?'red':'mint', {name:'value'})); return c; }
const mults=['low','high'].map(mkMult); add(lib, ...mults);
const MultChip=figma.combineAsVariants(mults, lib); setup(MultChip,'HORIZONTAL',{name:'MultChip', p:24, gap:12, fill:'bg', r:16});
MultChip.description='Множитель прошедшего раунда: low (<x2) красный, high (>=x2) мятный.';
const mc = v => { const i=pv(MultChip, parseFloat(v.slice(1))<2?'kind=low':'kind=high'); i.findOne(n=>n.name==='value').characters=v; return i; };
// TabBar
const TABS=[['spade','Казино'],['gamepad','Игры'],['wallet','Кошелёк'],['user','Профиль']];
function mkTab(active){ const c=figma.createComponent();
  setup(c,'HORIZONTAL',{name:'active='+active, w:350, h:64, p:[0,8], r:999, fill:'s2', stroke:'line', align:'CENTER', just:'SPACE_BETWEEN'});
  for (const [ic,l] of TABS){ if (l===active){ const it=AL('HORIZONTAL',{name:'tab '+l, h:48, p:[0,16], gap:8, r:999, fill:'red/14', align:'CENTER'}); add(it, I(ic,'red',20), T(l, TB, 13, 'red')); add(c,it); }
    else { const it=AL('HORIZONTAL',{name:'tab '+l, w:56, h:48, align:'CENTER', just:'CENTER'}); add(it, I(ic,'muted',22)); add(c,it); } }
  return c; }
const tabs=['Казино','Кошелёк'].map(mkTab); add(lib, ...tabs);
const TabBar=figma.combineAsVariants(tabs, lib); setup(TabBar,'VERTICAL',{name:'TabBar', p:24, gap:16, fill:'bg', r:16});
TabBar.description='Плавающий таб-бар-пилюля. Активный таб: капсула red/14 с иконкой и подписью, остальные только иконки.';
// BetInput
const BetInput=figma.createComponent(); setup(BetInput,'HORIZONTAL',{name:'BetInput', w:318, h:56, p:[0,8,0,16], gap:8, r:16, fill:'s2', align:'CENTER'});
{ const l=AL('HORIZONTAL',{name:'value', gap:8, align:'CENTER'}); add(l, chipMark(20), T('500', MB, 20, 'text', {name:'amount'}), T('≈ 5 USDT', MM, 13, 'muted', {name:'eq'}));
  add(BetInput, l); fillW(l);
  for (const ic of ['minus','plus']) { const b=AL('HORIZONTAL',{name:'btn '+ic, w:40, h:40, r:12, fill:'s3', align:'CENTER', just:'CENTER'}); add(b, I(ic,'text',18)); add(BetInput,b); } }
add(lib, BetInput); BetInput.description='Поле суммы ставки в фишках с эквивалентом в USDT и шагом -/+.';

// ---------- board ----------
const W=390, H=844;
function screen(name, kind){ const s=AL('VERTICAL',{name, w:W, h:H, fill:'bg', clip:true}); add(s, statusBar(), tgBar(kind)); return s; }
function wrap(p, gap=16, align){ return AL('VERTICAL',{name:'content', p, gap, align}); }
function row(o={}){ return AL('HORIZONTAL',Object.assign({name:'row', align:'CENTER'},o)); }
function titleRow(t, right){ const r=row({name:'title row', just:'SPACE_BETWEEN'}); add(r, T(t, DX, 20, 'text', {ls:-1})); if (right) add(r, right); return r; }
const shots = {};

// ===== 01a splash: logo assembles =====
const sp1=screen('01a Загрузка — логотип','close');
abs(sp1, grid(W,H,32), 0, 0, true);
{ const L=logo(36,1); abs(sp1, L, (W-L.width)/2, 400); }
// ===== 01b splash: line takes off =====
const sp2=screen('01b Загрузка — взлёт','close');
abs(sp2, grid(W,H,32), 0, 0, true);
{ const L=logo(36); abs(sp2, L, (W-L.width)/2, 200);
  const cv=curve(340, 380, 1.8); abs(sp2, cv.g, -10, 380);
  flyPlane(sp2, cv, -10, 380, 56);
  const m=T('x1.84', MB, 20, 'text'); abs(sp2, m, -10+cv.tip[0]-110, 380+cv.tip[1]+8); }
// ===== 01c splash: multiplier + progress =====
const sp3=screen('01c Загрузка — множитель','close');
abs(sp3, grid(W,H,32), 0, 0, true);
{ const big=T('x∞', MB, 220, 'text', {name:'x∞ outline', ls:-6}); big.fills=[]; big.strokes=[P('text/14')]; big.strokeWeight=1.5; abs(sp3, big, (W-big.width)/2, 250);
  const L=logo(36); abs(sp3, L, (W-L.width)/2, 140);
  const pr=AL('VERTICAL',{name:'progress', w:350, gap:12});
  const lr=row({name:'scale', just:'SPACE_BETWEEN'}); add(lr, T('x1.00', MM, 13, 'muted'), T('x∞', MM, 13, 'muted')); add(pr, lr); fillW(lr);
  const bar=frame(350,6,{fill:'s2', r:3, name:'bar'}); const fl=rect(287,6,'red',3); bar.appendChild(fl); add(pr, bar);
  const st=row({name:'status', just:'SPACE_BETWEEN'}); add(st, T('Подключаемся к столу', TR, 13, 'muted'), T('82%', MB, 13, 'text')); add(pr, st); fillW(st);
  abs(sp3, pr, 20, 700); }

// ===== 02 onboarding =====
const s2=screen('02 Вход','close');
{ const c=wrap([8,20,0,20],20); add(s2,c); fillW(c);
  const hero=frame(350,240,{fill:'s1', r:24, clip:true, name:'hero chart'}); add(c, hero);
  hero.appendChild(grid(350,240,28));
  const cv=curve(290,170,1.9); hero.appendChild(cv.g); cv.g.x=0; cv.g.y=70; flyPlane(hero, cv, 0, 70, 48);
  const m=T('x24.80', MB, 36, 'text', {ls:-4}); hero.appendChild(m); m.x=20; m.y=18;
  const chips=row({gap:8}); add(chips, mc('x3.10'), mc('x1.24'), mc('x12.40')); hero.appendChild(chips); chips.x=20; chips.y=72;
  const tb=AL('VERTICAL',{name:'title', gap:8}); add(c,tb); fillW(tb);
  const h=T('Забери до\nкрасной линии', DX, 36, 'text', {lh:40, ls:-2, name:'display'}); h.setRangeFills(10, 23, [P('red')]);
  add(tb, h, T('Краш, красное/чёрное и мины на внутриигровых фишках. Пополнение в TON и USDT.', TR, 15, 'muted', {w:350, lh:22}));
  const bonus=row({name:'welcome bonus', p:16, gap:16, r:20, fill:'s1'}); add(c,bonus); fillW(bonus);
  const gi=AL('HORIZONTAL',{w:48, h:48, r:999, fill:'mint/14', align:'CENTER', just:'CENTER', name:'gift'}); add(gi, I('gift','mint',22));
  const bt=AL('VERTICAL',{gap:4, name:'text'}); add(bt, T('+1 000 фишек', MB, 20, 'mint'), T('Приветственный бонус за первый вход', TR, 13, 'muted'));
  add(bonus, gi, bt);
  const acts=AL('VERTICAL',{name:'actions', gap:12}); add(c,acts); fillW(acts);
  const b1=btn('primary','Войти через Telegram','send'); add(acts,b1); fillW(b1);
  const b2=btn('secondary','Подключить TON-кошелёк','wallet'); add(acts,b2); fillW(b2);
  const legal=row({name:'legal', gap:12}); add(c, legal); fillW(legal);
  const age=AL('HORIZONTAL',{w:40, h:40, r:999, stroke:'dim', sw:1.5, align:'CENTER', just:'CENTER', name:'18+'}); add(age, T('18+', MB, 13, 'muted'));
  add(legal, age, T('Только для совершеннолетних. Фишки не являются деньгами, играйте ответственно.', TR, 13, 'dim', {w:298, lh:18})); }

// ===== 03 home =====
const s3=screen('03 Главная','close');
{ const c=wrap([8,20,16,20],0); add(s3,c); fillW(c);
  const card=AL('VERTICAL',{name:'balance', p:16, gap:4, r:24, fill:'s1'}); add(c,card); fillW(card);
  const r1=row({just:'SPACE_BETWEEN'}); const who=row({gap:8}); add(who, avatar('МК',28), T('Макс, на счету', TR, 15, 'muted')); add(r1, who, I('bell','muted',20)); add(card,r1); fillW(r1);
  const r2=row({gap:12, name:'amount'}); add(r2, chipMark(28), T('12 480', MB, 36, 'text', {ls:-3})); add(card,r2);
  const r3=row({just:'SPACE_BETWEEN'}); const dep=btn('primary','Пополнить','plus'); dep.resize(dep.width, 44); dep.paddingLeft=16; dep.paddingRight=20;
  add(r3, T('≈ 124,80 USDT', MM, 15, 'muted'), dep); add(card,r3); fillW(r3);
  // live ticker (full-bleed)
  const tk=AL('HORIZONTAL',{name:'live wins ticker', w:390, h:40, p:[0,20], gap:16, fill:'s1', align:'CENTER', clip:true}); add(s3,tk);
  tk.strokes=[P('line')]; tk.strokeAlign='INSIDE'; tk.strokeTopWeight=1; tk.strokeBottomWeight=1; tk.strokeLeftWeight=0; tk.strokeRightWeight=0;
  const lv=row({gap:8}); const dot=figma.createEllipse(); dot.resize(6,6); dot.fills=[P('red')]; add(lv, dot, T('Выигрыши', TB, 13, 'text')); add(tk, lv);
  for (const [n,m,a] of [['Дима К.','x4.12','+2 060'],['Аня','x2.10','+630'],['skyfox','x11.36','+11 360'],['Lera_M','x3.00','+900']]) { add(tk, rect(1,16,'text/14')); const it=row({gap:8}); add(it, T(n, TS, 13, 'text'), T(m, MM, 13, 'muted'), T(a, MB, 13, 'mint')); add(tk,it); }
  const c2=wrap([16,20,0,20],0); add(s3,c2); fillW(c2);
  const bw=AL('VERTICAL',{name:'promo carousel', gap:12, align:'CENTER'}); add(c2,bw); fillW(bw);
  const ban=frame(350,88,{fill:'s2', r:20, clip:true, name:'banner'}); add(bw, ban);
  const bt=T('x2 к депозиту', DX, 20, 'text', {ls:-1, keepCase:true}); bt.setRangeTextCase(3,13,'UPPER'); bt.setRangeFills(0,2,[P('red')]); ban.appendChild(bt); bt.x=16; bt.y=16;
  const bs=T('До 5 000 фишек бонусом, до 20 октября', TR, 13, 'muted', {w:180, lh:18}); ban.appendChild(bs); bs.x=16; bs.y=46;
  [[222,24],[252,16],[282,24]].forEach(([x,y],i)=>{ const cm=chipMark(56); cm.strokes=[P('s2')]; cm.strokeWeight=3; ban.appendChild(cm); cm.x=x; cm.y=y+i*0; });
  const dots=row({gap:6}); add(dots, rect(18,6,'text',3), rect(6,6,'dim',3), rect(6,6,'dim',3)); add(bw,dots);
  const gs=AL('VERTICAL',{name:'games', p:[20,0,0,0], gap:12}); add(c2,gs); fillW(gs);
  const gt=titleRow('Игры', T('Все 6', TR, 15, 'muted')); add(gs,gt); fillW(gt);
  const online = t => { const r=row({gap:8, name:'online'}); add(r, I('users','muted',14), T(t, MM, 13, 'muted')); return r; };
  const cc=frame(350,100,{fill:'s1', r:20, clip:true, name:'game Краш'}); add(gs,cc);
  const ct=T('Самолётик', DX, 20, 'text', {ls:-1}); cc.appendChild(ct); ct.x=16; ct.y=14;
  const cs=T('Краш до x1000', TR, 13, 'muted'); cc.appendChild(cs); cs.x=16; cs.y=42;
  const co=online('1 204 играют'); cc.appendChild(co); co.x=16; co.y=68;
  const ccv=curve(150,84,2.0,{sw:2.5}); cc.appendChild(ccv.g); ccv.g.x=170; ccv.g.y=16; flyPlane(cc, ccv, 170, 16, 34);
  const cm2=T('x2.47', MB, 15, 'text'); cc.appendChild(cm2); cm2.x=214; cm2.y=40;
  const sm=row({gap:8, name:'small games', align:'MIN'}); add(gs, sm); fillW(sm);
  const g1=AL('VERTICAL',{name:'game Красное/Чёрное', h:132, p:16, gap:8, r:20, fill:'s1'}); add(sm,g1); fillW(g1);
  const tiles=row({gap:4}); [['red','text'],['s3','text'],['red','text'],['text','bg'],['s3','text'],['red','text']].forEach(([f])=>add(tiles, rect(18,24,f,4))); add(g1,tiles);
  add(g1, T('Красное/\nЧёрное', DX, 20, 'text', {lh:22, ls:-1}), online('2 418'));
  const g2=AL('VERTICAL',{name:'game Мины', h:132, p:16, gap:8, r:20, fill:'s1'}); add(sm,g2); fillW(g2);
  const cells=row({gap:4}); [0,1,0,1,0].forEach(g=>{ const cl=AL('HORIZONTAL',{w:22, h:24, r:4, fill:g?'mint/14':'s3', align:'CENTER', just:'CENTER'}); if(g) add(cl, I('gem','mint',14)); add(cells,cl); }); add(g2,cells);
  add(g2, T('Мины', DX, 20, 'text', {ls:-1}), online('987'));
  abs(s3, pv(TabBar,'active=Казино'), 20, H-24-64); }

// ===== 04 crash =====
const s4=screen('04 Краш','back');
{ const c=wrap([4,20,0,20],12); add(s4,c); fillW(c);
  const rg=row({gap:8}); const hb=AL('HORIZONTAL',{w:32, h:32, r:999, fill:'text/8', align:'CENTER', just:'CENTER', name:'history'}); add(hb, I('history','muted',16)); add(rg, pill('users','1 204'), hb);
  const tr=titleRow('Самолётик', rg); add(c,tr); fillW(tr);
  const hist=row({gap:8, name:'round history'}); ['x1.32','x3.10','x1.05','x12.40','x2.01','x1.87','x5.66','x1.19'].forEach(v=>add(hist, mc(v))); add(c,hist);
  const ch=frame(350,290,{fill:'s1', r:24, clip:true, name:'crash chart'}); add(c,ch);
  ch.appendChild(grid(350,290,29));
  [['x2.5',116],['x2.0',174],['x1.5',232]].forEach(([l,y])=>{ const t=T(l, MM, 13, 'dim'); ch.appendChild(t); t.x=350-12-t.width; t.y=y-8; });
  const cv=curve(280,200,1.9); ch.appendChild(cv.g); cv.g.x=0; cv.g.y=90; flyPlane(ch, cv, 0, 90, 52);
  const mk=cv.at(0.6); const dt=figma.createEllipse(); dt.resize(10,10); dt.fills=[P('mint')]; dt.strokes=[P('s1')]; dt.strokeWeight=2; ch.appendChild(dt); dt.x=mk[0]-5; dt.y=90+mk[1]-5;
  const lab=AL('HORIZONTAL',{p:[4,8], r:8, fill:'mint/14', name:'cashout marker'}); add(lab, T('Аня +630', MB, 13, 'mint')); ch.appendChild(lab); lab.x=mk[0]-lab.width-8; lab.y=90+mk[1]-30;
  const big=T('x2.47', MB, 72, 'text', {lh:76, ls:-5, name:'multiplier'}); ch.appendChild(big); big.x=18; big.y=14;
  const fl=T('В полёте 8,2 с', TR, 13, 'muted'); ch.appendChild(fl); fl.x=24; fl.y=94;
  const pn=AL('VERTICAL',{name:'bet panel', p:16, gap:12, r:24, fill:'s1'}); add(c,pn); fillW(pn);
  const ph=row({just:'SPACE_BETWEEN'}); add(ph, T('Ставка', TB, 15, 'text'), T('Баланс 12 480', MM, 13, 'muted')); add(pn,ph); fillW(ph);
  const bi=BetInput.createInstance(); add(pn,bi); fillW(bi);
  const q=row({gap:8, name:'quick'}); for (const v of ['100','500','1 000','x2']) { const it=AL('HORIZONTAL',{h:36, r:12, fill:'s2', align:'CENTER', just:'CENTER'}); add(it, T(v, MB, 13, 'text')); add(q,it); fillW(it); } add(pn,q); fillW(q);
  const au=row({name:'auto cashout', h:48, p:[0,12], r:12, fill:'s2', just:'SPACE_BETWEEN'}); const tg=frame(40,24,{fill:'text', r:12, name:'toggle'}); const kn=figma.createEllipse(); kn.resize(18,18); kn.x=19; kn.y=3; kn.fills=[P('bg')]; tg.appendChild(kn);
  const ar=row({gap:12}); add(ar, T('x3.00', MB, 15, 'text'), tg); add(au, T('Авто-кэшаут', TS, 15, 'text'), ar); add(pn,au); fillW(au);
  const cta=btn('win','Забрать 1 235'); add(c,cta); fillW(cta); }

// ===== 05 red/black =====
const s5=screen('05 Красное/Чёрное','back');
{ const c=wrap([4,20,12,20],12); add(s5,c); fillW(c);
  const tr=titleRow('Красное/Чёрное', pill('timer','Ставки 0:12')); add(c,tr); fillW(tr);
  const tape=frame(390,104,{clip:true, name:'tape'}); add(s5,tape);
  const seq=[12,3,9,0,13,5,8,1,14,6,11];
  seq.forEach((n,i)=>{ const kind = n===0?'zero': n<=7?'red':'black';
    const tl=AL('VERTICAL',{name:'tile '+n, w:64, h:88, r:12, align:'CENTER', just:'CENTER', fill: kind==='red'?'red': kind==='zero'?'text':'s2', stroke: i===5?'text': kind==='black'?'line':null, sw: i===5?2:1});
    add(tl, T(String(n), DX, 20, kind==='black'?'text':'bg')); tape.appendChild(tl); tl.x=163+(i-5)*72; tl.y=8; const d=Math.abs(i-5); tl.opacity = d>=4?0.3 : d===3?0.55 : 1; });
  for (const [y,pts] of [[0,'0,0 12,0 6,7'],[97,'0,7 12,7 6,0']]) { const tri=figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7"><polygon points="${pts}" fill="#F3EFEA"/></svg>`); tri.fills=[]; tri.children[0].fills=[P('text')]; tape.appendChild(tri); tri.x=189; tri.y=y; tri.name='marker'; }
  const c2=wrap([12,20,0,20],16); add(s5,c2); fillW(c2);
  const hr=row({gap:6, name:'last results'}); add(hr, T('Последние', TR, 13, 'muted')); hr.itemSpacing=6;
  ['red','black','red','red','zero','black','red','black','black','red','red','black','red','black'].forEach(k=>add(hr, rect(14,14, k==='red'?'red': k==='zero'?'text':'s3', 4))); add(c2,hr);
  const cols=row({gap:8, name:'bets', align:'MIN'}); add(c2,cols); fillW(cols);
  for (const [nm,mul,kind,cnt,sum,sel,inits] of [['Красное','x2','red','38 игроков','46 200',1,['А','Д','К']],['Чёрное','x2','black','31 игрок','39 850',0,['С','Л','М']],['Зеро','x14','zero','4 игрока','2 300',0,['Р','В']]]) {
    const cl=AL('VERTICAL',{name:'bet '+nm, p:8, gap:12, r:16, fill:'s1', stroke: sel?'red':null, sw:2}); add(cols,cl); fillW(cl);
    const fg = kind==='black'?'text':'bg';
    const hd=AL('VERTICAL',{name:'head', h:64, p:[12,12], gap:4, r:12, fill: kind==='red'?'red': kind==='zero'?'text':'s3'}); add(hd, T(nm, TB, 15, fg), T(mul, MB, 15, fg)); add(cl,hd); fillW(hd);
    const bd=AL('VERTICAL',{name:'players', p:[0,4,4,4], gap:4}); add(cl,bd); fillW(bd);
    const st=row({gap:-6}); inits.forEach(x=>{ const a=avatar(x,24); a.strokes=[P('s1')]; a.strokeWeight=2; a.strokeAlign='OUTSIDE'; add(st,a); }); add(bd, st);
    add(bd, T(sum, MB, 15, 'text'), T(cnt, TR, 13, 'muted')); }
  const bi=BetInput.createInstance(); add(c2,bi); fillW(bi);
  const cta=btn('primary','Поставить 500 на красное'); add(c2,cta); fillW(cta);
  const lt=titleRow('Ставки раунда', T('73 игрока', TR, 15, 'muted')); add(c2,lt); fillW(lt);
  const ls=AL('VERTICAL',{name:'round bets', gap:0}); add(c2,ls); fillW(ls);
  for (const [i,n,k,a] of [['ДК','Дима К.','red','5 000'],['СЛ','skyfox','black','3 200'],['РВ','Рома В.','zero','1 000']]) { const r=row({h:48, gap:12}); const nmT=T(n, TS, 15, 'text'); add(r, avatar(i,32), nmT, rect(10,10, k==='red'?'red': k==='zero'?'text':'s3', 3), T(a, MB, 15, 'text')); add(ls,r); fillW(r); nmT.layoutGrow=1; } }

// ===== 06 mines =====
const s6=screen('06 Мины','back');
{ const c=wrap([4,20,0,20],16); add(s6,c); fillW(c);
  const tr=titleRow('Мины', pill('shield','Честная игра')); add(c,tr); fillW(tr);
  const st=row({gap:8, name:'stats'}); add(c,st); fillW(st);
  for (const [l,v,k] of [['Ставка','500','text'],['Множитель','x2.14','text'],['Следующий','x2.68','muted']]) { const cl=AL('VERTICAL',{p:12, gap:4, r:16, fill:'s1', name:l}); add(cl, T(l, TR, 13, 'muted'), T(v, MB, 20, k)); add(st,cl); fillW(cl); }
  const gr=AL('VERTICAL',{name:'field 5x5', gap:8}); add(c,gr); fillW(gr);
  const open=new Set(['0,1','1,3','2,2','3,0','2,4']); const last='2,2';
  for (let r=0;r<5;r++){ const rw=row({gap:8}); add(gr,rw); fillW(rw);
    for (let k=0;k<5;k++){ const key=r+','+k, o=open.has(key);
      const cl=AL('HORIZONTAL',{name:o?'gem':'closed', h:62, r:12, fill:o?'mint/14':'s2', stroke: key===last?'mint': o?null:'line', sw: key===last?1.5:1, align:'CENTER', just:'CENTER'});
      if (o) add(cl, I('gem','mint',28)); add(rw,cl); fillW(cl); } }
  const ms=AL('VERTICAL',{name:'mines count', gap:8}); add(c,ms); fillW(ms);
  const mh=row({just:'SPACE_BETWEEN'}); add(mh, T('Мин на поле', TR, 13, 'muted'), T('5 из 22 кристаллов найдено', TR, 13, 'muted')); add(ms,mh); fillW(mh);
  const sg=row({p:4, gap:4, r:16, fill:'s1', name:'segmented'}); for (const v of ['1','3','5','10','24']) { const on=v==='3'; const it=AL('HORIZONTAL',{h:40, r:12, fill:on?'text':null, align:'CENTER', just:'CENTER'}); add(it, T(v, MB, 15, on?'bg':'muted')); add(sg,it); fillW(it); } add(ms,sg); fillW(sg);
  const cta=btn('win','Забрать 1 070'); add(c,cta); fillW(cta); }

// ===== 07 win =====
const s7=screen('07 Выигрыш','back');
{ const ch=frame(390,200,{clip:true, name:'round replay'}); add(s7,ch);
  ch.appendChild(grid(390,200,26));
  const cv=curve(330,180,2.1,{sw:3}); ch.appendChild(cv.g); cv.g.x=0; cv.g.y=20;
  const tip=cv.tip; const end=figma.createEllipse(); end.resize(10,10); end.fills=[P('red')]; ch.appendChild(end); end.x=tip[0]-5; end.y=20+tip[1]-5;
  const fl=T('улетел на x11.36', MM, 13, 'muted'); ch.appendChild(fl); fl.x=tip[0]-fl.width-14; fl.y=20+tip[1]-4;
  const mk=cv.at(0.86); const dt=figma.createEllipse(); dt.resize(14,14); dt.fills=[P('mint')]; dt.strokes=[P('bg')]; dt.strokeWeight=3; ch.appendChild(dt); dt.x=mk[0]-7; dt.y=20+mk[1]-7;
  const lab=AL('HORIZONTAL',{p:[4,8], r:8, fill:'mint/14', name:'cashout'}); add(lab, T('кэшаут x8.20', MB, 13, 'mint')); ch.appendChild(lab); lab.x=mk[0]-lab.width-12; lab.y=20+mk[1]-12;
  const c=wrap([16,20,0,20],4,'CENTER'); add(s7,c); fillW(c);
  add(c, T('Вы забрали на', TR, 15, 'muted'), T('x8.20', MB, 72, 'mint', {lh:80, ls:-5}), T('+4 100 фишек', DX, 36, 'text', {ls:-2}), T('≈ 41,00 USDT', MM, 15, 'muted'));
  const cw=wrap([24,20,0,20],0); add(s7,cw); fillW(cw);
  const card=AL('VERTICAL',{name:'round summary', p:16, gap:12, r:20, fill:'s1'}); add(cw,card); fillW(card);
  for (const [a,b] of [['Ставка','500'],['Раунд','#284 117'],['Баланс','16 080']]) { const r=row({just:'SPACE_BETWEEN'}); add(r, T(a, TR, 15, 'muted'), T(b, MB, 15, 'text')); add(card,r); fillW(r); }
  const aw=wrap([24,20,0,20],12); add(s7,aw); fillW(aw);
  const b1=btn('primary','Ещё раунд','rotate'); add(aw,b1); fillW(b1);
  const b2=btn('secondary','Поделиться выигрышем','share'); add(aw,b2); fillW(b2); }

// ===== 08 wallet =====
const s8=screen('08 Кошелёк','close');
{ const c=wrap([4,20,0,20],12); add(s8,c); fillW(c);
  const top=row({just:'SPACE_BETWEEN', align:'MIN'}); add(c,top); fillW(top);
  const bl=AL('VERTICAL',{gap:4, name:'balance'}); const am=row({gap:12}); add(am, chipMark(28), T('12 480', MB, 36, 'text', {ls:-3}));
  add(bl, T('Баланс', TR, 13, 'muted'), am, T('≈ 124,80 USDT', MM, 15, 'muted'));
  const wp=row({h:32, p:[0,12,0,4], gap:8, r:999, fill:'text/8', name:'wallet'}); add(wp, tonMark(24), T('UQAz…9fK2', MM, 13, 'muted'));
  add(top, bl, wp);
  const sg=row({p:4, gap:4, r:16, fill:'s1', name:'segmented'}); [['Пополнить',1],['Вывести',0]].forEach(([l,on])=>{ const it=AL('HORIZONTAL',{h:40, r:12, fill:on?'text':null, align:'CENTER', just:'CENTER'}); add(it, T(l, TB, 15, on?'bg':'muted')); add(sg,it); fillW(it); }); add(c,sg); fillW(sg);
  const cur=row({gap:8, name:'currency'}); add(c,cur); fillW(cur);
  for (const [nm,rate,mark,sel] of [['TON','540 фишек',tonMark,1],['USDT','100 фишек',usdtMark,0]]) { const cd=row({p:16, gap:12, r:16, fill:'s1', stroke: sel?'red':'line', sw: sel?1.5:1}); const tx=AL('VERTICAL',{gap:2}); add(tx, T(nm, TB, 15, 'text'), T(rate, MM, 13, 'muted')); add(cd, mark(36), tx); add(cur,cd); fillW(cd); }
  const ac=AL('VERTICAL',{name:'amount', p:16, gap:8, r:16, fill:'s1'}); add(c,ac); fillW(ac);
  const ar=row({just:'SPACE_BETWEEN'}); const lv=row({gap:8, align:'BASELINE'}); add(lv, T('10', MB, 36, 'text', {ls:-3}), T('TON', MB, 20, 'muted'));
  add(ar, lv, T('+5 400 фишек', MB, 15, 'mint')); add(ac, T('Сумма пополнения', TR, 13, 'muted'), ar); fillW(ar);
  const q=row({gap:8, name:'quick'}); for (const v of ['5','10','25','50']) { const on=v==='10'; const it=AL('HORIZONTAL',{h:36, r:12, fill:'s1', stroke:on?'text':null, sw:1.5, align:'CENTER', just:'CENTER'}); add(it, T(v+' TON', MB, 13, on?'text':'muted')); add(q,it); fillW(it); } add(c,q); fillW(q);
  const cta=btn('primary','Пополнить на 10 TON'); add(c,cta); fillW(cta);
  const ht=titleRow('История', T('Все', TR, 15, 'muted')); add(c,ht); fillW(ht);
  const hl=AL('VERTICAL',{name:'history', gap:4}); add(c,hl); fillW(hl);
  for (const [ic,t,d,a,k] of [['arrowDownLeft','Пополнение TON','Сегодня, 14:02','+5 400','mint'],['arrowUpRight','Вывод USDT','Вчера, 23:40','−2 000','text']]) { const r=row({h:52, gap:12}); const ib=AL('HORIZONTAL',{w:40, h:40, r:999, fill:k==='mint'?'mint/14':'text/8', align:'CENTER', just:'CENTER'}); add(ib, I(ic, k==='mint'?'mint':'muted', 18)); const tx=AL('VERTICAL',{gap:2}); add(tx, T(t, TS, 15, 'text'), T(d, TR, 13, 'muted')); add(r, ib, tx, T(a, MB, 15, k)); add(hl,r); fillW(r); tx.layoutGrow=1; }
  abs(s8, pv(TabBar,'active=Кошелёк'), 20, H-24-64); }

// ---------- board layout ----------
const board=AL('VERTICAL',{name:'REDLINE — Telegram Mini App', p:80, gap:80, fill:'s3'});
const head=AL('VERTICAL',{gap:8}); add(head, logo(36), T('Telegram мини-приложение, внутриигровое крипто-казино. 7 экранов, 390×844', TR, 15, 'muted')); add(board, head);
const colm=(label, s)=>{ const c=AL('VERTICAL',{gap:16, name:'col '+s.name}); add(c, T(label, TS, 15, 'text'), s); return c; };
const row1=row({gap:48, align:'MIN', name:'row 1'}); add(row1, colm('01a  Загрузка: логотип собирается, 0–600 мс', sp1), colm('01b  Загрузка: линия взлетает, 600–1500 мс', sp2), colm('01c  Загрузка: множитель и прогресс, 1500–2400 мс', sp3), colm('02  Вход', s2));
const row2=row({gap:48, align:'MIN', name:'row 2'}); add(row2, colm('03  Главная', s3), colm('04  Краш «Самолётик»', s4), colm('05  Красное/Чёрное', s5), colm('06  Мины', s6), colm('07  Выигрыш', s7), colm('08  Кошелёк', s8));
add(board, row1, row2);
board.x=0; board.y=0; lib.x=0; lib.y=board.height+120;
figma.currentPage.name='REDLINE';
await board.screenshot({scale:0.5});
for (const s of [s2,s3,s4,s5,s6,s7,s8]) await s.screenshot({scale:0.8});
return { fonts:{DX,MB,MM,TR,TS,TB}, tektur:has('Tektur'), board:{w:board.width,h:board.height}, alphaPaint: s2.findOne(n=>n.name==='welcome bonus').fills[0], pillFill: pills[0].fills[0] };
