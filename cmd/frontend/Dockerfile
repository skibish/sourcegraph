FROM sourcegraph/builder:f0477ccc01@sha256:0f14baa016789955064b62519d15cd2f5787eb266bee6fef29e8aac7d77ed6e0 as builder

ARG VERSION="unknown"
ENV VERSION ${VERSION}

ARG FRONTEND_PKG="github.com/sourcegraph/sourcegraph/cmd/frontend"
ENV FRONTEND_PKG ${FRONTEND_PKG}

ARG PRE_BUILD_SCRIPT="cmd/frontend/pre-build.sh"

ENV OUTPUT_DIR=/output
RUN mkdir -p ${OUTPUT_DIR}

WORKDIR /src
COPY . .

# Start postgres (for the dev/generate.sh scripts)
# hadolint ignore=DL3004
RUN sudo -u postgres -E /usr/lib/postgresql/9.6/bin/pg_ctl initdb
# hadolint ignore=DL3004
RUN sudo -u postgres -E /usr/lib/postgresql/9.6/bin/pg_ctl start

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
