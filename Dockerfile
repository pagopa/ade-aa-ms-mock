FROM circleci/node:14.16.0 as builder

RUN sudo apt-get -y install --no-install-recommends libunwind8=1.1-4.1

WORKDIR /usr/src/app

COPY /src /usr/src/app/src
COPY /package.json /usr/src/app/package.json
COPY /tsconfig.json /usr/src/app/tsconfig.json
COPY /yarn.lock /usr/src/app/yarn.lock
COPY /openapi /usr/src/app/openapi

RUN sudo chmod -R 777 /usr/src/app \
  && yarn install \
  && yarn build

FROM node:14.16.0-alpine
LABEL maintainer="https://pagopa.gov.it"

WORKDIR /usr/src/app

COPY /package.json /usr/src/app/package.json
COPY --from=builder /usr/src/app/dist /usr/src/app/dist
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/openapi /usr/src/app/openapi

EXPOSE 3000

CMD ["node", "src/server.js"]