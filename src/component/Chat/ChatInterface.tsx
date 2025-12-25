import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Typography,
    Paper,
    Drawer,
    List,
    ListItem,
    CircularProgress,
    Avatar
} from '@mui/material';
import { Send, Close, SmartToy, Person } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../auth/AuthProvider';

interface ChatInterfaceProps {
    open: boolean;
    onClose: () => void;
    context: {
        type: 'data-product' | 'table';
        name: string;
        description?: string;
    };
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ open, onClose, context }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: `Hello! I'm your data assistant. Ask me anything about ${context.name}.`,
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const { user } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post('/api/v1/chat', {
                query: input,
                context: context
            }, {
                headers: {
                    Authorization: `Bearer ${user?.token}`
                }
            });

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.data.answer || "I'm sorry, I couldn't understand that.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I encountered an error processing your request.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: '400px', maxWidth: '100%' }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f5f5f5' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SmartToy color="primary" />
                        <Typography variant="h6">Data Assistant</Typography>
                    </Box>
                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </Box>

                {/* Messages Area */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#fafafa' }}>
                    <List>
                        {messages.map((msg) => (
                            <ListItem key={msg.id} sx={{
                                flexDirection: 'column',
                                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                mb: 2
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    gap: 1,
                                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                                    maxWidth: '85%'
                                }}>
                                    <Avatar sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: msg.sender === 'user' ? '#1976d2' : '#2e7d32'
                                    }}>
                                        {msg.sender === 'user' ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
                                    </Avatar>
                                    <Paper sx={{
                                        p: 1.5,
                                        bgcolor: msg.sender === 'user' ? '#e3f2fd' : '#ffffff',
                                        borderRadius: 2
                                    }}>
                                        <Typography variant="body2">{msg.text}</Typography>
                                    </Paper>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1 }}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </ListItem>
                        ))}
                        {loading && (
                            <ListItem sx={{ justifyContent: 'flex-start' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={20} />
                                    <Typography variant="body2" color="text.secondary">Thinking...</Typography>
                                </Box>
                            </ListItem>
                        )}
                        <div ref={messagesEndRef} />
                    </List>
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            placeholder="Ask a question..."
                            variant="outlined"
                            size="small"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={loading}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                        >
                            <Send />
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </Drawer>
    );
};

export default ChatInterface;
