FROM sourcegraph/builder:f0477ccc01@sha256:0f14baa016789955064b62519d15cd2f5787eb266bee6fef29e8aac7d77ed6e0 as builder

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
