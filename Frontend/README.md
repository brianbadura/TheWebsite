# TheWebsite — Frontend

A minimal React frontend using Vite.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server (http://localhost:5173)
npm run dev
```

## Building for Production

```bash
npm run build
```

This generates a `dist/` folder with static HTML, CSS, and JS files.

## Deploying to EC2

Upload the contents of the `dist/` folder to your EC2 instance and serve it with any static web server, for example:

```bash
# Using nginx, Apache, or a simple Node server
npx serve dist

## Docker
docker build -t frontend .
docker run -p 3000:80 frontend