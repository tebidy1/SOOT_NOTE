'use server';

import { z } from 'zod';

const SummarizeOrderInformationInputSchema = z.object({
  receiptText: z
    .string()
    .describe('The text extracted from the shipping receipt.'),
});
export type SummarizeOrderInformationInput = z.infer<
  typeof SummarizeOrderInformationInputSchema
>;

const SummarizeOrderInformationOutputSchema = z.object({
  summary: z.string().describe('A summary of the order information.'),
  contactInformation: z
    .string()
    .optional()
    .describe('Contact information extracted from the receipt, if available.'),
});
export type SummarizeOrderInformationOutput = z.infer<
  typeof SummarizeOrderInformationOutputSchema
>;

export async function summarizeOrderInformation(
  input: SummarizeOrderInformationInput
): Promise<SummarizeOrderInformationOutput> {
  // Mock implementation since Genkit/Firebase removal
  return new Promise((resolve) => {
    setTimeout(() => {
        resolve({
            summary: `This is a mock summary of your shipment based on the provided text: "${input.receiptText.substring(0, 50)}..."`,
            contactInformation: "Contact: support@aramex.com"
        });
    }, 1000);
  });
}
