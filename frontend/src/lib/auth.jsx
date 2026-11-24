import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler, token } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [checked, setChecked] = useState(!token.get());
    const navigate = useNavigate();

    const signOutLocal = useCallback(() => {
        token.set(null);
        setUser(null);
        navigate('/admin/connexion', { replace: true });
    }, [navigate]);

    useEffect(() => setUnauthorizedHandler(signOutLocal), [signOutLocal]);

    useEffect(() => {
        if (!token.get()) return;
        api.get('/api/admin/me').then((r) => setUser(r.user)).catch(() => token.set(null)).finally(() => setChecked(true));
    }, []);

    const value = useMemo(() => ({
        user,
        checked,
        isLoggedIn: !!token.get(),
        signIn({ token: t, user: u }) { token.set(t); setUser(u); setChecked(true); },
        async signOut() {
            try { await api.post('/api/admin/logout'); } catch { /* jeton déjà expiré */ }
            signOutLocal();
        },
    }), [user, checked, signOutLocal]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
