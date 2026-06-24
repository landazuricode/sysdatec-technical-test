FROM node:24-alpine AS development-dependencies-env
RUN apk add --no-cache openssl
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
RUN apk add --no-cache openssl
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev --ignore-scripts

FROM node:24-alpine AS build-env
RUN apk add --no-cache openssl
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:24-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY ./package.json package-lock.json ./
COPY --from=production-dependencies-env /app/node_modules ./node_modules
COPY --from=development-dependencies-env /app/node_modules/prisma ./node_modules/prisma
COPY --from=development-dependencies-env /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=development-dependencies-env /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=build-env /app/build ./build
COPY --from=build-env /app/prisma ./prisma
COPY --from=build-env /app/generated ./generated
COPY --from=build-env /app/prisma.config.ts ./prisma.config.ts
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "start"]
