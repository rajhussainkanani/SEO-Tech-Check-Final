# Frontend build stage
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY ../frontend/package*.json ./
RUN npm i --legacy-peer-deps && \
    npm i ajv@8.12.0 ajv-keywords@5.1.0 && \
    npm cache clean --force
COPY ../frontend .

# Set environment variable for React build
ENV REACT_APP_API_URL=/api

RUN npm run build

# Backend build stage
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .

# Final stage
FROM node:18-alpine
WORKDIR /app
COPY --from=backend-build /app/backend .
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('https://zm32ek2v4y.us-east-1.awsapprunner.com/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]
