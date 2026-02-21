import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import History from "./pages/History";
import About from "./pages/About";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={
          <main className="page">
            <div className="container">
              <div className="empty-state">
                <p style={{ fontSize: "3rem" }}>404</p>
                <p>Page not found.</p>
              </div>
            </div>
          </main>
        } />
      </Routes>
    </BrowserRouter>
  );
}
