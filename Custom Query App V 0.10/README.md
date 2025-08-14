# Custom Query Test

This project is a full-stack application with a React frontend and a Node.js/Express backend, designed for building and executing custom queries with an interactive UI. It uses Firebase as the database and supports Excel export of results.

## Folder Structure

```
Custom Query Test/
├── client/
│ ├── .env
│ ├── package.json
│ ├── vite.config.js
│ ├── public/
│ └── src/
├── server/
│ ├── .env
│ ├── package.json
│ ├── index.js
│ ├── controller/
│ ├── db/
│ ├── helper/
│ ├── router/
│ └── utils/
├── node_modules/
├── get-local-ip.js
├── package.json
├── package-lock.json
├── run.bat
├── run_inner.bat
├── start-client.cmd
```

## Features

- **Dynamic Query Builder**: Build complex queries with a user-friendly UI.
- **Authentication**: Secure login with OTP support.
- **Excel Export**: Download query results as Excel files.
- **Centralized Dependency Management**: All dependencies are managed at the root level for consistency.

## Notes

- If you encounter issues, check the generated log file (e.g., `log_XXXXXXXX.txt`) for troubleshooting.
- For development, you can run client and server separately from their respective folders if needed.

## Setup & Running

To start the project, simply run:

- run.bat

This will:

- Install all dependencies for the root, server, and client (if not already installed)
- Build the client app if needed
- Start both the server and client concurrently
- Log all output to a timestamped log file (e.g., `log_XXXXXXXX.txt`)

> **Note:**  
> The client will be available at the local IP shown in the console (e.g., `http://192.168.x.x:3000`).
