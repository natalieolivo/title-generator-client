import { screen } from "@testing-library/react";
import { renderWithMantine } from "@/test-utils/render";
import Home from "./page";

describe("Home page", () => {
  it("renders the page heading as the only h1 inside main", () => {
    renderWithMantine(<Home />);
    const main = screen.getByRole("main");
    const heading = screen.getByRole("heading", { level: 1, name: "Titilating Titles" });
    expect(main).toContainElement(heading);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("composes the intro, decorative mascot and generator form", () => {
    const { container } = renderWithMantine(<Home />);
    const main = screen.getByRole("main");

    expect(screen.getByText(/titilating titles for blog posts/i)).toBeInTheDocument();
    // The mascot is aria-hidden, so it is only reachable through the DOM.
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    expect(main).toContainElement(screen.getByLabelText(/subject/i));
    expect(main).toContainElement(screen.getByRole("button", { name: /generate titles/i }));
  });
});
