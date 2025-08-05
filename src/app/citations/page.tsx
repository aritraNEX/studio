
import { CitationGeneratorTab } from "@/components/citation-generator-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { BookA } from "lucide-react";

export default function CitationsPage() {
    return (
        <ToolPageLayout
            title="Citation Generator"
            subtitle="Generate academic citations in APA, MLA, and Chicago styles."
            icon={BookA}
        >
            <CitationGeneratorTab />
        </ToolPageLayout>
    );
}
