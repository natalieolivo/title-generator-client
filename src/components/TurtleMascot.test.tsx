import { act, render } from "@testing-library/react";
import TurtleMascot from "./TurtleMascot";

const originalMatchMedia = window.matchMedia;

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: reduce && query === "(prefers-reduced-motion: reduce)",
    media: query,
  })) as unknown as typeof window.matchMedia;
}

function mockRect(svg: Element, rect: Partial<DOMRect>) {
  jest.spyOn(svg, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ...rect,
  } as DOMRect);
}

function movePointer(clientX: number, clientY: number) {
  act(() => {
    window.dispatchEvent(new MouseEvent("pointermove", { clientX, clientY }));
  });
}

function vars(svg: SVGElement) {
  return {
    headX: svg.style.getPropertyValue("--head-x"),
    headY: svg.style.getPropertyValue("--head-y"),
    eyeX: svg.style.getPropertyValue("--eye-x"),
    eyeY: svg.style.getPropertyValue("--eye-y"),
  };
}

function renderMascot() {
  const { container, unmount } = render(<TurtleMascot />);
  return { svg: container.querySelector("svg")!, unmount };
}

beforeEach(() => mockReducedMotion(false));

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  jest.restoreAllMocks();
});

describe("TurtleMascot", () => {
  it("is hidden from assistive tech and not focusable", () => {
    const { svg } = renderMascot();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  it("scales the pointer offset from the mascot center into head and eye variables", () => {
    const { svg } = renderMascot();
    // Center is (300, 200).
    mockRect(svg, { left: 200, top: 100, width: 200, height: 200 });

    movePointer(500, 300);

    // Offset (200, 100) over 400 gives (0.5, 0.25).
    expect(vars(svg)).toEqual({
      headX: "7px",
      headY: "2px",
      eyeX: "2.5px",
      eyeY: "1px",
    });
  });

  it("looks the opposite way when the pointer is up and to the left", () => {
    const { svg } = renderMascot();
    mockRect(svg, { left: 200, top: 100, width: 200, height: 200 });

    movePointer(100, 0);

    expect(vars(svg)).toEqual({
      headX: "-7px",
      headY: "-4px",
      eyeX: "-2.5px",
      eyeY: "-2px",
    });
  });

  it("clamps the offset so a far-away pointer cannot over-rotate the head", () => {
    const { svg } = renderMascot();
    mockRect(svg, { left: 0, top: 0, width: 0, height: 0 });

    movePointer(5000, -5000);

    expect(vars(svg)).toEqual({
      headX: "14px",
      headY: "-8px",
      eyeX: "5px",
      eyeY: "-4px",
    });
  });

  it("measures the rect on every move so layout changes are respected", () => {
    const { svg } = renderMascot();
    const rectSpy = jest.spyOn(svg, "getBoundingClientRect");
    rectSpy.mockReturnValue({ left: 0, top: 0, width: 0, height: 0 } as DOMRect);
    movePointer(400, 0);
    expect(vars(svg).headX).toBe("14px");

    rectSpy.mockReturnValue({ left: 400, top: 0, width: 0, height: 0 } as DOMRect);
    movePointer(400, 0);
    expect(vars(svg).headX).toBe("0px");
    expect(rectSpy).toHaveBeenCalledTimes(2);
  });

  it("does not track the pointer when the user prefers reduced motion", () => {
    mockReducedMotion(true);
    const addSpy = jest.spyOn(window, "addEventListener");
    const { svg } = renderMascot();
    mockRect(svg, { left: 0, top: 0, width: 0, height: 0 });

    movePointer(400, 400);

    expect(addSpy).not.toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(vars(svg)).toEqual({ headX: "", headY: "", eyeX: "", eyeY: "" });
  });

  it("removes its pointer listener on unmount", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { svg, unmount } = renderMascot();
    mockRect(svg, { left: 0, top: 0, width: 0, height: 0 });

    const handler = addSpy.mock.calls.find(([type]) => type === "pointermove")![1];
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("pointermove", handler);
    movePointer(400, 400);
    expect(vars(svg).headX).toBe("");
  });
});
