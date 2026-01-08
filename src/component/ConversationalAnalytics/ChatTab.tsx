import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { URLS } from '../../constants/urls';
import { useAuth } from '../../auth/AuthProvider';

interface ChatTabProps {
  entry: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatTab: React.FC<ChatTabProps> = ({ entry }) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    // Add user message to UI immediately
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Check if this is a Data Product
      const isDataProduct = entry._isDataProduct || entry.entryType === 'DATA_PRODUCT';
      const dataProduct = entry._dataProduct;

      let contextData: any;

      if (isDataProduct && dataProduct) {
        // For Data Products, prepare context for all tables in the product
        const tablesContext = dataProduct.tables && dataProduct.tables.length > 0
          ? dataProduct.tables.map((table: any) => ({
            name: table.displayName || table.entryName || 'Unknown Table',
            fullyQualifiedName: table.fullyQualifiedName || table.entryName || '',
            type: table.type || 'Table',
            description: table.description || ''
          }))
          : [];

        contextData = {
          name: dataProduct.displayName || dataProduct.name || 'Unknown Data Product',
          description: dataProduct.description || "No description available.",
          isDataProduct: true,
          dataProductId: dataProduct.id,
          tables: tablesContext, // Array of tables in this Data Product
          fullyQualifiedName: `data-products://${dataProduct.id}`,
          entryType: 'DATA_PRODUCT',
          conversationHistory: conversationHistory
        };
      } else {
        // For regular tables/entries, extract schema as before
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

        contextData = {
          name: entry.entrySource?.displayName || entry.displayName || entry.name || 'Unknown',
          description: entry.entrySource?.description || entry.description || "No description available.",
          schema: formattedSchema,
          fullyQualifiedName: entry.fullyQualifiedName || entry.name || '',
          entryType: entry.entryType || entry.entrySource?.system || 'Unknown',
          conversationHistory: conversationHistory
        };
      }

      // 2. Call the Backend
      const res = await axios.post(`${URLS.API_URL}${URLS.CHAT}`, {
        message: userMessage,
        context: contextData
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      // Update conversation history for next turn
      if (res.data.conversationHistory) {
        setConversationHistory(res.data.conversationHistory);
      }

      // Add assistant response to UI
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.data.reply || 'No response received.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (e: any) {
      console.error('Chat error:', e);
      const errorMessage = e?.response?.data?.error || e?.message || "Error communicating with Conversational Analytics API. Please check if the API is enabled and permissions are granted.";
      setError(errorMessage);

      // Add error message to chat
      const errorMsg: Message = {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConversationHistory([]);
    setError(null);
  };

  return (
    <Box sx={{ padding: '24px', maxWidth: '1200px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1F1F1F' }}>
          Conversational Analytics
        </Typography>
        <Typography variant="body2" sx={{ color: '#575757' }}>
          Ask natural language questions about this table's data. Powered by Google Cloud Conversational Analytics API.
        </Typography>
      </Box>

      {/* Chat Messages Area */}
      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          mb: 2,
          p: 2,
          backgroundColor: '#F8FAFD',
          borderRadius: '8px',
          border: '1px solid #DADCE0',
          minHeight: '400px',
          maxHeight: '600px'
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#575757' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Start a conversation by asking a question about this table.
            </Typography>
            <Typography variant="body2" sx={{ color: '#9AA0A6' }}>
              Example: "What columns does this table have?" or "Show me the top 10 rows"
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    maxWidth: '80%',
                    backgroundColor: msg.role === 'user' ? '#0E4DCA' : '#ffffff',
                    color: msg.role === 'user' ? '#ffffff' : '#1F1F1F',
                    borderRadius: '8px',
                    border: msg.role === 'assistant' ? '1px solid #DADCE0' : 'none'
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {msg.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      opacity: 0.7,
                      fontSize: '0.7rem'
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))
        )}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #DADCE0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" sx={{ color: '#575757' }}>
                  Thinking...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Ask a question..."
            placeholder="e.g., What columns does this table have? Show me sample data."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !loading && handleAsk()}
            disabled={loading}
            multiline
            maxRows={3}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleAsk}
              disabled={loading || !input.trim()}
              startIcon={!loading && <SendIcon />}
              sx={{ backgroundColor: '#0E4DCA', minWidth: '120px' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClearChat}
              disabled={loading}
              size="small"
              sx={{ minWidth: '120px' }}
            >
              Clear Chat
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatTab;