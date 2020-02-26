import IAction from '../interfaces/IAction';

/**
 * Устанавливает простые редьюсеры по-умолчанию
 */
export default function getApiReducer<TStore extends StringIndexes = {}>(
  fieldName: string,
) {
  return {
    request: (state: TStore) => ({
      ...state,
      [fieldName]: {
        loading: true,
      },
    }),

    success: (state: TStore, action: IAction) => ({
      ...state,
      [fieldName]: {
        loading: false,
        data: action.payload[0],
      },
    }),

    failure: (state: TStore) => ({
      ...state,
      [fieldName]: {
        loading: false,
      },
    }),
  };
}
