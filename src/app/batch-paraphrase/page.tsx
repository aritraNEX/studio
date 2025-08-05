
import { BatchParaphraseTab } from "@/components/batch-paraphrase-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { FileText } from "lucide-react";

export default function BatchParaphrasePage() {
    return (
        <ToolPageLayout
            title="Batch Paraphraser"
            subtitle="Paraphrase multiple documents at once."
            icon={FileText}
        >
            <BatchParaphraseTab />
        </ToolPageLayout>
    );
}
