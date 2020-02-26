export default interface IAction<PayloadT = any> {
  type: string;
  payload: PayloadT;
}
