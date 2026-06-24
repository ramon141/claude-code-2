import React from 'react';
import { BreadcrumbProvider } from "./BreadcrumbContext";
import { SidebarProvider } from "./SidebarContext";
import { LoadingProvider } from "./LoadingContext";
import PromisePopup from "../components/PromisePopup";
import type { BaseComponentProps } from "../types";

export default function GlobalProvider({ children }: BaseComponentProps): React.ReactElement {
  return (
    <LoadingProvider>
      <SidebarProvider>
        <BreadcrumbProvider>
          {children}
          <PromisePopup />
        </BreadcrumbProvider>
      </SidebarProvider>
    </LoadingProvider>
  );
}
