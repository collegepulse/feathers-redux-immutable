## feathers-redux-immutable

[![Build Status](https://travis-ci.org/collegepulse/feathers-redux-immutable.svg?branch=master)](https://travis-ci.org/collegepulse/feathers-redux-immutable)
[![Coverage Status](https://coveralls.io/repos/github/collegepulse/feathers-redux-immutable/badge.svg?branch=master)](https://coveralls.io/github/collegepulse/feathers-redux-immutable?branch=master)

An [immutable][1], [redux][2] data store for FeathersJS [services][3].

## Install

```
npm install feathers-redux-immutable --save
```

## Usage

```js
import reduxifyServices from 'feathers-redux-immutable';
const feathersClient = feathers()...;

// Create Redux actions and reducers for Feathers services
const services = reduxifyServices(feathersClient, ['messages', 'users']);

// Configure Redux store & reducers
export default combineReducers({
  messages: services.messages.reducer,
  users: services.users.reducer,
});

// Feathers service calls may now be dispatched.
store.dispatch(services.messages.get('557XxUL8PalGMgOo'));
```

## Action creators

`reduxifyServices` returns an object with the shape:

```javascript
{
  messages: { // For the Feathers service with path /messages.
    // action creators
    create(data, params) {}, // Action creator for app.services('messages').create(data, params)
    update(id, data, params) {},
    patch(id, data, params) {},
    remove(id, params) {},
    find(params) {},
    get(id, params) {},
    store(object) {}, // Interface for realtime replication.
    reset() {}, // Reinitializes store for this service.
    // reducer
    reducer() {}, // Reducers handling actions MESSAGES_CREATE_PENDING, _FULFILLED, and _REJECTED.
  },
  users: { ... },
}
```

Service calls can be dispatched by:

```javascript
dispatch(services.messages.create(data, params));
```

## Shape of the store

The usage example code produces a Redux state with the shape:

```javascript
state = {
  messages: {
    isLoading: boolean, // If get or find have started
    isSaving: boolean, // If update, patch or remove have started
    isFinished: boolean, // If last call finished successfully
    isError: Feathers error, // If last call was unsuccessful
    data: hook.result, // Results from other than a find call
    queryResult: hook.result, // Results from a find call. May be paginated.
  },
  users: { ... },
};
```

If integrating with [feathers-offline-realtime-immutable][5], the state will be decorated with these additional properties:

```javascript
state = {
  messages: {
    store: {
      connected: boolean, // If replication engine still listening for Feathers service events
      last: { // Read https://github.com/feathersjs/feathers-offline-realtime#event-information.
        action: string, // Replication action.
        eventName: string, // Feathers service event name. e.g. created
        records: object, // Feathers service event record.
      },
      records: [ objects ], // Sorted near realtime contents of remote service
    },
  },
  users: { ... },
}
```

## Replication Engine Integration

```javascript
const Realtime = require('feathers-offline-realtime-immutable');
const messages = feathersClient.service('/messages');

const messagesRealtime = new Realtime(messages, { subscriber: (records, last) => {
  store.dispatch(services.messages.store({ connected: messagesRealtime.connected, last, records }));
} });
```

## Why Immutable?

Immutable objects allow for shallow equality checking.

If you're using React to render your application, you can increase performance by utilizing a shallow comparison (as opposed to a more expensive deep object comparison) in the `shouldComponentUpdate` lifecycle method. The behavior is the default when extending from [React.PureComponent][4].

This implementation uses [timm][1], which uses plain JS objects.

## Acknowledgements
- [feathers-redux](https://github.com/feathersjs/feathers-redux) was our inspiration.

## License

MIT

[1]: http://guigrpa.github.io/timm/
[2]: http://redux.js.org/
[3]: https://docs.feathersjs.com/api/services
[4]: https://facebook.github.io/react/docs/react-api.html#react.purecomponent
[5]: https://github.com/collegepulse/feathers-offline-realtime-immutable
