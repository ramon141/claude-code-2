export interface InputMoneyProps {
    value: string;
    setValue: (value: string) => void;
    name: string;
    prefix?: string;
    label: string;
    sxInputLabel?: object;
    actionButton?: any;
    error?: boolean;
    helperText?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
    [key: string]: any;
}

export interface TextFieldMoneyProps {
    value: any;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    [key: string]: any;
} 