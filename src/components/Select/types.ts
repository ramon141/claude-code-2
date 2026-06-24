export interface SelectProps {
    title?: string;
    label?: string;
    actionButton?: any;
    sxInputLabel?: object;
    error?: boolean;
    helperText?: string;
    options?: Array<{ value: string; label: string }>;
    value?: any;
    onChange?: (value: any) => void;
    [key: string]: any;
} 