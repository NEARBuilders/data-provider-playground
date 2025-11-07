import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";
import { handlers } from "./mocks/handlers";

// Setup MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: "bypass" // Bypass unhandled requests instead of warning
  });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});
