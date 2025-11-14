import { useDidMount } from '@/hooks';
import { useEffect, useState } from 'react';
import { productAPI } from '@/services/api';

const useFeaturedProducts = (itemsCount = 6) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const didMount = useDidMount(true);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError('');

      // Call API to get featured products
      const response = await productAPI.getFeaturedProducts(itemsCount);
      const { products = [] } = response.data;

      if (products.length === 0) {
        if (didMount) {
          setError('No featured products found.');
          setLoading(false);
        }
      } else {
        // Transform API response using productAPI.transformProduct
        const items = products.map(productAPI.transformProduct);
        if (didMount) {
          setFeaturedProducts(items);
          setLoading(false);
        }
      }
    } catch (e) {
      if (didMount) {
        setError('Failed to fetch featured products');
        setLoading(false);
        console.error('Error fetching featured products:', e);
      }
    }
  };

  useEffect(() => {
    if (featuredProducts.length === 0 && didMount) {
      fetchFeaturedProducts();
    }
  }, []);

  return {
    featuredProducts, fetchFeaturedProducts, isLoading, error
  };
};

export default useFeaturedProducts;
