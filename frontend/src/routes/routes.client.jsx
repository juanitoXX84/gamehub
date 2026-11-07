import { ClientLayout } from '../layouts'
import { Catalog, GameDetail, Home } from '../pages/client'

const routesClient = [
  {
    path: '/',
    layout: ClientLayout,
    component: Home,
  },
  {
    path: '/home',
    layout: ClientLayout,
    component: Home,
  },
  {
    path: '/catalogo',
    layout: ClientLayout,
    component: Catalog,
  },
  {
    path: '/juegos/:gameId',
    layout: ClientLayout,
    component: GameDetail,
  },
]

export default routesClient
