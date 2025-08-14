import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { ref, update, child, get } from "firebase/database";
import { auth, database } from "../db/config.js";
/**
 * Login function to authenticate users using Firebase Authentication.
 * This function checks if the user exists in the database and verifies their role.
 * If the user is authenticated and has a valid role, it returns a success response.
 * If the user is not found or has an unauthorized role, it returns an error response.
 * If any error occurs during the authentication process, it returns a failure response.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 * @returns response object with status and message
 */
export const login = async (req, res) => {
  console.log("\n\n");
  console.log("======== Login Starts =======");
  try {
    console.log("Login request body:", req.body);
    const { fullUserEmail, userPassword, userWinID } = req.body;

    if (!fullUserEmail || !userPassword) {
      console.error("Email and password are required");
      return res.status(400).json({ message: "Email and password are required" });
    }

    const userCredential = await signInWithEmailAndPassword(auth, fullUserEmail, userPassword);

    if (!userCredential) {
      console.error("User is undefined!");
      return res.status(401).json({ message: "User is undefined" });
    }

    const user = userCredential.user;
    console.log("User UID:", user.uid);

    const dbRef = ref(database);
    // Fetch user data from the database
    const snapshot = await get(child(dbRef, `users/${user.uid}`));

    // Check if the user exists in the database
    if (snapshot.exists()) {
      const role = snapshot.val().role;
      console.log("User role:", role);
      if (role === "OPH" || role === "Director") {
        console.log("User authenticated successfully");
        try {
          if (!user.uid) {
            console.log("User UID is required");
            return res.status(400).json({ message: "Invalid" });
          }

          const snapshotData = await get(child(dbRef, `op_head/${user.uid}`));
          if (!snapshotData.exists()) return res.status(404).json({ message: "User not found" });

          const userData = snapshotData.val();
          console.log("User data:", userData);

          const phone = userData.phno;
          if (!phone) return res.status(400).json({ message: "User phone not found" });

          const currentTime = new Date().toISOString();
          const lastLoginTime = userData.loginDetails.loginTime;

          console.log("Current time:", currentTime);
          console.log("Last login time:", lastLoginTime);
          const timeDifference = lastLoginTime ? (new Date(currentTime) - new Date(lastLoginTime)) / (1000 * 60 * 60 * 24) : null;
          console.log("timeDifference in days:", timeDifference);

          if (userWinID !== userData.loginDetails.pcIdentifier || userData.loginDetails.pcIdentifier === null) {
            if (timeDifference > 90 || timeDifference === null) {
              // both pcIdentifier are not matching and time difference is more than 90
              return res.status(200).json({
                message: "Login time and PC identifier updated successfully. Please verify OTP.",
                phone,
                userWinID,
                user: user.uid,
              });
            } else {
              // only pcIdentifier is not matching
              return res.status(200).json({
                message: "PC identifier updated successfully. Please verify OTP.",
                phone,
                userWinID,
                user: user.uid,
              });
            }
          } else {
            if (timeDifference > 90 || timeDifference === null) {
              // pcIdentifier is matching and time difference is more than 90
              return res.status(200).json({
                message: "Login time updated successfully. Please verify OTP.",
                phone,
                userWinID,
                user: user.uid,
              });
            } else {
              // pcIdentifier is matching and time difference is less than 90
              console.log("No updates needed, user is already authenticated");
              return res.status(200).json({
                message: "User authenticated successfully",
                phone,
                user: user.uid,
                userWinID,
              });
            }
          }
        } catch (error) {
          console.error("Error during authentication:", error.message);
          return res.status(500).json({ message: "Authentication failed", error: error.message });
        }
      } else {
        console.error("Unauthorized role:", role);
        return res.status(401).json({ message: "Unauthorized role" });
      }
    } else {
      console.error("No such user found in DB");
      return res.status(401).json({ message: "No such user found in DB" });
    }
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(401).json({ message: "Login failed", error: error.message });
  } finally {
    console.log("======== Login Ends =======");
    console.log("\n\n");
  }
};

