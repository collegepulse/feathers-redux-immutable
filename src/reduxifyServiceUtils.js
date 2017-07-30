import { merge } from 'timm';

/**
 * Creates an object of action types for a given service.
 *
 * @param {String} name - the serviceName by which the service is known on client. Default route.
 * @returns {{find: *, get: *, create: *, update: *, patch: *, remove: *, on: *, reducer: *}}
 */
export function getActionTypes(serviceName) {
  const SERVICE_NAME = `SERVICES_${serviceName.toUpperCase()}_`;
  return {
    FIND: `${SERVICE_NAME}FIND`,
    GET: `${SERVICE_NAME}GET`,
    CREATE: `${SERVICE_NAME}CREATE`,
    UPDATE: `${SERVICE_NAME}UPDATE`,
    PATCH: `${SERVICE_NAME}PATCH`,
    REMOVE: `${SERVICE_NAME}REMOVE`,
    RESET: `${SERVICE_NAME}RESET`,
    STORE: `${SERVICE_NAME}STORE`,
  };
}

/**
 * Creates an initial state object for a feathers service.
 *
 * @param {Object} options
 * @returns {Object} - default state
 */
export function getDefaultState(opts) {
  return {
    [opts.isError]: null,
    [opts.isLoading]: false,
    [opts.isSaving]: false,
    [opts.isFinished]: false,
    [opts.data]: null,
    [opts.queryResult]: null,
    [opts.store]: null,
  };
}

/**
 * Reset status if no promise is pending
 *
 * @param {String} actionName - name of redux action
 * @param {Object} opts
 * @returns {Object}
 */
export function reducerForReset(actionName, opts) {
  return {
    [actionName]: (state, action) => {
      if (state[opts.isLoading] || state[opts.isSaving]) {
        return state;
      }
      return merge(state, {
        [opts.isError]: null,
        [opts.isLoading]: false,
        [opts.isSaving]: false,
        [opts.isFinished]: false,
        [opts.data]: null,
        [opts.queryResult]: action.payload ? state[opts.queryResult] : null,
        [opts.store]: null,
      });
    },
  };
}

/**
 * Update store
 *
 * @param {String} actionName - name of redux action
 * @param {Object} opts
 * @returns {Object}
 *
 */
export function reducerForStore(actionName, opts) {
  return {
    [actionName]: (state, action) => (
      merge(state, {
        [opts.store]: action.payload,
      })
    ),
  };
}
