import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, Send, DollarSign } from 'lucide-react';
import { z } from 'zod';

const transferSchema = z.object({
  senderFullName: z.string().min(2, 'Full name is required'),
  senderIdNumber: z.string().min(5, 'Valid ID number is required'),
  senderPhone: z.string().regex(/^(\+961|961)?[0-9]{7,8}$/, 'Must be a valid Lebanese phone number'),
  amount: z.number().min(1, 'Amount must be at least $1'),
  receiverFullName: z.string().min(2, 'Receiver name is required'),
});

export default function MoneyTransfer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [idPictureUrl, setIdPictureUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    senderFullName: '',
    senderIdNumber: '',
    senderPhone: '',
    amount: '',
    receiverFullName: '',
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('id-pictures')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('id-pictures')
        .getPublicUrl(fileName);

      setIdPictureUrl(publicUrl);
      toast.success('ID picture uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload ID picture');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationData = {
      ...form,
      amount: parseFloat(form.amount) || 0,
    };

    const result = transferSchema.safeParse(validationData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!idPictureUrl) {
      toast.error('Please upload your ID picture');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('money_transfers')
        .insert({
          user_id: user.id,
          sender_full_name: form.senderFullName,
          sender_id_number: form.senderIdNumber,
          sender_id_picture_url: idPictureUrl,
          sender_phone: form.senderPhone,
          amount: parseFloat(form.amount),
          receiver_full_name: form.receiverFullName,
          transfer_type: 'local',
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Transfer request submitted successfully!');
      navigate('/transfers');
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Failed to submit transfer request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground">Money Transfer</h1>
          <p className="text-muted-foreground mt-2">Send money locally within Lebanon</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Local Transfer - Lebanon
            </CardTitle>
            <CardDescription>
              Fill in the details below to initiate a money transfer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sender Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Sender Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="senderFullName">Full Name</Label>
                  <Input
                    id="senderFullName"
                    value={form.senderFullName}
                    onChange={(e) => setForm({ ...form, senderFullName: e.target.value })}
                    placeholder="Enter your full name"
                  />
                  {errors.senderFullName && <p className="text-sm text-destructive">{errors.senderFullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderIdNumber">ID Number</Label>
                  <Input
                    id="senderIdNumber"
                    value={form.senderIdNumber}
                    onChange={(e) => setForm({ ...form, senderIdNumber: e.target.value })}
                    placeholder="Enter your ID number"
                  />
                  {errors.senderIdNumber && <p className="text-sm text-destructive">{errors.senderIdNumber}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idPicture">ID Picture</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="idPicture"
                      type="file"
                      accept="image/*"
                      onChange={handleIdUpload}
                      disabled={uploading}
                      className="flex-1"
                    />
                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  {idPictureUrl && (
                    <div className="mt-2">
                      <img 
                        src={idPictureUrl} 
                        alt="ID Preview" 
                        className="h-24 w-auto object-contain rounded border"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderPhone">Phone Number (Lebanese)</Label>
                  <Input
                    id="senderPhone"
                    value={form.senderPhone}
                    onChange={(e) => setForm({ ...form, senderPhone: e.target.value })}
                    placeholder="+961 XX XXX XXX"
                  />
                  {errors.senderPhone && <p className="text-sm text-destructive">{errors.senderPhone}</p>}
                </div>
              </div>

              {/* Transfer Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
                {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
              </div>

              {/* Receiver Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Receiver Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="receiverFullName">Receiver Full Name</Label>
                  <Input
                    id="receiverFullName"
                    value={form.receiverFullName}
                    onChange={(e) => setForm({ ...form, receiverFullName: e.target.value })}
                    placeholder="Enter receiver's full name"
                  />
                  {errors.receiverFullName && <p className="text-sm text-destructive">{errors.receiverFullName}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Transfer Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
