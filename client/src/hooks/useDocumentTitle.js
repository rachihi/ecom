import { useLayoutEffect } from 'react';

const useDocumentTitle = (title) => {
  useLayoutEffect(() => {
    if (title) {
      document.title = title;
    } else {
      document.title = '102 Concept';
    }
  }, [title]);
};

export default useDocumentTitle;
