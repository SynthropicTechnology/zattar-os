import '@testing-library/jest-dom';

// jest-environment-jsdom replaces the global scope and drops several Web API
// globals that Node >= 18 provides natively.  Next.js (e.g. NextRequest) and
// many test utilities rely on them, so we re-expose them here.

// TextEncoder/TextDecoder are needed by undici and other modules
if (typeof globalThis.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextEncoder, TextDecoder } = require('util');
  Object.assign(globalThis, { TextEncoder, TextDecoder });
}

// ReadableStream / WritableStream (used by fetch internals)
if (typeof globalThis.ReadableStream === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const webStreams = require('stream/web');
  Object.assign(globalThis, {
    ReadableStream: webStreams.ReadableStream,
    WritableStream: webStreams.WritableStream,
    TransformStream: webStreams.TransformStream,
  });
}

// Request, Response, Headers, fetch — pull from undici (bundled with Node)
if (typeof globalThis.Request === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const undici = require('undici');
  Object.assign(globalThis, {
    Request: undici.Request,
    Response: undici.Response,
    Headers: undici.Headers,
    fetch: undici.fetch,
  });
}
