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

# Remove the default Nginx configuration file.
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx configuration template into the image.
# This template contains a placeholder for the port number.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy the built static files from the 'build' stage to the Nginx public directory.
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 8080. This is good practice for documentation, though Cloud Run
# primarily relies on the PORT environment variable to route traffic.
EXPOSE 8080

# This is the command that runs when the container starts.
# 1. `envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf`
#    This command takes the template file, substitutes the ${PORT} variable with the value
#    provided by Cloud Run's environment, and creates a final config file.
# 2. `nginx -g 'daemon off;'`
#    This starts the Nginx server in the foreground.
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
