FROM node:20-slim

# 1. Instalar pnpm de la forma clásica y a prueba de fallos
RUN npm install -g pnpm

WORKDIR /app

# 2. El asterisco (*) es clave: copia el lockfile SOLO si existe en GitHub, si no, no da error
COPY package.json pnpm-lock.yaml* ./

# 3. Instalamos de forma normal (sin --frozen-lockfile para evitar caídas)
RUN pnpm install

# 4. Copiamos el resto de tu código
COPY . .

# 5. Generamos Prisma (vital para conectarse a Supabase)
RUN pnpm prisma generate

# 6. Exponemos el puerto
EXPOSE 3000

# 7. Arrancamos el servidor
CMD ["pnpm", "start"]