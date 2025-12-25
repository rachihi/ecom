// project import
import samplePage from './sample-page';
import support from './support';
import pages from './pages';
import management from './management';

// types
import { NavItemType } from 'types/menu';

// ==============================|| MENU ITEMS ||============================== //

const menuItems: { items: NavItemType[] } = {
  items: [management]
};

export default menuItems;
