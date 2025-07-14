FROM node:18-slim

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /home/app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
