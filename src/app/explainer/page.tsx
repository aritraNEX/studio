
import { ConceptExplainerTab } from "@/components/concept-explainer-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function ExplainerPage() {
    return (
        <ToolPageLayout
            title="Concept Explainer"
            subtitle="Break down complex topics into simple, easy-to-understand steps."
            iconName="BrainCircuit"
        >
            <ConceptExplainerTab />
        </ToolPageLayout>
    );
}
