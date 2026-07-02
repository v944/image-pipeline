declare global {
  interface WindowEventMap {
    "start-processing": CustomEvent;
  }

  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

declare module "*?worker" {
  const workerConstructor: { new (): Worker };
  export default workerConstructor;
}

export {};
