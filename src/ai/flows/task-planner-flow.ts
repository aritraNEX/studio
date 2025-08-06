
'use server';
/**
 * @fileOverview An AI flow for breaking down tasks and creating a schedule.
 *
 * - taskPlanner - A function that generates a scheduled plan for a given task.
 * - TaskPlannerInput - The input type for the taskPlanner function.
 * - TaskPlannerOutput - The return type for the taskPlanner function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskPlannerInputSchema = z.object({
  task: z.string().describe('The main task or project to be planned.'),
  deadline: z.string().describe('The final deadline for the task, in ISO 8601 format.'),
  priority: z.enum(['Low', 'Medium', 'High']).describe('The priority level of the task.'),
});
export type TaskPlannerInput = z.infer<typeof TaskPlannerInputSchema>;

const TaskPlannerOutputSchema = z.object({
  planTitle: z.string().describe('A suitable title for the overall plan.'),
  subtasks: z
    .array(
      z.object({
        title: z.string().describe('A concise title for the subtask.'),
        date: z
          .string()
          .describe('The specific date (YYYY-MM-DD) this subtask should be completed by.'),
      })
    )
    .describe('An array of subtasks, each with a title and a scheduled date.'),
});
export type TaskPlannerOutput = z.infer<typeof TaskPlannerOutputSchema>;

export async function taskPlanner(
  input: TaskPlannerInput
): Promise<TaskPlannerOutput> {
  return taskPlannerFlow(input);
}

const taskPlannerPrompt = ai.definePrompt({
  name: 'taskPlannerPrompt',
  input: {schema: TaskPlannerInputSchema},
  output: {schema: TaskPlannerOutputSchema},
  prompt: `You are a world-class project manager AI. Your task is to take a user's goal and break it down into a concrete, actionable, and scheduled plan.

Today's date is: ${new Date().toISOString().split('T')[0]}

User's Task: '{{task}}'
Final Deadline: '{{deadline}}'
Priority: '{{priority}}'

Follow these steps precisely:
1.  **Create a Plan Title**: Generate a clear and motivating title for the entire plan.
2.  **Break Down into Subtasks**: Analyze the main task and break it down into smaller, logical, and manageable subtasks. The number of subtasks should be reasonable for the timeframe.
3.  **Schedule Subtasks**: This is the most critical step. Distribute the subtasks over the time available between today and the final deadline.
    -   Assign a specific 'date' (in YYYY-MM-DD format) to each subtask.
    -   Be realistic. Don't schedule too many tasks for a single day.
    -   Consider the task's priority. For 'High' priority tasks, schedule subtasks more aggressively and earlier in the timeline. For 'Low' priority, spread them out more.
    -   Ensure the final subtask's date is on or before the user's deadline.
4.  **Final Output**: Return the plan in the specified JSON format. Ensure all dates are valid and correctly formatted.
`,
});

const taskPlannerFlow = ai.defineFlow(
  {
    name: 'taskPlannerFlow',
    inputSchema: TaskPlannerInputSchema,
    outputSchema: TaskPlannerOutputSchema,
  },
  async (input) => {
    try {
        const {output} = await taskPlannerPrompt(input);
        if (!output || !output.subtasks || output.subtasks.length === 0) {
            throw new Error("The model did not return a valid plan.");
        }
        // Sort tasks by date to ensure they are in chronological order
        output.subtasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return output;
    } catch (e: any) {
        console.error("Error in taskPlannerFlow: ", e);
        if (e.message?.includes('overloaded')) {
            throw new Error('The AI model is currently busy. Please try again in a moment.');
        }
        throw new Error('An error occurred while generating the plan. Please try again.');
    }
  }
);
