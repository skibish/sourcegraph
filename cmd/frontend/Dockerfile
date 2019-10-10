FROM sourcegraph/builder:2d297a9c7f@sha256:60a17014bded94514c4e974ec69c2b9857ba26e6c73d8bec13bc13045a088d3e as builder

ARG VERSION="unknown"
ENV VERSION ${VERSION}

ARG FRONTEND_PKG="github.com/sourcegraph/sourcegraph/cmd/frontend"
ENV FRONTEND_PKG ${FRONTEND_PKG}

ARG PRE_BUILD_SCRIPT="cmd/frontend/pre-build.sh"

ENV OUTPUT_DIR=/output
RUN mkdir -p ${OUTPUT_DIR}

WORKDIR /src
COPY . .

RUN ${PRE_BUILD_SCRIPT}
RUN cmd/frontend/build.sh

FROM sourcegraph/alpine:3.9@sha256:e9264d4748e16de961a2b973cc12259dee1d33473633beccb1dfb8a0e62c6459

ARG COMMIT_SHA="unknown"
ARG DATE="unknown"
ARG VERSION="unknown"

LABEL org.opencontainers.image.revision=${COMMIT_SHA}
LABEL org.opencontainers.image.created=${DATE}
LABEL org.opencontainers.image.version=${VERSION}
LABEL com.sourcegraph.github.url=https://github.com/sourcegraph/sourcegraph/commit/${COMMIT_SHA}

ENV CONFIGURATION_MODE=server PGDATABASE=sg PGHOST=pgsql PGPORT=5432 PGSSLMODE=disable PGUSER=sg PUBLIC_REPO_REDIRECTS=true
USER sourcegraph
CMD ["serve"]
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/frontend"]
COPY --from=builder /output/frontend /usr/local/bin/
