import axios from "axios";
import { useState, useEffect } from "react";

export function AuthChecker() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const useruid = sessionStorage.getItem("userUID");
      if (!useruid) {
        setUser(false);
        return;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_SERVER_URL}/auth/checker`,
          { useruid }
        );

        if (response.status === 200) {
          setUser(true);
        }
      } catch (error) {
        console.log("Error", error);
        if (error.response?.status === 401) {
          console.log(error.response?.data.message);
          setUser(false);
        }
      }
    };

    checkUser();
  }, []);

  return user;
}
