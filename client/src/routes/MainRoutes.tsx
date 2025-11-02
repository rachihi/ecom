import { lazy } from 'react';

// project-imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import PagesLayout from 'layout/Pages';
import SimpleLayout from 'layout/Simple';
import { SimpleLayoutType } from 'config';
import AuthGuard from 'utils/route-guard/AuthGuard';


const MaintenanceError = Loadable(lazy(() => import('pages/maintenance/error/404')));
const MaintenanceError500 = Loadable(lazy(() => import('pages/maintenance/error/500')));
const MaintenanceUnderConstruction = Loadable(lazy(() => import('pages/maintenance/under-construction/under-construction')));
const MaintenanceComingSoon = Loadable(lazy(() => import('pages/maintenance/coming-soon/coming-soon')));

const AppContactUS = Loadable(lazy(() => import('pages/contact-us')));
// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));
// render - admin pages
const CustomersPage = Loadable(lazy(() => import('pages/admin/customers')));
const SuppliersPage = Loadable(lazy(() => import('pages/admin/suppliers')));
const OrdersPage = Loadable(lazy(() => import('pages/admin/orders/main')));
const WarehousePage = Loadable(lazy(() => import('pages/admin/warehouse')));
const PurchaseOrdersPage = Loadable(lazy(() => import('pages/admin/purchase-orders')));
const PaymentsPage = Loadable(lazy(() => import('pages/admin/payments')));
const CashbookPage = Loadable(lazy(() => import('pages/admin/cashbook')));

const PosPage = Loadable(lazy(() => import('pages/admin/pos')));
const ProductsPage = Loadable(lazy(() => import('pages/admin/products')));
const CategoriesPage = Loadable(lazy(() => import('pages/admin/categories')));


// ==============================|| MAIN ROUTES ||============================== //

const MainRoutes = {
  path: '/',
  children: [
    {
      path: '/',
      element: (
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        {
          path: 'sample-page',
          element: <SamplePage />
        },
        { path: 'admin/customers', element: <CustomersPage /> },
        { path: 'admin/suppliers', element: <SuppliersPage /> },
        { path: 'admin/orders', element: <OrdersPage /> },
        { path: 'admin/warehouse', element: <WarehousePage /> },
        { path: 'admin/purchase-orders', element: <PurchaseOrdersPage /> },
        { path: 'admin/payments', element: <PaymentsPage /> },
        { path: 'admin/cashbook', element: <CashbookPage /> },

        { path: 'admin/pos', element: <PosPage /> },
        { path: 'admin/products', element: <ProductsPage /> },
        { path: 'admin/categories', element: <CategoriesPage /> }
      ]
    },
    {
      path: '/',
      element: <SimpleLayout layout={SimpleLayoutType.SIMPLE} />,
      children: [
        {
          path: 'contact-us',
          element: <AppContactUS />
        }
      ]
    },
    {
      path: '/maintenance',
      element: <PagesLayout />,
      children: [
        {
          path: '404',
          element: <MaintenanceError />
        },
        {
          path: '500',
          element: <MaintenanceError500 />
        },
        {
          path: 'under-construction',
          element: <MaintenanceUnderConstruction />
        },
        {
          path: 'coming-soon',
          element: <MaintenanceComingSoon />
        }
      ]
    },
    { path: '*', element: <MaintenanceError /> }
  ]
};

export default MainRoutes;
