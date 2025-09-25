FROM ubuntu:focal

# Install Node.js 18, ffmpeg, and dependencies
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y nodejs ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install nodemon globally
RUN npm i -g nodemon

# Copy project files
COPY . .

# Expose app port
EXPOSE 3001

# Inline entrypoint logic (was in docker-entrypoint.sh)
CMD npx prisma generate && \
    node -e "console.log('DATABASE_URL present:', !!process.env.DATABASE_URL)" && \
    node index.js
