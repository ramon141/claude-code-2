import type { TableColumn, ActionItem } from '../Table/types';

export interface TableTabsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
    columns: TableColumn[];
    fieldTabsName?: string;
    tabsName?: string[];
    defaultTab?: string;
    pageSize?: number;
    width?: string;
    // Repassados para Table
    searchEnabled?: boolean;
    searchPlaceholder?: string;
    onSearchChange?: (value: string) => void;
    filterEnabled?: boolean;
    onFilterClick?: () => void;
    actions?: ActionItem[];
    // Tabs especificos
    onAddTab?: (tab: string) => void;
    useAddTab?: boolean;
    useEditTab?: boolean;
}
