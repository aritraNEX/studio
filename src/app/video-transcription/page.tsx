
import { TranscriptionTab } from "@/components/transcription-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function VideoTranscriptionPage() {
    return (
        <ToolPageLayout
            title="Video to Text"
            subtitle="Transcribe speech from a video into text with timestamps."
            iconName="Video"
        >
            <TranscriptionTab />
        </ToolPageLayout>
    );
}
