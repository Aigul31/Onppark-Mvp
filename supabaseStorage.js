const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require("crypto");

class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// Supabase Storage Service для замены Replit Object Storage
class SupabaseStorageService {
  constructor() {
    // Используем обычный клиент с anon key для Storage операций
    this.supabase = createClient(
      process.env.SUPABASE_URL || "https://hifwcfptqusvoarbejap.supabase.co",
      process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZndjZnB0cXVzdm9hcmJlamFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTg1MTMsImV4cCI6MjA3MjAzNDUxM30.g971sOhMGkvbVIjh2LC-hD2900OCrkg_FJLgAgdV-es"
    );
    this.bucketName = 'uploads'; // основной bucket для файлов
  }

  // Создает presigned URL для загрузки файла
  async getObjectEntityUploadURL() {
    try {
      const objectId = randomUUID();
      const filePath = `uploads/${objectId}`;

      // Создаем presigned URL для PUT запроса
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUploadUrl(filePath);

      if (error) {
        console.error('Supabase storage error:', error);
        throw new Error(`Failed to create upload URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error creating upload URL:', error);
      throw error;
    }
  }

  // Получает файл по пути
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    // Извлекаем путь файла из URL
    const filePath = objectPath.replace("/objects/", "uploads/");
    
    try {
      // Проверяем существование файла
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('uploads', {
          search: filePath.split('/').pop()
        });

      if (error || !data || data.length === 0) {
        throw new ObjectNotFoundError();
      }

      return {
        bucketName: this.bucketName,
        filePath: filePath,
        exists: true
      };
    } catch (error) {
      throw new ObjectNotFoundError();
    }
  }

  // Скачивает файл и возвращает response
  async downloadObject(fileInfo, res, cacheTtlSec = 3600) {
    try {
      const { data, error } = await this.supabase.storage
        .from(fileInfo.bucketName)
        .download(fileInfo.filePath);

      if (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
          res.status(404).json({ error: "File not found" });
        }
        return;
      }

      // Определяем content type по расширению файла
      const contentType = this.getContentType(fileInfo.filePath);
      
      // Устанавливаем заголовки
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", `public, max-age=${cacheTtlSec}`);
      res.setHeader("Content-Length", data.size);

      // Отправляем файл
      const buffer = Buffer.from(await data.arrayBuffer());
      res.end(buffer);
      
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Определяет content type по расширению файла
  getContentType(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'json': 'application/json'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

module.exports = {
  SupabaseStorageService,
  ObjectNotFoundError,
};