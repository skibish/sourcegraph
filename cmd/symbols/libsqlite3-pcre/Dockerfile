FROM sourcegraph/builder:2d297a9c7f@sha256:60a17014bded94514c4e974ec69c2b9857ba26e6c73d8bec13bc13045a088d3e as builder

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
