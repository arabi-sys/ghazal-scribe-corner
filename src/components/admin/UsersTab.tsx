import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/types';
import { toast } from 'sonner';
import { Edit, Trash2, Shield, User } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
}

interface UsersTabProps {
  users: Profile[];
  onRefresh: () => void;
}

export function UsersTab({ users, onRefresh }: UsersTabProps) {
  const [userRoles, setUserRoles] = useState<Record<string, 'admin' | 'user'>>({});
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', email: '' });

  useEffect(() => {
    fetchUserRoles();
  }, [users]);

  const fetchUserRoles = async () => {
    const { data } = await supabase.from('user_roles').select('*');
    if (data) {
      const rolesMap: Record<string, 'admin' | 'user'> = {};
      data.forEach((r: UserRole) => {
        rolesMap[r.user_id] = r.role;
      });
      setUserRoles(rolesMap);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'user') => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);
    
    if (error) {
      toast.error('Failed to update role');
    } else {
      toast.success(`Role changed to ${newRole}`);
      setUserRoles(prev => ({ ...prev, [userId]: newRole }));
    }
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setEditForm({ full_name: user.full_name || '', email: user.email });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editForm.full_name })
      .eq('id', editingUser.id);
    
    if (error) {
      toast.error('Failed to update user');
    } else {
      toast.success('User updated');
      setEditDialogOpen(false);
      onRefresh();
    }
  };

  const handleDeleteUser = async (userId: string, userAuthId: string) => {
    // Delete profile (user_roles will be deleted by cascade from auth.users)
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    
    if (error) {
      toast.error('Failed to delete user profile');
    } else {
      toast.success('User profile deleted');
      onRefresh();
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Users ({users.length})</h2>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select 
                    value={userRoles[u.user_id] || 'user'} 
                    onValueChange={(v: 'admin' | 'user') => handleChangeRole(u.user_id, v)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {userRoles[u.user_id] === 'admin' ? (
                            <><Shield className="h-4 w-4" />Admin</>
                          ) : (
                            <><User className="h-4 w-4" />User</>
                          )}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2"><User className="h-4 w-4" />User</div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2"><Shield className="h-4 w-4" />Admin</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{u.full_name || u.email}"? This will remove their profile data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(u.id, u.user_id)} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editForm.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <Button onClick={handleSaveUser} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
