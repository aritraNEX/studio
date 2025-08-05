
import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { BookText } from "lucide-react";

export default function SummarizePage() {
    return (
        <ToolPageLayout
            title="Summarizer"
            subtitle="Condense long texts into short, concise summaries."
            icon={BookText}
        >
            <OperationTab operation="summarize" onSendTo={() => {}} />
        </ToolPageLayout>
    );
}
