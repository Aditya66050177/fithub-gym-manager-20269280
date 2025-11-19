import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dumbbell, LogOut, Search, Shield, UserCog, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  created_at: string;
  user_roles: Array<{
    role: 'admin' | 'owner' | 'user';
  }>;
}

interface GymOwnerRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  business_name: string | null;
  business_address: string | null;
  business_phone: string | null;
  business_email: string | null;
  years_in_business: number | null;
  number_of_locations: number | null;
  description: string | null;
  profiles: {
    name: string;
    email: string;
    phone: string | null;
  };
}

export default function UserManagement() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'owner' | 'user'>('user');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requests, setRequests] = useState<GymOwnerRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (userRole !== 'admin') {
      navigate('/dashboard');
    } else {
      fetchUsers();
      fetchRequests();
    }
  }, [user, userRole, navigate]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        email,
        created_at,
        user_roles (
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as any);
    }
    setLoading(false);
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('gym_owners')
      .select(`
        id,
        user_id,
        status,
        created_at,
        business_name,
        business_address,
        business_phone,
        business_email,
        years_in_business,
        number_of_locations,
        description,
        profiles (
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data as any);
    }
    setRequestsLoading(false);
  };

  const handleApprove = async (requestId: string, userId: string) => {
    const { error: updateError } = await supabase
      .from('gym_owners')
      // @ts-expect-error Supabase type inference issue
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (updateError) {
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive',
      });
      return;
    }

    const { error: roleError } = await supabase
      .from('user_roles')
      // @ts-expect-error Supabase type inference issue
      .update({ role: 'owner' })
      .eq('user_id', userId);

    if (roleError) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Gym owner request approved successfully',
    });

    fetchRequests();
    fetchUsers();
  };

  const handleReject = async (requestId: string) => {
    const { error } = await supabase
      .from('gym_owners')
      // @ts-expect-error Supabase type inference issue
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Gym owner request rejected',
    });

    fetchRequests();
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(
        (u) => u.user_roles.length > 0 && u.user_roles[0].role === roleFilter
      );
    }

    setFilteredUsers(filtered);
  };

  const openRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.user_roles[0]?.role || 'user');
    setDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    const { error } = await (supabase
      .from('user_roles')
      // @ts-expect-error Supabase type inference issue
      .update({ role: newRole })
      .eq('user_id', selectedUser.id));

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'User role updated successfully',
    });
    
    setDialogOpen(false);
    fetchUsers();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'owner':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Admin Panel</span>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Gym Owner Applications Section */}
        <Card>
          <CardHeader>
            <CardTitle>Gym Owner Applications</CardTitle>
            <CardDescription>Review and approve gym owner requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No applications found</p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{request.profiles.name}</h3>
                            <p className="text-sm text-muted-foreground">{request.profiles.email}</p>
                            {request.profiles.phone && (
                              <p className="text-sm text-muted-foreground">{request.profiles.phone}</p>
                            )}
                          </div>
                          <Badge
                            variant={
                              request.status === 'approved'
                                ? 'default'
                                : request.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>

                        {request.business_name && (
                          <div className="border-t pt-4 space-y-2">
                            <h4 className="font-semibold">Business Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Business Name:</span>
                                <p className="font-medium">{request.business_name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Email:</span>
                                <p className="font-medium">{request.business_email}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Phone:</span>
                                <p className="font-medium">{request.business_phone}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Address:</span>
                                <p className="font-medium">{request.business_address}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Years in Business:</span>
                                <p className="font-medium">{request.years_in_business}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Locations:</span>
                                <p className="font-medium">{request.number_of_locations}</p>
                              </div>
                            </div>
                            {request.description && (
                              <div className="mt-2">
                                <span className="text-muted-foreground">Description:</span>
                                <p className="mt-1 text-sm">{request.description}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {request.status === 'pending' && (
                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={() => handleApprove(request.id, request.user_id)}
                              className="flex-1"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                              className="flex-1"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find and manage users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.user_roles[0]?.role || 'user')}>
                            {user.user_roles[0]?.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleDialog(user)}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Manage Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
