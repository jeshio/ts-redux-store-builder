import IAction from './IAction';

export default interface IApiAction<
  Parameters extends any[] = any[],
  SuccessParameters extends any[] = any[],
  FailureParameters extends any[] = any[]
> {
  request: (...args: Parameters) => IAction<Parameters>;
  success: (...args: SuccessParameters) => IAction<SuccessParameters>;
  failure: (...args: FailureParameters) => IAction<FailureParameters>;
}
