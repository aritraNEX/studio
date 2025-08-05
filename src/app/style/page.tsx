
"use client";

import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { useWorkspace } from "@/contexts/workspace-context";

export default function StylePage() {
    const { addWorkspaceStep } = useWorkspace();
    return (
        <ToolPageLayout
            title="Style Editor"
            subtitle="Rewrite text in a different style or tone."
            iconName="Palette"
        >
            <OperationTab operation="style" onSendTo={(text, op) => addWorkspaceStep({ id: Date.now(), operation: op, text })} />
        </ToolPageLayout>
    );
}
