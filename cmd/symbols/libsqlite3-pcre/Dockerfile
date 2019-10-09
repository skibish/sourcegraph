FROM sourcegraph/builder:f0477ccc01@sha256:0f14baa016789955064b62519d15cd2f5787eb266bee6fef29e8aac7d77ed6e0 as builder

ENV OUTPUT_DIR=/output
RUN mkdir -p ${OUTPUT_DIR}

WORKDIR /src
COPY . .
RUN ./build.sh

FROM alpine:3.9@sha256:644fcb1a676b5165371437feaa922943aaf7afcfa8bfee4472f6860aad1ef2a0

# hadolint ignore=DL3018
RUN apk --no-cache add pcre-dev

COPY --from=builder /output/pcre.so /libsqlite3-pcre.so
ENV LIBSQLITE3_PCRE /libsqlite3-pcre.so
