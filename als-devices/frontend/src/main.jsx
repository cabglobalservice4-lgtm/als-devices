import './css/app.css';

import { lazy, StrictMode, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ShopProvider, useShop } from '@/lib/shop';
import { AuthProvider } from '@/lib/auth';
import { api } from '@/lib/api';
import ApiPage from '@/lib/page';
import ShopLayout from '@/Layouts/ShopLayout';
import AdminLayout from '@/Layouts/AdminLayout';

// Chaque page est chargée à la demande : le premier affichage reste léger sur mobile
const Home = lazy(() => import('@/Pages/Home'));
const Catalog = lazy(() => import('@/Pages/Catalog/Index'));
const Product = lazy(() => import('@/Pages/Product/Show'));
const Cart = lazy(() => import('@/Pages/Cart'));
const Checkout = lazy(() => import('@/Pages/Checkout'));
const OrderConfirmation = lazy(() => import('@/Pages/OrderConfirmation'));
const Page = lazy(() => import('@/Pages/Page'));
const Invoice = lazy(() => import('@/Pages/Invoice'));
const Contact = lazy(() => import('@/Pages/Contact'));
const Login = lazy(() => import('@/Pages/Auth/Login'));
const Dashboard = lazy(() => import('@/Pages/Admin/Dashboard'));
const OrdersIndex = lazy(() => import('@/Pages/Admin/Orders/Index'));
const OrderShow = lazy(() => import('@/Pages/Admin/Orders/Show'));
const ProductsIndex = lazy(() => import('@/Pages/Admin/Products/Index'));
const ProductForm = lazy(() => import('@/Pages/Admin/Products/Form'));
const Import = lazy(() => import('@/Pages/Admin/Import'));
const Settings = lazy(() => import('@/Pages/Admin/Settings'));

const ShopShell = ({ children }) => <ShopLayout>{children}</ShopLayout>;
const BareShell = ({ children }) => <div className="min-h-screen bg-bone">{children}</div>;
const AdminShell = ({ children }) => <AdminLayout title="">{children}</AdminLayout>;

const get = (path) => ({ search }) => api.get(path + search);

function shop(component, load, extra = {}) {
    return <ApiPage component={component} load={load} shell={ShopShell} {...extra} />;
}
function admin(component, load, extra = {}) {
    return <ApiPage component={component} load={load} shell={AdminShell} {...extra} />;
}

function ScrollToTop() {
    const { pathname, state } = useLocation();
    useEffect(() => { if (!state?.keepScroll) window.scrollTo(0, 0); }, [pathname]);
    return null;
}

function App() {
    return (
        <>
            <ScrollToTop />
            <Suspense fallback={<div className="fixed inset-x-0 top-0 h-0.5 animate-pulse bg-als" />}>
                <Routes>
                    <Route path="/" element={shop(Home, get('/api/home'))} />
                    <Route path="/boutique" element={shop(Catalog, get('/api/catalog'))} />
                    <Route path="/boutique/:category" element={shop(Catalog, ({ params, search }) => api.get(`/api/catalog/${params.category}${search}`))} />
                    <Route path="/produit/:slug" element={shop(Product, ({ params }) => api.get(`/api/products/${params.slug}`))} />
                    <Route path="/panier" element={<CartPage />} />
                    <Route path="/commande" element={<CheckoutPage />} />
                    <Route path="/commande/:token" element={shop(OrderConfirmation, ({ params }) => api.get(`/api/orders/${params.token}`))} />
                    <Route path="/commande/:token/facture" element={<ApiPage component={Invoice} shell={BareShell} load={({ params }) => api.get(`/api/orders/${params.token}`)} />} />
                    <Route path="/page/:slug" element={shop(Page, ({ params }) => api.get(`/api/pages/${params.slug}`))} />
                    <Route path="/contact" element={<Contact />} />

                    <Route path="/admin/connexion" element={<Login />} />
                    <Route path="/admin" element={admin(Dashboard, get('/api/admin/dashboard'))} />
                    <Route path="/admin/commandes" element={admin(OrdersIndex, get('/api/admin/orders'))} />
                    <Route path="/admin/commandes/:id" element={admin(OrderShow, ({ params }) => api.get(`/api/admin/orders/${params.id}`), { remount: true })} />
                    <Route path="/admin/produits" element={admin(ProductsIndex, get('/api/admin/products'))} />
                    <Route path="/admin/produits/nouveau" element={admin(ProductForm, get('/api/admin/products/form'))} />
                    <Route path="/admin/produits/import" element={admin(Import, get('/api/admin/products/import'))} />
                    <Route path="/admin/produits/:id" element={admin(ProductForm, ({ params }) => api.get(`/api/admin/products/${params.id}`), { remount: true })} />
                    <Route path="/admin/reglages" element={admin(Settings, get('/api/admin/settings'))} />

                    <Route path="*" element={<ShopLayout><NotFound /></ShopLayout>} />
                </Routes>
            </Suspense>
        </>
    );
}

function CartPage() {
    const ctx = useShop();
    // Le panier est recalculé par l'API à chaque modification
    return <ApiPage component={Cart} shell={ShopShell} deps={[JSON.stringify(ctx.cart.items)]} load={() => api.post('/api/cart', { items: ctx.cart.items })} />;
}
function CheckoutPage() {
    const ctx = useShop();
    return (
        <ApiPage component={Checkout} shell={ShopShell} deps={[ctx.cart.count]}
            load={async () => {
                const [quote, options] = await Promise.all([api.post('/api/cart', { items: ctx.cart.items }), api.get('/api/checkout')]);
                const lines = quote.lines.filter((l) => l.available);
                return { ...options, lines, subtotal: quote.subtotal };
            }} />
    );
}

function NotFound() {
    return (
        <div className="container-als grid min-h-[50vh] place-items-center text-center">
            <div>
                <p className="h-display text-6xl">404<span className="text-als">.</span></p>
                <p className="mt-3 text-graphite">Cette page n'existe pas.</p>
                <a href="/" className="btn-ink mt-6">Retour à l'accueil</a>
            </div>
        </div>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <ShopProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ShopProvider>
        </BrowserRouter>
    </StrictMode>,
);
