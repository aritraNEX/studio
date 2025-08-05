
import { ConceptExplainerTab } from "@/components/concept-explainer-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { BrainCircuit } from "lucide-react";

export default function ExplainerPage() {
    return (
        <ToolPageLayout
            title="Concept Explainer"
            subtitle="Break down complex topics into simple, easy-to-understand steps."
            icon={BrainCircuit}
        >
            <ConceptExplainerTab />
        </ToolPageLayout>
    );
}
