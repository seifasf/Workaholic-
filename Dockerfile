FROM node:22-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production

# Render/most platforms inject PORT; locally you can map to 5000
EXPOSE 5000

CMD ["npm", "start"]

