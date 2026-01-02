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
      let schema: any[] = [];
      
      // Try to extract schema from aspects
      if (entry.aspects) {
        const aspectKeys = Object.keys(entry.aspects);
        const schemaKey = aspectKeys.find(key => key.includes('schema') || key.includes('Schema'));
        
        if (schemaKey) {
          const schemaAspect = entry.aspects[schemaKey];
          // Handle different schema formats
          if (schemaAspect?.data?.fields) {
            if (schemaAspect.data.fields.fields?.listValue?.values) {
              schema = schemaAspect.data.fields.fields.listValue.values;
            } else if (Array.isArray(schemaAspect.data.fields)) {
              schema = schemaAspect.data.fields;
            } else if (schemaAspect.data.fields.fields) {
              schema = Array.isArray(schemaAspect.data.fields.fields) 
                ? schemaAspect.data.fields.fields 
                : Object.values(schemaAspect.data.fields.fields);
            }
          }
        }
      }

      // Format schema for better AI understanding
      const formattedSchema = schema.map((field: any) => {
        if (typeof field === 'string') return field;
        return {
          name: field.name || field.stringValue || field.displayName || 'unknown',
          type: field.type || field.dataType || 'unknown',
          description: field.description || ''
        };
      });

      const contextData = {
        name: entry.entrySource?.displayName || entry.displayName || entry.name || 'Unknown',
        description: entry.entrySource?.description || entry.description || "No description available.",
        schema: formattedSchema, // Sending the columns helps the AI understand the data structure
        fullyQualifiedName: entry.fullyQualifiedName || entry.name || '',
        entryType: entry.entryType || entry.entrySource?.system || 'Unknown'
      };

      // 2. Call the Backend
      const res = await axios.post(`${URLS.API_URL}${URLS.CHAT}`, {
        message: input,
        context: contextData
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      setResponse(res.data.reply);
    } catch (e: any) {
      console.error('Chat error:', e);
      const errorMessage = e?.response?.data?.error || e?.message || "Error communicating with AI. Please check if Vertex AI API is enabled and permissions are granted.";
      setError(errorMessage);
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