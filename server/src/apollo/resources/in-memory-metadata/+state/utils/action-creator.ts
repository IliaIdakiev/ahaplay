export const REGISTERED_ACTION_TYPES: { [actionType: string]: number } = {};

export function resetRegisteredActionTypes() {
  for (const key of Object.keys(REGISTERED_ACTION_TYPES)) {
    delete REGISTERED_ACTION_TYPES[key];
  }
}

export type Primitive =
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

export interface ActionCreatorProps<T> {
  _as: "props";
  _p: T;
}

export const arraysAreNotAllowedInProps =
  "action creator props cannot be an array";
type ArraysAreNotAllowedInProps = typeof arraysAreNotAllowedInProps;
export const typePropertyIsNotAllowedInProps =
  "action creator props cannot have a property named `type`";
type TypePropertyIsNotAllowedInProps = typeof typePropertyIsNotAllowedInProps;
export const emptyObjectsAreNotAllowedInProps =
  "action creator props cannot be an empty object";
type EmptyObjectsAreNotAllowedInProps = typeof emptyObjectsAreNotAllowedInProps;
export const primitivesAreNotAllowedInProps =
  "action creator props cannot be a primitive value";
type PrimitivesAreNotAllowedInProps = typeof primitivesAreNotAllowedInProps;
export const arraysAreNotAllowedMsg = "action creator cannot return an array";
type ArraysAreNotAllowed = typeof arraysAreNotAllowedMsg;
export const typePropertyIsNotAllowedMsg =
  "action creator cannot return an object with a property named `type`";
type TypePropertyIsNotAllowed = typeof typePropertyIsNotAllowedMsg;
export const emptyObjectsAreNotAllowedMsg =
  "action creator cannot return an empty object";
type EmptyObjectsAreNotAllowed = typeof emptyObjectsAreNotAllowedMsg;

export type NotAllowedInPropsCheck<T> = T extends object
  ? T extends any[]
    ? ArraysAreNotAllowedInProps
    : T extends { type: any }
    ? TypePropertyIsNotAllowedInProps
    : keyof T extends never
    ? EmptyObjectsAreNotAllowedInProps
    : unknown
  : T extends Primitive
  ? PrimitivesAreNotAllowedInProps
  : never;

export interface Action {
  type: string;
}

export type ActionType<A> = A extends ActionCreator<infer T, infer C>
  ? ReturnType<C> & { type: T }
  : never;

export declare interface TypedAction<T extends string> extends Action {
  readonly type: T;
}

export type Creator<
  P extends any[] = any[],
  R extends object = object
> = FunctionWithParametersType<P, R>;

export type ActionCreator<
  T extends string = string,
  C extends Creator = Creator
> = C & TypedAction<T>;

export type FunctionWithParametersType<P extends unknown[], R = void> = (
  ...args: P
) => R;

export interface ActionCreatorProps<T> {
  _as: "props";
  _p: T;
}

export type NotAllowedCheck<T extends object> = T extends any[]
  ? ArraysAreNotAllowed
  : T extends { type: any }
  ? TypePropertyIsNotAllowed
  : keyof T extends never
  ? EmptyObjectsAreNotAllowed
  : unknown;

export function props<
  P extends SafeProps,
  SafeProps = NotAllowedInPropsCheck<P>
>(): ActionCreatorProps<P> {
  return { _as: "props", _p: undefined! };
}

function defineType<T extends string>(
  type: T,
  creator: Creator
): ActionCreator<T> {
  return Object.defineProperty(creator, "type", {
    value: type,
    writable: false,
  }) as ActionCreator<T>;
}

export function createAction<T extends string>(
  type: T
): ActionCreator<T, () => TypedAction<T>>;
export function createAction<T extends string, P extends object>(
  type: T,
  config: ActionCreatorProps<P> & NotAllowedCheck<P>
): ActionCreator<T, (props: P & NotAllowedCheck<P>) => P & TypedAction<T>>;
export function createAction<
  T extends string,
  P extends any[],
  R extends object
>(
  type: T,
  creator: Creator<P, R & NotAllowedCheck<R>>
): FunctionWithParametersType<P, R & TypedAction<T>> & TypedAction<T>;
export function createAction<T extends string, C extends Creator>(
  type: T,
  config?: { _as: "props" } | C
): ActionCreator<T> {
  REGISTERED_ACTION_TYPES[type] = (REGISTERED_ACTION_TYPES[type] || 0) + 1;

  if (typeof config === "function") {
    return defineType(type, (...args: any[]) => ({
      ...config(...args),
      type,
    }));
  }
  const as = config ? config._as : "empty";
  switch (as) {
    case "empty":
      return defineType(type, () => ({ type }));
    case "props":
      return defineType(type, (props: object) => ({
        ...props,
        type,
      }));
    default:
      throw new Error("Unexpected config.");
  }
}
