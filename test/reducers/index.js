import { combineReducers } from 'redux';

export default function (reduxifiedServices) {
  return combineReducers({
    messages: reduxifiedServices.messages.reducer,
  });
}
