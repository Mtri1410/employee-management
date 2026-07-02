import React from 'react';
import { useApp } from '../context/AppContext';
import { HelpCircle, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function CustomDialog() {
  const { modalDialog, closeDialog } = useApp();

  if (!modalDialog.isOpen) return null;

  const getIcon = () => {
    switch (modalDialog.type) {
      case 'success':
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/5 animate-pulse">
            <CheckCircle className="w-6 h-6" />
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/5 animate-pulse">
            <XCircle className="w-6 h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/5 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'confirm':
        return (
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/5">
            <HelpCircle className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/5">
            <Info className="w-6 h-6" />
          </div>
        );
    }
  };

  const handleConfirm = () => {
    if (modalDialog.onConfirm) {
      modalDialog.onConfirm();
    }
    closeDialog();
  };

  const handleCancel = () => {
    if (modalDialog.onCancel) {
      modalDialog.onCancel();
    }
    closeDialog();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-4">
      {/* Modal Dialog Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Glow accent effect */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-teal-500/10 blur-2xl rounded-full pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-4">
          
          {/* Header Icon */}
          {getIcon()}

          {/* Title */}
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-200 leading-snug">
              {modalDialog.title}
            </h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-line px-2">
              {modalDialog.message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full pt-4 flex gap-3 justify-center">
            {modalDialog.type === 'confirm' ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl transition border border-slate-750 font-bold text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/15 transition text-xs"
                >
                  Xác nhận
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={closeDialog}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/15 transition text-xs"
              >
                Đồng ý (OK)
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
