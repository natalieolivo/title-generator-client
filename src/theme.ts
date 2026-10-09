import { createTheme, type MantineColorsTuple } from "@mantine/core";
import classes from "./theme.module.css";

const volt: MantineColorsTuple = [
  "#eef0ff", "#dfe2ff", "#bfc4ff", "#9ea5ff", "#7f87ff",
  "#5f67ff", "#4a50e6", "#393ecc", "#2b2fa8", "#1f2280",
];

const display = "var(--font-display), var(--font-geist-sans), system-ui, sans-serif";

export const theme = createTheme({
  colors: { volt },
  primaryColor: "volt",
  primaryShade: 6,
  autoContrast: true,
  black: "#0b0b0f",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  headings: { fontFamily: display, fontWeight: "700" },
  defaultRadius: "xl",
  components: {
    Button: {
      defaultProps: { size: "xl", radius: "xl" },
      classNames: { root: classes.button },
    },
    TextInput: {
      defaultProps: { size: "xl", radius: "xl" },
      classNames: { input: classes.input, label: classes.label },
    },
    NumberInput: {
      defaultProps: { size: "xl", radius: "xl" },
      classNames: { input: classes.input, label: classes.label },
    },
    Paper: { classNames: { root: classes.card } },
    Alert: { classNames: { root: classes.alert } },
  },
});
