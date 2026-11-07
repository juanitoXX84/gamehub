import routesAdmin from './routes.admin'
import routesClient from './routes.client'
import routesCommon from './routes.common'

export const routes = [...routesAdmin, ...routesClient, ...routesCommon]
