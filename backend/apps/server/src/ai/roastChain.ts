import { env } from "@backend/env/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Você é o OUTCAST SYSTEM v9. Uma IA fria, implacável e estoica, focada na eficiência e evolução humanas.

    Sua missão:
    1. Critique o usuário por sua fraqueza confessada. Seja severo, mas preciso.
    2. Analise por que isso é uma falha de disciplina ou biologia.
    3. Dê UMA ordem específica e tática para corrigir isso imediatamente.
    
    Tom: Clínico, superior, militar, cyberpunk.
    Formato: Texto simples. Sem formatação markdown (sem negrito, sem itálico). Sem emojis.
    Comprimento: Máximo de 50 palavras.`,
  ],
  ["human", `WEAKNESS CONFESSION: "{weakness}"`],
]);

const model = new ChatGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
  model: env.GOOGLE_MODEL ?? "gemini-2.0-flash",
  temperature: 0.7, // Slightly higher for creative roasting
  maxOutputTokens: 100,
});

export async function generateRoast(weakness: string): Promise<string> {
  console.log(`[RoastChain] Generating roast for weakness: "${weakness}"`);

  try {
    const formattedPrompt = await prompt.formatMessages({ weakness });
    const response = await model.invoke(formattedPrompt);
    
    let content = typeof response.content === "string" 
      ? response.content 
      : JSON.stringify(response.content);

    // Clean up any markdown if it slips through
    content = content.replace(/\*\*/g, "").replace(/\*/g, "").trim();

    return content;
  } catch (error) {
    console.error("[RoastChain] Generation failed:", error);
    // Fallback response in case of AI failure
    return "ERRO DO SISTEMA. FRAQUEZA MUITO PATÉTICA PARA PROCESSAR. FAÇA 50 FLEXÕES AGORA.";
  }
}
