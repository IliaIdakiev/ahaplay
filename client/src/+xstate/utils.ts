export function props<D extends object>() {
  return {} as unknown as D;
}

export function createAction<T extends string, P extends object | void>(
  type: T,
  payload?: P
) {
  function actionCreator(payload: P) {
    return {
      type,
      payload,
    };
  }
  actionCreator.type = type;
  return actionCreator;
}
