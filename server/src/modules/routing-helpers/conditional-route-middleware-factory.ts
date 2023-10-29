import { NextFunction, Request, Response } from "express";

/* *
 * NOTICE: When using conditionalRouteMiddlewareFactory:
 *
 * To skip the rest of the middleware functions from a router middleware stack,
 * call next('route') to pass control to the next route. NOTE: next('route')
 * WILL ONLY WORK in middleware functions that were loaded by using
 * the app.METHOD() or router.METHOD() functions !!!
 *
 * Example:
 * router
 *   .get('/', condRoute(isSomething), ...)
 *   .get('/', condRoute(isSomethingElse), ...)
 *   ...
 * */

export function conditionalRouteMiddlewareFactory(
  condFn: (req: Request) => boolean
) {
  return function (req: Request, _res: Response, next: NextFunction): void {
    if (condFn(req)) {
      return void next();
    }
    next("route");
  };
}
