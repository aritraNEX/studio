
import { AssignmentMakerTab } from "@/components/assignment-maker-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { PenSquare } from "lucide-react";

export default function AssignmentMakerPage() {
    return (
        <ToolPageLayout
            title="Assignment Mentor"
            subtitle="Generate well-researched and structured assignments on any topic."
            icon={PenSquare}
        >
            <AssignmentMakerTab />
        </ToolPageLayout>
    );
}
