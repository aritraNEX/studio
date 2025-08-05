
import { GrammarCheckTab } from "@/components/grammar-check-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function GrammarPage() {
    return (
        <ToolPageLayout
            title="Grammar Checker"
            subtitle="Correct spelling, grammar, and punctuation mistakes."
            iconName="SpellCheck"
        >
            <GrammarCheckTab />
        </ToolPageLayout>
    );
}
