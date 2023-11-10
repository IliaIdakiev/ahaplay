export type MakeKeysRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type MakeAllKeysRequired<T> = {
  [K in keyof T]-?: T[K];
};
export type Unpack<T> = T extends Array<infer I>
  ? I
  : T extends (...args: any) => infer R
  ? R
  : T extends Promise<infer P>
  ? P
  : T;

export type RemoveUnion<T, P> = T extends P ? never : T;
