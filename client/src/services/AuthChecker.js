import axios from "axios";
import { useState, useEffect } from "react";

/**
 *  AuthChecker Component
 *  This component checks if a user is authenticated by verifying their session.
 * @returns {boolean|null} Returns true if the user is authenticated, false if not authenticated, or null if the check is still in progress.
 */
export function AuthChecker() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const useruid = sessionStorage.getItem("userUID") || null;
      if (!useruid || useruid === null) {
        setUser(false);
        return;
      }

      try {
        const response = await axios.post(`${import.meta.env.VITE_BASE_SERVER_URL}/auth/checker`, { useruid });

        if (response.status === 200) {
          setUser(true);
        } else {
          setUser(false);
        }
      } catch (error) {
        console.log("Error", error);
        if (error.response?.status === 401) {
          console.log(error.response?.data.message);
        }
        setUser(false);
      }
    };

    checkUser();
  }, []);

  return user;
}
