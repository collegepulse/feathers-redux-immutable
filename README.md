## feathers-redux-immutable

An [immutable][1], [redux][2] data store for FeathersJS [services][3].

## Usage

```js
/* todo */
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
