import { merge } from 'timm';

export default function reducerForServiceMethod(actionType, ifLoading, isFind, opts) {
  return {
    // promise has been started
    [`${actionType}_${opts.PENDING}`]: state => (
      merge(state, {
        [opts.isError]: null,
        [opts.isLoading]: ifLoading,
        [opts.isSaving]: !ifLoading,
        [opts.isFinished]: false,
        [opts.data]: null,
        [opts.queryResult]: state[opts.queryResult] || null, // leave previous to reduce redraw
      })
    ),
    // promise resolved
    [`${actionType}_${opts.FULFILLED}`]: (state, action) => (
      merge(state, {
        [opts.isError]: null,
        [opts.isLoading]: false,
        [opts.isSaving]: false,
        [opts.isFinished]: true,
        [opts.data]: !isFind ? action.payload : null,
        [opts.queryResult]: isFind ? action.payload : (state[opts.queryResult] || null),
      })
    ),
    // promise rejected
    [`${actionType}_${opts.REJECTED}`]: (state, action) => (
      merge(state, {
        [opts.isError]: action.payload,
        [opts.isLoading]: false,
        [opts.isSaving]: false,
        [opts.isFinished]: true,
        [opts.data]: null,
        [opts.queryResult]: isFind ? null : (state[opts.queryResult] || null),
      })
    ),
  };
}
