import type React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TableColumn {
    Header: string;
    accessor: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cell?: ({ value, row }: { value: any; row: any }) => React.ReactNode;
}

export interface ActionItem {
    label: string;
    onClick?: () => void;
    path?: string;
    disabled?: boolean;
    icon?: React.ElementType;
}

export interface TableProps {
    columns: TableColumn[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
    pageSize?: number;
    width?: string;
    // Toolbar
    showToolbar?: boolean;
    searchEnabled?: boolean;
    searchPlaceholder?: string;
    onSearchChange?: (value: string) => void;
    filterEnabled?: boolean;
    onFilterClick?: () => void;
    actions?: ActionItem[];
}
