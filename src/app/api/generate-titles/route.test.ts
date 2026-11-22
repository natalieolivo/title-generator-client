/** @jest-environment node */
import { NextRequest } from "next/server";
import {
  generateTitles,
  scoreTitles,
  type SeoCriterionScores,
} from "@natalieolivo/title-generator";
import { POST } from "./route";

jest.mock("@natalieolivo/title-generator", () => ({
  generateTitles: jest.fn(),
  scoreTitles: jest.fn(),
}));
jest.mock("@/lib/rateLimit", () => ({ checkRateLimit: jest.fn() }));

import { checkRateLimit } from "@/lib/rateLimit";

const mockGenerate = jest.mocked(generateTitles);
const mockScore = jest.mocked(scoreTitles);
const mockLimit = jest.mocked(checkRateLimit);

function makeRequest(
  body: unknown,
  init: { ip?: string; signal?: AbortSignal; raw?: string } = {},
) {
  return new NextRequest("http://localhost/api/generate-titles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init.ip ? { "x-forwarded-for": init.ip } : {}),
    },
    body: init.raw ?? JSON.stringify(body),
    signal: init.signal,
  });
}

const scored = (titles: string[]) =>
  titles.map((title, i) => ({
    title,
    total: 90 - i * 10,
    rank: i + 1,
    rationale: `why ${title}`,
    scores: { internal: 1 } as unknown as SeoCriterionScores,
  }));

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.resetAllMocks();
  delete process.env.ANTHROPIC_API_KEY;
  const unmocked = (name: string) => () => {
    throw new Error(`${name} called without a test-specific mock`);
  };
  mockGenerate.mockImplementation(unmocked("generateTitles"));
  mockScore.mockImplementation(unmocked("scoreTitles"));
  mockLimit.mockReturnValue({ allowed: true });
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  errorSpy.mockRestore();
});

