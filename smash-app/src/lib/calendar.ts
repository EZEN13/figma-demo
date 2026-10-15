import { tg } from '../telegram/tg';
import { hhmm } from './format';

const stamp = (date: string, min: number) => `${date.replace(/-/g, '')}T${hhmm(min).replace(':', '')}00`;

/** .ics для «Добавить в календарь» (SPEC §3.8). Время — московское. */
export function buildIcs(o: { uid: string; title: string; location: string; date: string; start: number; duration: number; description?: string }) {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const esc = (v: string) => v.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SMASH//Padel//RU',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${o.uid}@smash`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Europe/Moscow:${stamp(o.date, o.start)}`,
    `DTEND;TZID=Europe/Moscow:${stamp(o.date, o.start + o.duration)}`,
    `SUMMARY:${esc(o.title)}`,
    `LOCATION:${esc(o.location)}`,
    o.description ? `DESCRIPTION:${esc(o.description)}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(o.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/** Открыть .ics: data-URL через openLink, а если клиент не умеет — скачать файл. */
export function openIcs(ics: string, filename: string) {
  const dataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  try {
    // Telegram открывает только http(s); в браузере и Desktop — скачивание
    if (tg.platform === 'ios' || tg.platform === 'android') tg.openLink(dataUrl);
    else throw new Error('download');
  } catch {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
