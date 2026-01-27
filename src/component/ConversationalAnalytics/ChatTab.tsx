import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { URLS } from '../../constants/urls';
import { useAuth } from '../../auth/AuthProvider';

// Markdown styles for tables and code blocks
const markdownStyles = {
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    marginTop: '12px',
    marginBottom: '12px',
    fontSize: '14px',
  },
  '& th, & td': {
    border: '1px solid #DADCE0',
    padding: '8px 12px',
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: '#F1F3F4',
    fontWeight: 600,
  },
  '& tr:nth-of-type(even)': {
    backgroundColor: '#F8F9FA',
  },
  '& code': {
    backgroundColor: '#F1F3F4',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  '& pre': {
    backgroundColor: '#1E1E1E',
    color: '#D4D4D4',
    padding: '12px',
    borderRadius: '8px',
    overflowX: 'auto',
    '& code': {
      backgroundColor: 'transparent',
      padding: 0,
      color: 'inherit',
    },
  },
  '& p': {
    margin: '8px 0',
  },
  '& ul, & ol': {
    paddingLeft: '20px',
  },
};

interface ChatTabProps {
  entry: any;
  tables?: any[]; // Optional list of tables for Data Products/Datasets
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatTab: React.FC<ChatTabProps> = ({ entry, tables }) => {
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
      // Check if this is a Data Product or if multiple tables are selected
      const hasMultipleTables = tables && tables.length > 1;
      const isDataProduct = entry._isDataProduct || entry.entryType === 'DATA_PRODUCT' || hasMultipleTables;

      let contextData: any;

      if (isDataProduct || hasMultipleTables) {
        // Prepare context for all tables
        // If we have the 'tables' prop (related tables selected), use that.
        // Otherwise check internal dataProduct object.
        const tableList = tables || (entry._dataProduct?.tables) || [entry];

        const tablesContext = tableList.map((t: any) => {
          // Handle structure from resourcesEntryList (dataplexEntry) or direct table object
          const tableObj = t.dataplexEntry || t;
          return {
            name: tableObj.entrySource?.displayName || tableObj.displayName || tableObj.entryName || tableObj.name?.split('/').pop() || 'Unknown Table',
            fullyQualifiedName: tableObj.fullyQualifiedName || tableObj.name || '',
            // If it's from resourcesEntryList, it might be nested
            type: tableObj.entryType || tableObj.type || 'Table',
            description: tableObj.entrySource?.description || tableObj.description || ''
          };
        });

        // For multi-table chat, use the first table as the primary context
        const primaryTable = tableList[0];
        const primaryName = primaryTable.entrySource?.displayName || primaryTable.displayName || primaryTable.name?.split('/').pop() || 'Selected Tables';

        contextData = {
          name: hasMultipleTables ? `${primaryName} + ${tableList.length - 1} related tables` : primaryName,
          description: entry.entrySource?.description || entry.description || "Multi-table conversation",
          isDataProduct: true, // Enable multi-table handling in backend
          tables: tablesContext,
          fullyQualifiedName: entry.fullyQualifiedName || entry.name || '',
          entryType: isDataProduct ? 'DATA_PRODUCT' : 'MULTI_TABLE',
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
          {tables && tables.length > 1
            ? `Ask natural language questions about ${tables.length} tables. The AI can query across all selected tables.`
            : 'Ask natural language questions about this table\'s data. Powered by Google Cloud Conversational Analytics API.'}
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
              {tables && tables.length > 1
                ? 'Start a conversation by asking a question about your selected tables.'
                : 'Start a conversation by asking a question about this table.'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#9AA0A6' }}>
              {tables && tables.length > 1
                ? 'Example: "Join customers and orders to show total orders per customer" or "Compare sales across both tables"'
                : 'Example: "What columns does this table have?" or "Show me the top 10 rows"'}
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
                    border: msg.role === 'assistant' ? '1px solid #DADCE0' : 'none',
                    ...(msg.role === 'assistant' ? markdownStyles : {})
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {msg.content}
                    </Typography>
                  )}
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
            placeholder={tables && tables.length > 1
              ? "e.g., Join these tables to show..., Compare data across tables..."
              : "e.g., What columns does this table have? Show me sample data."}
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