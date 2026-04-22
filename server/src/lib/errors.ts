// Typed error with status + machine code. The error middleware renders it as the standard JSON shape.
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'HttpError';
  }
}

export const badRequest = (code: string, message: string) => new HttpError(400, code, message);
export const unauthorized = (code = 'UNAUTHORIZED', message = 'Authentication required') =>
  new HttpError(401, code, message);
export const forbidden = (code = 'FORBIDDEN', message = 'Access denied') =>
  new HttpError(403, code, message);
export const notFound = (code = 'NOT_FOUND', message = 'Resource not found') =>
  new HttpError(404, code, message);
export const conflict = (code: string, message: string) => new HttpError(409, code, message);
export const upstream = (code = 'UPSTREAM_ERROR', message = 'Upstream service unavailable') =>
  new HttpError(502, code, message);
