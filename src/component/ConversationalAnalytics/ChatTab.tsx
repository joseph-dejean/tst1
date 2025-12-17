import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { URLS } from '../../constants/urls';
import { useAuth } from '../../auth/AuthProvider';

interface ChatTabProps {
  entry: any;
}

const ChatTab: React.FC<ChatTabProps> = ({ entry }) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    
    try {
      // 1. Prepare Context (Extract useful info from the entry object)
      const number = entry.entryType.split('/')[1];
      // Try to get schema if available
      const schema = entry.aspects?.[`${number}.global.schema`]?.data?.fields?.fields?.listValue?.values || [];

      const contextData = {
        name: entry.entrySource.displayName || entry.name,
        description: entry.entrySource.description || "No description available.",
        schema: schema // Sending the columns helps the AI understand the data structure
      };

      // 2. Call the Backend
      const res = await axios.post(`${URLS.API_URL}/chat`, {
        message: input,
        context: contextData
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      setResponse(res.data.reply);
    } catch (e) {
      console.error(e);
      setError("Error communicating with AI. Please check if Vertex AI API is enabled and permissions are granted.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: '24px', maxWidth: '900px' }}>
      <Typography variant="h6" gutterBottom sx={{color: '#1F1F1F'}}>
        Conversational Analytics
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: '#575757' }}>
        Ask natural language questions about this asset's schema, description, or usage to get instant insights powered by Gemini.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField 
          fullWidth 
          variant="outlined"
          label="Ask a question..."
          placeholder="e.g., Does this table contain PII? What is the primary key?" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
          disabled={loading}
        />
        <Button 
          variant="contained" 
          onClick={handleAsk} 
          disabled={loading}
          startIcon={!loading && <SendIcon />}
          sx={{ backgroundColor: '#0E4DCA', minWidth: '120px' }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Ask AI'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {response && (
        <Paper elevation={0} sx={{ p: 3, backgroundColor: '#F8FAFD', border: '1px solid #DADCE0', borderRadius: '8px' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#0E4DCA', fontWeight: 'bold' }}>
            Gemini Response:
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {response}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ChatTab;