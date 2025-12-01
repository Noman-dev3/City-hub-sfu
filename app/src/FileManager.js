'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FileManager {
    constructor(uploadDir) {
        this.uploadDir = uploadDir;
        this.ensureUploadDir();
    }

    ensureUploadDir() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async saveFile(file, metadata = {}) {
        const fileId = uuidv4();
        const ext = path.extname(file.name);
        const fileName = `${fileId}${ext}`;
        const filePath = path.join(this.uploadDir, fileName);

        // In a real express-fileupload scenario, file.mv is used
        // But here we might be receiving a stream or buffer depending on middleware
        // Assuming express-fileupload or similar is used, or we handle raw stream

        // If we use simple fs write (for small files or text)
        // But for express, we usually use multer or express-fileupload

        // Let's assume we receive the file object from a middleware like express-fileupload
        if (file.mv) {
            await file.mv(filePath);
        } else {
            // Fallback if it's a buffer
            fs.writeFileSync(filePath, file.data);
        }

        const fileInfo = {
            id: fileId,
            originalName: file.name,
            fileName: fileName,
            size: file.size,
            mimetype: file.mimetype,
            uploadDate: new Date().toISOString(),
            ...metadata
        };

        this.saveMetadata(fileId, fileInfo);
        return fileInfo;
    }

    saveMetadata(fileId, metadata) {
        const metaPath = path.join(this.uploadDir, `${fileId}.json`);
        fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
    }

    getFiles() {
        const files = [];
        if (!fs.existsSync(this.uploadDir)) return files;

        const items = fs.readdirSync(this.uploadDir);
        for (const item of items) {
            if (item.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(path.join(this.uploadDir, item), 'utf8');
                    files.push(JSON.parse(content));
                } catch (err) {
                    console.error('Error reading metadata:', err);
                }
            }
        }
        return files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    }

    getFile(fileId) {
        const metaPath = path.join(this.uploadDir, `${fileId}.json`);
        if (!fs.existsSync(metaPath)) return null;

        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        const filePath = path.join(this.uploadDir, metadata.fileName);

        if (!fs.existsSync(filePath)) return null;

        return {
            ...metadata,
            path: filePath
        };
    }

    deleteFile(fileId) {
        const metaPath = path.join(this.uploadDir, `${fileId}.json`);
        if (fs.existsSync(metaPath)) {
            const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            const filePath = path.join(this.uploadDir, metadata.fileName);

            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            fs.unlinkSync(metaPath);
            return true;
        }
        return false;
    }
}

module.exports = FileManager;
