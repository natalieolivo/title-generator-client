import { NextRequest, NextResponse } from "next/server";
import { generateTitles } from "@natalieolivo/title-generator";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MAX_SUBJECT_LENGTH = 200;
const MAX_COUNT = 6;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip).allowed) {
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
    return NextResponse.json({ titles });
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
