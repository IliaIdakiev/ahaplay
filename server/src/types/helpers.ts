export type MakeKeysRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type MakeAllKeysRequired<T> = {
  [K in keyof T]-?: T[K];
};
