FROM node:16.14 AS builder

LABEL maintainer="rosen-bridge team <team@rosen.tech>"
LABEL description="Docker image for the watcher service owned by rosen-bridge organization."
LABEL org.label-schema.vcs-url="https://github.com/rosen-bridge/ts-guard-service"

COPY  package*.json ./
RUN npm ci && npm install yamljs
COPY --chmod=700 --chown=ergo:ergo . .
RUN npx yaml2json --pretty --save config/default.yaml \
    && npx yaml2json --pretty --save config/production.yaml \
    && npx yaml2json --pretty --save config/custom-environment-variables.yaml \
    && npm run release && chmod +x ./bin/index && mv ./bin/index watcher-service

FROM ubuntu:20.04 AS runtime

WORKDIR /app

RUN adduser --disabled-password --home /app --uid 3000 --gecos "ErgoPlatform" ergo && \
    install -m 0740 -o ergo -g ergo -d /app/logs \
    && chown -R ergo:ergo /app/ && umask 0077
USER ergo

COPY --from=builder --chmod=700 --chown=ergo:ergo watcher-service config ./

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["./watcher-service"]
