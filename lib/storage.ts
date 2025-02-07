import { openDB, DBSchema } from 'idb';

interface StoredFile {
  name: string;
  type: string;
  content: ArrayBuffer;
}

interface FileDB extends DBSchema {
  files: {
    key: string;
    value: {
      cellId: string;
      files: StoredFile[];
    };
  };
}

const DB_NAME = 'notebook-files';
const STORE_NAME = 'files';

async function getDB() {
  return openDB<FileDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'cellId' });
    },
  });
}

async function fileToStored(file: File): Promise<StoredFile> {
  return {
    name: file.name,
    type: file.type,
    content: await file.arrayBuffer()
  };
}

export async function saveFiles(cellId: string, files: File[]) {
  const db = await getDB();
  const storedFiles = await Promise.all(files.map(fileToStored));
  await db.put(STORE_NAME, { cellId, files: storedFiles });
}

export async function loadFiles(cellId: string): Promise<File[]> {
  const db = await getDB();
  const data = await db.get(STORE_NAME, cellId);
  if (!data) return [];
  
  return data.files.map(file => 
    new File([file.content], file.name, { 
      type: file.type, 
      lastModified: Date.now() 
    })
  );
}

export async function removeFile(cellId: string, fileName: string) {
  const db = await getDB();
  const data = await db.get(STORE_NAME, cellId);
  if (!data) return;

  const updatedFiles = data.files.filter(f => f.name !== fileName);
  await db.put(STORE_NAME, { cellId, files: updatedFiles });
}

export async function clearFiles(cellId: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, cellId);
} 