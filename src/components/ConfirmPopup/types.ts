export interface ConfirmPopupProps {
    isOpen: boolean;
    handleClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
} 