
import { ResearchTab } from "@/components/research-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function ResearchPage() {
    return (
        <ToolPageLayout
            title="Research Assistant"
            subtitle="Fact-check claims and generate citations for your text."
            iconName="GraduationCap"
        >
            <ResearchTab />
        </ToolPageLayout>
    );
}
