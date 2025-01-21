import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'reset';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Z]/.test(pass)) return 'La contraseña debe incluir al menos una mayúscula';
    if (!/[a-z]/.test(pass)) return 'La contraseña debe incluir al menos una minúscula';
    if (!/[0-9]/.test(pass)) return 'La contraseña debe incluir al menos un número';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const passwordError = validatePassword(password);
        if (passwordError) {
          setError(passwordError);
          return;
        }

        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
        setResetSent(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (mode === 'reset' && resetSent) {
      return (
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Correo enviado</h3>
          <p className="text-gray-600 mb-4">
            Si existe una cuenta con este correo, recibirás instrucciones para restablecer tu contraseña.
          </p>
          <button
            onClick={() => setMode('login')}
            className="text-blue-500 hover:text-blue-600"
          >
            Volver al inicio de sesión
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {mode !== 'reset' && (
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 
            mode === 'login' ? 'Iniciar sesión' :
            mode === 'register' ? 'Registrarse' :
            'Enviar correo de recuperación'}
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {mode === 'login' ? 'Iniciar sesión' :
           mode === 'register' ? 'Crear cuenta' :
           'Recuperar contraseña'}
        </h2>

        {renderForm()}

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' ? (
            <>
              <button
                onClick={() => setMode('reset')}
                className="text-blue-500 hover:text-blue-600 block w-full"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                onClick={() => setMode('register')}
                className="text-blue-500 hover:text-blue-600 block w-full"
              >
                ¿No tienes cuenta? Regístrate
              </button>
            </>
          ) : (
            <button
              onClick={() => setMode('login')}
              className="text-blue-500 hover:text-blue-600"
            >
              {mode === 'register' ? '¿Ya tienes cuenta? Inicia sesión' : 'Volver al inicio de sesión'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}