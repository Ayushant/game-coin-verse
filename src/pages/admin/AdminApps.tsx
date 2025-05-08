
import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { FileUpload } from '@/components/ui/file-upload';
import { ReactNode } from 'react';
import { Loader2, Plus, Trash, Edit } from 'lucide-react';

type App = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  download_url: string;
  coin_price: number | null;
  inr_price: number | null;
  payment_method: 'coins' | 'razorpay' | 'manual' | 'free';
  payment_instructions: string | null;
  created_at: string;
};

const STORAGE_BUCKET = 'app_images';

const AdminApps = () => {
  const { isAdmin, getConversionRateInINR } = useAdmin();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    download_url: '',
    coin_price: '',
    inr_price: '',
    payment_method: 'coins',
    payment_instructions: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      loadApps();
      checkStorageBucket();
    }
  }, [isAdmin]);

  const checkStorageBucket = async () => {
    try {
      // Check if storage bucket exists, create if not
      const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET);
      
      if (error && error.message.includes('not found')) {
        await supabase.storage.createBucket(STORAGE_BUCKET, {
          public: true
        });
      }
    } catch (error) {
      console.error('Error checking storage bucket:', error);
    }
  };

  const loadApps = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('paid_apps')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setApps(data);
    } catch (error) {
      console.error('Error loading apps:', error);
      toast({
        title: 'Error',
        description: 'Failed to load apps',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewApp = () => {
    setSelectedApp(null);
    setFormValues({
      name: '',
      description: '',
      download_url: '',
      coin_price: '',
      inr_price: '',
      payment_method: 'coins',
      payment_instructions: '',
    });
    setImageUrl('');
    setDialogOpen(true);
  };

  const handleEditApp = (app: App) => {
    setSelectedApp(app);
    setFormValues({
      name: app.name,
      description: app.description,
      download_url: app.download_url,
      coin_price: app.coin_price?.toString() || '',
      inr_price: app.inr_price?.toString() || '',
      payment_method: app.payment_method,
      payment_instructions: app.payment_instructions || '',
    });
    setImageUrl(app.image_url || '');
    setDialogOpen(true);
  };

  const handleDeleteApp = (app: App) => {
    setSelectedApp(app);
    setDeleteDialogOpen(true);
  };

  const handleUploadComplete = (url: string) => {
    setImageUrl(url);
  };

  const saveApp = async () => {
    try {
      setSaving(true);
      
      const appData = {
        name: formValues.name,
        description: formValues.description,
        download_url: formValues.download_url,
        image_url: imageUrl,
        coin_price: formValues.coin_price ? Number(formValues.coin_price) : null,
        inr_price: formValues.inr_price ? Number(formValues.inr_price) : null,
        payment_method: formValues.payment_method as 'coins' | 'razorpay' | 'manual' | 'free',
        payment_instructions: formValues.payment_method === 'manual' ? formValues.payment_instructions : null,
      };
      
      // Validate form
      if (!appData.name || !appData.description || !appData.download_url) {
        toast({
          title: 'Missing Fields',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      // Check payment method requirements
      if (appData.payment_method === 'coins' && !appData.coin_price) {
        toast({
          title: 'Missing Coin Price',
          description: 'Please enter a coin price for coin payment method',
          variant: 'destructive',
        });
        return;
      }
      
      if ((appData.payment_method === 'razorpay' || appData.payment_method === 'manual') && !appData.inr_price) {
        toast({
          title: 'Missing INR Price',
          description: 'Please enter an INR price for this payment method',
          variant: 'destructive',
        });
        return;
      }
      
      if (appData.payment_method === 'manual' && !appData.payment_instructions) {
        toast({
          title: 'Missing Payment Instructions',
          description: 'Please enter payment instructions for manual payment method',
          variant: 'destructive',
        });
        return;
      }
      
      let result;
      if (selectedApp) {
        // Update existing app
        result = await supabase
          .from('paid_apps')
          .update(appData)
          .eq('id', selectedApp.id);
      } else {
        // Create new app
        result = await supabase
          .from('paid_apps')
          .insert([appData]);
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: selectedApp ? 'App Updated' : 'App Created',
        description: selectedApp 
          ? `${appData.name} has been updated` 
          : `${appData.name} has been added to the store`,
      });
      
      // Reload apps
      loadApps();
      
      // Close dialog
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving app:', error);
      toast({
        title: 'Error',
        description: selectedApp ? 'Failed to update app' : 'Failed to create app',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteApp = async () => {
    if (!selectedApp) return;
    
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('paid_apps')
        .delete()
        .eq('id', selectedApp.id);
      
      if (error) throw error;
      
      toast({
        title: 'App Deleted',
        description: `${selectedApp.name} has been deleted from the store`,
      });
      
      // Update local state
      setApps(apps.filter(app => app.id !== selectedApp.id));
      
      // Close dialog
      setDeleteDialogOpen(false);
      setSelectedApp(null);
    } catch (error) {
      console.error('Error deleting app:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete app',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const renderPrice = (app: App) => {
    if (app.payment_method === 'free') {
      return <span className="text-gray-500">Free</span>;
    }
    
    return (
      <div className="space-y-1">
        {app.coin_price && (
          <div className="font-medium">{app.coin_price} coins</div>
        )}
        {app.inr_price && (
          <div className="text-sm">₹{app.inr_price}</div>
        )}
      </div>
    );
  };

  const columns = [
    {
      header: "App",
      accessorKey: (row: App): ReactNode => (
        <div className="flex items-center">
          {row.image_url ? (
            <img 
              src={row.image_url} 
              alt={row.name} 
              className="w-10 h-10 object-cover rounded mr-3"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-400">
              No img
            </div>
          )}
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-sm text-muted-foreground line-clamp-1">{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      accessorKey: (row: App): ReactNode => renderPrice(row),
    },
    {
      header: "Payment Method",
      accessorKey: (row: App): ReactNode => (
        <Badge className={
          row.payment_method === 'coins' ? 'bg-green-500' : 
          row.payment_method === 'razorpay' ? 'bg-blue-500' :
          row.payment_method === 'manual' ? 'bg-purple-500' : 'bg-gray-500'
        }>
          {row.payment_method}
        </Badge>
      ),
    },
    {
      header: "Added",
      accessorKey: (row: App): ReactNode => (
        <div className="text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: App): ReactNode => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditApp(row);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteApp(row);
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">App Management</h1>
          <p className="text-muted-foreground">Manage apps in the store</p>
        </div>
        <Button onClick={handleAddNewApp}>
          <Plus className="mr-2 h-4 w-4" />
          Add New App
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Apps</CardTitle>
          <CardDescription>
            {apps.length} {apps.length === 1 ? 'app' : 'apps'} in store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={apps}
            isLoading={loading}
            emptyMessage="No apps found"
          />
        </CardContent>
      </Card>

      {/* App Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedApp ? 'Edit App' : 'Add New App'}</DialogTitle>
            <DialogDescription>
              {selectedApp ? 'Update app details' : 'Add a new app to the store'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">App Name</Label>
                <Input
                  id="name"
                  value={formValues.name}
                  onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                  placeholder="App Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="download_url">Download URL</Label>
                <Input
                  id="download_url"
                  value={formValues.download_url}
                  onChange={(e) => setFormValues({...formValues, download_url: e.target.value})}
                  placeholder="https://example.com/app.apk"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formValues.description}
                onChange={(e) => setFormValues({...formValues, description: e.target.value})}
                placeholder="App description"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>App Image</Label>
              <div className="flex items-center space-x-4">
                {imageUrl && (
                  <img 
                    src={imageUrl} 
                    alt="App preview" 
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <FileUpload 
                  onUploadComplete={handleUploadComplete}
                  storageBucket={STORAGE_BUCKET}
                  storagePath="images"
                  acceptedFileTypes="image/*"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formValues.payment_method}
                onValueChange={(value) => setFormValues({...formValues, payment_method: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coins">Coins</SelectItem>
                  <SelectItem value="razorpay">Razorpay (INR)</SelectItem>
                  <SelectItem value="manual">Manual Payment (UPI/Bank)</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {(formValues.payment_method === 'coins' || formValues.payment_method === 'free') && (
                <div className="space-y-2">
                  <Label htmlFor="coin_price">Coin Price</Label>
                  <Input
                    id="coin_price"
                    type="number"
                    value={formValues.coin_price}
                    onChange={(e) => setFormValues({...formValues, coin_price: e.target.value})}
                    placeholder="100"
                    disabled={formValues.payment_method === 'free'}
                  />
                  {formValues.payment_method === 'free' && (
                    <p className="text-xs text-muted-foreground">Free apps don't have a coin price</p>
                  )}
                </div>
              )}
              
              {(formValues.payment_method === 'razorpay' || formValues.payment_method === 'manual') && (
                <div className="space-y-2">
                  <Label htmlFor="inr_price">Price (INR)</Label>
                  <Input
                    id="inr_price"
                    type="number"
                    value={formValues.inr_price}
                    onChange={(e) => setFormValues({...formValues, inr_price: e.target.value})}
                    placeholder="99"
                  />
                  {formValues.payment_method === 'manual' && formValues.inr_price && (
                    <p className="text-xs text-muted-foreground">
                      Equivalent to approximately {Math.round(Number(formValues.inr_price) * 100)} coins
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {formValues.payment_method === 'manual' && (
              <div className="space-y-2">
                <Label htmlFor="payment_instructions">Payment Instructions</Label>
                <Textarea
                  id="payment_instructions"
                  value={formValues.payment_instructions}
                  onChange={(e) => setFormValues({...formValues, payment_instructions: e.target.value})}
                  placeholder="UPI ID: example@upi or Bank details for payment"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Provide clear instructions for users on how to make the payment
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveApp} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                selectedApp ? 'Update App' : 'Add App'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedApp?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteApp} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete App'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApps;
