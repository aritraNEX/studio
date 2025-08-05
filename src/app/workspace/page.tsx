
"use client";

import { WorkspaceTab } from "@/components/workspace-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { WorkspaceProvider, useWorkspace } from "@/contexts/workspace-context";
import { useRouter } from "next/navigation";

function WorkspacePageContent() {
    const router = useRouter();
    const { setWorkspaceText } = useWorkspace();

    const handleSendTo = (text: string, operation: 'tts') => {
        // Since TTS is now its own page, we can navigate to it.
        // We might need a better way to pass the text, e.g., via query params or context.
        setWorkspaceText(text);
        router.push('/tts');
    };
    
    return (
        <ToolPageLayout
            title="Workspace"
            subtitle="Chain multiple AI operations together in a seamless workflow."
            iconName="Wand2"
        >
            <WorkspaceTab onSendTo={handleSendTo} />
        </ToolPageLayout>
    );
}


export default function WorkspacePage() {
    return (
        <WorkspaceProvider>
            <WorkspacePageContent />
        </WorkspaceProvider>
    );
}
