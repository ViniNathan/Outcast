import { env } from "@backend/env/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
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

// Prompt que pede JSON explícito (Gemini não suporta strict structured output como OpenAI)
// Nota: {{ e }} são escapes para chaves literais no LangChain template
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

You MUST respond with ONLY a valid JSON object matching this exact schema (no markdown, no explanation):
{{
  "title": "string (min 3 chars)",
  "description": "string (min 10 chars)",
  "category": "daily" | "weekly" | "monthly",
  "difficulty": "E" | "D" | "C" | "B" | "A" | "S",
  "progress": {{
    "target": number (positive integer),
    "unit": "string (min 1 char)"
  }},
  "attributesFocus": ["string"] (max 4 items, from: discipline, strength, focus, consistency)
}}`,
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
- User message (optional): {message}

Generate ONE mission. Respond with ONLY the JSON object.`,
  ],
]);

const model = new ChatGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
  model: env.GOOGLE_MODEL ?? "gemini-2.0-flash",
  temperature: 0,
});

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

function extractJsonFromResponse(text: string): unknown {
  // Tenta extrair JSON de blocos de código ou do texto direto
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch?.[1]) {
    return JSON.parse(codeBlockMatch[1].trim());
  }
  // Tenta encontrar o primeiro { e último }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }
  return JSON.parse(text);
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

  console.log("[MissionChain] Iniciando geração de missão...");
  console.log("[MissionChain] Payload:", JSON.stringify(payload, null, 2));

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    console.log(`[MissionChain] Tentativa ${attempt + 1}/3`);
    try {
      // Invoca o prompt e modelo diretamente (sem structured output)
      const formattedPrompt = await prompt.formatMessages(payload);
      console.log("[MissionChain] Prompt formatado, invocando modelo...");
      
      const response = await model.invoke(formattedPrompt);
      const content = typeof response.content === "string" 
        ? response.content 
        : JSON.stringify(response.content);
      
      console.log("[MissionChain] Resposta do modelo:", content.slice(0, 500));
      
      // Parseia e valida com Zod
      const parsed = extractJsonFromResponse(content);
      console.log("[MissionChain] JSON extraído:", JSON.stringify(parsed, null, 2));
      
      const proposal = missionProposalSchema.parse(parsed);
      console.log("[MissionChain] Validação Zod OK:", proposal.title);

      // Atualiza janela de memória e reconstrói BufferMemory (curto prazo).
      memoryWindow.push({
        message: payload.message === "none" ? "" : payload.message,
        proposal,
      });
      while (memoryWindow.length > MEMORY_WINDOW) memoryWindow.shift();
      await rebuildShortMemory();

      console.log("[MissionChain] Missão gerada com sucesso (fallback=false)");
      return { proposal, fallback: false };
    } catch (error) {
      lastError = error;
      console.error(`[MissionChain] Erro na tentativa ${attempt + 1}:`, error);
    }
  }

  console.error("[MissionChain] Todas as tentativas falharam, usando fallback");
  console.error("[MissionChain] Último erro:", lastError);
  
  return {
    proposal: buildFallbackMissionProposal(input.objective),
    fallback: true,
    error: lastError,
  };
}
