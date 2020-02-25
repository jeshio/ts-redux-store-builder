type StoreType = {
  name: string;
};

export default function getTypeName(a: StoreType): StoreType {
  return {
    name: a.name + 'test',
  };
}
