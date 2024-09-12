FROM node:18.17.1

LABEL maintainer="rosen-bridge team <team@rosen.tech>"
LABEL description="Docker image for the watcher service owned by rosen-bridge organization."
LABEL org.label-schema.vcs-url="https://github.com/rosen-bridge/watcher-service"

RUN adduser --disabled-password --home /app --uid 3000 --gecos "ErgoPlatform" ergo && \
    install -m 0740 -o ergo -g ergo -d /app/logs \
    && chown -R ergo:ergo /app/ && umask 0077
USER ergo

WORKDIR /app/services/watcher
# TODO: Add layer optimizations when at least one package is added to the monorepo
# https://git.ergopool.io/ergo/rosen-bridge/watcher/-/issues/131
COPY --chmod=700 --chown=ergo:ergo . .
RUN npm ci

ENV NODE_ENV=production
ENV SERVICE_PORT=3000
EXPOSE 3000

ENTRYPOINT ["npm", "run", "start"]
