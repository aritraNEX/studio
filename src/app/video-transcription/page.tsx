
import { TranscriptionTab } from "@/components/transcription-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { Video } from "lucide-react";

export default function VideoTranscriptionPage() {
    return (
        <ToolPageLayout
            title="Video to Text"
            subtitle="Transcribe speech from a video into text with timestamps."
            icon={Video}
        >
            <TranscriptionTab />
        </ToolPageLayout>
    );
}
