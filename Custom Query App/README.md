# Custom Query App

This project is a full-stack application with a React frontend and a Node.js/Express backend, designed for building and executing custom queries with an interactive UI. It uses Firebase as the database and supports exporting results to Excel.

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
- For development, you can run the client and server separately from their respective folders if needed.

## Setup & Running

Option 1:

    To start the project, simply run:

    - run.bat

    This will:

    - Install all dependencies for the root, server, and client (if not already installed)
    - Update the .env file with the system IP address
    - Build the client app if needed
    - Start both the server and client concurrently
    - Log all output to a timestamped log file (e.g., `log_XXXXXXXX.txt`)

    > **Note:**
    > The client will be available at the local IP shown in the console (e.g., `http://192.168.x.x:3000`).

OR

    Follow these steps:

    1. Open two terminals.
    2. In the first terminal, navigate to the client folder and run:

    - `npm install`
    - `npm run dev`

    3. In the second terminal, navigate to the server folder and run:

    - `npm install`
    - `npm start`

    > **Note:**
    > 1. There will be no log file for this option of running the application
    > 2. Please check the .env file if the IP address is correct if not update manually.

## Version Control Notes

- **Version 0.10**:

  - Initial base version, stable and error-free.

- **Version 0.11**:

  - Enabled the OTP feature.
  - Uncommented the session checker function.
  - Resolved an issue related to Gender in server/helper/option3Validator.js.

- **Version 0.12**:

  - Changed multi-selection behavior from AND (when multiple options are selected, only patients with all of the selected values are displayed) to OR (when multiple options are selected, patients with any of the selected values are displayed).

- **Version 0.13**:

  - Added options to select Phase 1 and Phase 2.
  - Added logic to select either Phase 1/2 options or a general date.
  - Allowed multiple Phase 1 and Phase 2 values to be selected.
  - Ensured that only one general date can be selected.

- **Version 0.14**:

  - Added Yes/No options for Survey, Screening, and TCC.
  - Added logic to handle Yes/No options for Survey, Screening, and TCC.

- **Version 0.15.2**:

  - Removed Yes/No options from Survey, Screening, and TCC and removed their logic from the backend.
  - Removed Phase 1 and Phase 2 options from General and removed their logic from the backend.
  - Added a Coverage Status option in Survey, Screening, and TCC and added logic to validate it.
  - The following options where added under Coverage Status
    1. Covered in Phase 1
    2. Not Covered in Phase 1
    3. Covered in Phase 2
    4. Not Covered in Phase 2

- **Version 0.15.3**:

  - Added the profile_history1 node to the backend and frontend so that data is processed from profile_history1 instead of patients1, and whenever there is no data in profile_history1, it falls back to patients1.
