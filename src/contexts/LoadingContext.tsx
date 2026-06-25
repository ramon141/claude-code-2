import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import useModal from "../hooks/useModal";
import type { ApiError } from "../pages/Setup/errorMessage";

interface ToastPromiseMessages<TData> {
  pending: string;
  success: string | ((data: TData) => string | undefined);
  error: string | ((error: ApiError) => string | undefined);
}

interface LoadingContextType {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
  toastPromise: <TData>(
    promise: Promise<TData>,
    messages: ToastPromiseMessages<TData>,
  ) => void;
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

  const applyMessage = <TArg,>(
    nextType: string,
    template: string | ((arg: TArg) => string | undefined),
    arg: TArg,
  ) => {
    setType(nextType);
    if (typeof template === 'string') {
      setMessage(template);
      return;
    }
    const resolved = template(arg);
    if (resolved) setMessage(resolved);
    else handleClose();
  };

  const toastPromise = <TData,>(
    promise: Promise<TData>,
    messages: ToastPromiseMessages<TData>,
  ) => {
    setType(LOADING_CONST.LOADING);
    setMessage(messages.pending);
    handleOpen();

    promise
      .then((data: TData) => applyMessage(LOADING_CONST.SUCCESS, messages.success, data))
      .catch((error: ApiError) => applyMessage(LOADING_CONST.ERROR, messages.error, error));
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
