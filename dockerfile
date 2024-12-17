FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci ; npm cache clean --force

COPY . .

EXPOSE 80

ENTRYPOINT [ "npm","start"]