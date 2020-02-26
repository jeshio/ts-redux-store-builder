import CIAction from '../interfaces/IAction';

export type TReducer<StoreT = StringIndexes, PayloadT = {}> = (
  store: StoreT,
  action: CIAction<PayloadT>,
) => StoreT;
