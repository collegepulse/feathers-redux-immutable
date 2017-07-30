import { createStore, applyMiddleware } from 'redux';
import rootReducer from '../reducers';
import middleware from '../middleware';

export default function configureStore(reduxifiedServices, initialState) {
  const createStoreWithMiddlewares = applyMiddleware(...middleware)(createStore);
  return createStoreWithMiddlewares(rootReducer(reduxifiedServices), initialState);
}
