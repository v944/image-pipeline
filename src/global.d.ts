interface WindowEventMap {
  "start-processing": CustomEvent;
}

declare module "*?worker" {
  const workerConstructor: { new (): Worker };
  export default workerConstructor;
}

export {};
