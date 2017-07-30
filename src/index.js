import reduxifyService from './reduxifyService';

/**
 * Normalizes the routes argument for internal usage.
 *
 * @param {Object|Array|String} routes - The feathers services to reduxify. See below.
 * @returns {Object}
 */
export function getRouteNameMap(routes) {
  if (typeof routes === 'string') {
    return { [routes]: routes };
  } else if (Array.isArray(routes)) {
    return routes.reduce((routeMap, route) => (
      Object.assign(routeMap, { [route]: route })
    ), {});
  }
  return routes;
}

/**
 * Create Redux actions and reducers for Feathers services.
 *
 * @param {Object} app - Feathers application instance
 * @param {Object|Array|String} routes - The feathers services to reduxify. See below.
 * @param {Object} options - See reduxifyService
 * @returns {Object} Each services' action creators.
 *
 */
export default (app, routes, options) => {
  const routeNameMap = getRouteNameMap(routes);
  return Object.keys(routeNameMap).reduce((services, routeKey) => (
    Object.assign(services, {
      [routeNameMap[routeKey]]: reduxifyService(app, routeKey, routeNameMap[routeKey], options),
    })
  ), {});
};
