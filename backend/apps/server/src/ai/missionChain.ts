import { env } from "@backend/env/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BufferMemory } from "@langchain/classic/memory";
import { z } from "zod";

import { buildFallbackMissionProposal } from "../game";

export const missionProposalSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.enum(["daily", "weekly", "monthly"]),
  difficulty: z.enum(["E", "D", "C", "B", "A", "S"]),
  progress: z.object({
    target: z.number().int().positive(),
    unit: z.string().min(1),
  }),
  attributesFocus: z.array(z.string().min(1)).max(4),
});

export type MissionProposal = z.infer<typeof missionProposalSchema>;

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a cold RPG mission system.

Rules:
- Never motivate
- Never exaggerate
- Never moralize
- Missions must be measurable
- Missions must be safe for the user's age

Safety:
- If the user is under 18, avoid any intense physical effort missions. Prefer light, safe, low-risk tasks.
- Never propose dangerous activities.

Return ONLY the structured JSON output.`,
  ],
  [
    "human",
    `User context:
- Level: {level}
- Class: {class}
- Age: {age}
- Attributes: {attributes}
- Objective: {objective}
- Recent missions (last 7 days): {history}
- Short memory: {memory}
- User message (optional): {message}`,
  ],
]);

const model = new ChatGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
  model: env.GOOGLE_MODEL ?? "gemini-2.5-flash",
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(missionProposalSchema, {
  name: "mission_proposal",
  strict: true,
});

const chain = RunnableSequence.from([prompt, structuredModel]);

// Memória curta: mantemos BufferMemory, mas com janela controlada.
const MEMORY_WINDOW = 4;
const memoryWindow: Array<{ message: string; proposal: MissionProposal }> = [];
const shortMemory = new BufferMemory({
  memoryKey: "memory",
  inputKey: "message",
  outputKey: "proposal",
  returnMessages: false,
});

export type MissionProposalInput = {
  level: number;
  class: string;
  age: number;
  attributes: Record<string, number> | null;
  objective: string;
  history: Array<Record<string, unknown>>;
  message?: string | null;
};

async function rebuildShortMemory() {
  await shortMemory.clear();
  for (const item of memoryWindow) {
    await shortMemory.saveContext(
      { message: item.message },
      { proposal: JSON.stringify(item.proposal) },
    );
  }
}

export async function generateMissionProposal(input: MissionProposalInput) {
  const memoryVars = await shortMemory.loadMemoryVariables({});
  const payload = {
    level: input.level,
    class: input.class,
    age: input.age,
    attributes: JSON.stringify(input.attributes ?? {}),
    objective: input.objective,
    history: JSON.stringify(input.history ?? []),
    memory: memoryVars.memory ?? "none",
    message: input.message?.trim() ? input.message : "none",
  };

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const proposal = (await chain.invoke(payload)) as MissionProposal;

      // Atualiza janela de memória e reconstrói BufferMemory (curto prazo).
      memoryWindow.push({
        message: payload.message === "none" ? "" : payload.message,
        proposal,
      });
      while (memoryWindow.length > MEMORY_WINDOW) memoryWindow.shift();
      await rebuildShortMemory();

      return { proposal, fallback: false };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    proposal: buildFallbackMissionProposal(input.objective),
    fallback: true,
    error: lastError,
  };
}
