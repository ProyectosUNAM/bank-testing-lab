FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
ENV PACT_SKIP_BINARY_INSTALL=true
RUN npm config set strict-ssl false
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
