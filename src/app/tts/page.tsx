
import { TtsTab } from "@/components/tts-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function TtsPage() {
    return (
        <ToolPageLayout
            title="Text to Speech"
            subtitle="Convert text into natural-sounding audio."
            iconName="AudioLines"
        >
            <TtsTab />
        </ToolPageLayout>
    );
}