describe("POST /api/generate-titles validation", () => {
  it.each([
    ["missing subject", {}, /subject/],
    ["non-string subject", { subject: 5 }, /subject/],
    ["blank subject", { subject: "   " }, /subject/],
    ["subject over 200 chars", { subject: "a".repeat(201) }, /200/],
    ["non-numeric count", { subject: "x", count: "3" }, /count/],
    ["fractional count", { subject: "x", count: 2.5 }, /count/],
    ["zero count", { subject: "x", count: 0 }, /count/],
    ["negative count", { subject: "x", count: -1 }, /count/],
    ["count over 6", { subject: "x", count: 7 }, /6 or fewer/],
    ["non-string tone", { subject: "x", tone: 3 }, /tone/],
  ])("returns 400 for %s", async (_name, body, message) => {
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(message);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed JSON body", async () => {
    const res = await POST(makeRequest(null, { raw: "{not json" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid JSON body.");
  });

  it("accepts a subject of exactly 200 chars and count of 6", async () => {
    mockGenerate.mockResolvedValue(["t"]);
    mockScore.mockResolvedValue(scored(["t"]));
    const res = await POST(makeRequest({ subject: "a".repeat(200), count: 6 }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/generate-titles rate limiting", () => {
  it("returns 429 and never calls the generator when limited", async () => {
    mockLimit.mockReturnValue({ allowed: false });
    const res = await POST(makeRequest({ subject: "x" }));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/too many requests/i);
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(mockScore).not.toHaveBeenCalled();
  });

  it("charges 2 units to the first x-forwarded-for address", async () => {
    mockGenerate.mockResolvedValue(["t"]);
    mockScore.mockResolvedValue(scored(["t"]));
    await POST(makeRequest({ subject: "x" }, { ip: "9.9.9.9, 10.0.0.1" }));
    expect(mockLimit).toHaveBeenCalledWith("9.9.9.9", 2);
  });

  it("falls back to a shared key when there is no forwarded address", async () => {
    mockGenerate.mockResolvedValue(["t"]);
    mockScore.mockResolvedValue(scored(["t"]));
    await POST(makeRequest({ subject: "x" }));
    expect(mockLimit).toHaveBeenCalledWith("unknown", 2);
  });

  it("rate limits before validating the body", async () => {
    mockLimit.mockReturnValue({ allowed: false });
    const res = await POST(makeRequest(null, { raw: "{bad" }));
    expect(res.status).toBe(429);
  });
});

describe("POST /api/generate-titles success", () => {
  it("returns titles merged with trimmed scores", async () => {
    mockGenerate.mockResolvedValue(["A", "B"]);
    mockScore.mockResolvedValue(scored(["A", "B"]));

    const res = await POST(makeRequest({ subject: "apps", count: 2, tone: "fun" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      titles: [
        { title: "A", score: { total: 90, rank: 1, rationale: "why A" } },
        { title: "B", score: { total: 80, rank: 2, rationale: "why B" } },
      ],
    });
    expect(mockGenerate).toHaveBeenCalledWith({ subject: "apps", count: 2, tone: "fun" });
    expect(mockScore).toHaveBeenCalledWith({ subject: "apps", titles: ["A", "B"] });
  });

  it("matches scores to titles by index, not by rank order", async () => {
    mockGenerate.mockResolvedValue(["A", "B"]);
    mockScore.mockResolvedValue([
      { title: "A", total: 60, rank: 2, rationale: "why A", scores: {} as unknown as SeoCriterionScores },
      { title: "B", total: 90, rank: 1, rationale: "why B", scores: {} as unknown as SeoCriterionScores },
    ]);

    const body = await (await POST(makeRequest({ subject: "x" }))).json();

    expect(body.titles).toEqual([
      { title: "A", score: { total: 60, rank: 2, rationale: "why A" } },
      { title: "B", score: { total: 90, rank: 1, rationale: "why B" } },
    ]);
  });

  it("omits count and tone from the generator call when not provided", async () => {
    mockGenerate.mockResolvedValue(["A"]);
    mockScore.mockResolvedValue(scored(["A"]));
    await POST(makeRequest({ subject: "apps" }));
    expect(mockGenerate).toHaveBeenCalledWith({ subject: "apps" });
  });

  it("returns titles without a score for entries scoring did not cover", async () => {
    mockGenerate.mockResolvedValue(["A", "B"]);
    mockScore.mockResolvedValue(scored(["A"]));
    const body = await (await POST(makeRequest({ subject: "x" }))).json();
    expect(body.titles[0].score).toBeDefined();
    expect(body.titles[1]).toEqual({ title: "B" });
  });
});

describe("POST /api/generate-titles scoring degradation", () => {
  it("returns unscored titles when scoring rejects", async () => {
    mockGenerate.mockResolvedValue(["A", "B"]);
    mockScore.mockRejectedValue(new Error("boom"));

    const res = await POST(makeRequest({ subject: "x" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ titles: [{ title: "A" }, { title: "B" }] });
  });

  it("returns unscored titles when scoring never resolves within 20s", async () => {
    jest.useFakeTimers();
    mockGenerate.mockResolvedValue(["A"]);
    mockScore.mockReturnValue(new Promise(() => {}));

    const pending = POST(makeRequest({ subject: "x" }));
    await jest.advanceTimersByTimeAsync(19_999);
    let settled = false;
    pending.then(() => (settled = true));
    await jest.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    const res = await pending;
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ titles: [{ title: "A" }] });
  });

  it("clears the timeout when scoring finishes in time", async () => {
    jest.useFakeTimers();
    mockGenerate.mockResolvedValue(["A"]);
    mockScore.mockResolvedValue(scored(["A"]));
    await POST(makeRequest({ subject: "x" }));
    expect(jest.getTimerCount()).toBe(0);
  });

  it("skips scoring when the client already disconnected", async () => {
    mockGenerate.mockResolvedValue(["A"]);
    const controller = new AbortController();
    controller.abort();

    const res = await POST(makeRequest({ subject: "x" }, { signal: controller.signal }));

    expect(res.status).toBe(200);
    expect(mockScore).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({ titles: [{ title: "A" }] });
  });

  it("returns unscored titles when scoring rejects with a non-Error", async () => {
    mockGenerate.mockResolvedValue(["A"]);
    mockScore.mockRejectedValue("nope");

    const res = await POST(makeRequest({ subject: "x" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ titles: [{ title: "A" }] });
    expect(errorSpy).toHaveBeenCalledWith("scoreTitles failed:", "Unknown error");
  });
});

describe("POST /api/generate-titles generator errors", () => {
  it("returns 500 with a generic message when the API key is missing", async () => {
    mockGenerate.mockRejectedValue(new Error("Missing ANTHROPIC_API_KEY"));
    const res = await POST(makeRequest({ subject: "x" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Server is misconfigured. Please try again later.");
    expect(JSON.stringify(body)).not.toContain("ANTHROPIC_API_KEY");
  });

  it("returns 502 for any other generator error", async () => {
    mockGenerate.mockRejectedValue(new Error("upstream 529"));
    const res = await POST(makeRequest({ subject: "x" }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("Failed to generate titles. Please try again.");
    expect(mockScore).not.toHaveBeenCalled();
  });

  it("returns 502 when a non-Error value is thrown", async () => {
    mockGenerate.mockRejectedValue("nope");
    const res = await POST(makeRequest({ subject: "x" }));
    expect(res.status).toBe(502);
  });
});
