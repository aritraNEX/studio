
import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function TranslatePage() {
    return (
        <ToolPageLayout
            title="Translator"
            subtitle="Translate text between dozens of languages."
            iconName="Languages"
        >
            <OperationTab operation="translate" onSendTo={() => {}} />
        </ToolPageLayout>
    );
}
