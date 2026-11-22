import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { theme } from "@/theme";

export function renderWithMantine(ui: ReactElement, options?: RenderOptions) {
  return render(
    <MantineProvider env="test" theme={theme}>
      {ui}
    </MantineProvider>,
    options,
  );
}
