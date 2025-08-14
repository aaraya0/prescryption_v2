FROM node:20
WORKDIR /app

COPY package*.json ./
RUN npm install

# Copiá solo lo necesario de prescryption_solidity
COPY prescryption_solidity/contracts_data.json /app/contracts/contracts_data.json
COPY prescryption_solidity/build/contracts/PrescriptionContract.json /app/contracts/PrescriptionContract.json

COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