/**
 * Authentication checker function to verify if the user is authenticated.
 * This function checks the current authentication state of the user.
 * If the user is authenticated and their UID matches the provided UID,
 * it returns a success response.
 * If the user is not authenticated or the UID does not match,
 * it returns an unauthorized access response.
 * @param {import('express').Request} req - The request object.
 * @param {import('express').Response} res - The response object.
 * @returns response object with status and message
 */
export const checker = async (req, res) => {
  console.log("\n\n");
  console.log("======== Auth Checker Starts =======");

  try {
    console.log("AuthChecker Body", req.body);
    onAuthStateChanged(auth, (authUser) => {
      console.log("authuser", authUser?.uid);

      if (authUser?.uid === req.body.useruid) {
        console.log("Valid user");

        return res.status(200).json({ message: "Valid user" });
      } else {
        console.log("Unauthorized access");

        return res.status(401).json({ message: "Unauthorized access" });
      }
    });
  } catch (error) {
    console.log("Authcher error", error);
    return res.status(401).json({ message: "Falied to Authenicate" });
  } finally {
    console.log("======== Auth Checker Ends =======");
    console.log("\n\n");
  }
};

/**
 *  Function to verify OTP for user login.
 *  This function checks if the user exists in the database and verifies their login details.
 *  It updates the user's login time and PC identifier based on the provided parameters.
 *  If the user is authenticated successfully, it returns a success response.
 *  If the user is not found or the parameters are missing, it returns an error response.
 *  If any error occurs during the verification process, it returns a failure response.
 * @param {import('express').Request} req - The request object containing user details.
 * @param {import('express').Response} res - The response object to send the result.
 * @returns response object with status and message
 */
export const verifyOtp = async (req, res) => {
  console.log("Verify OTP request body:", req.body);

  const { userUID, userWinID } = req.body;
  if (!userUID || !userWinID) return res.status(400).json({ message: "Missing parameters" });
  const dbRef = ref(database);
  const snapshotData = await get(child(dbRef, `op_head/${userUID}`));

  if (!snapshotData.exists()) return res.status(404).json({ message: "User not found" });

  const userData = snapshotData.val();
  console.log("User data:", userData);
  const currentTime = new Date().toISOString();
  const lastLoginTime = userData.loginDetails.loginTime;

  console.log("Current time:", currentTime);
  console.log("Last login time:", lastLoginTime);
  const timeDifference = lastLoginTime ? (new Date(currentTime) - new Date(lastLoginTime)) / (1000 * 60 * 60 * 24) : null;
  console.log("timeDifference in days:", timeDifference);

  if (userWinID !== userData.loginDetails.pcIdentifier || userData.loginDetails.pcIdentifier === null) {
    if (timeDifference > 90 || timeDifference === null) {
      // both pcIdentifier are not matching and time difference is more than 90
      console.log("Updating both loginTime and pcIdentifier in DB");

      await update(ref(database, `op_head/${userUID}/loginDetails`), {
        loginTime: currentTime,
        pcIdentifier: userWinID,
      });
      return res.status(200).json({
        message: "Update Successful.",
      });
    } else {
      // only pcIdentifier is not matching
      console.log("Updating pcIdentifier in DB");

      await update(ref(database, `op_head/${userUID}/loginDetails`), {
        pcIdentifier: userWinID,
      });
      return res.status(200).json({
        message: "Update Successful.",
      });
    }
  } else {
    if (timeDifference > 90 || timeDifference === null) {
      // pcIdentifier is matching and time difference is more than 90
      console.log("Updating loginTime in DB");
      await update(ref(database, `op_head/${userUID}/loginDetails`), {
        loginTime: currentTime,
      });
      return res.status(200).json({
        message: "Update Successful.",
      });
    } else {
      // pcIdentifier is matching and time difference is less than 90
      console.log("No updates needed, user is already authenticated");
      return res.status(200).json({
        message: "Update Successful.",
      });
    }
  }
};
