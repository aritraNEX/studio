
import { AssignmentMakerTab } from "@/components/assignment-maker-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function AssignmentMakerPage() {
    return (
        <ToolPageLayout
            title="Assignment Mentor"
            subtitle="Generate well-researched and structured assignments on any topic."
            iconName="PenSquare"
        >
            <AssignmentMakerTab />
        </ToolPageLayout>
    );
}
