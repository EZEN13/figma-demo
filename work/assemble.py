#!/usr/bin/env python3
"""Собирает вызовы use_figma из work/src/*.js и общий work/build.js.
Каждый вызов = const RESET + пролог + части (каждая в своём блоке) + эпилог.
Лимит одного вызова use_figma — 50 000 символов, поэтому пробелы в начале строк и строки-комментарии вырезаются."""
import pathlib, re
W = pathlib.Path(__file__).parent; S = W/'src'
def mini(js): return '\n'.join(l.strip() for l in js.splitlines() if l.strip() and not l.strip().startswith('//'))
pre = (S/'00-prelude.js').read_text()
def shot(names, scale):
    return ''.join(f"await getBoard().children.find(n=>n.name==='{n}').screenshot({{scale:{scale}}});\n" for n in names)
CALLS = {
 'call-1': (True,  ['10-components.js','20-row-auth.js'], "layoutLib();\nawait page.children.find(n=>n.name==='Компоненты').screenshot({scale:0.5});\n"+shot(['Ряд 1 — Вход и онбординг'],0.5)),
 'call-2': (False, ['25-fixups.js','30-row-booking.js','40-row-mine.js'], "layoutLib();\n"+shot(['Ряд 2 — Поиск и бронь','Ряд 3 — Брони, игроки, профиль'],0.5)+"await getBoard().screenshot({scale:0.5});\n"),
}
full = []
for name,(reset,parts,epi) in CALLS.items():
    body = f"const RESET={'true' if reset else 'false'};\n"+pre+''.join('{\n'+(S/p).read_text()+'\n}\n' for p in parts)+epi+"return {ok:true, board:{w:getBoard().width,h:getBoard().height}};\n"
    m = mini(body); (W/'out'/f'{name}.js').write_text(m)
    print(name, len(m)); full.append(f"// ===== {name}: отдельный вызов use_figma =====\n"+body)
(W/'build.js').write_text("// СМЭШ — полная сборка. Слишком длинно для одного use_figma (лимит 50 000 символов),\n// поэтому выполняется вызовами из work/out/call-*.js (их собирает work/assemble.py).\n// call-1 пересоздаёт страницу, токены и компоненты (RESET), call-2 находит их по имени и дописывает ряды.\n\n"+'\n'.join(full))
