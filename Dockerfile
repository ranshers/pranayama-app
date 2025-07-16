# --- Build Stage ---
# Use an official Node.js runtime as a parent image.
# This stage is for building the React application.
FROM node:18-alpine AS build

# Set the working directory in the container.
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache.
COPY package*.json ./

# Install project dependencies.
RUN npm install

# Copy the rest of the application's source code.
COPY . .

# Build the React app for production.
# The output will be in the /app/build folder.
RUN npm run build

# --- Production Stage ---
# Use a lightweight Nginx image to serve the static files.
# This stage creates the final, smaller production image.
FROM nginx:1.25-alpine

# Copy the built static files from the 'build' stage to the Nginx public directory.
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 to allow traffic to the Nginx server.
EXPOSE 80

# The default Nginx command will start the server.
# CMD ["nginx", "-g", "daemon off;"] is the default command for this image.
