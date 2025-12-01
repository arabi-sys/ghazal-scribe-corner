import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface CategoriesTabProps {
  categories: Category[];
  onRefresh: () => void;
}

export function CategoriesTab({ categories, onRefresh }: CategoriesTabProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '', slug: '', description: '', image_url: ''
  });

  const handleSaveCategory = async () => {
    const categoryData = {
      name: categoryForm.name,
      slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
      description: categoryForm.description || null,
      image_url: categoryForm.image_url || null
    };

    if (editingCategory) {
      const { error } = await supabase.from('categories').update(categoryData).eq('id', editingCategory.id);
      if (error) toast.error('Failed to update category');
      else toast.success('Category updated');
    } else {
      const { error } = await supabase.from('categories').insert(categoryData);
      if (error) toast.error('Failed to create category');
      else toast.success('Category created');
    }
    setDialogOpen(false);
    resetForm();
    onRefresh();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) toast.error('Failed to delete category. It may have products assigned.');
    else {
      toast.success('Category deleted');
      onRefresh();
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', description: '', image_url: '' });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Categories ({categories.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input 
                  value={categoryForm.slug} 
                  onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})} 
                  placeholder="auto-generated-from-name"
                />
              </div>
              <ImageUpload 
                value={categoryForm.image_url} 
                onChange={(url) => setCategoryForm({...categoryForm, image_url: url})} 
              />
              <div>
                <Label>Description</Label>
                <Textarea value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} />
              </div>
              <Button onClick={handleSaveCategory} className="w-full">{editingCategory ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">No img</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                <TableCell className="max-w-[200px] truncate">{c.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(c)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete "{c.name}"? Products in this category will become uncategorized.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCategory(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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
