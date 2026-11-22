"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  Badge,
  Button,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import classes from "../theme.module.css";

type TitleScore = { total: number; rank: number; rationale: string };
type TitleResult = { title: string; score?: TitleScore };
type GenerateResponse = { titles: TitleResult[] } | { error: string };

// Filled badges rely on the theme's autoContrast for dark text (>= 6:1 on
// green/yellow/orange shade 5); the light variant's text failed AA.
export function scoreColor(total: number) {
  if (total >= 75) return "green";
  if (total >= 50) return "yellow";
  return "orange";
}

export default function TitleGeneratorForm() {
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState(4);
  const [tone, setTone] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TitleResult[]>([]);
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
    <Stack gap="xl">
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <TextInput
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.currentTarget.value)}
            placeholder="e.g. a productivity app"
            required
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <NumberInput
              label="Count"
              min={1}
              max={6}
              allowDecimal={false}
              clampBehavior="strict"
              value={count}
              onChange={(value) => setCount(Number(value) || 1)}
            />
            <TextInput
              label="Tone (optional)"
              value={tone}
              onChange={(e) => setTone(e.currentTarget.value)}
              placeholder="e.g. playful, urgent"
            />
          </SimpleGrid>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            color="green"
            className={classes.green}
          >
            Generate titles
          </Button>
        </Stack>
      </form>

      {error && (
        <Alert color="red" radius="xl" role="alert">
          {error}
        </Alert>
      )}

      {results.length > 0 && (
        <Stack gap="md">
          {results.map(({ title, score }, index) => (
            <Paper key={index} withBorder p="lg" radius="xl" shadow="sm">
              <Stack gap="md">
                {score && (
                  <Stack gap={6}>
                    <Badge
                      size="lg"
                      variant="filled"
                      color={scoreColor(score.total)}
                      aria-label={`Rank ${score.rank} of ${results.length}, SEO score ${score.total} out of 100`}
                      style={{ alignSelf: "flex-start" }}
                    >
                      #{score.rank} · SEO {score.total}/100
                    </Badge>
                    <Text size="sm" c="gray.7">
                      {score.rationale}
                    </Text>
                  </Stack>
                )}
                <Text size="xl" fw={700}>
                  {title}
                </Text>
                <Button
                  type="button"
                  size="lg"
                  variant={copiedIndex === index ? "filled" : "light"}
                  color={copiedIndex === index ? "green" : undefined}
                  onClick={() => handleCopy(title, index)}
                >
                  {copiedIndex === index ? "Copied!" : "Copy"}
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
