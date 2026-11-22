import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithMantine } from "@/test-utils/render";
import TitleGeneratorForm from "./TitleGeneratorForm";

jest.mock("@natalieolivo/title-generator", () => ({
  generateTitles: jest.fn(() => {
    throw new Error("title-generator must not be called from client tests");
  }),
  scoreTitles: jest.fn(() => {
    throw new Error("title-generator must not be called from client tests");
  }),
}));

const fetchMock = jest.fn();

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function sentBody() {
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  subject = "a productivity app",
) {
  await user.type(screen.getByLabelText(/subject/i), subject);
  await user.click(screen.getByRole("button", { name: /generate titles/i }));
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("TitleGeneratorForm", () => {
  it("renders the empty form with defaults and no results", () => {
    renderWithMantine(<TitleGeneratorForm />);
    expect(screen.getByLabelText(/subject/i)).toHaveValue("");
    expect(screen.getByLabelText(/count/i)).toHaveValue("4");
    expect(screen.getByLabelText(/tone/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: /generate titles/i })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not submit without a subject", async () => {
    const user = userEvent.setup();
    renderWithMantine(<TitleGeneratorForm />);
    await user.click(screen.getByRole("button", { name: /generate titles/i }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the subject, count and trimmed tone, then shows the titles", async () => {
    fetchMock.mockReturnValue(jsonResponse({ titles: [{ title: "Do More" }, { title: "Less Stress" }] }));
    const user = userEvent.setup();
    renderWithMantine(<TitleGeneratorForm />);

    await user.type(screen.getByLabelText(/tone/i), "  playful ");
    await fillAndSubmit(user);

    expect(await screen.findByText("Do More")).toBeInTheDocument();
    expect(screen.getByText("Less Stress")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate-titles",
      expect.objectContaining({ method: "POST" }),
    );
    expect(sentBody()).toEqual({ subject: "a productivity app", count: 4, tone: "playful" });
  });

  it("leaves tone out of the request when it is blank", async () => {
    fetchMock.mockReturnValue(jsonResponse({ titles: [{ title: "T" }] }));
    const user = userEvent.setup();
    renderWithMantine(<TitleGeneratorForm />);
    await user.type(screen.getByLabelText(/tone/i), "   ");
    await fillAndSubmit(user);
    await screen.findByText("T");
    expect(sentBody()).not.toHaveProperty("tone");
  });

  it("sends the changed count", async () => {
    fetchMock.mockReturnValue(jsonResponse({ titles: [{ title: "T" }] }));
    const user = userEvent.setup();
    renderWithMantine(<TitleGeneratorForm />);
    const count = screen.getByLabelText(/count/i);
    // Clearing the field snaps the value to 1, so replace the selection instead.
    await user.tripleClick(count);
    await user.keyboard("2");
    await fillAndSubmit(user);
    await screen.findByText("T");
    expect(sentBody().count).toBe(2);
  });

  describe("score badges", () => {
    it("shows rank, score and rationale for scored titles", async () => {
      fetchMock.mockReturnValue(
        jsonResponse({
          titles: [
            { title: "Best", score: { total: 88, rank: 1, rationale: "Clear and keyword rich" } },
            { title: "Okay", score: { total: 60, rank: 2, rationale: "Decent" } },
            { title: "Weak", score: { total: 30, rank: 3, rationale: "Vague" } },
          ],
        }),
      );
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);

      expect(await screen.findByText("#1 · SEO 88/100")).toBeInTheDocument();
      expect(screen.getByText("#2 · SEO 60/100")).toBeInTheDocument();
      expect(screen.getByText("#3 · SEO 30/100")).toBeInTheDocument();
      expect(screen.getByText("Clear and keyword rich")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Rank 1 of 3, SEO score 88 out of 100"),
      ).toBeInTheDocument();
    });

    it.each([
      [75, "green"],
      [74, "yellow"],
      [50, "yellow"],
      [49, "orange"],
    ])("colors a score of %i as %s", async (total, color) => {
      fetchMock.mockReturnValue(
        jsonResponse({ titles: [{ title: "T", score: { total, rank: 1, rationale: "r" } }] }),
      );
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);

      const badge = await screen.findByText(`#1 · SEO ${total}/100`);
      expect(badge.closest(".mantine-Badge-root")).toHaveStyle({
        "--badge-bg": `var(--mantine-color-${color}-filled)`,
      });
    });

    it("renders unscored titles without any badge", async () => {
      fetchMock.mockReturnValue(jsonResponse({ titles: [{ title: "Plain" }] }));
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);

      expect(await screen.findByText("Plain")).toBeInTheDocument();
      expect(screen.queryByText(/SEO/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^Rank/)).not.toBeInTheDocument();
    });

    it("shows badges only on the titles that have a score", async () => {
      fetchMock.mockReturnValue(
        jsonResponse({
          titles: [
            { title: "Scored", score: { total: 80, rank: 1, rationale: "good" } },
            { title: "Unscored" },
          ],
        }),
      );
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);

      await screen.findByText("Unscored");
      expect(screen.getAllByText(/SEO/)).toHaveLength(1);
    });
  });

  describe("errors", () => {
    it("shows the server error message for a rate-limit response", async () => {
      fetchMock.mockReturnValue(
        jsonResponse({ error: "Too many requests. Please wait a minute and try again." }, 429),
      );
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);

      expect(await screen.findByRole("alert")).toHaveTextContent(/too many requests/i);
      expect(screen.getByRole("button", { name: /generate titles/i })).toBeEnabled();
    });

    it("shows the server error message for a 502", async () => {
      fetchMock.mockReturnValue(
        jsonResponse({ error: "Failed to generate titles. Please try again." }, 502),
      );
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);
      expect(await screen.findByRole("alert")).toHaveTextContent("Failed to generate titles.");
    });

    it("shows a generic message for a non-ok response without an error field", async () => {
      fetchMock.mockReturnValue(jsonResponse({ titles: [] }, 500));
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);
      expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong.");
    });

    it("shows a network error message when fetch rejects", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);
      expect(await screen.findByRole("alert")).toHaveTextContent("Network error. Please try again.");
    });

    it("shows a network error message when the body is not JSON", async () => {
      fetchMock.mockReturnValue(
        Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError("bad")) }),
      );
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);
      expect(await screen.findByRole("alert")).toHaveTextContent("Network error.");
    });

    it("clears a previous error and results on the next submit", async () => {
      fetchMock
        .mockReturnValueOnce(jsonResponse({ error: "Nope" }, 502))
        .mockReturnValueOnce(jsonResponse({ titles: [{ title: "Recovered" }] }));
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);
      expect(await screen.findByRole("alert")).toHaveTextContent("Nope");

      await user.click(screen.getByRole("button", { name: /generate titles/i }));
      expect(await screen.findByText("Recovered")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("disables the submit button while the request is pending, then re-enables it", async () => {
      let resolve!: (value: unknown) => void;
      fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);

      const button = screen.getByRole("button", { name: /generate titles/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("data-loading", "true");

      await user.click(button);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      resolve({ ok: true, status: 200, json: () => Promise.resolve({ titles: [{ title: "Done" }] }) });
      expect(await screen.findByText("Done")).toBeInTheDocument();
      await waitFor(() => expect(button).toBeEnabled());
    });

    it("hides old results as soon as a new request starts", async () => {
      fetchMock.mockReturnValueOnce(jsonResponse({ titles: [{ title: "First batch" }] }));
      const user = userEvent.setup();
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);
      await screen.findByText("First batch");

      fetchMock.mockReturnValueOnce(new Promise(() => {}));
      await user.click(screen.getByRole("button", { name: /generate titles/i }));
      expect(screen.queryByText("First batch")).not.toBeInTheDocument();
    });
  });

  describe("copy", () => {
    const writeText = jest.fn();

    beforeEach(() => {
      writeText.mockReset().mockResolvedValue(undefined);
    });

    async function renderWithResults(user: ReturnType<typeof userEvent.setup>) {
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      fetchMock.mockReturnValue(jsonResponse({ titles: [{ title: "One" }, { title: "Two" }] }));
      renderWithMantine(<TitleGeneratorForm />);
      await fillAndSubmit(user);
      await screen.findByText("One");
    }

    it("copies the title and marks only that button as Copied", async () => {
      const user = userEvent.setup({ writeToClipboard: false });
      await renderWithResults(user);

      const [first, second] = screen.getAllByRole("button", { name: "Copy" });
      await user.click(second);

      expect(writeText).toHaveBeenCalledWith("Two");
      expect(await screen.findByRole("button", { name: "Copied!" })).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Copy" })).toEqual([first]);
    });
  });
});
