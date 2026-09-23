import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Items from './pages/Items';
import MyItems from './pages/MyItems';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import ItemDetails from './pages/ItemDetails';
import EditItem from './pages/EditItem';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import MyClaims from './pages/MyClaims';
import ItemClaimsReview from './pages/ItemClaimsReview';
import Chat from './pages/Chat';
import Unauthorized from './pages/Unauthorized';

// Admin Imports
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminItems from './pages/admin/AdminItems';
import AdminItemDetail from './pages/admin/AdminItemDetail';
import AdminClaims from './pages/admin/AdminClaims';
import AdminClaimDetail from './pages/admin/AdminClaimDetail';
import AdminReports from './pages/admin/AdminReports';
import AdminReportDetail from './pages/admin/AdminReportDetail';
import AdminActivity from './pages/admin/AdminActivity';

// Main student & public layout wrapper
const MainLayout = () => (
  <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Admin Routes - Isolated with dedicated AdminLayout */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:id" element={<AdminUserDetail />} />
            <Route path="/admin/items" element={<AdminItems />} />
            <Route path="/admin/items/:id" element={<AdminItemDetail />} />
            <Route path="/admin/claims" element={<AdminClaims />} />
            <Route path="/admin/claims/:id" element={<AdminClaimDetail />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/reports/:id" element={<AdminReportDetail />} />
            <Route path="/admin/activity" element={<AdminActivity />} />
          </Route>
        </Route>

        {/* Public & Student Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Chat />} />
            <Route path="/messages/:id" element={<Chat />} />
            <Route path="/items" element={<Items />} />
            <Route path="/my-items" element={<MyItems />} />
            <Route path="/my-claims" element={<MyClaims />} />
            <Route path="/items/:id" element={<ItemDetails />} />
            <Route path="/items/:id/claims" element={<ItemClaimsReview />} />
            <Route path="/items/:id/edit" element={<EditItem />} />
            <Route path="/report-lost" element={<ReportLost />} />
            <Route path="/report-found" element={<ReportFound />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
