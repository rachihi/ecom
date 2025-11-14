import { RouterProvider } from 'react-router-dom';
import { SWRConfig } from 'swr';

// project import
import router from 'routes';
import ThemeCustomization from 'themes';
import { fetcher } from 'utils/axios';

import Locales from 'components/Locales';
// import RTLLayout from 'components/RTLLayout';
import ScrollTop from 'components/ScrollTop';
import Snackbar from 'components/@extended/Snackbar';

// auth-provider
import { JWTProvider as AuthProvider } from 'contexts/JWTContext';

// ==============================|| APP - THEME, ROUTER, LOCAL  ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      {/* <RTLLayout> */}
      <Locales>
        <ScrollTop>
          <AuthProvider>
            <SWRConfig value={{ fetcher }}>
              <>
                <RouterProvider router={router} />
                <Snackbar />
              </>
            </SWRConfig>
          </AuthProvider>
        </ScrollTop>
      </Locales>
      {/* </RTLLayout> */}
    </ThemeCustomization>
  );
}
