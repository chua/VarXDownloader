FROM node:18-alpine3.17 as deps

WORKDIR /app
COPY package*.json ./

RUN npm install


#############################################
FROM node:18-alpine3.17 as tester

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run test


#############################################
FROM node:18-alpine3.17 as compiler

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


#############################################
FROM node:18-alpine3.17 as prod-deps

WORKDIR /app
COPY package*.json ./

RUN npm install --omit=dev


#############################################
FROM node:18-alpine3.17 as runner

WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=compiler /app/dist .


#ARG NODE_ENV=production
#ENV NODE_ENV=${NODE_ENV}
#EXPOSE 3000

#CMD [ "ls" ]
CMD ["node", "main.js"]





