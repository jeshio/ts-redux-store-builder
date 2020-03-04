import makeReducersByKeys from '../makeReducerByKeys';

describe('makeReducerByKeys', () => {
  test('should return empty reducer by default', () => {
    const state = { data: 'text', n: 2 };
    const reducer = makeReducersByKeys({});
    expect(reducer(state, { type: 'any', payload: null })).toStrictEqual(state);
  });

  test('should creates reducer with actions', () => {
    const initialState = { data: 'text', n: 2 };
    const testActionType = 'action.test';
    const secondTestActionType = 'action/test2';
    const reducer = makeReducersByKeys<typeof initialState>({
      [testActionType]: state => ({ ...state, data: 'zero' }),
      [secondTestActionType]: (state, action) => ({
        ...state,
        n: state.n + parseInt(action.payload, 10),
      }),
    });

    expect(
      reducer(initialState, { type: testActionType, payload: null }),
    ).toStrictEqual({ ...initialState, data: 'zero' });
    expect(
      reducer(initialState, { type: secondTestActionType, payload: 3 }),
    ).toStrictEqual({ ...initialState, n: 5 });
  });
});
