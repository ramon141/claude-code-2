import React, { createContext, useState, useCallback } from 'react';
import type { BreadcrumbItem } from '../components/Breadcrumb/types';
import type { BaseComponentProps } from '../types';

interface BreadcrumbContextType {
  breadcrumbItems: BreadcrumbItem[];
  useBreadcrumb: (items: BreadcrumbItem[]) => void;
}

export const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

const INITIAL_VALUE: BreadcrumbItem[] = [
  {
    label: 'Orçamento',
    path: '/',
  },
];

export const BreadcrumbProvider: React.FC<BaseComponentProps> = ({ children }) => {
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>(INITIAL_VALUE);

  const useBreadcrumb = useCallback(
    (items: BreadcrumbItem[]) => {
      setBreadcrumbItems(items);
    },
    [setBreadcrumbItems]
  );

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbItems, useBreadcrumb }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};
