import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Checkbox,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  CheckCircle,
  Cancel,
  Delete,
  PersonAdd,
  FilterList,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  checkAdminStatus,
  fetchAllAdmins,
  fetchGrantedAccesses,
  revokeAccess,
  bulkApproveRequests,
  bulkRejectRequests,
  setAdminRole,
  removeAdminRole,
  type AccessRequest,
  type GrantedAccess,
  type AdminRole,
} from '../../features/admin/adminSlice';
import { useNotification } from '../../contexts/NotificationContext';
import axios from 'axios';
import { URLS } from '../../constants/urls';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminAccessManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useNotification();

  const { isAdmin, currentUserRole, allAdmins, grantedAccesses } = useAppSelector(
    (state) => state.admin
  );

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [selectedAccesses, setSelectedAccesses] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [projectFilter, setProjectFilter] = useState<string>('');

  // Dialog states
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<GrantedAccess | null>(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'super-admin' | 'project-admin'>('project-admin');
  const [newAdminProjects, setNewAdminProjects] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const token = user?.token || '';
  const email = user?.email || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Check admin status
      await dispatch(checkAdminStatus({ token, email }));

      // Fetch pending requests
      const params: Record<string, string> = { userEmail: email, userRole: 'admin' };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (projectFilter) params.projectId = projectFilter;

      const response = await axios.get(`${URLS.API_URL}${URLS.GET_ACCESS_REQUESTS}`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-email': email,
          'x-user-role': 'admin',
        },
      });

      if (response.data.success) {
        setPendingRequests(response.data.data || []);
      }

      // Fetch granted accesses
      await dispatch(fetchGrantedAccesses({ token, email, status: 'ACTIVE' }));

      // Fetch all admins if super-admin
      if (currentUserRole?.role === 'super-admin') {
        await dispatch(fetchAllAdmins({ token, email }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [dispatch, token, email, statusFilter, projectFilter, currentUserRole?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedRequests([]);
    setSelectedAccesses([]);
  };

  const handleSelectAllRequests = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(pendingRequests.filter((r) => r.status === 'pending').map((r) => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests((prev) => [...prev, id]);
    } else {
      setSelectedRequests((prev) => prev.filter((r) => r !== id));
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await axios.post(
        `${URLS.API_URL}${URLS.UPDATE_ACCESS_REQUEST}`,
        { requestId, status: 'approved', reviewerEmail: email },
        { headers: { Authorization: `Bearer ${token}`, 'x-user-email': email } }
      );
      showSuccess('Access request approved successfully');
      fetchData();
    } catch (err) {
      showError('Failed to approve request');
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    try {
      await axios.post(
        `${URLS.API_URL}${URLS.UPDATE_ACCESS_REQUEST}`,
        { requestId, status: 'rejected', reviewerEmail: email, adminNote: reason },
        { headers: { Authorization: `Bearer ${token}`, 'x-user-email': email } }
      );
      showSuccess('Access request rejected');
      fetchData();
    } catch (err) {
      showError('Failed to reject request');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0) return;
    try {
      await dispatch(bulkApproveRequests({ token, email, requestIds: selectedRequests }));
      showSuccess(`Approved ${selectedRequests.length} requests`);
      setSelectedRequests([]);
      fetchData();
    } catch (err) {
      showError('Failed to bulk approve');
    }
  };

  const handleBulkReject = async () => {
    if (selectedRequests.length === 0) return;
    try {
      await dispatch(bulkRejectRequests({ token, email, requestIds: selectedRequests, reason: rejectReason }));
      showSuccess(`Rejected ${selectedRequests.length} requests`);
      setSelectedRequests([]);
      setRejectDialogOpen(false);
      setRejectReason('');
      fetchData();
    } catch (err) {
      showError('Failed to bulk reject');
    }
  };

  const handleRevokeAccess = async () => {
    if (!revokeTarget) return;
    try {
      await dispatch(revokeAccess({ token, email, grantId: revokeTarget.id }));
      showSuccess('Access revoked successfully');
      setRevokeDialogOpen(false);
      setRevokeTarget(null);
      fetchData();
    } catch (err) {
      showError('Failed to revoke access');
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return;
    try {
      const projects = newAdminProjects.split(',').map((p) => p.trim()).filter(Boolean);
      await dispatch(
        setAdminRole({
          token,
          creatorEmail: email,
          email: newAdminEmail,
          role: newAdminRole,
          assignedProjects: projects,
        })
      );
      showSuccess(`Admin role assigned to ${newAdminEmail}`);
      setAdminDialogOpen(false);
      setNewAdminEmail('');
      setNewAdminProjects('');
      fetchData();
    } catch (err) {
      showError('Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (adminEmail: string) => {
    try {
      await dispatch(removeAdminRole({ token, requesterEmail: email, targetEmail: adminEmail }));
      showSuccess(`Admin role removed from ${adminEmail}`);
      fetchData();
    } catch (err) {
      showError('Failed to remove admin');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusChip = (status: string) => {
    const colors: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      PENDING: 'warning',
      ACTIVE: 'success',
      REVOKED: 'error',
    };
    return <Chip label={status.toUpperCase()} color={colors[status] || 'default'} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8FAFD' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ backgroundColor: '#F8FAFD', minHeight: '100vh', p: 3 }}>
        <Alert severity="error">You do not have admin access. Contact a super-admin to request access.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#F8FAFD', minHeight: '100vh', padding: { xs: '0px 0.5rem', sm: '0px 1rem' } }}>
      <Box sx={{ backgroundColor: '#FFFFFF', borderRadius: { xs: '16px', sm: '20px' }, width: '100%', minHeight: '95vh', padding: { xs: '16px', sm: '24px' }, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
          <IconButton onClick={() => navigate('/home')} sx={{ color: '#1F1F1F' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 500, color: '#1F1F1F' }}>
            Access Management
          </Typography>
          <Chip
            label={currentUserRole?.role === 'super-admin' ? 'Super Admin' : 'Project Admin'}
            color="primary"
            size="small"
            sx={{ ml: 2 }}
          />
          <IconButton onClick={fetchData} sx={{ ml: 'auto' }}>
            <Refresh />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Pending Requests" />
            <Tab label="Active Accesses" />
            {currentUserRole?.role === 'super-admin' && <Tab label="Admin Roles" />}
          </Tabs>
        </Box>

        {/* Tab 0: Pending Requests */}
        <TabPanel value={tabValue} index={0}>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            {selectedRequests.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={handleBulkApprove}>
                  Approve ({selectedRequests.length})
                </Button>
                <Button variant="contained" color="error" startIcon={<Cancel />} onClick={() => setRejectDialogOpen(true)}>
                  Reject ({selectedRequests.length})
                </Button>
              </Box>
            )}
          </Box>

          {/* Requests Table */}
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DADCE0' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F8FAFD' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRequests.length === pendingRequests.filter((r) => r.status === 'pending').length && selectedRequests.length > 0}
                      indeterminate={selectedRequests.length > 0 && selectedRequests.length < pendingRequests.filter((r) => r.status === 'pending').length}
                      onChange={(e) => handleSelectAllRequests(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell><strong>Asset</strong></TableCell>
                  <TableCell><strong>Requester</strong></TableCell>
                  <TableCell><strong>Project</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Submitted</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No access requests found</TableCell>
                  </TableRow>
                ) : (
                  pendingRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell padding="checkbox">
                        {request.status === 'pending' && (
                          <Checkbox
                            checked={selectedRequests.includes(request.id)}
                            onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={request.assetName}>
                          <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {request.assetName?.split('/').pop() || request.assetName}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{request.requesterEmail}</TableCell>
                      <TableCell>{request.projectId || request.gcpProjectId}</TableCell>
                      <TableCell>
                        <Chip label={request.requestedRole || 'dataViewer'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{getStatusChip(request.status)}</TableCell>
                      <TableCell>{formatDate(request.submittedAt)}</TableCell>
                      <TableCell>
                        {request.status === 'pending' ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" sx={{ backgroundColor: '#E6F4EA', color: '#137333' }} onClick={() => handleApprove(request.id)}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ backgroundColor: '#FCE8E6', color: '#C5221F' }} onClick={() => handleReject(request.id)}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {request.status === 'approved' ? 'Granted' : 'Rejected'}
                            {request.reviewedBy && ` by ${request.reviewedBy}`}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 1: Active Accesses */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DADCE0' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F8FAFD' }}>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Asset</strong></TableCell>
                  <TableCell><strong>Project</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Granted</strong></TableCell>
                  <TableCell><strong>Granted By</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grantedAccesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No active accesses found</TableCell>
                  </TableRow>
                ) : (
                  grantedAccesses.map((access) => (
                    <TableRow key={access.id} hover>
                      <TableCell>{access.userEmail}</TableCell>
                      <TableCell>
                        <Tooltip title={access.assetName}>
                          <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {access.assetName?.split('/').pop() || access.assetName}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{access.gcpProjectId}</TableCell>
                      <TableCell>
                        <Chip label={access.role?.split('/').pop() || access.role} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{getStatusChip(access.status)}</TableCell>
                      <TableCell>{formatDate(access.grantedAt)}</TableCell>
                      <TableCell>{access.grantedBy}</TableCell>
                      <TableCell>
                        {access.status === 'ACTIVE' && (
                          <IconButton
                            size="small"
                            sx={{ backgroundColor: '#FCE8E6', color: '#C5221F' }}
                            onClick={() => {
                              setRevokeTarget(access);
                              setRevokeDialogOpen(true);
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 2: Admin Roles (Super-admin only) */}
        {currentUserRole?.role === 'super-admin' && (
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setAdminDialogOpen(true)}>
                Add Admin
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DADCE0' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F8FAFD' }}>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Assigned Projects</strong></TableCell>
                    <TableCell><strong>Created By</strong></TableCell>
                    <TableCell><strong>Created At</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No admins configured</TableCell>
                    </TableRow>
                  ) : (
                    allAdmins.map((admin) => (
                      <TableRow key={admin.email} hover>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={admin.role}
                            color={admin.role === 'super-admin' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {admin.assignedProjects?.length > 0
                            ? admin.assignedProjects.join(', ')
                            : admin.role === 'super-admin'
                            ? 'All Projects'
                            : '-'}
                        </TableCell>
                        <TableCell>{admin.createdBy}</TableCell>
                        <TableCell>{formatDate(admin.createdAt)}</TableCell>
                        <TableCell>
                          {admin.email !== email && (
                            <IconButton
                              size="small"
                              sx={{ backgroundColor: '#FCE8E6', color: '#C5221F' }}
                              onClick={() => handleRemoveAdmin(admin.email)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        )}
      </Box>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)}>
        <DialogTitle>Confirm Revoke Access</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to revoke access for <strong>{revokeTarget?.userEmail}</strong> to{' '}
            <strong>{revokeTarget?.assetName?.split('/').pop()}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will remove the IAM role from GCP and notify the user.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRevokeAccess} color="error" variant="contained">
            Revoke
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Access Requests</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            You are about to reject {selectedRequests.length} request(s). Optionally provide a reason:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkReject} color="error" variant="contained">
            Reject All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Admin Role</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="user@example.com"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={newAdminRole} label="Role" onChange={(e) => setNewAdminRole(e.target.value as 'super-admin' | 'project-admin')}>
                <MenuItem value="project-admin">Project Admin</MenuItem>
                <MenuItem value="super-admin">Super Admin</MenuItem>
              </Select>
            </FormControl>
            {newAdminRole === 'project-admin' && (
              <TextField
                fullWidth
                label="Assigned Projects"
                value={newAdminProjects}
                onChange={(e) => setNewAdminProjects(e.target.value)}
                placeholder="project-id-1, project-id-2"
                helperText="Comma-separated list of GCP project IDs"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAdmin} variant="contained" disabled={!newAdminEmail}>
            Add Admin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAccessManagement;
