export interface ApiResponse<T = null> {
    data: T;
    message?: string;
    success: boolean;
}

export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}

export interface RouteConfig {
    path: string;
    element: React.ReactElement;
    isPrivate: boolean;
    breadcrumb: boolean;
}

export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}

export interface FormField {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
}
