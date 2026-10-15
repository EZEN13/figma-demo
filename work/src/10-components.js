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
