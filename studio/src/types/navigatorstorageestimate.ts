declare global {
  interface StorageEstimate {
    usageDetails?: {
      caches: number
      indexedDB: number
      serviceWorkerRegistrations: number
    }
  }
}

export { }

