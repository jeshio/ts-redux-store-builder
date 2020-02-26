const switchAction = <TStore>(fieldName: keyof TStore) => (state: TStore) => ({
  ...state,
  [fieldName]: !state[fieldName],
});

export default switchAction;
