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
            Tittling Titles
          </Title>
          <Group gap="lg" wrap="nowrap" align="center">
            <TurtleMascot />
            <Text fw={500} className={styles.intro}>
              Generate tittling titles for blog posts, social media content, or newly built apps. Use for brainstorming headlines or copy them for quick use.
            </Text>
          </Group>
        </Stack>
        <TitleGeneratorForm />
      </Stack>
    </Container>
  );
}
