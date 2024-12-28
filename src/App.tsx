import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import BestieDetails from './pages/BestieDetails';
import StyleSelection from './pages/StyleSelection';
import Generation from './pages/Generation';
import Account from './pages/Account';
import Share from './pages/Share';
import Upgrade from './pages/Upgrade';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/account" element={<Account />} />
          <Route path="/bestie-details" element={<BestieDetails />} />
          <Route path="/style-selection" element={<StyleSelection />} />
          <Route path="/generation" element={<Generation />} />
          <Route path="/share/:token" element={<Share />} />
          <Route path="/upgrade" element={<Upgrade />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;