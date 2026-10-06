import styles from "./page.module.css";
import TitleGeneratorForm from "@/components/TitleGeneratorForm";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Title Generator</h1>
        <p>AI-generated headline variants for a subject of your choosing.</p>
        <TitleGeneratorForm />
      </main>
    </div>
  );
}
