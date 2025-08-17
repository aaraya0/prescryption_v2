FROM node:20

# 👉 AGREGADO: dependencias del sistema que requiere Chromium en Cloud Run
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libatspi2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
    libglib2.0-0 libnss3 libnspr4 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxdamage1 libxext6 libxfixes3 libxrandr2 libxrender1 libxss1 libxtst6 \
    wget xdg-utils && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_CACHE_DIR=/tmp \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    # 👉 AGREGADO: flags útiles para puppeteer-core/@sparticuz/chromium
    CHROMIUM_FLAGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --no-zygote --single-process"

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copiá solo lo necesario de prescryption_solidity
COPY prescryption_solidity/contracts_data.json /app/contracts/contracts_data.json
COPY prescryption_solidity/build/contracts/PrescriptionContract.json /app/contracts/PrescriptionContract.json

COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
