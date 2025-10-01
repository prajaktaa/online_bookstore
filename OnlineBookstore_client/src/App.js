import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Books from './pages/Books';
import Checkout from './pages/Checkout';

export default function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <h1>Online Bookstore</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Books />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
