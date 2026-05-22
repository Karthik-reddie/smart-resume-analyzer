declare module '*.css'

// Minimal JSX types for editor without relying on installed @types.
// This keeps the scaffolding usable even before npm install.

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

