import { mockDataProducts } from '../mocks/mockDataProducts';
import type { DataProduct } from '../types/DataProduct';

/**
 * Search Data Products by term
 * Matches against name, displayName, description, and tags
 */
export const searchDataProducts = (searchTerm: string): DataProduct[] => {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  const term = searchTerm.toLowerCase().trim();
  
  return mockDataProducts.filter((product) => {
    const nameMatch = product.name.toLowerCase().includes(term);
    const displayNameMatch = product.displayName.toLowerCase().includes(term);
    const descriptionMatch = product.description.toLowerCase().includes(term);
    const tagMatch = product.tags?.some(tag => tag.toLowerCase().includes(term));
    
    return nameMatch || displayNameMatch || descriptionMatch || tagMatch;
  });
};

/**
 * Convert Data Product to a search result entry format
 * This allows Data Products to be displayed alongside regular entries
 */
export const dataProductToEntry = (dataProduct: DataProduct): any => {
  return {
    name: `data-products/${dataProduct.id}`,
    displayName: dataProduct.displayName,
    fullyQualifiedName: `data-products://${dataProduct.id}`,
    entryType: 'DATA_PRODUCT',
    entrySource: {
      resource: `data-products/${dataProduct.id}`,
      system: 'DATA_PRODUCT',
      displayName: 'Data Product'
    },
    description: dataProduct.description,
    aspects: {},
    // Add metadata for Data Product
    _isDataProduct: true,
    _dataProductId: dataProduct.id,
    _dataProduct: dataProduct
  };
};

/**
 * Merge Data Products into search results
 */
export const mergeDataProductsIntoResults = (searchResults: any[], searchTerm: string): any[] => {
  const matchingDataProducts = searchDataProducts(searchTerm);
  const dataProductEntries = matchingDataProducts.map(dataProductToEntry);
  
  // Combine regular results with Data Products
  return [...dataProductEntries, ...searchResults];
};

/**
 * Filter results by Data Product
 */
export const filterByDataProduct = (results: any[], dataProductId: string): any[] => {
  if (!dataProductId || dataProductId === 'all') {
    return results;
  }

  const dataProduct = mockDataProducts.find(dp => dp.id === dataProductId);
  if (!dataProduct || !dataProduct.tables || dataProduct.tables.length === 0) {
    return results;
  }

  // Filter results to only show tables/assets that belong to this Data Product
  const tableFQNs = new Set(dataProduct.tables.map(t => t.fullyQualifiedName));
  
  return results.filter(result => {
    return tableFQNs.has(result.fullyQualifiedName);
  });
};

