FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:railway

ENV NODE_ENV=production
CMD ["npm","run","start:railway"]
