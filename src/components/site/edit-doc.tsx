import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type EditDoc = {
  published?: boolean;
  publish?: () => void;
  setDoc: (next: { published?: boolean; publish?: () => void }) => void;
};

const EditDocContext = createContext<EditDoc>({ setDoc: () => undefined });

export function EditDocProvider({ children }: { children: ReactNode }) {
  const [doc, setDocState] = useState<{ published?: boolean; publish?: () => void }>({});
  const setDoc = useCallback((next: { published?: boolean; publish?: () => void }) => {
    setDocState(next);
  }, []);
  const value = useMemo(() => ({ ...doc, setDoc }), [doc, setDoc]);
  return <EditDocContext.Provider value={value}>{children}</EditDocContext.Provider>;
}

export function useEditDoc() {
  return useContext(EditDocContext);
}
