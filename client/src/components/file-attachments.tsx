import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Paperclip, 
  Upload, 
  File, 
  Download, 
  Trash2, 
  Cloud,
  X,
  FileText,
  Image,
  FileArchive
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FileAttachmentsProps {
  taskId?: string;
  noteId?: string;
  projectId?: string;
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

function FileAttachments({ taskId, noteId, projectId }: FileAttachmentsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const queryClient = useQueryClient();

  // Fetch attachments
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['/api/attachments', { taskId, noteId, projectId }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (taskId) params.append('taskId', taskId);
      if (noteId) params.append('noteId', noteId);
      if (projectId) params.append('projectId', projectId);
      return apiRequest(`/api/attachments?${params}`);
    },
    enabled: !!(taskId || noteId || projectId),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      if (taskId) formData.append('taskId', taskId);
      if (noteId) formData.append('noteId', noteId);
      if (projectId) formData.append('projectId', projectId);

      return apiRequest('/api/attachments/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attachments'] });
      setSelectedFile(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      apiRequest(`/api/attachments/${attachmentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attachments'] });
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card data-testid="file-attachments">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          File Attachments
        </CardTitle>
        <CardDescription>
          Attach files to organize your work better
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver ? 'border-ai-primary bg-ai-primary/5' : 'border-muted-foreground/25'
          } ${selectedFile ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/20' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          data-testid="file-drop-zone"
        >
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <File className="h-6 w-6 text-blue-600" />
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  data-testid="button-confirm-upload"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFile(null)}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Cloud className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Support for images, PDFs, documents up to 10MB
                </p>
              </div>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                data-testid="file-input"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-ai-primary text-white rounded-md cursor-pointer hover:bg-ai-primary/90 transition-colors"
              >
                Choose File
              </label>
            </div>
          )}
        </div>

        {/* Attachments List */}
        {isLoading ? (
          <div className="space-y-2" data-testid="attachments-loading">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-100 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : attachments.length > 0 ? (
          <div className="space-y-2" data-testid="attachments-list">
            {attachments.map((attachment: FileAttachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(attachment.type)}
                  <div>
                    <p className="font-medium text-sm">{attachment.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.size)}</span>
                      <span>•</span>
                      <span>{new Date(attachment.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(attachment.url, '_blank')}
                    data-testid={`button-download-${attachment.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(attachment.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${attachment.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground" data-testid="no-attachments">
            <Paperclip className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">No files attached yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { FileAttachments };
export default FileAttachments;