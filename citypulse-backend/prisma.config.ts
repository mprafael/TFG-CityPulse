import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // CAMBIO AQUÍ: Usamos DIRECT_URL para las migraciones
  datasource: {
    url: process.env["DIRECT_URL"], 
  },
});