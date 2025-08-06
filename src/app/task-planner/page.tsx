
import { TaskPlannerTab } from "@/components/task-planner-tab";
import ToolPageLayout from "@/components/tool-page-layout";

export default function TaskPlannerPage() {
    return (
        <ToolPageLayout
            title="AI Task Planner"
            subtitle="Break down any task into a manageable, scheduled plan."
            iconName="ListTodo"
        >
            <TaskPlannerTab />
        </ToolPageLayout>
    );
}
