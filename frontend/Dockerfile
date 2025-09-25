FROM node:18-alpine
WORKDIR /home/app

# Install deps first for layer caching
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Make entrypoint executable
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

# Run entrypoint which will prisma generate then start dev server
CMD ["./docker-entrypoint.sh"]