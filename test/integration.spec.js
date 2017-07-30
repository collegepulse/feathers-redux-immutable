/* eslint-env mocha */

import assert from 'assert';
import feathers from 'feathers';

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
    const promise = store.dispatch(reduxifiedServices.messages.create({ message: 'hello' }));

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
            message: 'hello',
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
              queryResult: [{ id: 0, message: 'message-0' }, { id: 1, message: 'message-1' }],
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
                message: 'message-3',
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
