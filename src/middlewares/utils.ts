import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

/**
 * Wrap all route handlers of a Router to automatically forward rejected promises
 * or thrown errors to Express error-handling middleware.
 *
 * @param router - The Express Router whose route handlers should be wrapped.
 * @returns A new Router with all async handlers wrapped.
 */
export function withErrorHandling(router: Router): Router {
  const wrappedRouter = Router();

  // Iterate over all routes registered on the router
  router.stack.forEach((layer: any) => {
    if (layer.route && layer.route.stack) {
      layer.route.stack.forEach((routeLayer: any) => {
        const originalHandler: RequestHandler = routeLayer.handle;

        // Wrap the handler in a safe async function
        routeLayer.handle = async (
          req: Request,
          res: Response,
          next: NextFunction
        ) => {
          try {
            await originalHandler(req, res, next);
          } catch (err) {
            next(err);
          }
        };
      });
    }
  });

  // Mount the original router onto the wrapped router
  wrappedRouter.use(router);

  return wrappedRouter;
}
