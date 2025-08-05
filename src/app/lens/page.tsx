
import { LensTab } from "@/components/lens-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function LensPage() {
    return (
        <ToolPageLayout
            title="Vesper Lens"
            subtitle="Analyze images and ask questions about their content."
            iconName="Camera"
        >
            <LensTab />
        </ToolPageLayout>
    );
}
