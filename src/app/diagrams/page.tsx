
import { DiagramGeneratorTab } from "@/components/diagram-generator-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function DiagramsPage() {
    return (
        <ToolPageLayout
            title="Diagram Generator"
            subtitle="Create diagrams, flowcharts, and mind maps from text."
            iconName="Share2"
        >
            <DiagramGeneratorTab />
        </ToolPageLayout>
    );
}
