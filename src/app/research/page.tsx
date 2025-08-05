
import { ResearchTab } from "@/components/research-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { GraduationCap } from "lucide-react";

export default function ResearchPage() {
    return (
        <ToolPageLayout
            title="Research Assistant"
            subtitle="Fact-check claims and generate citations for your text."
            icon={GraduationCap}
        >
            <ResearchTab />
        </ToolPageLayout>
    );
}
