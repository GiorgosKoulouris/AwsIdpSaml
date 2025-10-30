FROM node:22-alpine

ENV NODE_UID=1000 \
    NODE_GID=1000

RUN mkdir -p /home/node/app/
RUN mkdir -p /home/node/app/certs

WORKDIR /home/node/app

COPY package.json.template package.json

RUN cd /home/node/app \
    && npm install axios body-parser cors dotenv express jsonwebtoken jwt-decode saml xml-crypto xml-encryption xml-formatter xml2js xmldom \
    && chown -R node:node /home/node/app

COPY --chown=node:node . .

EXPOSE 5000

LABEL maintainer="George Koulouris (gkoulouris@thecanopener.com)"
LABEL version="1.0.3"
LABEL project="TCOP AWS Federation"

ENTRYPOINT ["./entrypoint.sh"]