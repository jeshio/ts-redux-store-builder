[![npm](https://img.shields.io/npm/v/ts-redux-store-builder)](https://www.npmjs.com/package/ts-redux-store-builder)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/ts-redux-store-builder)](https://www.npmjs.com/package/ts-redux-store-builder)
[![Travis (.org)](https://img.shields.io/travis/jeshio/ts-redux-store-builder)](https://travis-ci.org/jeshio/ts-redux-store-builder)
[![Codecov](https://img.shields.io/codecov/c/github/jeshio/ts-redux-store-builder)](https://codecov.io/gh/jeshio/ts-redux-store-builder)

## Ts-redux-store-builder

Create redux store with types like this:

```typescript
const moduleStore = new ModuleStore<IState, IActions>(
  moduleName, // it is using in action types
  actionHandlers, // generates reducer from your actions (includes API actions!)
  initialState, // your any object structure (with IState type)
  customSelectors, // you can wrap default selectors
);

// your module store with types!
const { actions, reducer, selectors } = moduleStore;
```

## Example

See [this](examples/storeWithAPIActions.ts) example with details. Run it:

```bash
yarn build
node dist/examples/storeWithAPIActions.js
```

## Publish

```bash
yarn run major/minor/patch
yarn publish
```
