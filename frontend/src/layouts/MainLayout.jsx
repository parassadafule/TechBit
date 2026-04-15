import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 md:pb-8">
        <div className="flex gap-6">
          {}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>

          {}
          <Sidebar />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
