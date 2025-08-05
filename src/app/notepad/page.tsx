
import { NotepadTab } from "@/components/notepad-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function NotepadPage() {
    return (
        <ToolPageLayout
            title="Notepad"
            subtitle="A simple place for your thoughts, saved in your browser."
            iconName="Notebook"
        >
            <NotepadTab />
        </ToolPageLayout>
    );
}
