# ── Stage: production image ──
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (layer caching — only reinstalls when deps change)
COPY backend/package.json package-lock.json* ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy the rest of the backend source
COPY backend/ .

#Copy frontend code
COPY frontend/ ./frontend

# Expose the port the app runs on
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]