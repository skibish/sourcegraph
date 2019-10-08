FROM sourcegraph/builder:93358ba84e@sha256:0c57e2a246b841e32f0709fa39847f886937cc10dcd2c7291c0968a2afcaedb4 as builder

ENV OUTPUT_DIR=/output
RUN mkdir -p ${OUTPUT_DIR}

WORKDIR /src
COPY . .
RUN ./build.sh

FROM alpine:3.9@sha256:644fcb1a676b5165371437feaa922943aaf7afcfa8bfee4472f6860aad1ef2a0

RUN apk --no-cache add pcre-dev

COPY --from=builder /output/pcre.so /libsqlite3-pcre.so
ENV LIBSQLITE3_PCRE /libsqlite3-pcre.so
