
'use server';
/**
 * @fileOverview An AI flow for breaking down tasks and creating a detailed schedule.
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
  dailyAvailability: z.object({
      start: z.string().describe('The start of the daily available time slot (e.g., "09:00").'),
      end: z.string().describe('The end of the daily available time slot (e.g., "17:00").'),
    }).describe('The daily time window available for working on tasks.'),
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
          .describe('The specific date (YYYY-MM-DD) this subtask should be completed on.'),
        time: z
          .string()
          .describe('The specific time (HH:mm) this subtask is scheduled for.'),
        duration: z
          .number()
          .describe('The estimated duration of the subtask in minutes.'),
      })
    )
    .describe('An array of subtasks, each with a title, a scheduled date, and a specific time.'),
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
  prompt: `You are a world-class project manager AI. Your task is to take a user's goal and break it down into a concrete, actionable, and meticulously scheduled plan.

Today's date is: ${new Date().toISOString().split('T')[0]}

User's Task: '{{task}}'
Final Deadline: '{{deadline}}'
Priority: '{{priority}}'
User's Daily Availability: '{{dailyAvailability.start}}' to '{{dailyAvailability.end}}'

Follow these steps precisely:
1.  **Create a Plan Title**: Generate a clear and motivating title for the entire plan.
2.  **Break Down into Subtasks**: Analyze the main task and break it down into smaller, logical, and manageable subtasks. Estimate a realistic 'duration' in minutes for each subtask.
3.  **Smart Scheduling**: This is the most critical step. Distribute the subtasks over the time available between today and the final deadline.
    -   Assign a specific 'date' (YYYY-MM-DD) and 'time' (HH:mm, 24-hour format) to each subtask.
    -   All scheduled times MUST fall strictly within the user's daily availability window. Do not schedule tasks outside these hours.
    -   Consider the task's priority. For 'High' priority tasks, schedule subtasks more aggressively and earlier in the timeline. For 'Low' priority, spread them out more.
    -   Ensure the final subtask's date is on or before the user's deadline.
4.  **Final Output**: Return the plan in the specified JSON format. Ensure all dates and times are valid and correctly formatted.
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
        // Sort tasks by date and time to ensure they are in chronological order
        output.subtasks.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}:00`);
            const dateB = new Date(`${b.date}T${b.time}:00`);
            return dateA.getTime() - dateB.getTime();
        });
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
