import { createTheme, type MantineColorsTuple } from "@mantine/core";
import classes from "./theme.module.css";

const sun: MantineColorsTuple = [
  "#fff4e6", "#ffe4c7", "#ffcc99", "#ffb36b", "#ff9a45",
  "#ff8a2b", "#f27312", "#cc5f0b", "#a24c0a", "#7a3a08",
];

const display = "var(--font-display), var(--font-body), system-ui, sans-serif";

export const theme = createTheme({
  colors: { sun },
  primaryColor: "sun",
  primaryShade: 5,
  autoContrast: true,
  black: "#3a2a20",
  fontFamily: "var(--font-body), system-ui, sans-serif",
  headings: { fontFamily: display, fontWeight: "600" },
  defaultRadius: "xl",
  components: {
    Button: {
      defaultProps: { size: "xl", radius: "sm" },
      classNames: { root: classes.button },
    },
    TextInput: {
      defaultProps: { size: "xl", radius: "sm" },
      classNames: { input: classes.input, label: classes.label },
    },
    NumberInput: {
      defaultProps: { size: "xl", radius: "sm" },
      classNames: { input: classes.input, label: classes.label },
    },
    Paper: { classNames: { root: classes.card } },
    Alert: { classNames: { root: classes.alert } },
  },
});
