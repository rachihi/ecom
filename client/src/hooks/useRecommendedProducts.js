import { useDidMount } from '@/hooks';
import { useEffect, useState } from 'react';
import { productAPI } from '@/services/api';

const useRecommendedProducts = (itemsCount = 6) => {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const didMount = useDidMount(true);

  const fetchRecommendedProducts = async () => {
    try {
      setLoading(true);
      setError('');

      // Call API to get recommended products
      const response = await productAPI.getRecommendedProducts(itemsCount);
      const { products = [] } = response.data;

      if (products.length === 0) {
        if (didMount) {
          setError('No recommended products found.');
          setLoading(false);
        }
      } else {
        // Transform API response to match expected format
        const items = products.map(p => ({
          id: p._id,
          name: p.pName,
          description: p.pDescription,
          price: p.pPrice,
          quantity: p.pQuantity,
          category: p.pCategory,
          images: p.pImages || [],
          image: p.pImages && p.pImages.length > 0 ? p.pImages[0] : '',
          imageCollection: p.pImages || [],
          isFeatured: false,
          isRecommended: true,
          availableColors: [],
          maxQuantity: p.pQuantity,
          dateAdded: p.createdAt || Date.now(),
        }));

        if (didMount) {
          setRecommendedProducts(items);
          setLoading(false);
        }
      }
    } catch (e) {
      if (didMount) {
        setError('Failed to fetch recommended products');
        setLoading(false);
        console.error('Error fetching recommended products:', e);
      }
    }
  };

  useEffect(() => {
    if (recommendedProducts.length === 0 && didMount) {
      fetchRecommendedProducts();
    }
  }, []);

  return {
    recommendedProducts, fetchRecommendedProducts, isLoading, error
  };
};

export default useRecommendedProducts;
