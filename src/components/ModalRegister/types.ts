import React from 'react';

export interface ModalRegisterProps {
    isOpen: boolean;
    handleClose: () => void;
    children: React.ReactNode;
    postCreate?: () => void;
    editItem?: any;
    [key: string]: any;
} 