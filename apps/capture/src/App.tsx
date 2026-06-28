import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home — coming soon</div>} />
        <Route path="/capture" element={<div>Capture — coming soon</div>} />
        <Route path="/settings" element={<div>Settings — coming soon</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
