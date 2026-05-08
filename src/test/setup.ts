import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './server';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test (important for test isolation)
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());
