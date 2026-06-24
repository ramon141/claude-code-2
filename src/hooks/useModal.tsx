import { useState } from 'react';

interface UseModalReturn {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
}

export default function useModal(): UseModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  return { isOpen, handleOpen, handleClose };
}
