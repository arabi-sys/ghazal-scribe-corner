import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, User, Menu, X, BookOpen, Search, Heart, Bell } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const { unreadCount, getUnreadByTypes } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/categories', label: 'Categories' },
    { href: '/products', label: 'Products' },
    { href: '/ebooks', label: 'Ebooks' },
    { href: '/book-exchange', label: 'Book Exchange' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-semibold text-foreground">Ghazal Library</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              to={link.href} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/products">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          {user && (
            <Link to="/wishlist">
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/orders" className="relative">
                <Button variant="ghost" size="sm">
                  Orders
                  <NotificationBadge count={getUnreadByTypes(['order_status_update'])} className="ml-1" />
                </Button>
              </Link>
              <Link to="/transfers" className="relative">
                <Button variant="ghost" size="sm">
                  Transfers
                  <NotificationBadge count={getUnreadByTypes(['transfer_approved', 'transfer_declined'])} className="ml-1" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/auth" className="hidden md:block">
              <Button variant="default" size="sm">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium py-2 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link 
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium py-2 text-primary"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <hr className="my-2 border-border" />
                {user ? (
                  <>
                    <Link 
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium py-2"
                    >
                      My Orders
                    </Link>
                    <Link 
                      to="/transfers"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium py-2"
                    >
                      Money Transfers
                    </Link>
                    <Link 
                      to="/my-ebooks"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium py-2"
                    >
                      My Ebooks
                    </Link>
                    <Button variant="outline" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Sign In</Button>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
