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
          isFeatured: true,
          isRecommended: false,
          availableColors: [],
          maxQuantity: p.pQuantity,
          dateAdded: p.createdAt || Date.now(),
        }));

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
