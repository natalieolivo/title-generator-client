import { Container, Group, Stack, Text, Title } from "@mantine/core";
import styles from "./page.module.css";
import TitleGeneratorForm from "@/components/TitleGeneratorForm";
import TurtleMascot from "@/components/TurtleMascot";

export default function Home() {
  return (
    <Container size="sm" component="main" className={styles.main}>
      <Stack gap="xl">
        <Stack gap="md">
          <Title order={1} className={styles.title}>
            Title Generator
          </Title>
          <Group gap="lg" wrap="nowrap" align="center">
            <TurtleMascot />
            <Text fw={500} className={styles.intro}>
              AI-generated headline variants for a subject of your choosing.
            </Text>
          </Group>
        </Stack>
        <TitleGeneratorForm />
      </Stack>
    </Container>
  );
}
