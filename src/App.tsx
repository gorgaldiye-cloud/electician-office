import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileActionBar } from './components/layout/MobileActionBar';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ServicesPage } from './pages/public/ServicesPage';
import { ServiceDetailPage } from './pages/public/ServiceDetailPage';
import { PricingPage } from './pages/public/PricingPage';
import { ProjectsPage } from './pages/public/ProjectsPage';
import { AboutPage } from './pages/public/AboutPage';
import { ReviewsPage } from './pages/public/ReviewsPage';
import { FAQPage } from './pages/public/FAQPage';
import { BlogPage } from './pages/public/BlogPage';
import { ContactPage } from './pages/public/ContactPage';
import { BookingWizard } from './pages/public/BookingWizard';
import { TrackBookingPage } from './pages/public/TrackBookingPage';
import { AIDiagnosticsPage } from './pages/public/AIDiagnosticsPage';
import { LegalPage } from './pages/public/LegalPages';
import { repository } from './data';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminTechnicianView } from './pages/admin/AdminTechnicianView';
import { AdminQuotes } from './pages/admin/AdminQuotes';
import { AdminInvoices } from './pages/admin/AdminInvoices';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminInquiries } from './pages/admin/AdminInquiries';
import { AdminStaff } from './pages/admin/AdminStaff';
import { AdminServices } from './pages/admin/AdminServices';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminDataRequests } from './pages/admin/AdminDataRequests';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { PageTransition } from './motion';
import { DevMotionPage } from './pages/dev/DevMotionPage';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      if (
        window.location.pathname.includes('/dev/motion') ||
        window.location.hash.includes('dev/motion') ||
        window.location.search.includes('view=dev-motion')
      ) {
        return 'dev-motion';
      }
    }
    return 'home';
  });
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [, setCatalogRevision] = useState(0);

  useEffect(() => {
    const refreshCatalog = () => setCatalogRevision((revision) => revision + 1);
    window.addEventListener('abc:data-updated', refreshCatalog);
    void repository.initializeRemoteCatalog();
    return () => window.removeEventListener('abc:data-updated', refreshCatalog);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdmin = currentView.startsWith('admin');

  // Handle Admin tab switching
  const adminTab = currentView.replace('admin-', '');

  const handleAdminTabNavigate = (tab: string) => {
    setCurrentView(`admin-${tab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-white text-[#15191F]">
          {!isAdmin ? (
            <>
              <Header currentView={currentView} onNavigate={handleNavigate} />

              <main className="flex-1">
                <PageTransition currentKey={currentView}>
                  {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}
                  {currentView === 'services' && <ServicesPage onNavigate={handleNavigate} />}
                  {currentView === 'service-detail' && (
                    <ServiceDetailPage slug={viewParam || ''} onNavigate={handleNavigate} />
                  )}
                  {currentView === 'pricing' && <PricingPage onNavigate={handleNavigate} />}
                  {currentView === 'projects' && <ProjectsPage onNavigate={handleNavigate} />}
                  {currentView === 'about' && <AboutPage onNavigate={handleNavigate} />}
                  {currentView === 'reviews' && <ReviewsPage />}
                  {currentView === 'faq' && <FAQPage />}
                  {currentView === 'blog' && <BlogPage />}
                  {currentView === 'contact' && <ContactPage onNavigate={handleNavigate} />}
                  {currentView === 'book-service' && (
                    <BookingWizard initialServiceId={viewParam} onNavigate={handleNavigate} />
                  )}
                  {currentView === 'track-booking' && (
                    <TrackBookingPage initialReference={viewParam} onNavigate={handleNavigate} />
                  )}
                  {currentView === 'ai-diagnostics' && (
                    <AIDiagnosticsPage onNavigate={handleNavigate} />
                  )}
                  {currentView === 'privacy-policy' && <LegalPage type="privacy" />}
                  {currentView === 'terms' && <LegalPage type="terms" />}
                  {currentView === 'dev-motion' && <DevMotionPage />}
                </PageTransition>
              </main>

              <Footer onNavigate={handleNavigate} />
              <MobileActionBar currentView={currentView} onNavigate={handleNavigate} />
            </>
          ) : (
            <AdminLayout
              currentTab={adminTab}
              onNavigateTab={handleAdminTabNavigate}
              onExitAdmin={() => handleNavigate('home')}
            >
              {adminTab === 'dashboard' && <AdminDashboard onNavigateTab={handleAdminTabNavigate} />}
              {adminTab === 'bookings' && <AdminBookings />}
              {adminTab === 'technician-view' && <AdminTechnicianView />}
              {adminTab === 'quotes' && <AdminQuotes />}
              {adminTab === 'invoices' && <AdminInvoices />}
              {adminTab === 'customers' && <AdminCustomers />}
              {adminTab === 'inquiries' && <AdminInquiries onNavigateTab={handleAdminTabNavigate} />}
              {adminTab === 'staff' && <AdminStaff />}
              {adminTab === 'services' && <AdminServices />}
              {adminTab === 'reviews' && <AdminReviews />}
              {adminTab === 'data-requests' && <AdminDataRequests />}
              {adminTab === 'settings' && <AdminSettings />}
              {adminTab === 'audit-logs' && <AdminAuditLogs />}
            </AdminLayout>
          )}
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}
