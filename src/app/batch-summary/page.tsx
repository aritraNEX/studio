
import { BatchSummaryTab } from "@/components/batch-summary-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { FileText } from "lucide-react";

export default function BatchSummaryPage() {
    return (
        <ToolPageLayout
            title="Batch Summarizer"
            subtitle="Summarize multiple documents at once."
            icon={FileText}
        >
            <BatchSummaryTab />
        </ToolPageLayout>
    );
}
