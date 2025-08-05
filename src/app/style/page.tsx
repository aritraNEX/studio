
import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function StylePage() {
    return (
        <ToolPageLayout
            title="Style Editor"
            subtitle="Rewrite text in a different style or tone."
            iconName="Palette"
        >
            <OperationTab operation="style" onSendTo={() => {}} />
        </ToolPageLayout>
    );
}
