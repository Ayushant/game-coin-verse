
import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ReactNode } from 'react';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { App, PaymentMethod } from '@/types/app';

const appSchema = z.object({
  name: z.string().min(2, { message: "App name is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  download_url: z.string().url({ message: "Valid download URL is required" }),
  image_url: z.string().url().optional().or(z.literal('')),
  payment_method: z.enum(['coins', 'razorpay', 'manual', 'free']),
  coin_price: z.number().optional(),
  inr_price: z.number().optional(),
  payment_instructions: z.string().optional(),
});

type AppFormValues = z.infer<typeof appSchema>;

const AdminApps = () => {
  const { conversionRate } = useAdmin();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingApp, setDeletingApp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<AppFormValues>({
    resolver: zodResolver(appSchema),
    defaultValues: {
      name: "",
      description: "",
      download_url: "",
      image_url: "",
      payment_method: "coins",
      coin_price: 0,
      inr_price: 0,
      payment_instructions: "",
    },
  });

  useEffect(() => {
    loadApps();
  }, []);
  
  useEffect(() => {
    if (selectedApp && isEditing) {
      form.reset({
        name: selectedApp.name,
        description: selectedApp.description,
        download_url: selectedApp.download_url,
        image_url: selectedApp.image_url || '',
        payment_method: selectedApp.payment_method as PaymentMethod,
        coin_price: selectedApp.coin_price || 0,
        inr_price: selectedApp.inr_price || 0,
        payment_instructions: selectedApp.payment_instructions || '',
      });
    }
  }, [selectedApp, isEditing, form]);

  const loadApps = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('paid_apps')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Cast the data from Supabase to match our App type
      const typedApps: App[] = data?.map(app => ({
        ...app,
        payment_method: app.payment_method as PaymentMethod,
      })) || [];

      setApps(typedApps);
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
  
  const openNewAppDialog = () => {
    setSelectedApp(null);
    setIsEditing(true);
    form.reset({
      name: "",
      description: "",
      download_url: "",
      image_url: "",
      payment_method: "coins",
      coin_price: 0,
      inr_price: 0,
      payment_instructions: "",
    });
    setDialogOpen(true);
  };
  
  const openEditDialog = (app: App) => {
    setSelectedApp(app);
    setIsEditing(true);
    setDialogOpen(true);
  };
  
  const viewAppDetails = (app: App) => {
    setSelectedApp(app);
    setIsEditing(false);
    setDialogOpen(true);
  };
  
  const handleDeleteApp = async (id: string) => {
    try {
      setDeletingApp(id);
      
      // Check if there are any purchases for this app
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('app_id', id);
      
      if (purchaseError) throw purchaseError;
      
      if (purchases && purchases.length > 0) {
        toast({
          title: 'Cannot Delete',
          description: `This app has ${purchases.length} purchases and cannot be deleted`,
          variant: 'destructive',
        });
        return;
      }
      
      // Delete the app
      const { error } = await supabase
        .from('paid_apps')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      setApps(apps.filter(app => app.id !== id));
      
      toast({
        title: 'App Deleted',
        description: 'App has been successfully deleted',
      });
    } catch (error) {
      console.error('Error deleting app:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete app',
        variant: 'destructive',
      });
    } finally {
      setDeletingApp(null);
    }
  };
  
  const onSubmit = async (values: AppFormValues) => {
    try {
      setSubmitting(true);
      console.log('Form values:', values);
      
      // Prepare the app data with proper casting for payment_method
      const appData = {
        name: values.name,
        description: values.description,
        download_url: values.download_url,
        image_url: values.image_url || null,
        payment_method: values.payment_method,
        coin_price: ['coins', 'free'].includes(values.payment_method) 
          ? values.coin_price 
          : null,
        inr_price: ['razorpay', 'manual'].includes(values.payment_method) 
          ? values.inr_price 
          : null,
        payment_instructions: values.payment_instructions || null,
      };

      console.log('App data to submit:', appData);
      
      if (selectedApp) {
        // Update existing app
        const { error } = await supabase
          .from('paid_apps')
          .update({
            ...appData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedApp.id);
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        // Update local state
        setApps(apps.map(app => 
          app.id === selectedApp.id
            ? { ...app, ...appData, payment_method: appData.payment_method as PaymentMethod }
            : app
        ));
        
        toast({
          title: 'App Updated',
          description: 'App details have been successfully updated',
        });
      } else {
        // Create new app
        console.log('Creating new app with data:', appData);
        const { data, error } = await supabase
          .from('paid_apps')
          .insert(appData)
          .select();
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        console.log('Insert response:', data);
        
        // Add new app to local state with proper typing
        if (data && data[0]) {
          const newApp: App = {
            ...data[0],
            payment_method: data[0].payment_method as PaymentMethod
          };
          setApps([newApp, ...apps]);
        }
        
        toast({
          title: 'App Created',
          description: 'New app has been successfully created',
        });
      }
      
      // Close dialog and reset form
      setDialogOpen(false);
      setSelectedApp(null);
      setIsEditing(false);
      form.reset();
    } catch (error) {
      console.error('Error saving app:', error);
      toast({
        title: 'Error',
        description: 'Failed to save app',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const getPaymentMethod = (method: string) => {
    switch (method) {
      case 'coins':
        return 'Coins';
      case 'razorpay':
        return 'Online Payment';
      case 'manual':
        return 'Manual Payment';
      case 'free':
        return 'Free';
      default:
        return method;
    }
  };
  
  const getAppPrice = (app: App) => {
    if (app.payment_method === 'free') {
      return 'Free';
    } else if (app.payment_method === 'coins' && app.coin_price) {
      return `${app.coin_price} coins`;
    } else if (['razorpay', 'manual'].includes(app.payment_method) && app.inr_price) {
      return `₹${app.inr_price}`;
    } else {
      return 'N/A';
    }
  };
  
  const handlePaymentMethodChange = (value: string) => {
    form.setValue('payment_method', value as PaymentMethod);
    
    // Reset price fields based on payment method
    if (value === 'coins' || value === 'free') {
      form.setValue('inr_price', 0);
    } else if (value === 'razorpay' || value === 'manual') {
      form.setValue('coin_price', 0);
    }
  };
  
  const columns = [
    {
      header: "App",
      accessorKey: (row: App): ReactNode => (
        <div className="flex items-center gap-3">
          {row.image_url && (
            <img 
              src={row.image_url} 
              alt={row.name} 
              className="w-10 h-10 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          )}
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
              {row.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Payment Method",
      accessorKey: (row: App): ReactNode => getPaymentMethod(row.payment_method),
    },
    {
      header: "Price",
      accessorKey: (row: App): ReactNode => getAppPrice(row),
    },
    {
      header: "Created On",
      accessorKey: (row: App): ReactNode => (
        <div className="text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: (row: App): ReactNode => (
        <div className="flex gap-2 justify-end">
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(row);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteApp(row.id);
            }}
            disabled={deletingApp === row.id}
          >
            {deletingApp === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">App Management</h1>
          <p className="text-muted-foreground">Manage downloadable apps</p>
        </div>
        <Button onClick={openNewAppDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add New App
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Apps</CardTitle>
          <CardDescription>
            Manage and monitor all available apps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={apps}
            onRowClick={viewAppDetails}
            isLoading={loading}
            emptyMessage="No apps found"
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing 
                ? selectedApp 
                  ? 'Edit App' 
                  : 'Add New App' 
                : 'App Details'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Fill in the details to create or update an app'
                : 'View app details'}
            </DialogDescription>
          </DialogHeader>
          
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter app name..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select 
                          onValueChange={handlePaymentMethodChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="coins">Coins</SelectItem>
                            <SelectItem value="razorpay">Razorpay</SelectItem>
                            <SelectItem value="manual">Manual Payment</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                  {form.watch('payment_method') === 'coins' && (
                    <FormField
                      control={form.control}
                      name="coin_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price in Coins</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            ≈ ₹{((field.value || 0) / conversionRate).toFixed(2)}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {['razorpay', 'manual'].includes(form.watch('payment_method')) && (
                    <FormField
                      control={form.control}
                      name="inr_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price in INR (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            ≈ {Math.floor((field.value || 0) * conversionRate)} coins
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="download_url"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Download URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the app..." 
                            className="resize-none min-h-24" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('payment_method') === 'manual' && (
                    <FormField
                      control={form.control}
                      name="payment_instructions"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Payment Instructions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Instructions for manual payment..." 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setDialogOpen(false);
                      setIsEditing(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      selectedApp ? 'Update App' : 'Create App'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          ) : selectedApp && (
            <>
              <div className="space-y-4">
                {selectedApp.image_url && (
                  <div className="flex justify-center">
                    <img 
                      src={selectedApp.image_url} 
                      alt={selectedApp.name} 
                      className="h-40 w-auto object-contain rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-base">{selectedApp.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                    <p className="text-base">{getPaymentMethod(selectedApp.payment_method)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Price</p>
                    <p className="text-base">{getAppPrice(selectedApp)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created On</p>
                    <p className="text-base">{new Date(selectedApp.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Download URL</p>
                  <p className="text-base break-all">
                    <a 
                      href={selectedApp.download_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedApp.download_url}
                    </a>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-base whitespace-pre-line">{selectedApp.description}</p>
                </div>
                
                {selectedApp.payment_method === 'manual' && selectedApp.payment_instructions && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Instructions</p>
                    <p className="text-base whitespace-pre-line">{selectedApp.payment_instructions}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setIsEditing(true);
                  }}
                >
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApps;
