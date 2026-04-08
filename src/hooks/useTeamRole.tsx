"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type RoleId = "STRATEGY" | "INFRA" | "GTM" | "TOOLING";

interface TeamRoleCtx {
  role: RoleId;
  setRole: (role: RoleId) => void;
}

const TeamRoleContext = createContext<TeamRoleCtx>({
  role: "STRATEGY",
  setRole: () => {},
});

export function TeamRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<RoleId>("STRATEGY");
  return (
    <TeamRoleContext.Provider value={{ role, setRole }}>
      {children}
    </TeamRoleContext.Provider>
  );
}

export function useTeamRole() {
  return useContext(TeamRoleContext);
}
