"use client";

import { useState, type FormEvent } from "react";

type GenerateResponse = { titles: string[] } | { error: string };

export default function TitleGeneratorForm() {
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState(4);
  const [tone, setTone] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setCopiedIndex(null);

    try {
      const response = await fetch("/api/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          count,
          ...(tone.trim() ? { tone: tone.trim() } : {}),
        }),
      });

      const data: GenerateResponse = await response.json();

      if (!response.ok || "error" in data) {
        setError("error" in data ? data.error : "Something went wrong.");
        return;
      }

      setResults(data.titles);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(title: string, index: number) {
    await navigator.clipboard.writeText(title);
    setCopiedIndex(index);
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. a productivity app"
            required
          />
        </div>

        <div>
          <label htmlFor="count">Count</label>
          <input
            id="count"
            type="number"
            min={1}
            max={6}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>

        <div>
          <label htmlFor="tone">Tone (optional)</label>
          <input
            id="tone"
            type="text"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="e.g. playful, urgent"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate titles"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {results.length > 0 && (
        <ul>
          {results.map((title, index) => (
            <li key={index}>
              {title}{" "}
              <button type="button" onClick={() => handleCopy(title, index)}>
                {copiedIndex === index ? "Copied!" : "Copy"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
