/** @jest-environment node */
type CheckRateLimit = typeof import("./rateLimit").checkRateLimit;

let checkRateLimit: CheckRateLimit;

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  // The hit map is module state, so reload for a clean slate per test.
  jest.resetModules();
  ({ checkRateLimit } = await import("./rateLimit"));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows a single unit-cost request", () => {
    expect(checkRateLimit("a")).toEqual({ allowed: true });
  });

  it("allows 3 requests at cost 2 and rejects the 4th", () => {
    expect(checkRateLimit("a", 2).allowed).toBe(true);
    expect(checkRateLimit("a", 2).allowed).toBe(true);
    expect(checkRateLimit("a", 2).allowed).toBe(true);
    expect(checkRateLimit("a", 2).allowed).toBe(false);
  });

  it("allows exactly 6 units at cost 1 and rejects the 7th", () => {
    for (let i = 0; i < 6; i++) expect(checkRateLimit("a").allowed).toBe(true);
    expect(checkRateLimit("a").allowed).toBe(false);
  });

  it("does not consume units when a request is rejected", () => {
    expect(checkRateLimit("a", 6).allowed).toBe(true);
    jest.advanceTimersByTime(30_000);
    // If this rejected call recorded its units, they would still be inside
    // the window after the original 6 expire.
    expect(checkRateLimit("a", 6).allowed).toBe(false);
    jest.advanceTimersByTime(30_000);
    expect(checkRateLimit("a", 6).allowed).toBe(true);
  });

  it("frees capacity once the 60 second window passes", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("a", 2);
    expect(checkRateLimit("a", 2).allowed).toBe(false);

    jest.advanceTimersByTime(59_999);
    expect(checkRateLimit("a", 2).allowed).toBe(false);

    jest.advanceTimersByTime(1);
    expect(checkRateLimit("a", 2).allowed).toBe(true);
  });

  it("slides the window instead of resetting all at once", () => {
    checkRateLimit("a", 2);
    jest.advanceTimersByTime(30_000);
    checkRateLimit("a", 2);
    checkRateLimit("a", 2);
    expect(checkRateLimit("a", 2).allowed).toBe(false);

    jest.advanceTimersByTime(30_000);
    // Only the first request's 2 units have expired.
    expect(checkRateLimit("a", 2).allowed).toBe(true);
    expect(checkRateLimit("a", 2).allowed).toBe(false);
  });

  it("tracks each key separately", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("1.1.1.1", 2);
    expect(checkRateLimit("1.1.1.1", 2).allowed).toBe(false);
    expect(checkRateLimit("2.2.2.2", 2).allowed).toBe(true);
  });

  it("rejects a cost larger than the limit even for a fresh key", () => {
    expect(checkRateLimit("a", 7).allowed).toBe(false);
    expect(checkRateLimit("a", 1).allowed).toBe(true);
  });

  it("allows a cost equal to the whole limit once", () => {
    expect(checkRateLimit("a", 6).allowed).toBe(true);
    expect(checkRateLimit("a", 1).allowed).toBe(false);
  });
});
