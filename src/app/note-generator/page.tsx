
import { NoteGeneratorTab } from "@/components/note-generator-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function NoteGeneratorPage() {
    return (
        <ToolPageLayout
            title="Note-Mentor"
            subtitle="Generate structured study notes on any topic to learn faster."
            iconName="StickyNote"
        >
            <NoteGeneratorTab />
        </ToolPageLayout>
    );
}
