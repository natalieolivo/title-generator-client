"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";

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

          <Button type="submit" fullWidth loading={loading}>
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
          {results.map((title, index) => (
            <Paper key={index} withBorder p="lg" radius="xl" shadow="sm">
              <Stack gap="md">
                <Text size="xl" fw={700}>
                  {title}
                </Text>
                <Button
                  type="button"
                  size="lg"
                  variant={copiedIndex === index ? "filled" : "light"}
                  color={copiedIndex === index ? "dark" : undefined}
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
