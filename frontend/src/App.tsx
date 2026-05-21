import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contracts from './pages/Contracts';
import ContractDetail from './pages/ContractDetail';
import Shipments from './pages/Shipments';
import Inventory from './pages/Inventory';
import FundedInventory from './pages/FundedInventory';
import Warehouse from './pages/Warehouse';
import Approvals from './pages/Approvals';
import Expenses from './pages/Expenses';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="contracts/:id" element={<ContractDetail />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="funded-inventory" element={<FundedInventory />} />
            <Route path="warehouse" element={<Warehouse />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="expenses" element={<Expenses />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
