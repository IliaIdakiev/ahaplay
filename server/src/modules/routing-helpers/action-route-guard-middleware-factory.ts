import { conditionalRouteMiddlewareFactory } from "./conditional-route-middleware-factory";

export function actionRouteGuardMiddlewareFactory(actionName: string) {
  return conditionalRouteMiddlewareFactory(
    (req) => req.query.action === actionName
  );
}
