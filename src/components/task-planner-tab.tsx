
"use client";
import { ListTodo } from "lucide-react";

export function TaskPlannerTab() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40rem] text-center text-muted-foreground p-8 bg-muted/20 rounded-lg">
      <ListTodo className="h-16 w-16 text-primary mb-6" />
      <h2 className="text-2xl font-semibold text-foreground mb-2">Personal Task Board</h2>
      <p className="max-w-md">
        This feature has been integrated into your personal Workspace. You can now manage your tasks on a dedicated board.
      </p>
    </div>
  );
}
