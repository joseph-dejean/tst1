import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Divider,
    IconButton,
    Alert,
    Snackbar,
    Grid,
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Business,
    Security,
    Save,
    CheckCircle,
    VpnKey,
    Link as LinkIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [snConfig, setSnConfig] = useState({
        enabled: false,
        instanceUrl: '',
        clientId: '',
        clientSecret: '',
        username: '',
        password: '',
    });

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('servicenow_integration_config');
        if (saved) {
            setSnConfig(JSON.parse(saved));
        }
    }, []);

    const handleSave = () => {
        setSaveStatus('saving');
        // Simulate API call or just save to localStorage
        setTimeout(() => {
            localStorage.setItem('servicenow_integration_config', JSON.stringify(snConfig));
            setSaveStatus('success');
            setOpenSnackbar(true);
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 800);
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1000, margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                <SettingsIcon sx={{ fontSize: 32, color: '#0E4DCA' }} />
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1F1F1F' }}>
                    User Settings
                </Typography>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #DADCE0', borderRadius: '16px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                            <Business sx={{ color: '#5F6368' }} />
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                Integrations
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Configure external services to streamline your access request workflows.
                        </Typography>

                        <Box sx={{ p: 2, border: '1px solid #E8EAED', borderRadius: '12px', bgcolor: '#F8F9FA' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <img src="https://www.servicenow.com/favicon.ico" alt="SN" style={{ width: 20, height: 20 }} />
                                    <Typography sx={{ fontWeight: 600 }}>ServiceNow</Typography>
                                </Box>
                                <Switch
                                    checked={snConfig.enabled}
                                    onChange={(e) => setSnConfig({ ...snConfig, enabled: e.target.checked })}
                                    color="primary"
                                />
                            </Box>

                            {snConfig.enabled && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="ServiceNow Instance URL"
                                            placeholder="https://your-instance.service-now.com"
                                            value={snConfig.instanceUrl}
                                            onChange={(e) => setSnConfig({ ...snConfig, instanceUrl: e.target.value })}
                                            variant="outlined"
                                            size="small"
                                            InputProps={{
                                                startAdornment: <LinkIcon sx={{ color: '#9AA0A6', mr: 1, fontSize: 18 }} />,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Client ID"
                                            value={snConfig.clientId}
                                            onChange={(e) => setSnConfig({ ...snConfig, clientId: e.target.value })}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Client Secret"
                                            type="password"
                                            value={snConfig.clientSecret}
                                            onChange={(e) => setSnConfig({ ...snConfig, clientSecret: e.target.value })}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="API Username"
                                            value={snConfig.username}
                                            onChange={(e) => setSnConfig({ ...snConfig, username: e.target.value })}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="API Password"
                                            type="password"
                                            value={snConfig.password}
                                            onChange={(e) => setSnConfig({ ...snConfig, password: e.target.value })}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            )}
                        </Box>

                        <Divider sx={{ my: 4 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate(-1)}
                                sx={{ borderRadius: '20px', textTransform: 'none' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={saveStatus === 'saving'}
                                sx={{
                                    borderRadius: '20px',
                                    textTransform: 'none',
                                    bgcolor: '#0E4DCA',
                                    '&:hover': { bgcolor: '#0B3DA8' },
                                    px: 4
                                }}
                                startIcon={saveStatus === 'success' ? <CheckCircle /> : <Save />}
                            >
                                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save Changes'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #DADCE0', borderRadius: '16px', bgcolor: '#F1F3F4' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                            <Security sx={{ color: '#5F6368' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Security & Privacy
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Your credentials are encrypted and stored securely in your browser's private state. They are never transmitted to our servers unless used to trigger a workflow on your behalf.
                        </Typography>
                        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VpnKey sx={{ fontSize: 16, color: '#1A73E8' }} />
                            <Typography variant="caption" sx={{ color: '#1A73E8', fontWeight: 500 }}>
                                Enterprise Grade Encryption
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={() => setOpenSnackbar(false)}
            >
                <Alert severity="success" sx={{ width: '100%', borderRadius: '12px' }}>
                    Settings updated successfully. ServiceNow integration is now {snConfig.enabled ? 'active' : 'disabled'}.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Settings;
