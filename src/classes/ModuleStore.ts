import IAction from '../interfaces/IAction';
import IApiAction from '../interfaces/IApiAction';
import makeReducersByKeys from '../utils/makeReducerByKeys';
import { TReducer } from '../types/TReducer';

const REQUEST_ACTION_NAME = 'request';
const SUCCESS_ACTION_NAME = 'success';
const FAILURE_ACTION_NAME = 'failure';

type ActionWithType<Action> = Action & {type: string}

export default class ModuleStore<
  StoreT extends StringIndexes,
  ActionsT extends {
  [index: string]: any[] | IApiAction;
  },
  SelectorsT extends StoreT = StoreT,
  ActionsWithType = {
    [P in keyof ActionsT]: 
      ActionsT[P] extends IApiAction
      ?  {
          request: ActionWithType<ActionsT[P]['request']>;
          success: ActionWithType<ActionsT[P]['success']>;
          failure: ActionWithType<ActionsT[P]['failure']>;
      } : ActionsT[P] extends any[] ? ActionWithType<(...args: ActionsT[P]) => IAction<ActionsT[P]>> : never;
  }> {
  protected reducersList: TReducer<StoreT, any>[] = [];
  
  #actions: ActionsWithType = {} as ActionsWithType;
  #selectors: SelectorsT = {} as SelectorsT;
  #initialStore: StoreT = {} as StoreT;

  constructor(
    protected readonly moduleName: string,
    initialActions: {
      [P in keyof ActionsT]: ActionsT[P] extends IApiAction<any, any, any>
        ? {
            request: TReducer<StoreT, Parameters<ActionsT[P]['request']>>;
            success: TReducer<StoreT, Parameters<ActionsT[P]['success']>>;
            failure: TReducer<StoreT, Parameters<ActionsT[P]['failure']>>;
          }
        : TReducer<StoreT, ActionsT[P]>;
    } = {} as any,
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
    this.setAction = this.setAction.bind(this);
    this.addStoreField = this.addStoreField.bind(this);
    if (initialActions) {
      Object.keys(initialActions).map((actionName: keyof typeof initialActions) => {
        const action = initialActions[
          actionName
        ] as any; // TODO: I cant to handle this type

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

  public get initialStore() {
    return this.#initialStore;
  }

  public selectors = (store: {[key: string]: any | StoreT}): SelectorsT => {
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

  public reducer = (store = this.#initialStore, action: IAction) => {
    return this.reducersList.reduce(
      (currentStore: StoreT, reducer: TReducer<StoreT>) =>
        reducer(currentStore, action),
      store,
    );
  };

  public setAction = <K extends keyof ActionsT>(
    actionName: K,
    reducer: TReducer<StoreT, ActionsT[K]>,
  ) => {
    const modelActionType = this.makeActionType(actionName);
    const action = (
      ...args: ActionsT[K] extends any[] ? ActionsT[K] : []
    ): IAction<ActionsT[K] extends any[] ? ActionsT[K] : []> => ({
      payload: args,
      type: modelActionType,
    });
    action.type = modelActionType; // adds a type prop to every action
    this.reducersList.push(
      makeReducersByKeys<StoreT, ActionsT[K]>({
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
      request: TReducer<StoreT,ActionsT[K] extends IApiAction ? ActionsT[K]['request'] : []>;
      success: TReducer<StoreT,ActionsT[K] extends IApiAction ? ActionsT[K]['success'] : []>;
      failure: TReducer<StoreT,ActionsT[K] extends IApiAction ? ActionsT[K]['failure'] : []>;
    },
  ) => {
    const createAction = (name: keyof IApiAction, reducer: TReducer<StoreT, any>) => {
      type ApiActionArgsType = ActionsT[K] extends IApiAction ? Parameters<ActionsT[K][typeof name]> : []
      const modelActionType = this.makeActionType(`${actionName}.${name}`);
      const action = (
        ...args: ApiActionArgsType
      ): IAction<ApiActionArgsType> => ({
        payload: args,
        type: modelActionType,
      });
      action.type = modelActionType;
      this.reducersList.push(
        makeReducersByKeys<StoreT, ActionsT[K]>({
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

  protected makeActionType(actionName: keyof ActionsT) {
    return `${this.moduleName}/${actionName}`;
  }
}
