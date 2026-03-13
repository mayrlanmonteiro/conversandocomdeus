import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Plans from './pages/Plans';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/login" element={<Home />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/planos" element={<Plans />} />
    </Routes>
  );
}
