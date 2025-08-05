
"use client";

import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { useWorkspace } from "@/contexts/workspace-context";

export default function SummarizePage() {
    const { addWorkspaceStep } = useWorkspace();
    return (
        <ToolPageLayout
            title="Summarizer"
            subtitle="Condense long texts into short, concise summaries."
            iconName="BookText"
        >
            <OperationTab operation="summarize" onSendTo={(text, op) => addWorkspaceStep({ id: Date.now(), operation: op, text })} />
        </ToolPageLayout>
    );
}
