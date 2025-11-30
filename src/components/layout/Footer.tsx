import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-serif text-xl font-semibold">Ghazal Library</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your destination for quality books and stationery supplies.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/categories" className="hover:text-foreground transition-colors">Categories</Link></li>
              <li><Link to="/products" className="hover:text-foreground transition-colors">All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-foreground transition-colors">Featured</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link></li>
              <li><Link to="/cart" className="hover:text-foreground transition-colors">Cart</Link></li>
              <li><Link to="/orders" className="hover:text-foreground transition-colors">Order History</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span>Contact Us</span></li>
              <li><span>Shipping Info</span></li>
              <li><span>Returns</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 Ghazal Library. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
