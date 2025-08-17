FROM node:20
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_CACHE_DIR=/tmp
WORKDIR /app

COPY package*.json ./
RUN npm install

# Copiá solo lo necesario de prescryption_solidity
COPY prescryption_solidity/contracts_data.json /app/contracts/contracts_data.json
COPY prescryption_solidity/build/contracts/PrescriptionContract.json /app/contracts/PrescriptionContract.json

COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
