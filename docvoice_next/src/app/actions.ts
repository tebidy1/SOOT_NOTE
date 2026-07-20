'use server';

import { summarizeOrderInformation, SummarizeOrderInformationInput } from '@/ai/flows/summarize-order-information';
import { z } from 'zod';

const SummarizeSchema = z.object({
  receiptText: z.string().min(10, { message: 'Please enter a more detailed receipt.' }),
});

type State = {
  success: boolean;
  message?: string;
  summary?: string;
  contactInformation?: string;
};

export async function summarizeAction(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = SummarizeSchema.safeParse({
    receiptText: formData.get('receiptText'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.receiptText?.[0] ?? 'Invalid input.',
    };
  }

  try {
    const input: SummarizeOrderInformationInput = {
      receiptText: validatedFields.data.receiptText,
    };
    const result = await summarizeOrderInformation(input);

    if (!result.summary) {
        return { success: false, message: 'Could not generate a summary. Please try again with a different receipt.' };
    }

    return {
      success: true,
      summary: result.summary,
      contactInformation: result.contactInformation,
    };
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}
