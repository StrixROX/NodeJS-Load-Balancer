import { ZodError } from "zod";

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
function errorBoundary<T extends Function>(fn: T): T {
  // @ts-expect-error: args is intentionally left typeless
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(error)
      }
    }
  };
}

export default errorBoundary;
