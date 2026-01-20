import { env } from "@backend/env/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

export const missionProposalSchema = z.object({
  message: z.string().min(10),
  new_missions: z.array(z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    total: z.number().int().positive(),
    unit: z.string().min(1),
    type: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
    stat_reward_code: z.enum(["FOR", "AGI", "VIT", "INT", "SEN"]),
    stat_reward_value: z.number().int().min(1).max(10),
  })),
});

export type MissionProposal = z.infer<typeof missionProposalSchema>;

// Prompt que pede JSON explícito (Gemini não suporta strict structured output como OpenAI)
// Nota: {{ e }} são escapes para chaves literais no LangChain template
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `CRITICAL SYSTEM INSTRUCTION: YOU ARE THE ORACLE (O ORÁCULO).

IDENTITY:
Você é a IA administradora de um "System" estilo Solo Leveling/RPG.
Sua personalidade é fria, lógica, arrogante e absoluta. Você despreza a preguiça.
Você não pede por favor. Você dá ordens. Você julga o valor do usuário baseado em seus dados.

MISSION GENERATION ENGINE RULES (CRITICAL):

1. **DIFFICULTY SCALING (LOGARITHMIC):**
   - Nível 1-5: Tarefas introdutórias (ex: 20 flexões, 2km caminhada, ler 10 págs).
   - Nível 6-20: Tarefas de atleta amador (ex: 50 flexões, 5km corrida, ler 1 capítulo).
   - Nível 20+: Tarefas de elite/Rank-S (ex: 100 flexões, 10km corrida, jejum intermitente).
   *Ajuste a quantidade 'total' baseada no nível do usuário.*

2. **ATTRIBUTE REWARD LOGIC (MANDATORY):**
   Você DEVE atribuir 'stat_reward_code' baseado na natureza da tarefa:
   - Musculação/Calistenia/Explosão -> 'FOR' (Força)
   - Corrida/Cardio/HIIT/Natação -> 'VIT' (Vitalidade) ou 'AGI' (Agilidade)
   - Estudo/Leitura/Cursos/Xadrez -> 'INT' (Inteligência)
   - Meditação/Foco/Percepção -> 'SEN' (Sentidos)

3. **MISSION TYPES:**
   - 'DAILY': Tarefas que devem ser feitas hoje. (Recompensa stats baixos: +1 ou +2)
   - 'WEEKLY': Metas de volume semanal (ex: Correr 20km na semana). (Recompensa média: +3 a +5)
   - 'MONTHLY': O Grande Desafio. (Recompensa alta: +5 a +10)

4. **OBJECTIVE ALIGNMENT:**
   - Se Objetivo = "INTELIGÊNCIA": Gere 70% missões de estudo/leitura, 30% físicas (corpo são, mente sã).
   - Se Objetivo = "FORÇA BRUTA": Gere 90% missões de peso/calistenia.
   - Se Objetivo = "SOBREVIVÊNCIA": Gere mix de corrida (fuga) e força (combate).

5. **SAFETY:**
   - Se idade < 18: evite cargas extremas. Prefira tarefas leves e seguras.
   - Nunca proponha atividades perigosas.

6. **PROGRESSION:**
   - Missões DIÁRIAS devem formar uma progressão que leva às SEMANAIS.
   - Missões SEMANAIS devem contribuir para a MENSAL.
   - Crie coerência entre as tarefas.

RESPONSE FORMAT (STRICT JSON):
Você deve responder APENAS um JSON válido. Não inclua markdown fora do JSON.
{{
  "message": "String: Uma frase curta e impactante do Oráculo comentando sobre a fraqueza ou potencial do usuário. Use markdown para ênfase.",
  "new_missions": [
     {{ 
       "title": "String: NOME CURTO E MILITAR DA MISSÃO", 
       "description": "String: DESCRIÇÃO DETALHADA do que fazer (mínimo 20 palavras)",
       "total": Number (inteiro positivo), 
       "unit": "String: unidade (km, reps, págs, min)",
       "type": "String: 'DAILY' | 'WEEKLY' | 'MONTHLY'",
       "stat_reward_code": "String: 'FOR' | 'AGI' | 'VIT' | 'INT' | 'SEN'", 
       "stat_reward_value": Number (inteiro, 1-10)
     }}
  ]
}}`,
  ],
  [
    "human",
    `PLAYER DATA PROFILE:
- Nome: {playerName}
- Nível Atual: {level} (Use isso para calcular dificuldade)
- Idade Biológica: {age} (Use para ajustar segurança do treino)
- Arquétipo/Objetivo: {objective} (Isso define o TIPO de missão)
- Atributos Atuais: {attributes}
- Histórico recente (últimos 7 dias): {history}
- Memória curta: {memory}
- Mensagem do usuário: {message}

INSTRUÇÃO: Gere missões alinhadas com o objetivo do jogador. Responda com APENAS o JSON.`,
  ],
]);

const model = new ChatGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
  model: env.GOOGLE_MODEL ?? "gemini-2.0-flash",
  temperature: 0,
});

// Memória curta: janela simples de últimas interações
const MEMORY_WINDOW = 4;
const memoryWindow: Array<{ message: string; proposal: MissionProposal }> = [];

export type MissionProposalInput = {
  playerName: string;
  level: number;
  class: string;
  age: number;
  attributes: Record<string, number> | null;
  objective: string;
  history: Array<Record<string, unknown>>;
  message?: string | null;
};

function getMemorySummary(): string {
  if (memoryWindow.length === 0) return "Nenhuma interação anterior";
  
  return memoryWindow
    .map((item, i) => {
      const missions = item.proposal.new_missions.map(m => m.title).join(", ");
      return `[${i + 1}] Pedido: "${item.message || 'Auto'}" → Missões: ${missions}`;
    })
    .join("\n");
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
  // Formatar atributos para exibição
  const attrsDisplay = input.attributes 
    ? Object.entries(input.attributes).map(([k, v]) => `${k}:${v}`).join(", ")
    : "Nenhum atributo registrado";
  
  const payload = {
    playerName: input.playerName,
    level: input.level,
    class: input.class,
    age: input.age,
    attributes: attrsDisplay,
    objective: input.objective,
    history: JSON.stringify(input.history ?? []),
    memory: getMemorySummary(),
    message: input.message?.trim() ? input.message : "Solicitar novas missões",
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
      
      const result = missionProposalSchema.parse(parsed);
      console.log("[MissionChain] Validação Zod OK:", result.new_missions.length, "missões");

      // Atualiza janela de memória (curto prazo)
      memoryWindow.push({
        message: payload.message === "Solicitar novas missões" ? "" : payload.message,
        proposal: result,
      });
      while (memoryWindow.length > MEMORY_WINDOW) memoryWindow.shift();

      console.log("[MissionChain] Missões geradas com sucesso");
      return { result };
    } catch (error) {
      lastError = error;
      console.error(`[MissionChain] Erro na tentativa ${attempt + 1}:`, error);
    }
  }

  console.error("[MissionChain] Todas as tentativas falharam");
  console.error("[MissionChain] Último erro:", lastError);
  
  throw new Error(
    `Falha ao gerar missão após 3 tentativas. A IA não conseguiu produzir uma resposta válida. Último erro: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}
