FROM node:20-alpine

WORKDIR /app

COPY website/package*.json ./
RUN npm ci

COPY website/ ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]