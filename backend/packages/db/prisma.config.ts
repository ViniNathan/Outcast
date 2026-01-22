import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

dotenv.config({
  path: "../../apps/server/.env",
});

// Durante o build (ex: Railway), DIRECT_URL pode não estar disponível
// Usa DATABASE_URL como fallback (o Prisma generate não precisa conectar de fato)
// O Prisma só precisa validar a sintaxe da URL durante o generate
// Se nenhuma estiver disponível, usa uma URL dummy válida (apenas para validação de sintaxe)
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "⚠️  DIRECT_URL e DATABASE_URL não encontradas. Usando URL dummy para prisma generate."
  );
}

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    // Usa a URL disponível ou uma dummy válida apenas para validação de sintaxe
    url: databaseUrl || "postgresql://dummy:dummy@localhost:5432/dummy",
  },
});
