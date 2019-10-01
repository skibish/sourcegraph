# This Dockerfile was generated from github.com/sourcegraph/godockerize. It
# was not written by a human, and as such looks janky. As you change this
# file, please don't be scared to make it more pleasant / remove hadolint
# ignores.

FROM sourcegraph/builder:a9bc56959f@sha256:25d9a6e484e322e1de6390b1712f9fee255af16c9752c00d14613bf6f50c8f1d as builder

ARG REPO_UPDATER_PKG="github.com/sourcegraph/sourcegraph/cmd/repo-updater"
ENV REPO_UPDATER_PKG ${REPO_UPDATER_PKG}

ARG VERSION="unknown"
ENV VERSION ${VERSION}

ENV OUTPUT_DIR=/output
RUN mkdir -p ${OUTPUT_DIR}

WORKDIR /src
COPY . .

RUN ./cmd/repo-updater/build.sh

FROM sourcegraph/alpine:3.9@sha256:e9264d4748e16de961a2b973cc12259dee1d33473633beccb1dfb8a0e62c6459

ARG COMMIT_SHA="unknown"
ARG DATE="unknown"
ARG VERSION="unknown"

LABEL org.opencontainers.image.revision=${COMMIT_SHA}
LABEL org.opencontainers.image.created=${DATE}
LABEL org.opencontainers.image.version=${VERSION}
LABEL com.sourcegraph.github.url=https://github.com/sourcegraph/sourcegraph/commit/${COMMIT_SHA}

USER sourcegraph
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/repo-updater"]
COPY --from=builder /output/usr/local/bin/repo-updater /usr/local/bin/
