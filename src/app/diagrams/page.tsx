
import { DiagramGeneratorTab } from "@/components/diagram-generator-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { Share2 } from "lucide-react";

export default function DiagramsPage() {
    return (
        <ToolPageLayout
            title="Diagram Generator"
            subtitle="Create diagrams, flowcharts, and mind maps from text."
            icon={Share2}
        >
            <DiagramGeneratorTab />
        </ToolPageLayout>
    );
}
