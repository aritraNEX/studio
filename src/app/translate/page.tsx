
"use client";

import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { useWorkspace } from "@/contexts/workspace-context";

export default function TranslatePage() {
    const { addWorkspaceStep } = useWorkspace();
    return (
        <ToolPageLayout
            title="Translator"
            subtitle="Translate text between dozens of languages."
            iconName="Languages"
        >
            <OperationTab operation="translate" onSendTo={(text, op) => addWorkspaceStep({ id: Date.now(), operation: op, text })} />
        </ToolPageLayout>
    );
}
