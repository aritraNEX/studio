
'use server';
/**
 * @fileOverview An AI flow for rescheduling incomplete tasks.
 *
 * - rescheduleTasks - A function that generates a new schedule for a list of incomplete tasks.
 * - RescheduleTasksInput - The input type for the rescheduleTasks function.
 * - RescheduleTasksOutput - The return type for the rescheduleTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RescheduleTasksInputSchema = z.object({
  incompleteTasks: z.array(z.string()).describe('A list of the titles of subtasks that are not yet completed.'),
  deadline: z.string().describe('The final deadline for the entire project, in ISO 8601 format.'),
  dailyAvailability: z.object({
      start: z.string().describe('The start of the daily available time slot (e.g., "09:00").'),
      end: z.string().describe('The end of the daily available time slot (e.g., "17:00").'),
    }).describe('The daily time window available for working on tasks.'),
});
export type RescheduleTasksInput = z.infer<typeof RescheduleTasksInputSchema>;

const RescheduleTasksOutputSchema = z.object({
  rescheduledTasks: z
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
    .describe('An array of the rescheduled subtasks, each with a title, a scheduled date, and a specific time.'),
});
export type RescheduleTasksOutput = z.infer<typeof RescheduleTasksOutputSchema>;

export async function rescheduleTasks(
  input: RescheduleTasksInput
): Promise<RescheduleTasksOutput> {
  return rescheduleTasksFlow(input);
}

const rescheduleTasksPrompt = ai.definePrompt({
  name: 'rescheduleTasksPrompt',
  input: {schema: RescheduleTasksInputSchema},
  output: {schema: RescheduleTasksOutputSchema},
  prompt: `You are a world-class project manager AI. Your task is to re-organize a list of incomplete tasks into a new, optimized schedule.

Today's date is: ${new Date().toISOString().split('T')[0]}

Incomplete Tasks: 
{{#each incompleteTasks}}
- {{this}}
{{/each}}

Final Deadline: '{{deadline}}'
User's Daily Availability: '{{dailyAvailability.start}}' to '{{dailyAvailability.end}}'

Follow these steps precisely:
1.  **Analyze Incomplete Tasks**: Review the list of tasks that need to be rescheduled.
2.  **Estimate Durations**: For each task, estimate a realistic 'duration' in minutes.
3.  **Smart Rescheduling**: Distribute these tasks over the time available between today and the final deadline.
    -   Assign a specific 'date' (YYYY-MM-DD) and 'time' (HH:mm, 24-hour format) to each task.
    -   All scheduled times MUST fall strictly within the user's daily availability window.
    -   Try to spread the tasks out evenly, but ensure the final task's date is on or before the user's deadline.
4.  **Final Output**: Return the new plan in the specified JSON format. Ensure all dates and times are valid and correctly formatted.
`,
});

const rescheduleTasksFlow = ai.defineFlow(
  {
    name: 'rescheduleTasksFlow',
    inputSchema: RescheduleTasksInputSchema,
    outputSchema: RescheduleTasksOutputSchema,
  },
  async (input) => {
    if (input.incompleteTasks.length === 0) {
      return { rescheduledTasks: [] };
    }
    
    try {
        const {output} = await rescheduleTasksPrompt(input);
        if (!output || !output.rescheduledTasks) {
            throw new Error("The model did not return a valid rescheduled plan.");
        }
        output.rescheduledTasks.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}:00`);
            const dateB = new Date(`${b.date}T${b.time}:00`);
            return dateA.getTime() - dateB.getTime();
        });
        return output;
    } catch (e: any) {
        console.error("Error in rescheduleTasksFlow: ", e);
        if (e.message?.includes('overloaded')) {
            throw new Error('The AI model is currently busy. Please try again in a moment.');
        }
        throw new Error('An error occurred while rescheduling the plan. Please try again.');
    }
  }
);
