# Custom Query App

This project is a full-stack application with a React frontend and a Node.js/Express backend, designed for building and executing custom queries with an interactive UI. It uses Firebase as the database and supports Excel export of results.

## Folder Structure

```
Custom Query App/
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

## Version Control Notes

- **Version 0.10**:

  - Initial base version, stable and error-free.

- **Version 0.11**:

  - Enabled OTP feature.
  - Uncommented out Session checker function.
  - Resolved issue related Gender in server/helper/option3Validator.js

- **Version 0.12**:

  - Changed for AND(when multiple-options is selected only patients with all those set of selected are displayed) to OR(when multiple-options is selected only patients with anyone those set of present are displayed)in multi-selection option

- **Version 0.13**:

  - Added options to select Phase 1 and Phase 2.
  - Allow multiple dates to be selected.

- **Version 0.14**:

  - Added Yes/No for screening,survey and tcc
  - Added logic to handle Yes/No for screening,survey and tcc
