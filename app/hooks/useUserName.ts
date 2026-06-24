import { useEffect, useState } from "react";
const USER_NAME_STORAGE_KEY = "user-name";

// Obtener las iniciales del nombre
export function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.trim().slice(0, 2).toUpperCase();
}

// Leer el nombre almacenado
function readStoredUserName() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_NAME_STORAGE_KEY);
}

// Hook para manejar el nombre del usuario
export function useUserName() {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUserNameState(readStoredUserName());
    setIsReady(true);
  }, []);

  // Establecer el nombre del usuario
  const setUserName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    localStorage.setItem(USER_NAME_STORAGE_KEY, trimmed);
    setUserNameState(trimmed);
  };

  return {
    userName,
    setUserName,
    initials: userName ? getUserInitials(userName) : "",
    isReady,
  };
}
