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

      const response = await productAPI.getRecommendedProducts(itemsCount);
      const { products = [] } = response.data;      

      if (products.length == 0) {
        if (didMount) {
          setError('No recommended products found.');
          setLoading(false);
        }
      } else {
        const items = products
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
