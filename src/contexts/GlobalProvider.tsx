import React from 'react';
import { SidebarProvider } from "./SidebarContext";
import { LoadingProvider } from "./LoadingContext";
import { ThemeProvider } from "./ThemeContext";
import PromisePopup from "../components/PromisePopup";
import type { BaseComponentProps } from "../types";

export default function GlobalProvider({ children }: BaseComponentProps): React.ReactElement {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <SidebarProvider>
          {children}
          <PromisePopup />
        </SidebarProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}
