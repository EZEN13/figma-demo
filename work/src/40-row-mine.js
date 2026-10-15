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
