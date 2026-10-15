import { Navigate, Route, Routes, type Location } from 'react-router';
import { Splash } from './screens/Splash';
import { Stub } from './screens/Stub';
import { Home } from './screens/Home';
import { MapScreen } from './screens/MapScreen';
import { Court } from './screens/Court';
import { Pay } from './screens/Pay';
import { BookingSuccess } from './screens/BookingSuccess';
import { Bookings } from './screens/Bookings';
import { Matches } from './screens/Matches';
import { Match } from './screens/Match';
import { Profile } from './screens/Profile';
import { LevelScreen, PlacesScreen } from './screens/Setup';

/** Карта маршрутов SPEC §4.2. Онбординг 02/03 и анимация сплэша — этап 4. */
export function AppRoutes({ location }: { location: Location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Splash />} />
      <Route path="/welcome/1" element={<Stub num="02" title="Корт за 30 секунд" stage={4} top="dark" backTo={null} next={{ label: 'Дальше', to: '/welcome/2' }} />} />
      <Route path="/welcome/2" element={<Stub num="03" title="Соберите четвёрку" stage={4} top="dark" backTo="/welcome/1" next={{ label: 'Начать', to: '/welcome/level' }} />} />
      <Route path="/welcome/level" element={<LevelScreen mode="onboarding" />} />
      <Route path="/welcome/places" element={<PlacesScreen mode="onboarding" />} />
      <Route path="/courts" element={<Home />} />
      <Route path="/courts/map" element={<MapScreen />} />
      <Route path="/court/:courtId" element={<Court />} />
      <Route path="/pay" element={<Pay />} />
      <Route path="/booking/:id/success" element={<BookingSuccess mode="success" />} />
      <Route path="/booking/:id" element={<BookingSuccess mode="view" />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/match/:id" element={<Match />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/level" element={<LevelScreen mode="edit" />} />
      <Route path="/profile/places" element={<PlacesScreen mode="edit" />} />
      <Route path="*" element={<Navigate to="/courts" replace />} />
    </Routes>
  );
}
