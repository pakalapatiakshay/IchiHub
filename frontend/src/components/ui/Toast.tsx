import { useToastStore } from '../../store/toastStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? XCircle : Info;
        const bgClass = toast.type === 'success'
          ? 'bg-semantic-success'
          : toast.type === 'error'
          ? 'bg-semantic-error'
          : 'bg-semantic-info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto ${bgClass} text-white px-5 py-4 rounded-2xl shadow-glass flex items-center gap-3 min-w-[300px] max-w-[400px] animate-toast-in backdrop-blur-sm`}
          >
            <Icon size={18} className="shrink-0 opacity-90" />
            <span className="flex-1 font-medium text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 hover:bg-white/20 rounded-xl p-1.5 transition-colors duration-150"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
