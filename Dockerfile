# Node.js 20 image as base
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first to install the dependencies
COPY package*.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose port 300 for nest application
EXPOSE 3000

RUN npm run build

# Run the application
CMD ["/app/wait-for-it.sh", "postgres:5432", "--", "npm", "run", "start:prod"] 
