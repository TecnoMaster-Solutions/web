import { useState, useEffect } from "react";
import { User } from "../types/typesUser";

export const useViewUser = (selectedUser: User | null) => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedUser) {
      setCurrentImage(selectedUser.image || null);
    } else {
      setCurrentImage(null);
    }
  }, [selectedUser]);

  return { currentImage };
};
