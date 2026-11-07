import { Route, Routes } from 'react-router-dom'
import GuestRoute from './components/GuestRoute'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import CatalogPage from './pages/CatalogPage'
import GameDetailPage from './pages/GameDetailPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogo" element={<CatalogPage />} />
        <Route path="juegos/:gameId" element={<GameDetailPage />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="registro" element={<RegisterPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="perfil" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
