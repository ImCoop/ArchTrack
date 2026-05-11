FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install

COPY apps/frontend apps/frontend

WORKDIR /app/apps/frontend
EXPOSE 5173
CMD ["npm", "run", "dev"]
