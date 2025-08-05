
import { OperationTab } from "@/components/operation-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { Palette } from "lucide-react";

export default function StylePage() {
    return (
        <ToolPageLayout
            title="Style Editor"
            subtitle="Rewrite text in a different style or tone."
            icon={Palette}
        >
            <OperationTab operation="style" onSendTo={() => {}} />
        </ToolPageLayout>
    );
}
