import { createAction, handleActions } from 'redux-actions';
import { getActionTypes, reducerForReset, reducerForStore, getDefaultState } from './reduxifyServiceUtils';
import reducerForServiceMethod from './reducerForServiceMethod';

const defaults = {
  isError: 'isError',
  isLoading: 'isLoading',
  isSaving: 'isSaving',
  isFinished: 'isFinished',
  data: 'data',
  queryResult: 'queryResult',
  store: 'store',
  PENDING: 'PENDING',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED',
};

/**
 * Build a Redux compatible wrapper around a Feathers service.
 *
 * @param {Object} app - the configured Feathers app
 * @param {String} route - the Feathers' route for the service.
 * @param {String} name - the serviceName by which the service is known on client. Default route.
 * @param {Object} options
 * @returns {{find: *, get: *, create: *, update: *, patch: *, remove: *, on: *, reducer: *}}
 */
export default function reduxifyService(app, route, name, options = {}) {
  const opts = Object.assign({}, defaults, options);
  const actionTypes = getActionTypes(name);
  const service = app.service(route);

  if (!service) {
    throw Error(`Feathers service '${route}' does not exist.`);
  }

  return {
    find: createAction(actionTypes.FIND, p => ({ promise: service.find(p), data: undefined })),
    get: createAction(actionTypes.GET, (id, p) => ({ promise: service.get(id, p) })),
    create: createAction(actionTypes.CREATE, (d, p) => ({ promise: service.create(d, p) })),
    update: createAction(actionTypes.UPDATE, (id, d, p) => ({ promise: service.update(id, d, p) })),
    patch: createAction(actionTypes.PATCH, (id, d, p) => ({ promise: service.patch(id, d, p) })),
    remove: createAction(actionTypes.REMOVE, (id, p) => ({ promise: service.remove(id, p) })),
    reset: createAction(actionTypes.RESET),
    store: createAction(actionTypes.STORE, store => store),
    on: (event, data, fcn) => (dispatch, getState) => { fcn(event, data, dispatch, getState); },
    reducer: handleActions(
      Object.assign({},
        reducerForServiceMethod(actionTypes.FIND, true, true, opts),
        reducerForServiceMethod(actionTypes.GET, true, false, opts),
        reducerForServiceMethod(actionTypes.CREATE, false, false, opts),
        reducerForServiceMethod(actionTypes.UPDATE, false, false, opts),
        reducerForServiceMethod(actionTypes.PATCH, false, false, opts),
        reducerForServiceMethod(actionTypes.REMOVE, false, false, opts),
        reducerForReset(actionTypes.RESET, opts),
        reducerForStore(actionTypes.STORE, opts),
      ),
      getDefaultState(opts),
    ),
  };
}
