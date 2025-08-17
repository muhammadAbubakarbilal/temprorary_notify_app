import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNoteSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Search, Plus, Share, Bot, Lightbulb, Link, Sparkles, Menu, Brain, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NoteWithTaskCount, InsertNote } from "@shared/schema";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface NotesEditorProps {
  projectId: string;
}

export default function NotesEditor({ projectId }: NotesEditorProps) {
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [extractingTasks, setExtractingTasks] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [content, setContent] = useState('');

  const { data: notes = [] } = useQuery<NoteWithTaskCount[]>({
    queryKey: ['/api/projects', projectId, 'notes'],
    enabled: !!projectId,
  });

  const { data: currentNote } = useQuery({
    queryKey: ['/api/notes', selectedNote],
    enabled: !!selectedNote,
  });

  const form = useForm<InsertNote>({
    resolver: zodResolver(insertNoteSchema),
    defaultValues: {
      projectId: projectId,
      title: "",
      content: "",
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: InsertNote) => {
      const response = await apiRequest('POST', `/api/projects/${projectId}/notes`, data);
      return response.json();
    },
    onSuccess: async (note) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'notes'] });

      // Auto-extract tasks from new note if it has content
      if (note.content && note.content.trim().length > 0) {
        try {
          await apiRequest('POST', `/api/notes/${note.id}/extract-tasks`);
          queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'tasks'] });
          toast({
            title: "Note created & tasks extracted",
            description: "Your note has been created and tasks were automatically extracted.",
          });
        } catch (error) {
          toast({
            title: "Note created",
            description: "Your note has been created successfully.",
          });
        }
      } else {
        toast({
          title: "Note created",
          description: "Your new note has been created successfully.",
        });
      }

      setNewNoteOpen(false);
      form.reset();
      setSelectedNote(note.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertNote> }) => {
      const response = await apiRequest('PATCH', `/api/notes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notes', selectedNote] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'tasks'] });
    },
  });

  const extractTasksMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await apiRequest('POST', `/api/notes/${noteId}/extract-tasks`);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'tasks'] });
      toast({
        title: "Tasks extracted",
        description: `Successfully extracted ${result.count} tasks from your note.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to extract tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = (data: InsertNote) => {
    createNoteMutation.mutate({ ...data, projectId });
  };

  const handleNoteUpdate = (field: 'title' | 'content', value: string) => {
    if (!selectedNote) return;
    updateNoteMutation.mutate({
      id: selectedNote,
      data: { [field]: value }
    });
    if (field === 'content') {
      setContent(value);
    }
  };

  const handleExtractTasks = async () => {
    if (!selectedNote) return;
    setExtractingTasks(true);
    try {
      await extractTasksMutation.mutateAsync(selectedNote);
    } finally {
      setExtractingTasks(false);
    }
  };

  const handleSave = () => {
    console.log('Saving note:', content);
  };

  const handleAIExtraction = async () => {
    if (!content.trim()) return;

    setIsExtracting(true);
    try {
      const response = await fetch(`/api/notes/temp/extract-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const tasks = await response.json();
        setExtractedTasks(tasks);
        setShowAISuggestions(true);
      } else {
        const error = await response.json();
        console.error('AI extraction failed:', error);
      }
    } catch (error) {
      console.error('AI extraction error:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `note-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full">
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} lg:w-80 border-r border-border bg-ai-card overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'block' : 'hidden lg:block'} custom-scrollbar`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ai-text">Notes</h3>
            <Dialog open={newNoteOpen} onOpenChange={setNewNoteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" data-testid="create-note">
                  <Plus className="h-4 w-4 text-ai-primary" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                  <DialogDescription>
                    Create a new note in this project.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter note title"
                              data-testid="input-note-title"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setNewNoteOpen(false)}
                        data-testid="cancel-note"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createNoteMutation.isPending}
                        data-testid="submit-note"
                      >
                        {createNoteMutation.isPending ? "Creating..." : "Create Note"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search notes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-notes"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No notes found</p>
              <p className="text-muted-foreground text-xs mt-1">
                {searchQuery ? "Try adjusting your search" : "Create your first note to get started"}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setSelectedNote(note.id);
                  setContent(note.content || "");
                }}
                className={cn(
                  "w-full p-3 rounded-lg cursor-pointer mb-2 text-left transition-colors",
                  selectedNote === note.id
                    ? "bg-ai-primary/10 border border-ai-primary/20"
                    : "hover:bg-muted"
                )}
                data-testid={`note-${note.id}`}
              >
                <div className="font-medium text-ai-text mb-1">{note.title}</div>
                <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {note.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                  {note.tasksExtracted > 0 && (
                    <div className="flex items-center space-x-1">
                      <Bot className="h-3 w-3 text-ai-secondary" />
                      <span>{note.tasksExtracted} tasks</span>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Rich Text Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Toolbar */}
            <div className="bg-ai-card border-b border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleAIExtraction}
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    disabled={isExtracting}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {isExtracting ? 'Extracting...' : 'AI Extract Tasks'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.hash = '#tasks'}
                    data-testid="quick-create-task"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Quick Task
                  </Button>
                  <Button size="sm" variant="ghost" data-testid="ai-suggestions">
                    <Lightbulb className="h-4 w-4 text-orange-500" />
                  </Button>
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Auto-saved</span>
                  <Button size="sm" className="bg-accent text-white hover:bg-accent/90" data-testid="share-note">
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {currentNote ? (
                <div className="p-6 max-w-4xl mx-auto">
                  <Input
                    value={(currentNote as any)?.title || ""}
                    onChange={(e) => handleNoteUpdate('title', e.target.value)}
                    className="text-3xl font-bold border-none shadow-none p-0 mb-6 bg-transparent"
                    placeholder="Note title..."
                    data-testid="note-title-input"
                  />

                  <RichTextEditor
                    content={(currentNote as any)?.content || ""}
                    onChange={(content) => handleNoteUpdate('content', content)}
                    placeholder="Start writing your note..."
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ai-primary"></div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-ai-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-ai-primary" />
              </div>
              <h3 className="text-lg font-semibold text-ai-text mb-2">No note selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a note from the sidebar or create a new one
              </p>
              <Button
                onClick={() => setNewNoteOpen(true)}
                className="bg-ai-primary text-white hover:bg-ai-primary/90"
                data-testid="create-first-note"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}