import { vi } from "vitest";

// Mock server-only to prevent it from throwing during tests
vi.mock("server-only", () => ({}));
