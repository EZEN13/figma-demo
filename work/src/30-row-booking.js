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
