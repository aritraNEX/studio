
import { PlagiarismTab } from "@/components/plagiarism-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function PlagiarismPage() {
    return (
        <ToolPageLayout
            title="Plagiarism Checker"
            subtitle="Check for unoriginal content in your text."
            iconName="ShieldCheck"
        >
            <PlagiarismTab />
        </ToolPageLayout>
    );
}
