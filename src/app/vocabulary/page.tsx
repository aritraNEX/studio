
import { VocabularyEnhancerTab } from "@/components/vocabulary-enhancer-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function VocabularyPage() {
    return (
        <ToolPageLayout
            title="Vocabulary Enhancer"
            subtitle="Improve your writing by finding better words and synonyms."
            iconName="BookUp"
        >
            <VocabularyEnhancerTab />
        </ToolPageLayout>
    );
}
