import ModuleStore from '../ModuleStore';

describe('ModuleStore', () => {
  describe('empty', () => {
    const moduleName = 'testModule';
    const moduleStore = new ModuleStore<{}, {}, {}>(moduleName);

    test('should no have actions', () => {
      expect(moduleStore.actions).toStrictEqual({});
    });

    test('should no have selectors', () => {
      expect(moduleStore.selectors({})).toStrictEqual({});
    });

    test('reducer should return empty state', () => {
      expect(
        moduleStore.reducers({}, { payload: null, type: 'type' }),
      ).toStrictEqual({});
    });

    test('initial should be empty', () => {
      expect(moduleStore.initialStore).toStrictEqual({});
    });
  });
});
