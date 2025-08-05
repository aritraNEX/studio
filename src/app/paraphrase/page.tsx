
import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { Quote } from "lucide-react";

export default function ParaphrasePage() {
    return (
        <ToolPageLayout
            title="Paraphraser"
            subtitle="Rephrase your text to make it unique and clear."
            icon={Quote}
        >
            <OperationTab operation="paraphrase" onSendTo={() => {}} />
        </ToolPageLayout>
    );
}
