import IAction from '../interfaces/IAction';
import IApiAction from '../interfaces/IApiAction';
import makeReducersByKeys from '../utils/makeReducerByKeys';
import { TReducer } from '../types/TReducer';

const REQUEST_ACTION_NAME = 'request';
const SUCCESS_ACTION_NAME = 'success';
const FAILURE_ACTION_NAME = 'failure';

type WithActionType<Action> = Action & { type: string };

export default class ModuleStore<
  StoreT extends StringIndexes,
  ActionsT extends StringIndexes,
  SelectorsT extends StoreT,
  ApiT = {},
  ActionsWithType = {
    [P in keyof ActionsT]: ActionsT[P] extends IApiAction<any, any, any>
      ? {
          request: WithActionType<ActionsT[P]['request']>;
          success: WithActionType<ActionsT[P]['success']>;
          failure: WithActionType<ActionsT[P]['failure']>;
        }
      : WithActionType<ActionsT[P]>;
  }
> {
  protected moduleName: string;
  protected reducersList: TReducer<StoreT, any>[] = [];
  
  #actions: ActionsWithType = {} as ActionsWithType;
  #selectors: SelectorsT = {} as SelectorsT;
  #initialStore: StoreT = {} as StoreT;
  #api: ApiT = {} as ApiT;

  constructor(
    moduleName: string,
    initialActions: {
      [P in keyof ActionsT]: ActionsT[P] extends IApiAction<any, any, any>
        ? {
            request: TReducer<StoreT, Parameters<ActionsT[P]['request']>>;
            success: TReducer<StoreT, Parameters<ActionsT[P]['success']>>;
            failure: TReducer<StoreT, Parameters<ActionsT[P]['failure']>>;
          }
        : TReducer<StoreT, Parameters<ActionsT[P]>>;
    } = {} as ActionsT,
    initialFields: StoreT = {} as StoreT,
    initialSelectors: {
      [P in keyof Subtract<SelectorsT, keyof StoreT>]: (
        subModuleStore: StoreT,
        globalStore: StringIndexes,
        selectors: SelectorsT,
      ) => SelectorsT[P];
    } &
      {
        [P in keyof StoreT]?: (
          subModuleStore: StoreT,
          globalStore: StringIndexes,
          selectors: SelectorsT,
        ) => SelectorsT[P];
      } = {} as SelectorsT,
  ) {
    this.moduleName = moduleName;
    this.setAction = this.setAction.bind(this);
    this.addStoreField = this.addStoreField.bind(this);
    if (initialActions) {
      Object.keys(initialActions).map(actionName => {
        const action = initialActions[
          actionName
        ] as ActionsT[typeof actionName];

        if (
          typeof action[REQUEST_ACTION_NAME] === 'function' &&
          typeof action[SUCCESS_ACTION_NAME] === 'function' &&
          typeof action[FAILURE_ACTION_NAME] === 'function'
        ) {
          this.setApiAction(actionName, {
            request: action.request,
            success: action.success,
            failure: action.failure,
          });
        } else {
          this.setAction(actionName, action);
        }
      });
    }
    if (initialFields) {
      Object.keys(initialFields).map(<K extends keyof StoreT>(fieldName: K) =>
        this.addStoreField(fieldName, initialFields[fieldName]),
      );
    }
    if (initialSelectors) {
      Object.keys(initialSelectors).map((selectorName: keyof SelectorsT) =>
        this.addSelector(
          selectorName,
          (initialSelectors as SelectorsT)[
            selectorName
          ] as SelectorsT[typeof selectorName],
        ),
      );
    }
  }

  public get actions() {
    return this.#actions;
  }

  public get api() {
    return this.#api;
  }

  public get initialStore() {
    return this.#initialStore;
  }

  public selectors = (store: StoreT | StringIndexes): SelectorsT => {
    return Object.keys(this.#selectors).reduce(
      (base, selectorName: string) => ({
        ...base,
        [selectorName]: this.#selectors[selectorName](
          store[this.moduleName],
          store,
          base as SelectorsT,
        ),
      }),
      {},
    ) as SelectorsT;
  };

  public reducers = (store = this.#initialStore, action: IAction) => {
    return this.reducersList.reduce(
      (currentStore: StoreT, reducer: TReducer<StoreT>) =>
        reducer(currentStore, action),
      store,
    );
  };

  public setAction = <K extends keyof ActionsT>(
    actionName: K,
    reducer: TReducer<StoreT, Parameters<ActionsT[K]>>,
  ) => {
    const modelActionType = this.makeActionType(actionName);
    const action = (
      ...args: Parameters<ActionsT[K]>
    ): IAction<Parameters<ActionsT[K]>> => ({
      payload: args,
      type: modelActionType,
    });
    action.type = modelActionType;
    this.reducersList.push(
      makeReducersByKeys<StoreT, Parameters<ActionsT[K]>>({
        [modelActionType]: reducer,
      }),
    );
    this.#actions = {
      ...this.#actions,
      [actionName]: action,
    };

    return this;
  };

  public setApiAction = <K extends keyof ActionsT>(
    actionName: K,
    reducers: {
      request: TReducer<StoreT, Parameters<ActionsT[K]['request']>>;
      success: TReducer<StoreT, Parameters<ActionsT[K]['success']>>;
      failure: TReducer<StoreT, Parameters<ActionsT[K]['failure']>>;
    },
  ) => {
    const createAction = (name: string, reducer: TReducer<StoreT, any>) => {
      const modelActionType = this.makeActionType(`${actionName}.${name}`);
      const action = (
        ...args: Parameters<ActionsT[K]>
      ): IAction<Parameters<ActionsT[K]>> => ({
        payload: args,
        type: modelActionType,
      });
      action.type = modelActionType;
      this.reducersList.push(
        makeReducersByKeys<StoreT, Parameters<ActionsT[K]>>({
          [modelActionType]: reducer,
        }),
      );
      return action;
    };
    this.#actions = {
      ...this.#actions,
      [actionName]: {
        request: createAction('request', reducers.request),
        success: createAction('success', reducers.success),
        failure: createAction('failure', reducers.failure),
      },
    };

    return this;
  };

  public addStoreField = <K extends keyof StoreT>(
    name: K,
    initialValue: StoreT[K],
  ) => {
    this.#initialStore = { ...this.#initialStore, [name]: initialValue };
    this.addSelector(
      name as keyof SelectorsT,
      (store: StoreT) => store[name] as SelectorsT[K],
    );
    return this;
  };

  public addSelector = <K extends keyof SelectorsT>(
    name: K,
    handler: (store: StoreT) => SelectorsT[K],
  ) => {
    this.#selectors = {
      ...this.#selectors,
      [name]: handler,
    };

    return this;
  };

  public setApi = (api: ApiT) => {
    this.#api = api;
  };

  protected makeActionType(actionName: keyof ActionsT) {
    return `${this.moduleName}/${actionName}`;
  }
}
