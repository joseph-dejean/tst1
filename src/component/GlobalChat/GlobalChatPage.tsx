import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AccessibleTablesPanel from './AccessibleTablesPanel';
import ChatInterface from './ChatInterface';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { Button } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const GlobalChatPage: React.FC = () => {
    const [selectedTables, setSelectedTables] = useState<any[]>([]);

    return (
        <Box sx={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
            {/* Left Panel: Accessible Tables */}
            <AccessibleTablesPanel
                selectedTables={selectedTables}
                onSelectionChange={setSelectedTables}
            />

            {/* Main Content: Chat Interface */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
                {selectedTables.length === 0 ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        p: 4,
                        textAlign: 'center'
                    }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 6,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                backgroundColor: '#F8FAFD',
                                border: '1px dashed #DADCE0',
                                borderRadius: '16px',
                                maxWidth: '500px'
                            }}
                        >
                            <Box sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                backgroundColor: '#E8F0FE',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3
                            }}>
                                <ChatBubbleOutlineIcon sx={{ fontSize: 32, color: '#1967D2' }} />
                            </Box>
                            <Typography variant="h5" sx={{ mb: 1, fontWeight: 500, color: '#1F1F1F' }}>
                                Global Data Chat
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#5F6368', mb: 3 }}>
                                Select one or more tables from the sidebar to start a conversation.
                                You can cross-reference data from different datasets and projects.
                            </Typography>
                        </Paper>
                    </Box>
                ) : (
                    <ChatInterface initialTables={selectedTables} mode="global" />
                )}
            </Box>
            {/* Create Agent Link */}
            <Box sx={{ position: 'absolute', top: 20, right: 30 }}>
                <Button
                    variant="text"
                    endIcon={<OpenInNewIcon />}
                    onClick={() => window.open('https://console.cloud.google.com/bigquery/analytics-hub', '_blank')}
                    sx={{ textTransform: 'none', color: '#1967D2' }}
                >
                    Create an Agent
                </Button>
            </Box>
        </Box>
    );
};

export default GlobalChatPage;
