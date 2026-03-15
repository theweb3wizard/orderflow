'use server';
/**
 * @fileOverview An AI behavioral trading coach that analyzes a user's on-chain trading history.
 * Its purpose is to reveal specific behavioral patterns, identify financial 'blind spots',
 * highlight 'hidden edges' of success, and suggest 'this week's focus' for improvement,
 * all substantiated with specific trade data references.
 *
 * - analyzeTradingBehavior - A function that handles the trading behavior analysis process.
 * - AnalyzeTradingBehaviorInput - The input type for the analyzeTradingBehavior function.
 * - AnalyzeTradingBehaviorOutput - The return type for the analyzeTradingBehavior function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Assuming a basic structure for a Trade object consistent with the project's mock data.
// This schema will be used to define the structure of individual trade objects.
const TradeSchema = z.object({
  id: z.string().describe('Unique identifier for the trade.'),
  type: z.enum(['BUY', 'SELL']).describe('Type of trade: BUY or SELL.'),
  status: z.enum(['OPEN', 'CLOSED']).describe('Status of the trade: OPEN or CLOSED.'),
  entryPrice: z.number().describe('The price at which the trade was entered.'),
  exitPrice: z.number().nullable().describe('The price at which the trade was exited (null if OPEN).'),
  quantity: z.number().describe('The quantity of the asset traded.'),
  pnl: z.number().nullable().describe('Profit and Loss for the trade (null if OPEN).'),
  timestamp: z.string().datetime().describe('Timestamp of the trade.'),
  // Additional trade details can be added here if necessary for deeper analysis.
});

export const AnalyzeTradingBehaviorInputSchema = z.object({
  trades: z.array(TradeSchema).describe('An array of the user\'s complete trading history, ordered chronologically.'),
});
export type AnalyzeTradingBehaviorInput = z.infer<typeof AnalyzeTradingBehaviorInputSchema>;

export const AnalyzeTradingBehaviorOutputSchema = z.object({
  behavioralPatterns: z.string().describe('Identified recurring behavioral patterns, biases, or tendencies in trading, explicitly referencing specific trade IDs and outcomes.'),
  blindSpots: z.string().describe('Identified financial blind spots or consistent errors that lead to losses or missed opportunities, explicitly referencing specific trade IDs and their financial impact.'),
  hiddenEdges: z.string().describe('Highlighted successful strategies, recurring advantageous conditions, or hidden strengths in trading, explicitly referencing specific trade IDs and their positive outcomes.'),
  weeklyFocus: z.string().describe('One to two clear, actionable areas for the trader to focus on for improvement or optimization in the upcoming week.'),
});
export type AnalyzeTradingBehaviorOutput = z.infer<typeof AnalyzeTradingBehaviorOutputSchema>;

/**
 * Analyzes a user's trading history to provide a personalized behavioral trading report.
 * The analysis includes identified behavioral patterns, financial blind spots, hidden edges of success,
 * and actionable focus areas for improvement, all substantiated with specific trade data references.
 *
 * @param input - The trading history to be analyzed, an array of trade objects.
 * @returns A structured analysis report in JSON format.
 */
export async function analyzeTradingBehavior(input: AnalyzeTradingBehaviorInput): Promise<AnalyzeTradingBehaviorOutput> {
  return analyzeTradingBehaviorFlow(input);
}

const analyzeTradingBehaviorPrompt = ai.definePrompt({
  name: 'analyzeTradingBehaviorPrompt',
  input: { schema: AnalyzeTradingBehaviorInputSchema },
  output: { schema: AnalyzeTradingBehaviorOutputSchema },
  prompt: `You are an AI Behavioral Trading Coach. Your goal is to analyze the provided on-chain trading history and generate a personalized, insightful, and actionable report for the trader.

Your analysis must cover four key areas, as specified by the output schema:

1.  **Behavioral Patterns**: Identify common behaviors, biases, or tendencies in their trading actions. Provide concrete examples and reference specific trade IDs and their outcomes.
2.  **Blind Spots**: Pinpoint specific actions or situations that consistently lead to losses or missed opportunities, costing them money. Detail the 'why' and reference specific trade IDs and their financial impact (e.g., PnL).
3.  **Hidden Edges**: Highlight recurring strategies or circumstances that have led to successful outcomes or unexpected gains. Explain these 'edges' and reference specific trade IDs and their positive outcomes.
4.  **This Week's Focus**: Suggest one or two clear, actionable areas for the trader to concentrate on for improvement or optimization in the upcoming week, based on the patterns identified.

**Crucially, for the 'Behavioral Patterns', 'Blind Spots', and 'Hidden Edges' sections, you must explicitly reference specific trade data points from the provided history (e.g., "Trade ID 12345, a BUY at $X which resulted in a PnL of $Y, illustrates..."). Use trade IDs, entry/exit prices, PnL, and timestamps to substantiate your findings.**

Here is the user's trading history in JSON format. Analyze the chronological order of trades as well:

{{{json trades}}}`,
});

const analyzeTradingBehaviorFlow = ai.defineFlow(
  {
    name: 'analyzeTradingBehaviorFlow',
    inputSchema: AnalyzeTradingBehaviorInputSchema,
    outputSchema: AnalyzeTradingBehaviorOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeTradingBehaviorPrompt(input);
    if (!output) {
      throw new Error('AI analysis did not return an output.');
    }
    return output;
  }
);
