
import { BatchSummaryTab } from "@/components/batch-summary-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function BatchSummaryPage() {
    return (
        <ToolPageLayout
            title="Batch Summarizer"
            subtitle="Summarize multiple documents at once."
            iconName="FileText"
        >
            <BatchSummaryTab />
        </ToolPageLayout>
    );
}
