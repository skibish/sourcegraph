FROM sourcegraph/builder:f0477ccc01@sha256:0f14baa016789955064b62519d15cd2f5787eb266bee6fef29e8aac7d77ed6e0 as builder

# Overridable package paths for when this script is called externally by
# our enterprise build scripts
ARG FRONTEND_PKG="github.com/sourcegraph/sourcegraph/cmd/frontend"
ENV FRONTEND_PKG ${FRONTEND_PKG}

ARG MANAGEMENT_CONSOLE_PKG="github.com/sourcegraph/sourcegraph/cmd/management-console"
ENV MANAGEMENT_CONSOLE_PKG ${MANAGEMENT_CONSOLE_PKG}

ARG REPO_UPDATER_PKG="github.com/sourcegraph/sourcegraph/cmd/repo-updater"
ENV REPO_UPDATER_PKG ${REPO_UPDATER_PKG}

ARG SERVER_PKG="github.com/sourcegraph/sourcegraph/cmd/server"
ENV SERVER_PKG ${SERVER_PKG}

ARG CTAGS_VERSION="03f933a96d3ef87adbf9d167462d45ce69577edb"
ENV CTAGS_VERSION ${CTAGS_VERSION}

ARG VERSION="unknown"
ENV VERSION ${VERSION}

ENV OUTPUT_DIR=/output
RUN mkdir -p ${OUTPUT_DIR}

ARG PRE_BUILD_SCRIPT="cmd/server/pre-build.sh"

# Set the default python version to 2.7
# (for the management-console's node-sass depdendency)
RUN ln -s /usr/bin/python2.7 /usr/bin/python

# Start postgres (for the dev/generate.sh scripts)
# hadolint ignore=DL3004
RUN sudo -u postgres -E /usr/lib/postgresql/9.6/bin/pg_ctl initdb
# hadolint ignore=DL3004
RUN sudo -u postgres -E /usr/lib/postgresql/9.6/bin/pg_ctl -D start

ENV PGUSER postgres
ENV PGDATA /var/lib/pgsql/data
ENV PGDATABASE postgres
ENV PGSSLMODE disable

WORKDIR /src
COPY . .

RUN ${PRE_BUILD_SCRIPT}
RUN ./cmd/server/build.sh

FROM alpine:3.10@sha256:72c42ed48c3a2db31b7dafe17d275b634664a708d901ec9fd57b1529280f01fb AS lsif-builder

# hadolint ignore=DL3018
RUN apk add --no-cache bash nodejs-current=12.4.0-r0 nodejs-npm=10.16.3-r0
RUN npm install -g yarn@1.17.3

WORKDIR /output/lsif
COPY lsif .

RUN ./build.sh

# TODO: Make this image use our sourcegraph/alpine:3.9 base image (3.10?).
FROM alpine:3.10@sha256:72c42ed48c3a2db31b7dafe17d275b634664a708d901ec9fd57b1529280f01fb

ARG COMMIT_SHA="unknown"
ARG DATE="unknown"
ARG VERSION="unknown"

LABEL org.opencontainers.image.revision=${COMMIT_SHA}
LABEL org.opencontainers.image.created=${DATE}
LABEL org.opencontainers.image.version=${VERSION}
LABEL com.sourcegraph.github.url=https://github.com/sourcegraph/sourcegraph/commit/${COMMIT_SHA}

RUN echo "@edge http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories && \
    echo "@edge http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    echo "@edge http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
    echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories && \
    echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
    echo "http://dl-cdn.alpinelinux.org/alpine/v3.6/main" >> /etc/apk/repositories && \
    echo "http://dl-cdn.alpinelinux.org/alpine/v3.6/community" >> /etc/apk/repositories

# hadolint ignore=DL3018
RUN apk update && apk add --no-cache \
    # NOTE that the Postgres version we run is different
    # from our *Minimum Supported Version* which alone dictates
    # the features we can depend on. See this link for more information:
    # https://github.com/sourcegraph/sourcegraph/blob/master/doc/dev/postgresql.md#version-requirements
    'bash=5.0.0-r0' 'postgresql-contrib=11.5-r1' 'postgresql=11.5-r1' \
    'redis=3.2.12-r0' bind-tools ca-certificates git@edge \
    mailcap nginx openssh-client pcre su-exec tini nodejs-current=12.4.0-r0

# IMPORTANT: If you update the syntect_server version below, you MUST confirm
# the ENV variables from its Dockerfile (https://github.com/sourcegraph/syntect_server/blob/master/Dockerfile)
# have been appropriately set in cmd/server/shared/shared.go.
# hadolint ignore=DL3022
COPY --from=comby/comby:0.7.0@sha256:7e4995f7c294f447d0b06e3854a829126b210da9a64cbe32154fbe4468659e20 /usr/local/bin/comby /usr/local/bin/comby
# hadolint ignore=DL3022
COPY --from=sourcegraph/syntect_server:5e1efbb@sha256:6ec136246b302a6c8fc113f087a66d5f9a89a9f5b851e9abb917c8b5e1d8c4b1 /syntect_server /usr/local/bin/
COPY --from=builder /output/bin/universal-* /usr/local/bin/
# hadolint ignore=DL3022
COPY --from=lsif-builder /output/lsif /lsif

# hadolint ignore=DL3022
COPY --from=sourcegraph/prometheus:10.0.0@sha256:aca8cf12d41cbf5d8885ed675fa017b83ad73af96d86bbe5bcead45ca8e958f3 /bin/prometheus /usr/local/bin
# hadolint ignore=DL3022
COPY --from=sourcegraph/prometheus:10.0.0@sha256:aca8cf12d41cbf5d8885ed675fa017b83ad73af96d86bbe5bcead45ca8e958f3 /usr/share/prometheus /usr/share/prometheus

# hadolint ignore=DL3018
RUN set -eux && \
    addgroup -S grafana && \
    adduser -S -G grafana grafana && \
    apk add --no-cache libc6-compat=1.1.23-r3 ca-certificates su-exec

# hadolint ignore=DL3022
COPY --from=sourcegraph/grafana:10.0.0@sha256:f84e4260dce4e36f5d5e9c6deb393ac1e9c930ffae622c432fa86640a1f2699f /usr/share/grafana /usr/share/grafana

# hadolint ignore=DL3022
COPY --from=builder /output/pcre.so /libsqlite3-pcre.so
ENV LIBSQLITE3_PCRE /libsqlite3-pcre.so

COPY --from=builder /output /

RUN echo "hosts: files dns" > /etc/nsswitch.conf

ENV GO111MODULES=on LANG=en_US.utf8
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/server"]
