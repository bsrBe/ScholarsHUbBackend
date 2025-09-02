# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .  



# Expose the port your app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
