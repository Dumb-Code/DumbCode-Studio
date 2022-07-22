import { useCallback, useEffect, useState } from 'react';

const databaseName = "AutoRecovery";
const databaseVersion = 1;

export type AutoRecoveryFileType = {
  name: string;
  data: Blob;
}

export default class AutoRecoveryFileSystem {

  static database: IDBDatabase | null = null

  private static async createDatabase() {
    const dbOpen = indexedDB.open(databaseName, databaseVersion)
    return new Promise<IDBDatabase | null>((resolve, reject) => {
      dbOpen.onsuccess = () => resolve(dbOpen.result)
      dbOpen.onerror = reject
      dbOpen.onupgradeneeded = () => {
        const db = dbOpen.result
        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files", {
            keyPath: "name",
          })
        }
      }
    })
  }

  static async getOrCreateSystem() {
    if (AutoRecoveryFileSystem.database) {
      return AutoRecoveryFileSystem.database
    }

    const databse = await AutoRecoveryFileSystem.createDatabase()
    if (databse) {
      AutoRecoveryFileSystem.database = databse
    }
    return databse
  }

  static async createTransaction(mode?: IDBTransactionMode) {
    const database = await AutoRecoveryFileSystem.getOrCreateSystem()
    if (database === null) {
      return null
    }
    return database.transaction(["files"], mode || "readonly")
  }

  static getFileStore(transaction: IDBTransaction) {
    return transaction.objectStore("files")
  }


  static async getFile(name: string, mode?: IDBTransactionMode) {
    const transaction = await AutoRecoveryFileSystem.createTransaction(mode)
    if (transaction === null) {
      return null
    }
    const fileStore = AutoRecoveryFileSystem.getFileStore(transaction)

    return new Promise<AutoRecoveryFileType | null>((resolve, reject) => {
      const request = fileStore.get(name)
      request.onsuccess = () => {
        const file = request.result as AutoRecoveryFileType
        resolve(file)
      }
      request.onerror = reject
      transaction.commit()
    })
  }

  static async writeFile(name: string, data: Blob) {
    const transaction = await AutoRecoveryFileSystem.createTransaction("readwrite")
    if (transaction === null) {
      return
    }
    const fileStore = AutoRecoveryFileSystem.getFileStore(transaction)

    return new Promise<void>((resolve, reject) => {
      const result = fileStore.put({
        name, data
      })
      result.onsuccess = () => {
        resolve()
      }
      result.onerror = e => {
        reject(e)
      }
      transaction.commit()
    })
  }

  static async listFiles() {
    const transaction = await AutoRecoveryFileSystem.createTransaction()
    if (transaction === null) {
      return []
    }
    const fileStore = AutoRecoveryFileSystem.getFileStore(transaction)

    return new Promise<AutoRecoveryFileType[]>((resolve, reject) => {
      const result = fileStore.getAll()
      result.onsuccess = () => {
        const files = result.result as AutoRecoveryFileType[]
        resolve(files)
      }
      result.onerror = reject
      transaction.commit()
    })
  }

  static async getOldest() {
    const files = await AutoRecoveryFileSystem.listFiles()
    if (files.length === 0) {
      return null
    }
    return files.sort((a, b) => a.name.localeCompare(b.name))[0]
  }

  static async deleteOldest() {
    //Do we need to do this?
    return false
  }

  static async getAllEntries() {
    return AutoRecoveryFileSystem.listFiles()
  }

  static async deleteAll() {
    const transaction = await AutoRecoveryFileSystem.createTransaction("readwrite")
    if (transaction === null) {
      return
    }
    const fileStore = AutoRecoveryFileSystem.getFileStore(transaction)

    return new Promise<void>((resolve, reject) => {
      const result = fileStore.clear()
      result.onsuccess = () => resolve()
      result.onerror = reject
      transaction.commit()
    })
  }
}

export const useUsageAndQuota = () => {
  const [quota, setQuota] = useState<number>(0)
  const [usage, setUsage] = useState<number>(0)
  const [numFiles, updateNumFiles] = useAllEntries()

  const updateQuotas = useCallback(async () => {
    const { quota, usage } = await window.navigator.storage.estimate()
    setQuota(quota ?? 0)
    setUsage(usage ?? 0)
    updateNumFiles()

  }, [updateNumFiles])

  useEffect(() => {
    updateQuotas()
    const interval = setInterval(updateQuotas, 1000)
    return () => clearInterval(interval)
  }, [updateQuotas])
  return [usage, quota, numFiles.length, updateQuotas] as const
}

export const useIfHasBeenGivenAccess = () => {
  return true
}

export const useAllEntries = () => {
  const [entries, setEntries] = useState<AutoRecoveryFileType[]>([])
  const updateEntries = useCallback(() => {
    AutoRecoveryFileSystem.getAllEntries().then(setEntries)
  }, [])
  useEffect(() => {
    updateEntries()
  }, [updateEntries])
  return [entries, updateEntries] as const
}