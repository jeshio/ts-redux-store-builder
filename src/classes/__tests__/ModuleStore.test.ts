import ModuleStore from '../ModuleStore';
import IApiAction from '../../interfaces/IApiAction';

describe('ModuleStore', () => {
  const moduleName = 'testModule';
  type DetailsSuccessResponse = {
    data: string;
  };
  type DetailsFailureResponse = {
    error: {
      status: number;
      message: string;
    };
  };

  describe('WITH EMPTY PARAMS', () => {
    const moduleStore = new ModuleStore<{}, {}>(moduleName);

    test('should no have actions', () => {
      expect(moduleStore.actions).toStrictEqual({});
    });

    test('should no have selectors', () => {
      expect(moduleStore.selectors({})).toStrictEqual({});
    });

    test('should return empty state from reducer', () => {
      expect(
        moduleStore.reducer({}, { payload: null, type: 'type' }),
      ).toStrictEqual({});
    });

    test('should has empty initial', () => {
      expect(moduleStore.initialStore).toStrictEqual({});
    });
  });

  describe('WITH STATE AND DEFAULT SELECTORS', () => {
    const initialFields = {
      count: 0,
      loading: false,
    };
    const moduleStore = new ModuleStore<
      typeof initialFields,
      {},
      typeof initialFields
    >(moduleName, {}, initialFields);

    test('should no have actions', () => {
      expect(moduleStore.actions).toStrictEqual({});
    });

    test('should have selectors with not empty state', () => {
      expect(
        moduleStore.selectors({
          [moduleName]: { count: 2, loading: true },
        }),
      ).toStrictEqual({ count: 2, loading: true });
    });

    test('should return empty state from reducer', () => {
      expect(
        moduleStore.reducer(initialFields, { payload: null, type: 'type' }),
      ).toStrictEqual(initialFields);
    });

    test('should has empty initial', () => {
      expect(moduleStore.initialStore).toStrictEqual(initialFields);
    });
  });

  describe('WITH STATE AND CUSTOM SELECTORS', () => {
    const initialFields = {
      count: 0,
      loading: false,
    };
    const moduleStore = new ModuleStore<
      typeof initialFields,
      {},
      typeof initialFields
    >(moduleName, {}, initialFields, {
      count: (store, globalStore) =>
        store.count + globalStore[moduleName].count,
    });
    test('should have default and custom selectors', () => {
      expect(
        moduleStore.selectors({
          [moduleName]: { count: 2, loading: true },
        }),
      ).toStrictEqual({ count: 4, loading: true });
    });
  });

  describe('WITH ACTIONS ONLY', () => {
    const initialFields = {};
    const moduleStore = new ModuleStore<
      typeof initialFields,
      { firstAction: [string, number?]; actionWithoutArgs: [] },
      typeof initialFields
    >(
      moduleName,
      {
        firstAction: state => state,
        actionWithoutArgs: state => state,
      },
      initialFields,
    );

    test('should have actions', () => {
      expect(moduleStore.actions.firstAction('test')).toStrictEqual({
        payload: ['test'],
        type: moduleStore.actions.firstAction.type,
      });
      expect(moduleStore.actions.firstAction('test', 2)).toStrictEqual({
        payload: ['test', 2],
        type: moduleStore.actions.firstAction.type,
      });
      expect(moduleStore.actions.actionWithoutArgs()).toStrictEqual({
        payload: [],
        type: moduleStore.actions.actionWithoutArgs.type,
      });
    });

    test('should no have selectors', () => {
      expect(moduleStore.selectors({})).toStrictEqual({});
    });

    test('should return empty state from reducer', () => {
      expect(
        moduleStore.reducer({}, { payload: null, type: 'type' }),
      ).toStrictEqual({});
    });

    test('should has empty initial', () => {
      expect(moduleStore.initialStore).toStrictEqual({});
    });
  });

  describe('WITH API-ACTIONS', () => {
    const initialFields = {
      details: '',
      id: 0,
    };
    const moduleStore = new ModuleStore<
      typeof initialFields,
      {
        fetchList: IApiAction;
        fetchDetails: IApiAction<
          [number],
          [DetailsSuccessResponse],
          [DetailsFailureResponse]
        >;
      },
      typeof initialFields
    >(
      moduleName,
      {
        fetchList: {
          request: state => state,
          failure: state => state,
          success: state => state,
        },
        fetchDetails: {
          request: (state, action) => ({ ...state, id: action.payload[0] }),
          failure: (state, action) => ({
            ...state,
            details: action.payload[0].error.message,
          }),
          success: (state, action) => ({
            ...state,
            details: action.payload[0].data,
          }),
        },
      },
      initialFields,
    );

    test('should have actions', () => {
      expect(moduleStore.actions.fetchList.request()).toStrictEqual({
        payload: [],
        type: moduleStore.actions.fetchList.request.type,
      });
      expect(moduleStore.actions.fetchDetails.request(2)).toStrictEqual({
        payload: [2],
        type: moduleStore.actions.fetchDetails.request.type,
      });
    });
  });

  describe('WITH ALL', () => {
    type StateType = {
      details: string;
      id: null | number;
    };
    const initialFields: StateType = {
      details: '',
      id: null,
    };
    const moduleStore = new ModuleStore<
      StateType,
      {
        fetchDetails: IApiAction<
          [number],
          [DetailsSuccessResponse],
          [DetailsFailureResponse]
        >;
        resetState: [];
      },
      StateType
    >(
      moduleName,
      {
        fetchDetails: {
          request: (state, action) => ({ ...state, id: action.payload[0] }),
          failure: (state, action) => ({
            ...state,
            details: action.payload[0].error.message,
          }),
          success: (state, action) => ({
            ...state,
            details: action.payload[0].data,
          }),
        },
        resetState: () => initialFields,
      },
      initialFields,
    );

    test('should changes state on actions', () => {
      const { fetchDetails, resetState } = moduleStore.actions;
      const { reducer } = moduleStore;
      const newState = reducer(initialFields, fetchDetails.request(6));

      expect(newState).toStrictEqual({
        ...initialFields,
        id: 6,
      });

      expect(
        reducer(
          newState,
          fetchDetails.success({
            data: 'ok',
          }),
        ),
      ).toStrictEqual({ ...initialFields, id: 6, details: 'ok' });

      expect(
        reducer(
          newState,
          fetchDetails.failure({
            error: {
              message: 'bad',
              status: 401,
            },
          }),
        ),
      ).toStrictEqual({ ...initialFields, id: 6, details: 'bad' });

      expect(reducer(newState, resetState())).toStrictEqual(initialFields);
    });
  });
});
