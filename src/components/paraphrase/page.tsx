
"use client";

import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function ParaphrasePage() {
    return (
        <ToolPageLayout
            title="Paraphraser"
            subtitle="Rephrase your text to make it unique and clear."
            iconName="Quote"
        >
            <OperationTab operation="paraphrase" />
        </ToolPageLayout>
    );
}

