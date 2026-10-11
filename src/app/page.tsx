import { Container, Stack, Text, Title } from "@mantine/core";
import styles from "./page.module.css";
import TitleGeneratorForm from "@/components/TitleGeneratorForm";
import TurtleMascot from "@/components/TurtleMascot";

export default function Home() {
  return (
    <Container size="sm" component="main" className={styles.main}>
      <Stack gap="xl">
        <Stack gap="md">
          <Title order={1} className={styles.title}>
            Titilating Titles
          </Title>
          <div className={styles.hero}>
            <TurtleMascot />
            <Text fw={500} className={styles.intro}>
              Generate (LLM powered) titilating titles for blog posts, social media content, or newly built apps. Use for brainstorming your own headlines or copy them for quick use.
            </Text>
          </div>
        </Stack>
        <TitleGeneratorForm />
      </Stack>
    </Container>
  );
}
