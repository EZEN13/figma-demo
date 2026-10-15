import { Navigate, Route, Routes, type Location } from 'react-router';
import { Splash } from './screens/Splash';
import { Stub } from './screens/Stub';
import { Home } from './screens/Home';
import { MapScreen } from './screens/MapScreen';
import { Court } from './screens/Court';
import { Pay } from './screens/Pay';
import { BookingSuccess } from './screens/BookingSuccess';
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

/** Карта маршрутов SPEC §4.2. */
export function AppRoutes({ location }: { location: Location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Splash />} />
      <Route path="/welcome/1" element={<Stub num="02" title="Корт за 30 секунд" stage={4} top="dark" backTo={null} next={{ label: 'Дальше', to: '/welcome/2' }} />} />
      <Route path="/welcome/2" element={<Stub num="03" title="Соберите четвёрку" stage={4} top="dark" backTo="/welcome/1" next={{ label: 'Начать', to: '/welcome/level' }} />} />
      <Route path="/welcome/level" element={<Stub num="06" title="Ваш уровень" stage={4} backTo="/welcome/2" next={{ label: 'Дальше', to: '/welcome/places' }} />} />
      <Route path="/welcome/places" element={<Places />} />
      <Route path="/courts" element={<Home />} />
      <Route path="/courts/map" element={<MapScreen />} />
      <Route path="/court/:courtId" element={<Court />} />
      <Route path="/pay" element={<Pay />} />
      <Route path="/booking/:id/success" element={<BookingSuccess mode="success" />} />
      <Route path="/booking/:id" element={<BookingSuccess mode="view" />} />
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
