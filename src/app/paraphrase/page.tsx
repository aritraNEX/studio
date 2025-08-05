
"use client";

import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { useWorkspace } from "@/contexts/workspace-context";

export default function ParaphrasePage() {
    const { addWorkspaceStep } = useWorkspace();
    return (
        <ToolPageLayout
            title="Paraphraser"
            subtitle="Rephrase your text to make it unique and clear."
            iconName="Quote"
        >
            <OperationTab operation="paraphrase" onSendTo={(text, op) => addWorkspaceStep({ id: Date.now(), operation: op, text })} />
        </ToolPageLayout>
    );
}
