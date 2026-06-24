import React, { useState } from "react";
import type { BaseComponentProps } from "../types";

interface SidebarContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  handleDrawerToggle: () => void;
  handleToggleCollapse: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

const SidebarProvider: React.FC<BaseComponentProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleCollapse = (): void => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const value: SidebarContextType = {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileOpen,
    setMobileOpen,
    handleDrawerToggle,
    handleToggleCollapse,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

export { SidebarProvider, SidebarContext };
