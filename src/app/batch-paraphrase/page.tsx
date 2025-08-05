
import { BatchParaphraseTab } from "@/components/batch-paraphrase-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function BatchParaphrasePage() {
    return (
        <ToolPageLayout
            title="Batch Paraphraser"
            subtitle="Paraphrase multiple documents at once."
            iconName="FileText"
        >
            <BatchParaphraseTab />
        </ToolPageLayout>
    );
}
