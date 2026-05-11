FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm install

COPY apps/backend apps/backend

WORKDIR /app/apps/backend
EXPOSE 4000
CMD ["npm", "run", "dev"]
