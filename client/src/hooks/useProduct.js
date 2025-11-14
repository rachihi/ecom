import { useDidMount } from '@/hooks';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { productAPI } from '@/services/api';

const useProduct = (id) => {
  // get and check if product exists in store
  const storeProduct = useSelector((state) => state.products.items.find((item) => item.id === id));

  const [product, setProduct] = useState(storeProduct);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const didMount = useDidMount(true);

  useEffect(() => {
    (async () => {
      try {
        if (!product || product.id !== id) {
          setLoading(true);
          
          // Call API to get single product
          const response = await productAPI.getProductById(id);
          const data = response.data.data;
          
          if (data && data._id) {
            // Transform API response to match expected format
            const transformedProduct = {
              id: data._id,
              name: data.pName,
              description: data.pDescription,
              price: data.pPrice,
              quantity: data.pQuantity,
              category: data.pCategory,
              images: data.pImages || [],
              image: data.pImages && data.pImages.length > 0 ? data.pImages[0] : '',
              imageCollection: data.pImages || [],
              isFeatured: false,
              isRecommended: false,
              availableColors: [],
              maxQuantity: data.pQuantity,
              dateAdded: data.createdAt || Date.now(),
            };            
            if (didMount) {
              setProduct(transformedProduct);
              setLoading(false);
            }
          } else {
            setError('Product not found.');
          }
        }
      } catch (err) {
        if (didMount) {
          setLoading(false);
          setError(err?.message || 'Something went wrong.');
          console.error('Error fetching product:', err);
        }
      }
    })();
  }, [id]);

  return { product, isLoading, error };
};

export default useProduct;
