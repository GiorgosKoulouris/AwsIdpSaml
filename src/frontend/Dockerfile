FROM node:22-alpine AS builder
ENV NODE_ENV production

WORKDIR /app
RUN npx create-react-app . && rm -rf public/ && rm -rf src/
RUN npm install @azure/msal-browser @azure/msal-react jwt-decode dotenv --legacy-peer-deps

COPY . .

RUN GENERATE_SOURCEMAP=false && npm run build

FROM nginx:1.27.5-alpine as production
ENV NODE_ENV production

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN mkdir /etc/nginx/certs/

EXPOSE 443

LABEL maintainer="George Koulouris (gkoulouris@thecanopener.com)"
LABEL version="1.0.2"
LABEL project="AWS Federation"

COPY ./entrypoint.sh .

ENTRYPOINT ["./entrypoint.sh"]