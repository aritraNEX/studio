
import { LensTab } from "@/components/lens-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { Camera } from "lucide-react";

export default function LensPage() {
    return (
        <ToolPageLayout
            title="Vesper Lens"
            subtitle="Analyze images and ask questions about their content."
            icon={Camera}
        >
            <LensTab />
        </ToolPageLayout>
    );
}
