import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
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
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
