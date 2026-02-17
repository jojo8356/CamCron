import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { readdir, stat, rm } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { createReadStream, type ReadStream } from 'node:fs';

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedAt: string;
}

@Injectable()
export class FileService {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = resolve(process.env.CAMCRON_DATA_DIR || './data');
  }

  private safePath(requestedPath: string): string {
    const resolved = resolve(this.baseDir, requestedPath || '.');
    const rel = relative(this.baseDir, resolved);
    if (rel.startsWith('..') || resolve(resolved) !== resolved.replace(/\/+$/, '')) {
      throw new BadRequestException('Chemin invalide');
    }
    // Ensure we stay within baseDir
    if (!resolved.startsWith(this.baseDir)) {
      throw new BadRequestException('Accès refusé');
    }
    return resolved;
  }

  async list(requestedPath: string): Promise<FileEntry[]> {
    const dirPath = this.safePath(requestedPath);
    let entries: string[];
    try {
      entries = await readdir(dirPath);
    } catch {
      throw new NotFoundException('Répertoire introuvable');
    }

    const results: FileEntry[] = [];
    for (const name of entries) {
      try {
        const fullPath = join(dirPath, name);
        const s = await stat(fullPath);
        const relPath = relative(this.baseDir, fullPath);
        results.push({
          name,
          path: relPath,
          type: s.isDirectory() ? 'directory' : 'file',
          size: s.size,
          modifiedAt: s.mtime.toISOString(),
        });
      } catch {
        // Skip files we can't stat
      }
    }

    // Directories first, then alphabetical
    return results.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  getDownloadStream(requestedPath: string): { stream: ReadStream; filename: string } {
    const filePath = this.safePath(requestedPath);
    const filename = filePath.split('/').pop() || 'download';
    const stream = createReadStream(filePath);
    return { stream, filename };
  }

  async remove(requestedPath: string): Promise<void> {
    const targetPath = this.safePath(requestedPath);
    // Prevent deleting the root data directory
    if (targetPath === this.baseDir) {
      throw new BadRequestException('Impossible de supprimer le répertoire racine');
    }
    try {
      await rm(targetPath, { recursive: true });
    } catch {
      throw new NotFoundException('Fichier ou répertoire introuvable');
    }
  }
}
