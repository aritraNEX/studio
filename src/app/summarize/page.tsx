
import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function SummarizePage() {
    return (
        <ToolPageLayout
            title="Summarizer"
            subtitle="Condense long texts into short, concise summaries."
            iconName="BookText"
        >
            <OperationTab operation="summarize" onSendTo={() => {}} />
        </ToolPageLayout>
    );
}
