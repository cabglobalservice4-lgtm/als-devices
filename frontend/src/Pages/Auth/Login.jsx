import { Navigate, useLocation } from 'react-router-dom';
import { useForm, useRouter } from '@/lib/kit';
import { useAuth } from '@/lib/auth';
import Seo from '@/Components/Seo';
import Logo from '@/Components/Logo';
import { route } from '@/lib/routes';

export default function Login() {
    const auth = useAuth();
    const router = useRouter();
    const location = useLocation();
    const { data, setData, post, processing, errors } = useForm({ email: '', password: '' });
    if (auth.isLoggedIn) return <Navigate to={route('admin.dashboard')} replace />;
    return (
        <div className="grid min-h-screen place-items-center bg-ink p-4">
            <Seo title="Connexion" noindex />
            <form onSubmit={(e) => { e.preventDefault(); post(route('admin.login'), { silent: true, onSuccess: (res) => { auth.signIn(res); router.visit(location.state?.from || route('admin.dashboard')); } }); }} className="w-full max-w-sm rounded-3xl bg-white p-8">
                <Logo />
                <h1 className="mt-8 font-display text-3xl font-bold tracking-tight">Back-office</h1>
                <label className="mt-6 block"><span className="label">E-mail</span>
                    <input type="email" autoComplete="username" className="field" value={data.email} onChange={(e) => setData('email', e.target.value)} autoFocus />
                </label>
                {errors.email && <p className="error">{errors.email}</p>}
                <label className="mt-4 block"><span className="label">Mot de passe</span>
                    <input type="password" autoComplete="current-password" className="field" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                </label>
                <button disabled={processing} className="btn-red mt-6 w-full py-3.5">Se connecter</button>
            </form>
        </div>
    );
}
