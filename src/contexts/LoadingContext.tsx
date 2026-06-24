import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import useModal from "../hooks/useModal";

interface LoadingContextType {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
  toastPromise: (promise: Promise<any>, messages: {
    pending: string;
    success: string | ((data: any) => string | undefined);
    error: string | ((error: any) => string | undefined);
  }) => void;
  type: string;
  message: string;
}

export const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LOADING_CONST = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [type, setType] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const { isOpen, handleOpen, handleClose } = useModal();

  const toastPromise = (
    promise: Promise<any>,
    messages: {
      pending: string;
      success: string | ((data: any) => string | undefined);
      error: string | ((error: any) => string | undefined);
    }
  ) => {
    setType(LOADING_CONST.LOADING);
    setMessage(messages.pending);
    handleOpen();

    promise
      .then((data: any) => {
        setType(LOADING_CONST.SUCCESS);
        if (typeof messages.success === 'string') {
          setMessage(messages.success);
        } else {
          const message = messages.success(data);
          if (message)
            setMessage(message);
          else
            handleClose();
        }
      })
      .catch((error: any) => {
        setType(LOADING_CONST.ERROR);
        if (typeof messages.error === 'string') {
          setMessage(messages.error);
        } else {
          const message = messages.error(error);
          if (message)
            setMessage(message);
          else
            handleClose();
        }
      });
  };

  const value: LoadingContextType = {
    isOpen,
    handleOpen,
    handleClose,
    toastPromise,
    type,
    message,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
