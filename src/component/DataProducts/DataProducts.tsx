import { useState } from 'react';
import { Box, Typography, Card, CardContent, CardActionArea, Chip, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

const DataProducts = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [filterRegion, setFilterRegion] = useState<string>('All');
    const [filterDomain, setFilterDomain] = useState<string>('All');
    const [filterAspect, setFilterAspect] = useState<string>('All');

    // Combine real data products with "Coming Soon" mock products
    const realProducts = user?.appConfig?.dataProducts || [];
    const mockProducts = [
        {
            id: 'mock-1',
            displayName: 'Customer 360 (Coming Soon)',
            description: 'A comprehensive view of customer interactions and transactions. Currently under development.',
            region: 'europe-west1',
            domain: 'Sales',
            status: 'Coming Soon',
            owner: 'Sales Team',
            aspects: { 'criticality': 'High', 'data_sensitivity': 'PII' },
            assets: []
        },
        {
            id: 'mock-2',
            displayName: 'Supply Chain Analytics (Coming Soon)',
            description: 'Real-time tracking of inventory and logistics. Expected Q3.',
            region: 'us-central1',
            domain: 'Logistics',
            status: 'Coming Soon',
            owner: 'Logistics Team',
            aspects: { 'criticality': 'Medium' },
            assets: []
        }
    ];

    const allProducts = [...realProducts, ...mockProducts];

    // Extract unique regions, domains, and aspects for filters
    const regions = ['All', ...Array.from(new Set(allProducts.map((p: any) => p.region || 'Unknown')))];
    const domains = ['All', ...Array.from(new Set(allProducts.map((p: any) => p.domain || 'General')))];

    // Flatten all aspect values for filtering
    const allAspectValues = allProducts.flatMap((p: any) => p.aspects ? Object.values(p.aspects) : []);
    const aspects = ['All', ...Array.from(new Set(allAspectValues))];

    const filteredProducts = allProducts.filter((product: any) => {
        const matchRegion = filterRegion === 'All' || product.region === filterRegion;
        const matchDomain = filterDomain === 'All' || (product.domain || 'General') === filterDomain;

        // Check if product has the selected aspect value in any of its aspects
        const productAspectValues = product.aspects ? Object.values(product.aspects) : [];
        const matchAspect = filterAspect === 'All' || productAspectValues.includes(filterAspect);

        return matchRegion && matchDomain && matchAspect;
    });

    return (
        <Box sx={{ padding: '2rem', backgroundColor: '#F8FAFD', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <Typography variant="h4" sx={{ fontWeight: 500, color: '#1F1F1F' }}>
                    Data Products Marketplace
                </Typography>
                <Box sx={{ display: 'flex', gap: '1rem' }}>
                    {/* Filters */}
                    <select
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={filterRegion}
                        onChange={(e) => setFilterRegion(e.target.value)}
                    >
                        {regions.map((r: any) => <option key={r} value={r}>Region: {r}</option>)}
                    </select>
                    <select
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={filterDomain}
                        onChange={(e) => setFilterDomain(e.target.value)}
                    >
                        {domains.map((d: any) => <option key={d} value={d}>Domain: {d}</option>)}
                    </select>
                    <select
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={filterAspect}
                        onChange={(e) => setFilterAspect(e.target.value)}
                    >
                        {aspects.map((a: any) => <option key={a} value={a}>Aspect: {a}</option>)}
                    </select>
                </Box>
            </Box>

            {filteredProducts.length === 0 ? (
                <Typography variant="body1" color="textSecondary">
                    No data products found matching your filters.
                </Typography>
            ) : (
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: 3 
                }}>
                    {filteredProducts.map((product: any) => (
                        <Card key={product.id} sx={{
                            height: '100%',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            opacity: product.status === 'Coming Soon' ? 0.7 : 1,
                            position: 'relative'
                        }}>
                            <CardActionArea
                                onClick={() => product.status !== 'Coming Soon' && navigate(`/data-products/${product.id}`)}
                                sx={{ height: '100%' }}
                                disabled={product.status === 'Coming Soon'}
                            >
                                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Typography variant="h6" component="div" sx={{ marginBottom: '0.5rem', color: '#0B57D0', fontWeight: 600 }}>
                                            {product.displayName}
                                        </Typography>
                                        {product.status === 'Coming Soon' && (
                                            <Chip label="Coming Soon" size="small" color="warning" variant="filled" />
                                        )}
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ marginBottom: '1rem', flexGrow: 1 }}>
                                        {product.description}
                                    </Typography>

                                    <Divider sx={{ my: 1 }} />

                                    <Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                                        {product.region && <Chip label={product.region} size="small" variant="outlined" />}
                                        <Chip label={product.domain || 'General'} size="small" variant="outlined" />
                                        {product.status !== 'Coming Soon' && (
                                            <Chip label={`${product.assets?.length || 0} Assets`} size="small" color="primary" variant="outlined" />
                                        )}
                                    </Box>
                                    <Typography variant="caption" sx={{ marginTop: '0.5rem', display: 'block', color: '#757575' }}>
                                        Owner: {product.owner || 'Unknown'}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default DataProducts;
