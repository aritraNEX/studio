
import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { Languages } from "lucide-react";

export default function TranslatePage() {
    return (
        <ToolPageLayout
            title="Translator"
            subtitle="Translate text between dozens of languages."
            icon={Languages}
        >
            <OperationTab operation="translate" onSendTo={() => {}} />
        </ToolPageLayout>
    );
}
