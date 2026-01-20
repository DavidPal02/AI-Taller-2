
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface VerifySuccessProps {
    onNavigateHome: () => void;
}

export const VerifySuccess: React.FC<VerifySuccessProps> = ({ onNavigateHome }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[80px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-700 p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                    className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-500/30"
                >
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                </motion.div>

                <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
                    ¡Perfil Verificado!
                </h1>

                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                    Has confirmado correctamente tu correo electrónico. Ahora tienes acceso completo a Taller Peter.
                </p>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNavigateHome}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all"
                >
                    Iniciar Sesión / Inicio
                    <ArrowRight className="w-5 h-5" />
                </motion.button>
            </motion.div>

            <footer className="absolute bottom-8 text-slate-600 text-sm font-medium">
                Taller Peter SaaS &copy; 2026
            </footer>
        </div>
    );
};
