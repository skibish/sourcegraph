FROM ubuntu:18.04@sha256:b88f8848e9a1a4e4558ba7cfc4acc5879e1d0e7ac06401409062ad2627e6fb58

LABEL org.opencontainers.image.url=https://sourcegraph.com/
LABEL org.opencontainers.image.source=https://github.com/sourcegraph/sourcegraph/
LABEL org.opencontainers.image.documentation=https://docs.sourcegraph.com/

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    # Python 2 (for management console)
    python2.7 \
    build-essential \
    make \
    ca-certificates \
    curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Node & npm
ENV NODE_VERSION 12.10.0
ENV NPM_VERSION 6.11.3
ENV YARN_VERSION 1.17.3
ENV NVM_DIR /usr/local/nvm
RUN mkdir $NVM_DIR && \
    curl -Lfs https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH
RUN echo "source $NVM_DIR/nvm.sh && \
    nvm install 10.13.0 && \
    npm install --global npm@$NPM_VERSION && \
    npm install --global yarn@$YARN_VERSION && \
    nvm install $NODE_VERSION && \
    nvm use $NODE_VERSION && \
    npm install --global npm@$NPM_VERSION && \
    npm install --global yarn@$YARN_VERSION" | bash

# Go
ENV GO_VERSION 1.13
RUN curl -Lfs "https://dl.google.com/go/go${GO_VERSION}.linux-amd64.tar.gz" | tar xz && mv go /usr/local
ENV GOPATH /go
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH

RUN mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 777 "$GOPATH"
WORKDIR $GOPATH
