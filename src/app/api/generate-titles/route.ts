import { NextRequest, NextResponse } from "next/server";
import { generateTitles, scoreTitles } from "@natalieolivo/title-generator";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Each request makes two paid calls (generate, then score).
const CALLS_PER_REQUEST = 2;
const SCORING_TIMEOUT_MS = 20_000;

const MAX_SUBJECT_LENGTH = 200;
const MAX_COUNT = 6;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip, CALLS_PER_REQUEST).allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: { subject?: unknown; count?: unknown; tone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { subject, count, tone } = body;

  if (typeof subject !== "string" || subject.trim().length === 0) {
    return NextResponse.json(
      { error: "`subject` is required and must be a non-empty string." },
      { status: 400 },
    );
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json(
      { error: `\`subject\` must be ${MAX_SUBJECT_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }
  if (
    count !== undefined &&
    (typeof count !== "number" || !Number.isInteger(count) || count <= 0)
  ) {
    return NextResponse.json(
      { error: "`count` must be a positive integer." },
      { status: 400 },
    );
  }
  if (count !== undefined && count > MAX_COUNT) {
    return NextResponse.json(
      { error: `\`count\` must be ${MAX_COUNT} or fewer.` },
      { status: 400 },
    );
  }
  if (tone !== undefined && typeof tone !== "string") {
    return NextResponse.json({ error: "`tone` must be a string." }, { status: 400 });
  }

  try {
    const titles = await generateTitles({
      subject,
      ...(count !== undefined ? { count: count as number } : {}),
      ...(tone !== undefined ? { tone: tone as string } : {}),
    });

    let scored: { title: string; total: number; rank: number; rationale: string }[] | null = null;
    try {
      if (request.signal.aborted) throw new Error("Client disconnected");
      // scoreTitles takes no AbortSignal, so a timeout only stops us waiting;
      // the underlying call still runs to completion.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Scoring timed out")),
          SCORING_TIMEOUT_MS,
        );
      });
      const results = await Promise.race([
        scoreTitles({ subject, titles }),
        timeout,
      ]).finally(() => clearTimeout(timer));
      scored = results.map(({ title, total, rank, rationale }) => ({
        title,
        total,
        rank,
        rationale,
      }));
    } catch (scoreError) {
      console.error(
        "scoreTitles failed:",
        scoreError instanceof Error ? scoreError.message : "Unknown error",
      );
    }

    return NextResponse.json({
      titles: titles.map((title, i) => {
        const s = scored?.[i];
        return s
          ? { title, score: { total: s.total, rank: s.rank, rationale: s.rationale } }
          : { title };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("ANTHROPIC_API_KEY")) {
      console.error("Server misconfiguration:", message);
      return NextResponse.json(
        { error: "Server is misconfigured. Please try again later." },
        { status: 500 },
      );
    }
    console.error("generateTitles failed:", message);
    return NextResponse.json(
      { error: "Failed to generate titles. Please try again." },
      { status: 502 },
    );
  }
}
