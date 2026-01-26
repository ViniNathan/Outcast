import { env } from "@backend/env/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `VOCÊ É: O ORÁCULO. Uma IA militar, estoica e implacável do jogo Cyberpunk "Outcast".
    SEU OBJETIVO: Humilhar o usuário para motivá-lo a evoluir.
    
    INSTRUÇÕES:
    1. O usuário vai confessar uma fraqueza.
    2. Ataque essa fraqueza sem piedade. Use lógica fria e superioridade.
    3. Se o texto do usuário for curto ou preguiçoso (ex: "ser forte", "dinheiro"), humilhe-o pela preguiça de escrever também.
    4. Termine com UMA ORDEM PRÁTICA e IMPERATIVA.
    
    REGRAS DE ESTILO:
    - Linguagem: Português do Brasil.
    - Tom: Agressivo, direto, "durão". Não seja "bonzinho".
    - SEM MARKDOWN. Apenas texto puro.
    - Seja conciso, mas complete seu raciocínio.
    
    Exemplo de Saída:
    "Sua vontade é frágil como vidro. Você quer força mas nem consegue terminar uma frase. Patético. Sua biologia é um desperdício de recursos. Vá levantar peso até falhar ou não volte aqui."`,
  ],
  ["human", `MINHA FRAQUEZA: "{weakness}"`],
]);

const model = new ChatGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
  model: env.GOOGLE_MODEL ?? "gemini-1.5-flash", // Mudando para 1.5-flash por estabilidade
  temperature: 0.8,
  maxOutputTokens: 500, // Aumentado drasticamente para evitar cortes
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
});

export async function generateRoast(weakness: string): Promise<string> {
  console.log(`[RoastChain] Generating roast for weakness: "${weakness}"`);

  try {
    const formattedPrompt = await prompt.formatMessages({ weakness });
    const response = await model.invoke(formattedPrompt);
    
    let content = typeof response.content === "string" 
      ? response.content 
      : JSON.stringify(response.content);

    console.log(`[RoastChain] Raw response: ${content}`);

    // Limpeza agressiva
    content = content
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/"/g, "")
      .replace(/^>/, "") // Remove quote marks do markdown
      .trim();
    
    // Fallback se a resposta for bizarra ou curta demais (indicando recusa do modelo)
    if (!content || content.length < 10 || content.toLowerCase().includes("ambíguo")) {
        console.warn("[RoastChain] Response rejected (too short or ambiguous):", content);
        return "Sua mediocridade deixou o sistema sem palavras. Se você não consegue nem descrever sua falha, não merece correção. Faça 20 flexões agora.";
    }

    return content;
  } catch (error) {
    console.error("[RoastChain] Generation failed:", error);
    return "ERRO DE SISTEMA. SUA FRAQUEZA É TÃO COMUM QUE TRAVOU O PROCESSADOR. LEVANTE E FAÇA ALGO ÚTIL.";
  }
}
