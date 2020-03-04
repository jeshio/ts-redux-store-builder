import { ModuleStore, IApiAction } from '../src';
import IAction from '@src/src/interfaces/IAction';

// CREATING STORE
/* tslint:disable */
interface IFetchErrorResponse {
  status: number;
  message: string;
}

interface IFetchListResponse {
  data: string[];
}

interface IFetchItemResponse {
  data: string;
}

interface IState {
  list: string[];
  currentItem: null | string;
  errorMsg: null | string;
}

type IActions = {
  fetchList: IApiAction<[], [IFetchListResponse], [IFetchErrorResponse]>;
  fetchItem: IApiAction<[number], [IFetchItemResponse], [IFetchErrorResponse]>;
  reset: [];
};

const moduleName = 'TEST_MODULE_NAME';
const initialState: IState = {
  list: [],
  currentItem: null,
  errorMsg: null,
};

const moduleStore = new ModuleStore<IState, IActions>(
  moduleName,
  {
    fetchList: {
      request: state => state,
      success: (state, action) => ({ ...state, list: action.payload[0].data }),
      failure: (state, action) => ({
        ...state,
        errorMsg: action.payload[0].message,
      }),
    },
    fetchItem: {
      request: state => state,
      success: (state, action) => ({ ...state, item: action.payload[0].data }),
      failure: (state, action) => ({
        ...state,
        errorMsg: action.payload[0].message,
      }),
    },
    reset: () => initialState,
  },
  initialState,
  {
    // custom selectors
    errorMsg: (state, store) =>
      state.errorMsg // also `store[moduleName].errorMsg`
        ? `${state.errorMsg} is error`
        : null,
  },
);

// STORE USING
const dispatch = (action: IAction) => console.log(action);

dispatch(moduleStore.actions.fetchList.request());
// { payload: [], type: 'TEST_MODULE_NAME/fetchList.request' }

dispatch(
  moduleStore.actions.fetchList.success({
    data: ['test', 'best'],
  }),
);
// { payload: [ { data: ['test', 'best'] } ], type: 'TEST_MODULE_NAME/fetchList.success' }

dispatch(
  moduleStore.actions.fetchList.failure({
    message: 'Incorrect',
    status: 499,
  }),
);
// { payload: [ { message: 'Incorrect', status: 499 } ], type: 'TEST_MODULE_NAME/fetchList.failure' }

dispatch(moduleStore.actions.fetchItem.request(3));
// { payload: [ 3 ], type: 'TEST_MODULE_NAME/fetchItem.request' }

dispatch(
  moduleStore.actions.fetchItem.success({
    data: 'test',
  }),
);
// { payload: [ { data: 'test' } ], type: 'TEST_MODULE_NAME/fetchItem.success' }

dispatch(
  moduleStore.actions.fetchItem.failure({
    message: 'Incorrect',
    status: 499,
  }),
);
// { payload: [ { message: 'Incorrect', status: 499 } ], type: 'TEST_MODULE_NAME/fetchItem.failure' }

dispatch(moduleStore.actions.reset());
// { payload: [], type: 'TEST_MODULE_NAME/reset' }

console.log(
  moduleStore.selectors({
    [moduleName]: { ...initialState, errorMsg: 'bad auth' },
  }),
);
// { list: [], currentItem: null, errorMsg: 'bad auth is error' }

console.log(
  moduleStore.reducer(
    initialState,
    moduleStore.actions.fetchList.success({
      data: ['test'],
    }),
  ),
);
// { list: ['test'], currentItem: null, errorMsg: null }

const { actions, reducer, selectors } = moduleStore;
