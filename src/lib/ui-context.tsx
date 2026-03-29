import React, { createContext, useContext, useRef, useState } from "react";
import { Animated } from "react-native";

type UIContextType = {
  homeScrollY: Animated.Value;
  isHomeReminderActive: boolean;
  setHomeReminderActive: (active: boolean) => void;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const homeScrollY = useRef(new Animated.Value(0)).current;
  const [isHomeReminderActive, setHomeReminderActive] = useState(false);

  return (
    <UIContext.Provider
      value={{
        homeScrollY,
        isHomeReminderActive,
        setHomeReminderActive,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUIState = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUIState must be used within a UIProvider");
  }
  return context;
};
