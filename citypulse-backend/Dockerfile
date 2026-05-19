FROM node:20-slim

# Habilitar corepack para gestionar pnpm de forma nativa
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar los manifiestos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar todas las dependencias del proyecto
RUN pnpm install --frozen-lockfile

# Copiar el resto del código fuente del backend
COPY . .

# Generar el cliente de Prisma para interactuar con Supabase
RUN pnpm prisma generate

# Exponer el puerto en el que escucha la API de Node/Express
EXPOSE 3000

# Comando para iniciar el servidor de WebSockets y la API
CMD ["pnpm", "start"]