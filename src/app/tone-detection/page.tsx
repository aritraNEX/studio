
import { ToneDetectionTab } from "@/components/tone-detection-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { Gauge } from "lucide-react";

export default function ToneDetectionPage() {
    return (
        <ToolPageLayout
            title="Tone Detector"
            subtitle="Analyze the tone of your text to ensure the right message."
            icon={Gauge}
        >
            <ToneDetectionTab />
        </ToolPageLayout>
    );
}
