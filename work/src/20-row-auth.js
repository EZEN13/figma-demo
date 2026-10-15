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
