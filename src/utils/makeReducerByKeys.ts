import IAction from '../interfaces/IAction';
import { TReducer } from '../types/TReducer';

export default function makeReducersByKeys<
  StoreT = {},
  PayloadT = {}
>(reducerByKeys: {
  [s: string]: TReducer<StoreT, any>;
}): TReducer<StoreT, PayloadT> {
  const keys = Object.keys(reducerByKeys);

  return (store: StoreT, action: IAction<PayloadT>) => {
    const type = action.type;
    if (keys.indexOf(type) > -1) {
      return reducerByKeys[type](store, action);
    }

    return store;
  };
}
