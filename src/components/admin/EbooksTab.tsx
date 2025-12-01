import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Ebook } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface EbooksTabProps {
  ebooks: Ebook[];
  onRefresh: () => void;
}

export function EbooksTab({ ebooks, onRefresh }: EbooksTabProps) {
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ebookForm, setEbookForm] = useState({
    title: '', author: '', description: '', price: '', genre: '', pages: '', isbn: '', cover_url: '', is_free: false
  });

  const handleSaveEbook = async () => {
    const ebookData = {
      title: ebookForm.title,
      author: ebookForm.author,
      description: ebookForm.description || null,
      price: parseFloat(ebookForm.price) || 0,
      genre: ebookForm.genre || null,
      pages: parseInt(ebookForm.pages) || null,
      isbn: ebookForm.isbn || null,
      cover_url: ebookForm.cover_url || null,
      is_free: ebookForm.is_free
    };

    if (editingEbook) {
      const { error } = await supabase.from('ebooks').update(ebookData).eq('id', editingEbook.id);
      if (error) toast.error('Failed to update ebook');
      else toast.success('Ebook updated');
    } else {
      const { error } = await supabase.from('ebooks').insert(ebookData);
      if (error) toast.error('Failed to create ebook');
      else toast.success('Ebook created');
    }
    setDialogOpen(false);
    resetForm();
    onRefresh();
  };

  const handleDeleteEbook = async (ebookId: string) => {
    const { error } = await supabase.from('ebooks').delete().eq('id', ebookId);
    if (error) toast.error('Failed to delete ebook');
    else {
      toast.success('Ebook deleted');
      onRefresh();
    }
  };

  const openEditDialog = (ebook: Ebook) => {
    setEditingEbook(ebook);
    setEbookForm({
      title: ebook.title,
      author: ebook.author,
      description: ebook.description || '',
      price: ebook.price.toString(),
      genre: ebook.genre || '',
      pages: ebook.pages?.toString() || '',
      isbn: ebook.isbn || '',
      cover_url: ebook.cover_url || '',
      is_free: ebook.is_free
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEbook(null);
    setEbookForm({ title: '', author: '', description: '', price: '', genre: '', pages: '', isbn: '', cover_url: '', is_free: false });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Ebooks ({ebooks.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Add Ebook</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingEbook ? 'Edit Ebook' : 'Add Ebook'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={ebookForm.title} onChange={e => setEbookForm({...ebookForm, title: e.target.value})} />
              </div>
              <div>
                <Label>Author</Label>
                <Input value={ebookForm.author} onChange={e => setEbookForm({...ebookForm, author: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price ($)</Label>
                  <Input type="number" step="0.01" value={ebookForm.price} onChange={e => setEbookForm({...ebookForm, price: e.target.value})} />
                </div>
                <div>
                  <Label>Pages</Label>
                  <Input type="number" value={ebookForm.pages} onChange={e => setEbookForm({...ebookForm, pages: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Genre</Label>
                  <Input value={ebookForm.genre} onChange={e => setEbookForm({...ebookForm, genre: e.target.value})} />
                </div>
                <div>
                  <Label>ISBN</Label>
                  <Input value={ebookForm.isbn} onChange={e => setEbookForm({...ebookForm, isbn: e.target.value})} />
                </div>
              </div>
              <ImageUpload 
                value={ebookForm.cover_url} 
                onChange={(url) => setEbookForm({...ebookForm, cover_url: url})} 
              />
              <div className="flex items-center justify-between">
                <Label>Free Ebook</Label>
                <Switch checked={ebookForm.is_free} onCheckedChange={checked => setEbookForm({...ebookForm, is_free: checked})} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={ebookForm.description} onChange={e => setEbookForm({...ebookForm, description: e.target.value})} rows={4} />
              </div>
              <Button onClick={handleSaveEbook} className="w-full">{editingEbook ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ebooks.map(e => (
              <TableRow key={e.id}>
                <TableCell>
                  {e.cover_url ? (
                    <img src={e.cover_url} alt={e.title} className="w-12 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">No img</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>{e.author}</TableCell>
                <TableCell>{e.genre || '-'}</TableCell>
                <TableCell>
                  {e.is_free ? (
                    <Badge variant="secondary">Free</Badge>
                  ) : (
                    <span>${e.price.toFixed(2)}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(e)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ebook</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete "{e.title}"? This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEbook(e.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
