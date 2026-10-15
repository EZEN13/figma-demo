// ===== Правки компонентов, уже созданных call-1 (идемпотентно) =====
comp('Ticket').findOne(n=>n.name==='count').characters='1 из 4';
comp('PayOption').children.filter(c=>c.name.startsWith('method=СБП')).forEach(c=>{ c.findOne(n=>n.name==='hint').characters='Без комиссии'; });
