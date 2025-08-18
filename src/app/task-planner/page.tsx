
import ToolPageLayout from "@/components/tool-page-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TaskPlannerPage() {
    return (
        <ToolPageLayout
            title="AI Task Planner"
            subtitle="Break down any task into a manageable, scheduled plan."
            iconName="ListTodo"
        >
            <div className="flex flex-col items-center justify-center min-h-[30rem] text-center text-muted-foreground p-8 bg-muted/20 rounded-lg">
                <h2 className="text-2xl font-semibold text-foreground mb-2">This Feature Has Moved!</h2>
                <p className="max-w-md mb-6">
                    Task planning and management are now fully integrated into your personal Workspace for a more streamlined experience.
                </p>
                <Button asChild>
                    <Link href="/workspace">Go to My Workspace</Link>
                </Button>
            </div>
        </ToolPageLayout>
    );
}
