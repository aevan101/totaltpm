# Project Management Application

Welcome to the **Total TPM** repository. This is a Next.js-based project designed to provide a robust and user-friendly platform for handling various project management tasks.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Build and Deployment](#build-and-deployment)
- [Available Scripts](#available-scripts)

---

## Prerequisites

Before you can run this project, ensure you have the following installed on your machine:

1. **Node.js** (Version 20 or higher) - [Download Node.js](https://nodejs.org/)
2. **npm** (Node Package Manager; typically included with Node.js installation)

## Getting Started

1. Clone the repository:

    ```bash
    git clone https://github.com/aevan101/totaltpm.git
    ```

2. Navigate into the project directory:

    ```bash
    cd totaltpm
    ```

---

## Installation

To install the required dependencies, run the following command in the project directory:

```bash
npm install
```

This command will install all the necessary packages and dependencies listed in the `package.json`.

---

## Running the Application

### Development Mode

To run the project in development mode, use the command below. This will start the development server with hot reloading enabled:

```bash
npm run dev
```

Once the server is running, open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## Build and Deployment

To create a production build of the application, use the following command:

```bash
npm run build
```

The production-ready files will be generated in the `.next` directory. You can then start the server in production mode using:

```bash
npm run start
```

This will launch the application in production mode, and you can access it via [http://localhost:3000](http://localhost:3000).

---

## Additional Configuration
This project uses **TypeScript** and **TailwindCSS** for styling:

1. **TypeScript**: No additional setup is required. You can start using `.tsx` and `.ts` files directly.
2. **TailwindCSS**: Configuration is already managed through the `postcss.config.mjs` and `tailwind.config.js` files. Customize these as per your design requirements.

---

## Available Scripts

The `package.json` includes the following scripts that you can use during development:

- `npm run dev` : Runs the application in development mode.
- `npm run build` : Builds the application for production.
- `npm run start` : Starts a production build of the application.
- `npm run lint` : Lints your codebase for any errors.

---

## Contributing

We welcome contributions! Please fork this repository, make your changes, and submit a pull request for review.

Feel free to check out the [issues section](https://github.com/aevan101/totaltpm/issues) and help us improve the project.

---

## License

This project is licensed under the terms described in the repository. Please check the LICENSE file for details.