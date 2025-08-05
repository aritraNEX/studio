
import { FlashcardGeneratorTab } from "@/components/flashcard-generator-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function FlashcardsPage() {
    return (
        <ToolPageLayout
            title="Flashcard Generator"
            subtitle="Create study flashcards from your notes or any text."
            iconName="Copy"
        >
            <FlashcardGeneratorTab />
        </ToolPageLayout>
    );
}
