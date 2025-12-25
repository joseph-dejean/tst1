import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton } from '@mui/material';
import { Check, Close, Refresh } from '@mui/icons-material';
import axios from 'axios';

interface AccessRequest {
    id: string;
    assetName: string;
    requesterEmail: string;
    message: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    timestamp: string;
}

const AccessRequests = () => {
    const [requests, setRequests] = useState<AccessRequest[]>([]);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('/api/v1/access-requests');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            await axios.post(`/api/v1/access-requests/${id}/${action}`);
            fetchRequests();
        } catch (error) {
            console.error(`Error ${action}ing request:`, error);
        }
    };

    return (
        <Box sx={{ padding: '2rem' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={600}>Access Requests</Typography>
                <IconButton onClick={fetchRequests}><Refresh /></IconButton>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>Asset</TableCell>
                            <TableCell>Requester</TableCell>
                            <TableCell>Message</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No requests found</TableCell>
                            </TableRow>
                        ) : (
                            requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell sx={{ fontWeight: 500 }}>{req.assetName}</TableCell>
                                    <TableCell>{req.requesterEmail}</TableCell>
                                    <TableCell sx={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {req.message}
                                    </TableCell>
                                    <TableCell>{new Date(req.timestamp).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={req.status}
                                            color={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'error' : 'warning'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {req.status === 'PENDING' && (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton color="success" size="small" onClick={() => handleAction(req.id, 'approve')}>
                                                    <Check />
                                                </IconButton>
                                                <IconButton color="error" size="small" onClick={() => handleAction(req.id, 'reject')}>
                                                    <Close />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AccessRequests;
