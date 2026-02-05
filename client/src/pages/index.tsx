import { useState } from 'react';
import { useLocation } from 'wouter';
import '../styles/effects.css';

/**
 * CHRONOS OSS - PUBLIC LAYER (A2.1)
 * "Access Denied" gate with TOTP authentication.
 */

export default function PublicLayer() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [, setLocation] = useLocation();

  const handleVerify = async () => {
    try {
      const response = await fetch('/api/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email: 'admin@chronos.ai' }) // Default admin for POC
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('sessionToken', data.token);
        setLocation('/private');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center font-mono overflow-hidden">
      <div className="scanlines absolute inset-0 pointer-events-none opacity-10" />
      <div className="vignette absolute inset-0 pointer-events-none" />
      
      <div className={`z-10 text-center space-y-8 ${error ? 'animate-glitch' : ''}`}>
        <h1 className="text-red-600 text-6xl font-bold tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
          ACCESS DENIED
        </h1>
        
        <div className="space-y-2">
          <p className="text-gray-500 text-xs tracking-[0.5em] uppercase">Security Clearance Required</p>
          <div className="w-64 h-px bg-red-900 mx-auto opacity-50" />
        </div>

        <div className="flex flex-col items-center space-y-4">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ENTER TOKEN"
            className="bg-transparent border border-red-900 text-red-500 text-center p-4 focus:outline-none focus:border-red-500 transition-all tracking-[1em] pl-[1.5em]"
          />
          <button
            onClick={handleVerify}
            className="text-red-900 hover:text-red-500 text-xs tracking-widest transition-colors uppercase"
          >
            Authenticate
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 text-[10px] text-gray-800 space-y-1">
        <p>TERMINAL: CHRONOS_V2_OSS</p>
        <p>ENCRYPTION: AES-256-GCM</p>
        <p>STATUS: MONITORING ACTIVE</p>
      </div>
    </div>
  );
}
