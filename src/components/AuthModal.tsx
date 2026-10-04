"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Apple, CheckCircle2 } from "lucide-react";
import { synth } from "./AudioEngine";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
  targetModuleName?: string;
}

export default function AuthModal({ isOpen, onClose, onSuccess, targetModuleName }: AuthModalProps) {
  const handleAuth = (provider: string) => {
    synth.playClick();
    onSuccess(`learner@${provider.toLowerCase()}.com`);
    synth.playSuccess();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
            className="relative w-full max-w-md border border-vidya-border bg-vidya-surface-raised/90 p-8 rounded-xl shadow-2xl backdrop-blur-xl z-10 overflow-hidden"
          >
            {/* Top Brand Stripe */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-vidya-warm-arc" />

            {/* Close Button */}
            <button
              onClick={() => {
                synth.playClick();
                onClose();
              }}
              className="absolute top-4 right-4 p-2 text-vidya-text-muted hover:text-vidya-text transition-colors rounded-lg hover:bg-vidya-surface"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title & Context */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-vidya-accent/10 text-vidya-accent rounded-full mb-4 border border-vidya-accent/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-bold text-vidya-text tracking-wide">
                Unlock Module
              </h2>
              {targetModuleName && (
                <p className="mt-2 text-xs font-mono text-vidya-accent uppercase tracking-wider">
                  {targetModuleName}
                </p>
              )}
              <p className="mt-3 text-sm text-vidya-text-muted leading-relaxed">
                Connect your account to gain free access to JEE & GATE advanced concept trees, and preserve your performance metrics.
              </p>
            </div>

            {/* Providers */}
            <div className="space-y-3">
              {/* Google */}
              <button
                onClick={() => handleAuth("Google")}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 border border-vidya-border bg-vidya-surface hover:bg-vidya-surface-raised transition-all rounded-lg text-vidya-text hover:border-vidya-text-muted cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.53 5.53 0 0 1 8.44 13a5.53 5.53 0 0 1 5.55-5.514c1.454 0 2.775.526 3.82 1.39l3.15-3.15C18.964 3.791 16.54 2.886 14 2.886c-5.514 0-10 4.486-10 10s4.486 10 10 10c5.514 0 10-4.486 10-10 0-.685-.064-1.357-.186-2.6H12.24Z" />
                </svg>
                <span className="font-medium text-sm">Continue with Google</span>
              </button>

              {/* Apple */}
              <button
                onClick={() => handleAuth("Apple")}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 border border-vidya-border bg-vidya-surface hover:bg-vidya-surface-raised transition-all rounded-lg text-vidya-text hover:border-vidya-text-muted cursor-pointer active:scale-[0.99]"
              >
                <Apple className="w-5 h-5" />
                <span className="font-medium text-sm">Continue with Apple</span>
              </button>

              {/* Meta */}
              <button
                onClick={() => handleAuth("Meta")}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 border border-vidya-border bg-vidya-surface hover:bg-vidya-surface-raised transition-all rounded-lg text-vidya-text hover:border-vidya-text-muted cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="font-medium text-sm">Continue with Meta</span>
              </button>
            </div>

            {/* Consent Policy */}
            <div className="mt-6 text-center text-xs text-vidya-text-muted">
              By authenticating, you agree to Agni Labs&apos;{" "}
              <a href="#" className="underline hover:text-vidya-accent transition-colors">Terms of Service</a> and{" "}
              <a href="#" className="underline hover:text-vidya-accent transition-colors">Privacy Policy</a>.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
