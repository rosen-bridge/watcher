FROM node:16.14.2

LABEL maintainer="rosen-bridge team <team@rosen.tech>"
LABEL description="Docker image for the watcher service owned by rosen-bridge organization."
LABEL org.label-schema.vcs-url="https://github.com/rosen-bridge/watcher"

RUN adduser --disabled-password --home /app --uid 3000 --gecos "ErgoPlatform" ergo && \
    install -m 0740 -o ergo -g ergo -d /app/logs \
    && chown -R ergo:ergo /app/ && umask 0077
USER ergo

WORKDIR /app
COPY --chmod=700 --chown=ergo:ergo package*.json ./
RUN npm i
COPY --chmod=700 --chown=ergo:ergo . .

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["npm", "run", "start"]
