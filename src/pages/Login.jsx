import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Phone, User, KeyRound, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';

export default function Login() {
  const [step, setStep] = useState(1); 
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      });
    }
  }, []);

  const requestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formattedPhone = `+63${phone}`;

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      setStep(2); 
    } catch (err) {
      console.error(err);
      setError('Failed to send SMS. Make sure you use a whitelisted test number.');
      if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await window.confirmationResult.confirm(otp);
      if (name) await updateProfile(result.user, { displayName: name });

      localStorage.setItem('omniCellAuth', 'true');
      localStorage.setItem('omniCellUser', result.user.displayName || 'Engineer');
      navigate('/');
    } catch (err) {
      setError('Invalid Access Code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></motion.div>
      <motion.div animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity }} className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></motion.div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 z-10">
        
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-500 rounded-xl mb-4 shadow-lg shadow-blue-500/50">
            {step === 1 ? <Activity size={32} className="text-white" /> : <ShieldCheck size={32} className="text-white" />}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">JAHS-Site-Tracker</h1>
          <p className="text-blue-200 text-sm mt-1">{step === 1 ? 'Telecom Engineering Portal' : 'Secure Verification'}</p>
        </div>

        {error && <p className="text-red-400 text-sm text-center font-bold bg-red-900/30 p-2 rounded-lg border border-red-500/50 mb-4">{error}</p>}

        {step === 1 && (
          <form onSubmit={requestOTP} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="text" placeholder="e.g. John Patrick" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500" />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1 block">Mobile Number</label>
              <div className="relative flex items-center bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-inner">
                <div className="flex items-center pl-4 pr-3 py-3 bg-slate-800/80 text-slate-400 border-r border-slate-700">
                  <Phone size={18} className="mr-2 text-slate-500" />
                  <span className="font-bold text-white tracking-wider">+63</span>
                </div>
                <input required type="tel" maxLength="10" placeholder="9123456789" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="w-full bg-transparent text-white px-4 py-3 outline-none tracking-widest font-mono placeholder:text-slate-600" />
              </div>
            </div>

            <div id="recaptcha-container"></div>

            <button type="submit" disabled={isLoading || phone.length < 10} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 mt-6 flex justify-center items-center gap-2">
              {isLoading ? 'Connecting...' : 'Send Access Code'} <ChevronRight size={20} />
            </button>
          </form>
        )}

        {step === 2 && (
          <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={verifyOTP} className="space-y-5">
            <p className="text-slate-300 text-sm text-center mb-6">We sent a 6-digit code to <span className="font-bold text-white">+63 {phone}</span>.</p>
            
            <div>
              <label className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1 block">6-Digit Access Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="text" maxLength="6" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500 tracking-[0.5em] font-mono font-bold text-center text-lg" />
              </div>
            </div>

            <button type="submit" disabled={isLoading || otp.length !== 6} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/30 active:scale-95 mt-6 flex justify-center items-center gap-2">
              {isLoading ? 'Verifying...' : 'Verify & Enter Portal'} <ChevronRight size={20} />
            </button>
            
            <button type="button" onClick={() => {setStep(1); setOtp('');}} className="w-full text-slate-400 hover:text-white text-sm mt-4 transition-colors">Wrong number? Go back.</button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}