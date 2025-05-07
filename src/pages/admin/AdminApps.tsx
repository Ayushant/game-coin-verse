
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
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

type App = {
  id: string;
  name: string;
  description: string;
  download_url: string;
  coin_price: number | null;
  inr_price: number | null;
  payment_method: 'coins' | 'razorpay' | 'manual' | 'free';
  payment_instructions: string | null;
  created_at: string;
  image_url: string | null;
};

const APP_STORAGE_BUCKET = 'app_images';

const AdminApps = () => {
  const { isAdmin, getCoinsFromINR } = useAdmin();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  
  // Form state
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appDownloadUrl, setAppDownloadUrl] = useState('');
  const [appImageUrl, setAppImageUrl] = useState('');
  const [appCoinPrice, setAppCoinPrice] = useState<string>('');
  const [appInrPrice, setAppInrPrice] = useState<string>('');
  const [appPaymentMethod, setAppPaymentMethod] = useState<'coins' | 'razorpay' | 'manual' | 'free'>('coins');
  const [appPaymentInstructions, setAppPaymentInstructions] = useState('');
  
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
      const { data, error } = await supabase.storage.getBucket(APP_STORAGE_BUCKET);
      
      if (error && error.message.includes('not found')) {
        await supabase.storage.createBucket(APP_STORAGE_BUCKET, {
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
      
      setApps(data || []);
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

  const resetForm = () => {
    setAppName('');
    setAppDescription('');
    setAppDownloadUrl('');
    setAppImageUrl('');
    setAppCoinPrice('');
    setAppInrPrice('');
    setAppPaymentMethod('coins');
    setAppPaymentInstructions('');
  };

  const populateEditForm = (app: App) => {
    setAppName(app.name);
    setAppDescription(app.description);
    setAppDownloadUrl(app.download_url);
    setAppImageUrl(app.image_url || '');
    setAppCoinPrice(app.coin_price ? String(app.coin_price) : '');
    setAppInrPrice(app.inr_price ? String(app.inr_price) : '');
    setAppPaymentMethod(app.payment_method);
    setAppPaymentInstructions(app.payment_instructions || '');
  };

  const handleAddApp = async () => {
    try {
      if (!appName.trim() || !appDescription.trim() || !appDownloadUrl.trim()) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      const newApp = {
        name: appName.trim(),
        description: appDescription.trim(),
        download_url: appDownloadUrl.trim(),
        image_url: appImageUrl,
        coin_price: appCoinPrice ? parseInt(appCoinPrice, 10) : null,
        inr_price: appInrPrice ? parseFloat(appInrPrice) : null,
        payment_method: appPaymentMethod,
        payment_instructions: appPaymentInstructions.trim() || null,
      };

      const { data, error } = await supabase
        .from('paid_apps')
        .insert([newApp])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'App Added',
        description: `${appName} has been added successfully`,
      });

      setApps([data, ...apps]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding app:', error);
      toast({
        title: 'Error',
        description: 'Failed to add app',
        variant: 'destructive',
      });
    }
  };

  const handleEditApp = async () => {
    try {
      if (!selectedApp) return;
      
      if (!appName.trim() || !appDescription.trim() || !appDownloadUrl.trim()) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      const updatedApp = {
        name: appName.trim(),
        description: appDescription.trim(),
        download_url: appDownloadUrl.trim(),
        image_url: appImageUrl,
        coin_price: appCoinPrice ? parseInt(appCoinPrice, 10) : null,
        inr_price: appInrPrice ? parseFloat(appInrPrice) : null,
        payment_method: appPaymentMethod,
        payment_instructions: appPaymentInstructions.trim() || null,
      };

      const { data, error } = await supabase
        .from('paid_apps')
        .update(updatedApp)
        .eq('id', selectedApp.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'App Updated',
        description: `${appName} has been updated successfully`,
      });

      setApps(apps.map(app => app.id === selectedApp.id ? data : app));
      setIsEditDialogOpen(false);
      setSelectedApp(null);
      resetForm();
    } catch (error) {
      console.error('Error updating app:', error);
      toast({
        title: 'Error',
        description: 'Failed to update app',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteApp = async () => {
    try {
      if (!selectedApp) return;

      const { error } = await supabase
        .from('paid_apps')
        .delete()
        .eq('id', selectedApp.id);

      if (error) throw error;

      toast({
        title: 'App Deleted',
        description: `${selectedApp.name} has been deleted`,
      });

      setApps(apps.filter(app => app.id !== selectedApp.id));
      setIsEditDialogOpen(false);
      setSelectedApp(null);
      resetForm();
    } catch (error) {
      console.error('Error deleting app:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete app',
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = (url: string) => {
    setAppImageUrl(url);
  };

  const handlePriceChange = (type: 'inr' | 'coins', value: string) => {
    if (type === 'inr') {
      setAppInrPrice(value);
      if (value && !isNaN(parseFloat(value))) {
        const coins = getCoinsFromINR(parseFloat(value));
        setAppCoinPrice(coins.toString());
      }
    } else {
      setAppCoinPrice(value);
    }
  };

  const handleViewApp = (app: App) => {
    setSelectedApp(app);
    populateEditForm(app);
    setIsEditDialogOpen(true);
  };

  const columns = [
    {
      header: "App",
      accessorKey: (row: App) => (
        <div className="flex items-center space-x-3">
          {row.image_url && (
            <img 
              src={row.image_url} 
              alt={row.name} 
              className="w-10 h-10 rounded object-cover"
            />
          )}
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
              {row.description.length > 50 
                ? row.description.substring(0, 50) + '...' 
                : row.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      accessorKey: (row: App) => (
        <div>
          {row.coin_price ? (
            <div className="font-medium">{row.coin_price} coins</div>
          ) : null}
          {row.inr_price ? (
            <div className="text-sm">₹{row.inr_price}</div>
          ) : null}
          {!row.coin_price && !row.inr_price && (
            <div className="text-sm">Free</div>
          )}
        </div>
      ),
    },
    {
      header: "Payment Method",
      accessorKey: (row: App) => (
        <div className="capitalize">{row.payment_method}</div>
      ),
    },
    {
      header: "Added",
      accessorKey: (row: App) => (
        <div className="text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: App) => (
        <Button 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            handleViewApp(row);
          }}
        >
          Edit
        </Button>
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
          <p className="text-muted-foreground">Manage apps in your store</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsAddDialogOpen(true);
        }}>
          Add New App
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Apps</CardTitle>
          <CardDescription>
            View and manage all apps in your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={apps}
            onRowClick={handleViewApp}
            isLoading={loading}
            emptyMessage="No apps found"
          />
        </CardContent>
      </Card>

      {/* Add App Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New App</DialogTitle>
            <DialogDescription>
              Add a new app to your store
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="appName">App Name *</Label>
                  <Input 
                    id="appName" 
                    value={appName} 
                    onChange={(e) => setAppName(e.target.value)} 
                    placeholder="Enter app name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="appDescription">Description *</Label>
                  <Textarea 
                    id="appDescription" 
                    value={appDescription} 
                    onChange={(e) => setAppDescription(e.target.value)} 
                    placeholder="Enter app description"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="appDownloadUrl">Download URL *</Label>
                  <Input 
                    id="appDownloadUrl" 
                    value={appDownloadUrl} 
                    onChange={(e) => setAppDownloadUrl(e.target.value)} 
                    placeholder="Enter download URL"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appImage">App Image</Label>
                <FileUpload 
                  onUploadComplete={handleImageUpload}
                  storageBucket={APP_STORAGE_BUCKET}
                  storagePath="images"
                  acceptedFileTypes="image/*"
                />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appPaymentMethod">Payment Method</Label>
                  <Select 
                    value={appPaymentMethod}
                    onValueChange={(value) => setAppPaymentMethod(value as any)}
                  >
                    <SelectTrigger id="appPaymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coins">Coins Only</SelectItem>
                      <SelectItem value="razorpay">Razorpay</SelectItem>
                      <SelectItem value="manual">Manual Payment</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(appPaymentMethod === 'coins' || appPaymentMethod === 'razorpay' || appPaymentMethod === 'manual') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="appInrPrice">Price (INR)</Label>
                      <Input 
                        id="appInrPrice" 
                        value={appInrPrice} 
                        onChange={(e) => handlePriceChange('inr', e.target.value)} 
                        placeholder="Enter price in INR"
                        type="number"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="appCoinPrice">Price (Coins)</Label>
                      <Input 
                        id="appCoinPrice" 
                        value={appCoinPrice} 
                        onChange={(e) => handlePriceChange('coins', e.target.value)} 
                        placeholder="Enter price in coins"
                        type="number"
                        min="0"
                      />
                    </div>
                  </>
                )}
                
                {appPaymentMethod === 'manual' && (
                  <div className="space-y-2">
                    <Label htmlFor="appPaymentInstructions">Payment Instructions</Label>
                    <Textarea 
                      id="appPaymentInstructions" 
                      value={appPaymentInstructions} 
                      onChange={(e) => setAppPaymentInstructions(e.target.value)} 
                      placeholder="Enter payment instructions (UPI ID, bank details, etc.)"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddApp}>
              Add App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit App Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit App</DialogTitle>
            <DialogDescription>
              Update app details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="editAppName">App Name *</Label>
                  <Input 
                    id="editAppName" 
                    value={appName} 
                    onChange={(e) => setAppName(e.target.value)} 
                    placeholder="Enter app name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editAppDescription">Description *</Label>
                  <Textarea 
                    id="editAppDescription" 
                    value={appDescription} 
                    onChange={(e) => setAppDescription(e.target.value)} 
                    placeholder="Enter app description"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editAppDownloadUrl">Download URL *</Label>
                  <Input 
                    id="editAppDownloadUrl" 
                    value={appDownloadUrl} 
                    onChange={(e) => setAppDownloadUrl(e.target.value)} 
                    placeholder="Enter download URL"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editAppImage">App Image</Label>
                {appImageUrl ? (
                  <div className="relative">
                    <img 
                      src={appImageUrl} 
                      alt="App preview" 
                      className="w-full h-auto rounded-lg mb-2 max-h-40 object-cover"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setAppImageUrl('')}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <FileUpload 
                    onUploadComplete={handleImageUpload}
                    storageBucket={APP_STORAGE_BUCKET}
                    storagePath="images"
                    acceptedFileTypes="image/*"
                  />
                )}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editAppPaymentMethod">Payment Method</Label>
                  <Select 
                    value={appPaymentMethod}
                    onValueChange={(value) => setAppPaymentMethod(value as any)}
                  >
                    <SelectTrigger id="editAppPaymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coins">Coins Only</SelectItem>
                      <SelectItem value="razorpay">Razorpay</SelectItem>
                      <SelectItem value="manual">Manual Payment</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(appPaymentMethod === 'coins' || appPaymentMethod === 'razorpay' || appPaymentMethod === 'manual') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="editAppInrPrice">Price (INR)</Label>
                      <Input 
                        id="editAppInrPrice" 
                        value={appInrPrice} 
                        onChange={(e) => handlePriceChange('inr', e.target.value)} 
                        placeholder="Enter price in INR"
                        type="number"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="editAppCoinPrice">Price (Coins)</Label>
                      <Input 
                        id="editAppCoinPrice" 
                        value={appCoinPrice} 
                        onChange={(e) => handlePriceChange('coins', e.target.value)} 
                        placeholder="Enter price in coins"
                        type="number"
                        min="0"
                      />
                    </div>
                  </>
                )}
                
                {appPaymentMethod === 'manual' && (
                  <div className="space-y-2">
                    <Label htmlFor="editAppPaymentInstructions">Payment Instructions</Label>
                    <Textarea 
                      id="editAppPaymentInstructions" 
                      value={appPaymentInstructions} 
                      onChange={(e) => setAppPaymentInstructions(e.target.value)} 
                      placeholder="Enter payment instructions (UPI ID, bank details, etc.)"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={handleDeleteApp}
            >
              Delete
            </Button>
            <div className="flex-grow" />
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedApp(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditApp}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApps;
