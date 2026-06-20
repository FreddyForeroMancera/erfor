import { useState, useEffect } from "react";

export function usePersistedToggle(key: string, initialValue: boolean = false): [boolean, () => void, (val: boolean) => void] {
  const [value, setValue] = useState<boolean>(initialValue);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedValue = localStorage.getItem(key);
      if (savedValue !== null) {
        setValue(savedValue === "true");
      }
    }
  }, [key]);

  const toggle = () => {
    const newValue = !value;
    setValue(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, String(newValue));
    }
  };

  const setAndPersist = (newValue: boolean) => {
    setValue(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, String(newValue));
    }
  };

  return [value, toggle, setAndPersist];
}
