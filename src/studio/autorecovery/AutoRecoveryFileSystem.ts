import { useCallback, useEffect, useState } from 'react';
import { LO } from '../util/ListenableObject';
import { useListenableObject } from './../util/ListenableObject';
let hasFileStorage = false;
if (typeof window !== "undefined") {
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
  window.navigator.persistentStorage = window.navigator.persistentStorage || window.navigator.webkitPersistentStorage;
  hasFileStorage = (window.requestFileSystem !== undefined) && (window.navigator.persistentStorage !== undefined);
}

const numberOfBytes = 100 * 1024 * 1024;

export default class AutoRecoveryFileSystem {
  static canAutoRecover = hasFileStorage

  static fileSystem = new LO<FileSystem | null>(null)

  static async hasBeenGivenAccess() {
    const bytes = await new Promise<number>((resolve, reject) => {
      window.navigator.persistentStorage.queryUsageAndQuota((_, quota) => resolve(quota), reject)
    })
    return bytes !== 0
  }


  private static async createSystem() {
    const bytes = await new Promise<number>((resolve, reject) => {
      window.navigator.persistentStorage.requestQuota(numberOfBytes, resolve, reject)
    })

    //If bytes is 0, then we've been denied
    if (bytes === 0) {
      return null
    }

    return new Promise<FileSystem>((resolve, reject) => {
      window.requestFileSystem(window.PERSISTENT, bytes, resolve, reject)
    })
  }

  static async getOrCreateSystem(allowCreation = true) {
    if (AutoRecoveryFileSystem.fileSystem.value) {
      return AutoRecoveryFileSystem.fileSystem.value
    }

    if (!allowCreation) {
      const hasBeenGivenAccess = await AutoRecoveryFileSystem.hasBeenGivenAccess()
      if (!hasBeenGivenAccess) {
        return null
      }
    }

    const fileSystem = await AutoRecoveryFileSystem.createSystem()
    if (fileSystem) {
      AutoRecoveryFileSystem.fileSystem.value = fileSystem
    }
    return fileSystem
  }

  static async deleteAll() {
    const fs = await AutoRecoveryFileSystem.getOrCreateSystem(false)
    if (fs === null) {
      return
    }

    return new Promise<void>((resolve, reject) => fs.root.removeRecursively(resolve, reject))
  }
}

export const useUsageAndQuota = () => {
  const [quota, setQuota] = useState<number>(0)
  const [usage, setUsage] = useState<number>(0)

  const updateQuotas = useCallback(() => {
    if (!AutoRecoveryFileSystem.canAutoRecover) {
      return
    }
    window.navigator.persistentStorage.queryUsageAndQuota((usage, quota) => {
      setQuota(quota)
      setUsage(usage)
    }, (err) => {
      console.warn(err)
      setQuota(0)
      setUsage(0)
    })
  }, [])

  useEffect(() => {
    updateQuotas()
  }, [updateQuotas])
  return [usage, quota, updateQuotas] as const
}

export const useIfHasBeenGivenAccess = () => {
  const [hasBeenGivenAccess, setHasBeenGivenAccess] = useState<boolean | null>(null)
  const [fs] = useListenableObject(AutoRecoveryFileSystem.fileSystem)

  useEffect(() => {
    if (fs !== null) {
      setHasBeenGivenAccess(true)
      return
    }
    if (hasBeenGivenAccess || !AutoRecoveryFileSystem.canAutoRecover) {
      return
    }
    AutoRecoveryFileSystem.hasBeenGivenAccess().then(setHasBeenGivenAccess)
  }, [hasBeenGivenAccess, fs])
  return hasBeenGivenAccess
}

