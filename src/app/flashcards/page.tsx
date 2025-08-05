
import { FlashcardGeneratorTab } from "@/components/flashcard-generator-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { Copy } from "lucide-react";

export default function FlashcardsPage() {
    return (
        <ToolPageLayout
            title="Flashcard Generator"
            subtitle="Create study flashcards from your notes or any text."
            icon={Copy}
        >
            <FlashcardGeneratorTab />
        </ToolPageLayout>
    );
}
