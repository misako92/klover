"use client";

import * as React from "react";

const UserNameContext = React.createContext<string>("");

export function UserNameProvider({ name, children }: { name: string; children: React.ReactNode }) {
  return <UserNameContext.Provider value={name}>{children}</UserNameContext.Provider>;
}

export function useUserName() {
  return React.useContext(UserNameContext);
}
