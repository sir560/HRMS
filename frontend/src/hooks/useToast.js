import { useCallback, useState } from "react";

export function useToast(initial = null) {
  const [toast, setToast] = useState(initial);
  const show = useCallback((message, variant = "success") => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 4000);
  }, []);
  const clear = useCallback(() => setToast(null), []);
  return { toast, show, clear };
}
