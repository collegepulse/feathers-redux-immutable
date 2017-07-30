import memory from 'feathers-memory';

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function makeDataItem(id) {
  return {
    id,
    order: id,
  };
}

export function makeMessageService() {
  this.use('/messages', memory({}));
}
