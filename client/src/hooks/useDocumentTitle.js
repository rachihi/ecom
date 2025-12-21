import { useLayoutEffect } from 'react';

const useDocumentTitle = (title) => {
  useLayoutEffect(() => {
    if (title) {
      document.title = title;
    } else {
      document.title = 'Bá Minh Store';
    }
  }, [title]);
};

export default useDocumentTitle;
