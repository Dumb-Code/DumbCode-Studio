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

  private static async getSubDirectory(directory: FileSystemDirectoryEntry, path?: string | null, options?: FileSystemFlags) {
    return new Promise<FileSystemDirectoryEntry>((resolve, reject) => {
      directory.getDirectory(path, options, entry => {
        if (entry.isDirectory) {
          resolve(entry as FileSystemDirectoryEntry)
        } else {
          reject("Expected a directory??")
        }
      }, reject)
    })
  }

  private static async listFiles<T extends boolean>(directory: FileSystemDirectoryEntry, isFile: T) {
    type Ret = T extends true ? FileSystemFileEntry : FileSystemDirectoryEntry
    return new Promise<Ret[]>((resolve, reject) => {
      directory.createReader().readEntries(entries => {
        const files = entries.filter(entry => entry.isFile === isFile)
        resolve(files as Ret[])
      }, reject)
    })
  }

  private static async getBaseDirectory() {
    const fs = await AutoRecoveryFileSystem.getOrCreateSystem(false)
    if (fs === null) {
      return null
    }
    return AutoRecoveryFileSystem.getSubDirectory(fs.root, "autorecovery", { create: true })
  }

  //Due to a limitation in the (deprecated) file api, 
  //The directory reader only returns the top 100 entries.
  //Therefore, we need to split up the file name into sub directories.
  //
  //As the minimum time between saves is 1 minute, 60000ms, 100 minutes would then be 6000000ms
  //Say a recovery file was pushed at 1650000000, at a rate of 1 per minute.
  //99 files later and we're at 1656000000
  //We can then split up the file name into subdirectories as follows:
  // 1650000000-<filename> --> 16/50/1650000000-<filename> 
  // 1656000000-<filename> --> 16/56/1656000000-<filename>
  //
  //And therefore they're in different directories \o/, thus no issue.
  //Note that the first two directories are numbers 00-99, which is 100 entries exactly.
  static async getFile(name: string) {
    // [1 6 5 0 [000000-<filename>]] = 1650000000-<filename>
    const [l1, l2, l3, l4, ...rest] = name
    const dir1 = l1 + l2
    const dir2 = l3 + l4

    const directory = await AutoRecoveryFileSystem.getBaseDirectory()
    if (directory === null) {
      return null
    }

    const directory1 = await AutoRecoveryFileSystem.getSubDirectory(directory, dir1, { create: true })
    const directory2 = await AutoRecoveryFileSystem.getSubDirectory(directory1, dir2, { create: true })

    return new Promise<FileSystemFileEntry>((resolve, reject) => {
      directory2.getFile(name, { create: true }, file => {
        if (file.isFile) {
          resolve(file as FileSystemFileEntry)
        } else {
          reject("Expected a file??")
        }
      }, reject)
    })
  }

  static async getOldest<T extends boolean>(directory: FileSystemDirectoryEntry, isFiles: T) {
    const files = await AutoRecoveryFileSystem.listFiles(directory, isFiles)
    if (files.length === 0) {
      return null
    }
    return files.sort((a, b) => a.name.localeCompare(b.name))[0]
  }

  static async deleteOldest() {
    const directory = await AutoRecoveryFileSystem.getBaseDirectory()
    if (directory === null) {
      return false
    }

    const oldestsTopDir = await AutoRecoveryFileSystem.getOldest(directory, false)
    if (oldestsTopDir === null) {
      return false
    }
    const oldestSubdir = await AutoRecoveryFileSystem.getOldest(oldestsTopDir, false)
    if (oldestSubdir === null) {
      return false
    }

    const oldestFile = await AutoRecoveryFileSystem.getOldest(oldestSubdir, true)
    if (oldestFile === null) {
      return false
    }

    return new Promise<boolean>((resolve, reject) => {
      oldestFile.remove(() => resolve(true), reject)
    })
  }

  static async getAllEntries() {
    const directory = await AutoRecoveryFileSystem.getBaseDirectory()
    if (directory === null) {
      return []
    }
    //16/50/1650000000-<filename>

    const topLevelDirectories = await AutoRecoveryFileSystem.listFiles(directory, false)

    const subLevelDirectories = await Promise.all(topLevelDirectories.map(dir =>
      AutoRecoveryFileSystem.listFiles(dir, false)
    ))

    const entries = await Promise.all(subLevelDirectories.flat().map(dir =>
      AutoRecoveryFileSystem.listFiles(dir, true)
    ))

    return entries.flat()
  }

  static async deleteAll() {
    const directory = await AutoRecoveryFileSystem.getBaseDirectory()
    if (directory === null) {
      return
    }

    return new Promise<void>((resolve, reject) => {
      directory.removeRecursively(resolve, reject)
    })
  }
}

export const useUsageAndQuota = () => {
  const [quota, setQuota] = useState<number>(0)
  const [usage, setUsage] = useState<number>(0)
  const [numFiles, updateNumFiles] = useAllEntries()

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
    updateNumFiles()
  }, [updateNumFiles])

  useEffect(() => {
    updateQuotas()
  }, [updateQuotas])
  return [usage, quota, numFiles.length, updateQuotas] as const
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

export const useAllEntries = () => {
  const [entries, setEntries] = useState<FileSystemFileEntry[]>([])
  const updateEntries = useCallback(() => {
    AutoRecoveryFileSystem.getAllEntries().then(setEntries)
  }, [])
  useEffect(() => {
    updateEntries()
  }, [updateEntries])
  return [entries, updateEntries] as const
}