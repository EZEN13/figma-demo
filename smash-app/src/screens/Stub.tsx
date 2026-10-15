import { useNavigate } from 'react-router';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useGoBack } from '../lib/nav';
import s from './Stub.module.css';

interface Props {
  num: string;
  title: string;
  stage: number;
  top?: 'dark' | 'light';
  /** куда ведёт «Назад»; null — корень вкладки */
  backTo: string | null;
  next?: { label: string; to: string; replace?: boolean; onGo?: () => void };
  tab?: boolean;
}

/** Аккуратная заглушка для экранов следующих этапов. */
export function Stub({ num, title, stage, top = 'light', backTo, next, tab }: Props) {
  const goBack = useGoBack();
  const navigate = useNavigate();
  const dark = top === 'dark';
  return (
    <Screen top={top} bg={dark ? 'ink' : 'chalk'} back={backTo === null ? null : () => goBack(backTo)} toast={tab ? 'tabbar' : 'bottom'}>
      <div className={s.wrap}>
        <span className={`${s.num} ${dark ? s.numDark : ''}`}>{num}</span>
        <h1 className={s.title}>{title}</h1>
        <p className={`${s.note} ${dark ? s.noteDark : ''}`}>Экран появится на этапе {stage}.</p>
        {next && (
          <div className={s.cta}>
            <Button
              block
              onClick={() => {
                next.onGo?.();
                navigate(next.to, { replace: next.replace });
              }}
            >
              {next.label}
            </Button>
          </div>
        )}
      </div>
    </Screen>
  );
}
