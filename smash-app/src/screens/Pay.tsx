import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Screen } from '../components/Screen';
import { BottomBar } from '../components/BottomBar';
import { Button } from '../components/Button';
import { Segment } from '../components/controls';
import { PayOption } from '../components/PayOption';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { TicketMeta, TicketTime } from '../components/Ticket';
import { useToast } from '../components/Toast';
import { CourtScheme } from '../graphics/CourtScheme';
import { ApiError, api, clubOf, keys } from '../api';
import { useQuery } from '../api/useQuery';
import { DURATIONS, priceFor, shareOf } from '../data/slots';
import type { Duration, Match, PayMethod, PaySplit, Player } from '../data/types';
import { useTelegram } from '../telegram/useTelegram';
import { useClosingConfirmation } from '../telegram/useHeaderColor';
import { haptic } from '../telegram/haptics';
import { dateMedium, hhmm, isValidISO, rub } from '../lib/format';
import { useGoBack } from '../lib/nav';
import s from './Pay.module.css';

interface Draft {
  courtId: string;
  date: string;
  start: number;
  duration: Duration;
  match?: Match;
}

/** dev-флаг ?fail=1 (в query до # или после) — «слот только что заняли». */
const failFlag = () => /[?&]fail=1\b/.test(window.location.search + window.location.hash);

/** 12 Оплата: `/pay?court=&date=&slot=&dur=` или `/pay?match=:id`. */
export function Pay() {
  const [p] = useSearchParams();
  const goBack = useGoBack();
  const matchId = p.get('match');
  const mq = useQuery(keys.match(matchId ?? '-'), () => (matchId ? api.getMatch(matchId) : Promise.reject(new ApiError('not_found'))));

  if (matchId) {
    if (mq.loading) return <PayLoading />;
    if (!mq.data) return <PayInvalid onBack={() => goBack('/matches')} />;
    const m = mq.data;
    return <PayView draft={{ courtId: m.courtId, date: m.date, start: m.start, duration: m.duration, match: m }} />;
  }

  const courtId = p.get('court') ?? '';
  const date = p.get('date');
  const start = Number(p.get('slot'));
  const dur = Number(p.get('dur')) as Duration;
  if (!clubOf(courtId) || !isValidISO(date) || !Number.isFinite(start) || !DURATIONS.includes(dur)) {
    return <PayInvalid onBack={() => goBack('/courts')} />;
  }
  return <PayView draft={{ courtId, date, start, duration: dur }} />;
}

function PayLoading() {
  const goBack = useGoBack();
  return (
    <Screen top="light" back={() => goBack('/matches')}>
      <div className={s.content}>
        <h1 className={s.title}>Оплата</h1>
        <Skeleton h={150} r={16} />
        <Skeleton h={96} r={16} />
        <Skeleton h={220} r={16} />
      </div>
    </Screen>
  );
}

function PayInvalid({ onBack }: { onBack: () => void }) {
  return (
    <Screen top="light" back={onBack}>
      <EmptyState
        art={<CourtScheme length={200} width={100} angle={-10} tone="line" />}
        title="Бронь не собрана"
        text="Выберите корт и время ещё раз"
        action={<Button onClick={onBack}>Назад к выбору</Button>}
      />
    </Screen>
  );
}

function PayView({ draft }: { draft: Draft }) {
  const { court, club } = clubOf(draft.courtId)!;
  const { user } = useTelegram();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const toast = useToast();
  const [split, setSplit] = useState<PaySplit>('split');
  const [method, setMethod] = useState<PayMethod>('sbp');
  const [busy, setBusy] = useState(false);
  useClosingConfirmation(true);

  const m = draft.match;
  const total = m ? m.total : priceFor(court, draft.date, draft.start, draft.duration);
  const pay = m ? m.pricePerPlayer : split === 'split' ? shareOf(total) : total;
  const backTo = m ? `/match/${m.id}` : `/court/${court.id}`;

  const submit = async () => {
    setBusy(true);
    try {
      const b = await api.createBooking({
        courtId: court.id,
        date: draft.date,
        start: draft.start,
        duration: draft.duration,
        split: m ? 'split' : split,
        method,
        matchId: m?.id,
        fail: failFlag(),
      });
      haptic.success();
      navigate(`/booking/${b.id}/success`, { replace: true });
    } catch (e) {
      setBusy(false);
      haptic.error();
      if (e instanceof ApiError && e.code === 'taken') {
        toast('Слот только что заняли. Выберите другое время');
        goBack(backTo);
      } else {
        toast('Нет сети, оплата не прошла', { label: 'Повторить', onClick: submit });
      }
    }
  };

  const you: Player = { name: 'Вы', initials: user.initials, you: true };
  const seats: (Player | null)[] = m ? [...m.seats.filter(Boolean), you, null, null, null].slice(0, 4) : [you, null, null, null];
  const openSeats = seats.filter((x) => !x).length;

  const note = m
    ? `Ваша доля в матче. ${openSeats ? 'Остальным придёт ссылка на оплату' : 'Остальные уже оплатили'}`
    : split === 'split'
      ? `Вы платите ${rub(pay)} сейчас, троим придёт ссылка на оплату`
      : 'Платите всю сумму, игроков позовёте после оплаты';

  const bar = (
    <BottomBar sum={rub(pay)} note={m || split === 'split' ? `ваша доля из ${rub(total)}` : `за ${draft.duration} мин`}>
      <Button loading={busy} onClick={submit}>
        Оплатить
      </Button>
    </BottomBar>
  );

  return (
    <Screen top="light" back={busy ? () => undefined : () => goBack(backTo)} toast="bar" bar={bar}>
      <div className={s.content}>
        <h1 className={s.title}>Оплата</h1>

        <div className={s.summary}>
          <div className={s.row}>
            <span className={s.club}>{club.name}</span>
            <span className={s.courtName}>
              Корт {court.number}, {court.indoor ? 'крытый' : 'открытый'}
            </span>
          </div>
          <TicketTime start={hhmm(draft.start)} end={hhmm(draft.start + draft.duration)} />
          <TicketMeta
            items={[
              ['Дата', dateMedium(draft.date)],
              ['Длительность', `${draft.duration} мин`],
              ['Стоимость', rub(total)],
            ]}
          />
        </div>

        <section className={s.section}>
          <h2 className={s.h}>{m ? 'Матч' : 'Кто платит'}</h2>
          {!m && (
            <Segment
              label="Кто платит"
              items={[
                { value: 'split', label: 'Делим на 4' },
                { value: 'full', label: 'Плачу целиком' },
              ]}
              value={split}
              onChange={setSplit}
            />
          )}
          <div className={s.split}>
            {(m || split === 'split') && (
              <div className={s.seats}>
                {seats.map((x, i) =>
                  x ? (
                    <PlayerAvatar key={i} state={x.you ? 'you' : 'filled'} initials={x.initials} photoUrl={x.you ? user.photoUrl : undefined} label={x.you ? 'Вы' : x.name} />
                  ) : (
                    <PlayerAvatar key={i} state="open" />
                  ),
                )}
              </div>
            )}
            <p className={s.note}>{note}</p>
          </div>
        </section>

        <section className={s.section}>
          <h2 className={s.h}>Способ оплаты</h2>
          <div className={s.methods} role="radiogroup" aria-label="Способ оплаты">
            {(['sbp', 'card', 'applepay'] as PayMethod[]).map((x) => (
              <PayOption key={x} method={x} on={method === x} onSelect={() => setMethod(x)} />
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}
