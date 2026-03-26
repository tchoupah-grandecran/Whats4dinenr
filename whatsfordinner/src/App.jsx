import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Recipes from './pages/Recipes';
import BottomNav from './components/BottomNav';
import Import from './pages/Import';
import ImportRayons from './pages/ImportRayon';

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <main className="max-w-md mx-auto relative min-h-screen pb-24">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/import" element={<Import />} />
        <Route path="/import-rayons" element={<ImportRayons />} />
      </Routes>
      
      {!isLoginPage && <BottomNav />}
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;