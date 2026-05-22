// Editor/build shim: allows TS to typecheck before npm install.
// Real installs will override these.

declare module 'react' {
  export const StrictMode: any
  export function useEffect(...args: any[]): any
  export function useMemo(...args: any[]): any
  export function useState<T>(initial: T): [T, (v: T) => void]

}

declare module 'react-dom/client' {
  export const createRoot: any
}

