import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { URLS } from '../../constants/urls';
import { useAuth } from '../../auth/AuthProvider';
import ChatTab from './ChatTab';
import { CircularProgress, Box, Alert, Typography } from '@mui/material';

const ChatPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const entryName = searchParams.get('entryName');
    const [entry, setEntry] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchEntry = async () => {
            if (!entryName) {
                setError('No entry name provided');
                setLoading(false);
                return;
            }

            if (!user?.token) {
                // Wait for auth to be ready
                return;
            }

            try {
                setLoading(true);
                const response = await axios.post(
                    `${URLS.API_URL}${URLS.GET_ENTRY}`,
                    { entryName },
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    }
                );
                // Add full path name if missing, or ensure structure matches what ChatTab expects
                setEntry(response.data);
            } catch (err: any) {
                console.error('Error fetching entry:', err);
                setError(err.response?.data?.message || 'Failed to load entry details');
            } finally {
                setLoading(false);
            }
        };

        fetchEntry();
    }, [entryName, user?.token]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!entry) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">Entry not found</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFD' }}>
            <Box sx={{ p: 2, backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6">{entry.entrySource?.displayName || entry.name}</Typography>
            </Box>
            <ChatTab entry={entry} />
        </Box>
    );
};

export default ChatPage;
