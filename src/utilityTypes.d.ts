type Subtract<T, K> = Pick<T, Exclude<keyof T, K>>;

interface StringIndexes {
  [index: string]: any;
}
