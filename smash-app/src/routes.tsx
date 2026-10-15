import { Navigate, Route, Routes, useParams, type Location } from 'react-router';
import { Splash } from './screens/Splash';
import { Stub } from './screens/Stub';
import { useApp } from './state/AppState';

function Places({ edit }: { edit?: boolean }) {
  const { dispatch } = useApp();
  return edit ? (
    <Stub num="07" title="Районы и клубы" stage={3} backTo="/profile" next={{ label: 'Сохранить', to: '/profile', replace: true }} />
  ) : (
    <Stub
      num="07"
      title="Где играете?"
      stage={4}
      backTo="/welcome/level"
      next={{ label: 'Готово', to: '/courts', replace: true, onGo: () => dispatch({ type: 'onboard' }) }}
    />
  );
}

function BookingStub({ success }: { success?: boolean }) {
  const { id } = useParams();
  return success ? (
    <Stub num="13" title={`Бронь ${id ?? ''} подтверждена`} stage={2} top="dark" backTo="/bookings" />
  ) : (
    <Stub num="13" title={`Бронь ${id ?? ''}`} stage={3} top="dark" backTo="/bookings" />
  );
}

/** Карта маршрутов SPEC §4.2. */
export function AppRoutes({ location }: { location: Location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Splash />} />
      <Route path="/welcome/1" element={<Stub num="02" title="Корт за 30 секунд" stage={4} top="dark" backTo={null} next={{ label: 'Дальше', to: '/welcome/2' }} />} />
      <Route path="/welcome/2" element={<Stub num="03" title="Соберите четвёрку" stage={4} top="dark" backTo="/welcome/1" next={{ label: 'Начать', to: '/welcome/level' }} />} />
      <Route path="/welcome/level" element={<Stub num="06" title="Ваш уровень" stage={4} backTo="/welcome/2" next={{ label: 'Дальше', to: '/welcome/places' }} />} />
      <Route path="/welcome/places" element={<Places />} />
      <Route path="/courts" element={<Stub num="08" title="Корты" stage={2} top="dark" backTo={null} tab next={{ label: 'Корт 3, Лужники', to: '/court/luzhniki-3' }} />} />
      <Route path="/courts/map" element={<Stub num="09" title="Карта" stage={2} top="dark" backTo="/courts" tab />} />
      <Route path="/court/:courtId" element={<Stub num="11" title="Корт" stage={2} top="dark" backTo="/courts" next={{ label: 'Забронировать', to: '/pay?court=luzhniki-3' }} />} />
      <Route path="/pay" element={<Stub num="12" title="Оплата" stage={2} backTo="/courts" next={{ label: 'Оплатить', to: '/booking/SM-48217/success', replace: true }} />} />
      <Route path="/booking/:id/success" element={<BookingStub success />} />
      <Route path="/booking/:id" element={<BookingStub />} />
      <Route path="/bookings" element={<Stub num="14" title="Брони" stage={3} backTo={null} tab />} />
      <Route path="/matches" element={<Stub num="16" title="Открытые матчи" stage={3} top="dark" backTo={null} tab next={{ label: 'Матч в 19:00', to: '/match/m1' }} />} />
      <Route path="/match/:id" element={<Stub num="17" title="Матч" stage={3} top="dark" backTo="/matches" />} />
      <Route path="/profile" element={<Stub num="18" title="Профиль" stage={3} top="dark" backTo={null} tab next={{ label: 'Уровень и районы', to: '/profile/level' }} />} />
      <Route path="/profile/level" element={<Stub num="06" title="Ваш уровень" stage={3} backTo="/profile" next={{ label: 'Дальше', to: '/profile/places' }} />} />
      <Route path="/profile/places" element={<Places edit />} />
      <Route path="*" element={<Navigate to="/courts" replace />} />
    </Routes>
  );
}
