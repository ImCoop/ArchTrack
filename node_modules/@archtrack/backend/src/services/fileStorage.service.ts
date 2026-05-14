import fs from 'node:fs/promises';
import path from 'node:path';

const uploadsRoot = path.resolve(process.cwd(), 'uploads');

export const fileStorageService = {
  root() {
    return uploadsRoot;
  },

  async save(relativePath: string, bytes: Buffer) {
    const absolutePath = path.resolve(uploadsRoot, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, bytes);
    return absolutePath;
  },

  resolve(relativePath: string) {
    return path.resolve(uploadsRoot, relativePath);
  },

  async exists(relativePath: string) {
    try {
      await fs.access(this.resolve(relativePath));
      return true;
    } catch {
      return false;
    }
  },
};
