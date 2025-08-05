
import { GrammarCheckTab } from "@/components/grammar-check-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { SpellCheck } from "lucide-react";

export default function GrammarPage() {
    return (
        <ToolPageLayout
            title="Grammar Checker"
            subtitle="Correct spelling, grammar, and punctuation mistakes."
            icon={SpellCheck}
        >
            <GrammarCheckTab />
        </ToolPageLayout>
    );
}
