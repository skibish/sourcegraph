FROM sourcegraph/builder:475db17a4b@sha256:79b1b11d7f622bf4e35979254348163bc2e7dc4353e7103aa23f7e1c46ea56a4 as builder

ARG CTAGS_VERSION="03f933a96d3ef87adbf9d167462d45ce69577edb"
ENV CTAGS_VERSION ${CTAGS_VERSION}

ENV OUTPUT_DIR=/output
RUN mkdir -p ${OUTPUT_DIR}

WORKDIR /src
COPY . .
RUN internal/pkg/ctags/build.sh

WORKDIR /
COPY .ctags.d /.ctags.d

FROM alpine:3.9@sha256:644fcb1a676b5165371437feaa922943aaf7afcfa8bfee4472f6860aad1ef2a0

COPY --from=builder /output/bin/universal-* /usr/local/bin/
