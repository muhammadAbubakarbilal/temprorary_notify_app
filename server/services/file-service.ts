import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { InsertAttachment, Attachment } from '@shared/schema';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Ensure upload directory exists
export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export interface FileUploadData {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  fileSize: number;
}

export async function validateFile(file: FileUploadData): Promise<{valid: boolean, error?: string}> {
  if (file.fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
    return { valid: false, error: `File type ${file.mimeType} is not allowed` };
  }

  return { valid: true };
}

export async function saveFile(file: FileUploadData, uploadedBy: string): Promise<Partial<InsertAttachment>> {
  await ensureUploadDir();

  const validation = await validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileId = randomUUID();
  const extension = path.extname(file.originalName);
  const fileName = `${fileId}${extension}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  await fs.writeFile(filePath, file.buffer);

  return {
    fileName,
    originalName: file.originalName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    filePath: path.join('uploads', fileName), // Relative path for serving
    uploadedBy,
  };
}

export async function deleteFile(attachment: Attachment): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), attachment.filePath);
    await fs.unlink(fullPath);
  } catch (error) {
    console.error('Failed to delete file:', error);
    // Don't throw - file might already be deleted
  }
}

export async function getFileStream(attachment: Attachment): Promise<Buffer> {
  const fullPath = path.join(process.cwd(), attachment.filePath);
  return fs.readFile(fullPath);
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'file-text';
  if (mimeType.includes('word')) return 'file-text';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'sheet';
  if (mimeType.startsWith('text/')) return 'file-text';
  return 'file';
}

// Mock implementation for development
export function createMockAttachment(originalName: string, uploadedBy: string): Partial<InsertAttachment> {
  const mimeType = originalName.includes('.pdf') ? 'application/pdf' : 
                   originalName.includes('.jpg') || originalName.includes('.jpeg') ? 'image/jpeg' :
                   originalName.includes('.png') ? 'image/png' : 'text/plain';
  
  return {
    fileName: `mock-${randomUUID()}.${originalName.split('.').pop()}`,
    originalName,
    mimeType,
    fileSize: Math.floor(Math.random() * 1000000) + 10000, // 10KB - 1MB
    filePath: `/uploads/mock-${originalName}`,
    uploadedBy,
  };
}