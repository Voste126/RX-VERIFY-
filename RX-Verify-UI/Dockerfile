# Stage 1: Build the React application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first for optimized caching
COPY package.json package-lock.json ./

# Install dependencies cleanly
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the Vite React application
RUN npm run build

# Stage 2: Serve the application using a lightweight web server
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install 'serve' globally to serve static files
RUN npm install -g serve

# Copy only the built output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the default port (Render will override this dynamically)
EXPOSE 3000

# Start the application using 'serve'.
# We use -s to serve it as a Single Page Application (routing all requests to index.html)
# We use tcp://0.0.0.0:${PORT:-3000} to bind to the port assigned by Render.
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-3000}"]
