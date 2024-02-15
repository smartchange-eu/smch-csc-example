# Use an official Node.js runtime as a base image
FROM node:14

# Create a directory for your application
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of your application source code to the container
COPY . .

# Expose the port your app is running on
EXPOSE 3000

# Define the command to start your Node.js application
CMD ["node", "index.js"]
