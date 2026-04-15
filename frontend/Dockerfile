FROM node:20-alpine

WORKDIR /app

# Copy the frontend project
COPY website/package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the project
COPY website/ .

# Vite dev server port
EXPOSE 5173

# Start the dev server
CMD ["npm", "run", "dev", "--", "--host"]