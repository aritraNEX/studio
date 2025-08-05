
import { CitationGeneratorTab } from "@/components/citation-generator-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function CitationsPage() {
    return (
        <ToolPageLayout
            title="Citation Generator"
            subtitle="Generate academic citations in APA, MLA, and Chicago styles."
            iconName="BookA"
        >
            <CitationGeneratorTab />
        </ToolPageLayout>
    );
}
