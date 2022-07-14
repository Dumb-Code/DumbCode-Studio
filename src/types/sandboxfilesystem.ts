declare global {

  interface Window {
    TEMPORARY: number;
    PERSISTENT: number;

    requestFileSystem: (type: Window['TEMPORARY'] | Window['PERSISTENT'], size: number, successCallback: (fs: FileSystem) => void, errorCallback?: (error: Error) => void) => void;
    webkitRequestFileSystem: Window['requestFileSystem']
  }


  interface StorageQuota {
    queryUsageAndQuota(successCallback: (usage: number, quota: number) => void, errorCallback?: (error: Error) => void): void;
    requestQuota(bytes: number, successCallback: (bytes: number) => void, errorCallback?: (error: Error) => void): void;
  }

  interface Navigator {
    persistentStorage: StorageQuota
    // temporaryStorage: StorageQuota

    webkitPersistentStorage: StorageQuota
    // webkitTemporaryStorage: StorageQuota
  }

  interface Metadata {
    readonly modificationTime: Date;
    readonly size: number;
  }

  interface FileSystemEntry {
    copyTo(newParent: FileSystemDirectoryEntry, newName?: string, successCallback?: (entry: FileSystemEntry) => void, errorCallback?: (error: Error) => void): void;
    getMetadata(successCallback: (metadata: Metadata) => void, errorCallback?: (error: Error) => void): void;
    getParent(successCallback: (entry: FileSystemDirectoryEntry) => void, errorCallback?: (error: Error) => void): void;
    moveTo(newParent: FileSystemDirectoryEntry, newName?: string, successCallback?: (entry: FileSystemEntry) => void, errorCallback?: (error: Error) => void): void;
    remove(successCallback?: () => void, errorCallback?: (error: Error) => void): void;
    toURL(): string;
  }

  interface FileSystemDirectoryEntry {
    removeRecursively(successCallback: () => void, errorCallback?: (error: Error) => void): void;
  }
}

export { };

