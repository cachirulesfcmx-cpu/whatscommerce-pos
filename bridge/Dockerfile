FROM node:20-slim

WORKDIR /app

# Install deps
COPY package.json ./
RUN npm install --omit=dev

# App code
COPY index.js ./

# Persist the WhatsApp session here — mount a volume at /app/auth
ENV AUTH_DIR=/app/auth
VOLUME ["/app/auth"]

EXPOSE 8080
CMD ["node", "index.js"]
