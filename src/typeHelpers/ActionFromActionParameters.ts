import IAction from '../interfaces/IAction';

export type ActionsFromActionsParameters<ActionsParametersT extends any> = {
  [P in keyof ActionsParametersT]: (
    ...args: ActionsParametersT[P]
  ) => IAction<ActionsParametersT[P]>;
};
