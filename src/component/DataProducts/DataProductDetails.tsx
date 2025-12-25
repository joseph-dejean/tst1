const DataProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [chatOpen, setChatOpen] = useState(false);
    const dataProducts = user?.appConfig?.dataProducts || [];
    const product = dataProducts.find((p: any) => p.id === id);

    if (!product) {
        return (
            <Box sx={{ padding: '2rem' }}>
                <Typography variant="h5">Product not found</Typography>
                <Button onClick={() => navigate('/data-products')}>Back to Products</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ padding: '2rem', backgroundColor: '#F8FAFD', minHeight: '100vh' }}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/data-products')}
                sx={{ marginBottom: '1rem', color: '#575757' }}
            >
                Back to Data Products
            </Button>

            <Paper sx={{ padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1F1F1F', marginBottom: '0.5rem' }}>
                            {product.displayName}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ marginBottom: '1rem' }}>
                            {product.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<OpenInNew />}
                                onClick={() => setChatOpen(true)}
                            >
                                Chat with Data
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => alert("Access request submitted!")}
                            >
                                Request Access
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                        {product.region && <Chip label={`Region: ${product.region}`} variant="outlined" />}
                        {product.domain && <Chip label={`Domain: ${product.domain}`} variant="outlined" />}
                    </Box>
                </Box>

                <Divider sx={{ marginY: '1.5rem' }} />

                <Typography variant="h6" sx={{ marginBottom: '1rem', color: '#1F1F1F' }}>
                    Assets ({product.assets?.length || 0})
                </Typography>

                {product.assets && product.assets.length > 0 ? (
                    <List>
                        {product.assets.map((asset: string, index: number) => (
                            <ListItem key={index} sx={{
                                backgroundColor: '#F8F9FA',
                                borderRadius: '8px',
                                marginBottom: '0.5rem',
                                border: '1px solid #E0E0E0'
                            }}>
                                <ListItemText
                                    primary={asset.split('/').pop()}
                                    secondary={asset}
                                    primaryTypographyProps={{ fontWeight: 500, color: '#0B57D0' }}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    endIcon={<OpenInNew />}
                                    onClick={() => navigate(`/view-details?name=${encodeURIComponent(asset)}`)}
                                >
                                    View Details
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No assets linked to this data product.
                    </Typography>
                )}

                <Divider sx={{ marginY: '1.5rem' }} />

                <Typography variant="h6" sx={{ marginBottom: '0.5rem', color: '#1F1F1F' }}>
                    Owner
                </Typography>
                <Typography variant="body1">
                    {product.owner || 'N/A'}
                </Typography>

            </Paper>

            <ChatInterface
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                context={{
                    type: 'data-product',
                    name: product.displayName,
                    description: product.description
                }}
            />
        </Box>
    );
};

export default DataProductDetails;
