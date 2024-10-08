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

# Install wait-for-it script
ADD https://github.com/vishnubob/wait-for-it/raw/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Generate the dist folder
RUN npm run build

# Create a non-root user and switch to it
RUN useradd -m postgres
RUN chown -R postgres:postgres /app /wait-for-it.sh
USER postgres

# Expose port 3000 for nest application
EXPOSE 3000

# Run the application
CMD ["/wait-for-it.sh", "postgres:5432", "--", "npm", "run", "start:dev"]