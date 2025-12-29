import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Admin from "./pages/Admin";
import MoneyTransfer from "./pages/MoneyTransfer";
import Transfers from "./pages/Transfers";
import Ebooks from "./pages/Ebooks";
import MyEbooks from "./pages/MyEbooks";
import ReadEbook from "./pages/ReadEbook";
import BookExchange from "./pages/BookExchange";
import Wishlist from "./pages/Wishlist";
import AudiobookStudio from "./pages/AudiobookStudio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/transfer" element={<MoneyTransfer />} />
              <Route path="/transfers" element={<Transfers />} />
              <Route path="/ebooks" element={<Ebooks />} />
              <Route path="/my-ebooks" element={<MyEbooks />} />
              <Route path="/read/:id" element={<ReadEbook />} />
              <Route path="/book-exchange" element={<BookExchange />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/audiobook-studio" element={<AudiobookStudio />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
