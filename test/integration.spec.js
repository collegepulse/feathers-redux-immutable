/* eslint-env mocha */

import assert from 'assert';
import feathers from 'feathers';
import Realtime from 'feathers-offline-realtime-immutable';

import configureStore from './store';
import reduxifyServices from '../src';
import { clone, makeDataItem, makeMessageService } from './utils';

const initServiceState = {
  isError: null,
  isLoading: false,
  isSaving: false,
  isFinished: false,
  data: null,
  queryResult: null,
  store: null,
};

const initData = Array.apply(null, { length: 5 }) // eslint-disable-line prefer-spread
  .map(Number.call, Number)
  .map(makeDataItem);

let app;
let reduxifiedServices;
let messages;
let store;
let state;

describe('integration', () => {
  describe('feathers-redux-immutable', () => {
    beforeEach(() => {
      app = feathers().configure(makeMessageService);
      messages = app.service('messages');
      return messages.remove(null)
        .then(() => messages.create(clone(initData)))
        .then(() => {
          reduxifiedServices = reduxifyServices(app, ['messages']);
          store = configureStore(reduxifiedServices);
          state = store.getState();
        });
    });

    it('should throw when service does not exist', () => {
      assert.throws(() => { reduxifyServices(app, ['nonExistentService']); });
    });

    it('sets initial service state', () => {
      state = store.getState();
      assert.deepEqual(state.messages, initServiceState);
    });

    it('successful service call', () => {
      const promise = store.dispatch(reduxifiedServices.messages.create({ order: 5 }));

      state = store.getState();
      assert.deepEqual(state.messages, Object.assign({}, initServiceState, {
        isSaving: true,
      }));

      return promise.then(() => {
        state = store.getState();
        assert.deepEqual(
          state.messages,
          Object.assign({}, initServiceState, {
            isFinished: true,
            data: {
              id: 1,
              order: 5,
            },
          }),
        );
      });
    });

    it('failed service call', () => {
      const promise = store.dispatch(reduxifiedServices.messages.get(999));

      state = store.getState();

      assert.deepEqual(
        state.messages,
        Object.assign({}, initServiceState, { isLoading: true }),
      );

      return promise
        .then(() => {
          assert(false, 'unexpected succeeded');
        })
        .catch(() => {
          state = store.getState();
          assert(state.messages.isError instanceof Error);
          assert.deepEqual(
            Object.assign({}, state.messages, { isError: null }),
            Object.assign({}, initServiceState, { isError: null, isFinished: true, data: null }),
          );
        });
    });

    it('service find call', () => {
      const promise = store.dispatch(
        reduxifiedServices.messages.find({ query: { id: { $lte: 1 } } }),
      );

      state = store.getState();
      assert.deepEqual(
        state.messages,
        Object.assign(
          {},
          initServiceState,
          { isLoading: true },
        ),
      );

      return promise
        .then(() => {
          state = store.getState();
          assert.deepEqual(
            state.messages,
            Object.assign(
              {},
              initServiceState,
              {
                isFinished: true,
                queryResult: [{ id: 0, order: 0 }, { id: 1, order: 1 }],
              },
            ),
          );
        });
    });

    it('service update call', () => {
      const promise = store.dispatch(
        reduxifiedServices.messages.update(0, { message: 'newMessage', foo: 'bar' }),
      );

      return promise
        .then(() => {
          state = store.getState();
          assert.deepEqual(
            state.messages,
            Object.assign(
              {},
              initServiceState,
              {
                isFinished: true,
                data: {
                  id: 0,
                  message: 'newMessage',
                  foo: 'bar',
                },
              },
            ),
          );
        });
    });

    it('service patch call', () => {
      const promise = store.dispatch(
        reduxifiedServices.messages.patch(0, { message: 'patchedMessage' }),
      );

      return promise
        .then(() => {
          state = store.getState();
          assert.deepEqual(
            state.messages,
            Object.assign(
              {},
              initServiceState,
              {
                isFinished: true,
                data: {
                  id: 0,
                  order: 0,
                  message: 'patchedMessage',
                },
              },
            ),
          );
        });
    });

    it('service remove call', () => {
      const promise = store.dispatch(
        reduxifiedServices.messages.remove(3),
      );

      return promise
        .then(() => {
          state = store.getState();
          assert.deepEqual(
            state.messages,
            Object.assign(
              {},
              initServiceState,
              {
                isFinished: true,
                data: {
                  id: 3,
                  order: 3,
                },
              },
            ),
          );
        });
    });

    it('reset', () => {
      const promise = store.dispatch(
        reduxifiedServices.messages.find({ query: { id: { $lte: 1 } } }),
      );

      state = store.getState();

      return promise
        .then(() => {
          store.dispatch(reduxifiedServices.messages.reset());
          state = store.getState();
          assert.deepEqual(state.messages, initServiceState);
        });
    });
  });

  describe('realtime replication', () => {
    let messagesRealtime;
    let actions;

    beforeEach(() => {
      app = feathers()
        .configure(makeMessageService);

      messages = app.service('messages');

      return messages.remove(null)
        .then(() => messages.create(clone(initData)))
        .then(() => {
          reduxifiedServices = reduxifyServices(app, ['messages']);
          store = configureStore(reduxifiedServices);

          actions = [];

          messagesRealtime = new Realtime(messages, {
            publication: record => record.order <= 1,
            sort: Realtime.sort('order'),
          });

          messagesRealtime.on('events', (records, last) => {
            actions.push(last);

            store.dispatch(reduxifiedServices.messages.store(
              { connected: messagesRealtime.connected, last, records },
            ));
          });
        });
    });

    it('connects', () => (
      messagesRealtime.connect()
        .then(() => {
          assert.deepEqual(actions, [{ action: 'snapshot' }, { action: 'add-listeners' }]);

          state = store.getState();
          assert.deepEqual(state.messages.store, {
            connected: true,
            last: { action: 'add-listeners' },
            records: [{ id: 0, order: 0 }, { id: 1, order: 1 }],
          });
        })
    ));

    it('can change sort order', () => (
      messagesRealtime.connect()
        .then(() => {
          messagesRealtime.changeSort(Realtime.multiSort({ order: -1 }));

          state = store.getState();
          assert.deepEqual(state.messages.store, {
            connected: true,
            last: { action: 'change-sort' },
            records: [{ id: 1, order: 1 }, { id: 0, order: 0 }],
          });
        })
    ));

    it('add record from Feathers service', () => (
      messagesRealtime.connect()
        .then(() => (
          messages.create({ id: 0.1, order: 0.1 })
            .then(() => {
              state = store.getState();

              assert.deepEqual(state.messages.store, {
                connected: true,
                last: {
                  eventName: 'created',
                  action: 'mutated',
                  record: { id: 0.1, order: 0.1 },
                  source: 0,
                },
                records: [{ id: 0, order: 0 }, { id: 0.1, order: 0.1 }, { id: 1, order: 1 }],
              });
            })
        ))
    ));

    it('add record from reduxified service', () => (
      messagesRealtime.connect()
        .then(() => (
          store.dispatch(reduxifiedServices.messages.create({ id: 0.2, order: 0.2 }))
            .then(() => {
              state = store.getState();

              assert.deepEqual(state.messages.store, {
                connected: true,
                last: {
                  eventName: 'created',
                  action: 'mutated',
                  record: { id: 0.2, order: 0.2 },
                  source: 0,
                },
                records: [{ id: 0, order: 0 }, { id: 0.2, order: 0.2 }, { id: 1, order: 1 }],
              });
            })
        ))
    ));

    it('patch record remaining in publication', () => (
      messagesRealtime.connect()
        .then(() => (
          messages.patch(0, { order: 0.4 })
            .then(() => {
              state = store.getState();

              assert.deepEqual(state.messages.store, {
                connected: true,
                last: {
                  eventName: 'patched',
                  action: 'mutated',
                  record: { id: 0, order: 0.4 },
                  source: 0,
                },
                records: [{ id: 0, order: 0.4 }, { id: 1, order: 1 }],
              });
            })
        ))
    ));

    it('patch record into publication', () => (
      messagesRealtime.connect()
        .then(() => (
          messages.patch(2, { order: 0.3 })
            .then(() => {
              state = store.getState();

              assert.deepEqual(state.messages.store, {
                connected: true,
                last: {
                  eventName: 'patched',
                  action: 'mutated',
                  record: { id: 2, order: 0.3 },
                  source: 0,
                },
                records: [{ id: 0, order: 0 }, { id: 2, order: 0.3 }, { id: 1, order: 1 }],
              });
            })
        ))
    ));

    it('patch record out of publication', () => (
      messagesRealtime.connect()
        .then(() => (
          messages.patch(0, { order: 10 })
            .then(() => {
              state = store.getState();

              assert.deepEqual(state.messages.store, {
                connected: true,
                last: {
                  eventName: 'patched',
                  action: 'left-pub',
                  record: { id: 0, order: 10 },
                  source: 0,
                },
                records: [{ id: 1, order: 1 }],
              });
            })
        ))
    ));
  });
});
