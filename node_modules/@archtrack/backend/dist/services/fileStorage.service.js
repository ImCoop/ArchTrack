import fs from 'node:fs/promises';
import path from 'node:path';
const uploadsRoot = path.resolve(process.cwd(), 'uploads');
export const fileStorageService = {
    root() {
        return uploadsRoot;
    },
    async save(relativePath, bytes) {
        const absolutePath = path.resolve(uploadsRoot, relativePath);
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, bytes);
        return absolutePath;
    },
    resolve(relativePath) {
        return path.resolve(uploadsRoot, relativePath);
    },
    async exists(relativePath) {
        try {
            await fs.access(this.resolve(relativePath));
            return true;
        }
        catch {
            return false;
        }
    },
};
