import { useState } from 'react';
import { CreditCard, Smartphone, Banknote, X, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useToastStore } from '../../store/toastStore';

// Add type declaration for Razorpay injected globally
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceName: string;
  providerName: string;
  baseAmount: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  serviceName,
  providerName,
  baseAmount,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cash'>('upi');
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const tipAmount = customTip ? parseFloat(customTip) || 0 : (baseAmount * tipPercentage) / 100;
  const totalAmount = baseAmount + tipAmount;

  const { addToast } = useToastStore();

  const handlePayment = async () => {
    if (paymentMethod === 'cash') {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onSuccess();
          onClose();
        }, 2000);
      }, 1000);
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create order on backend
      const order = await api<{ orderId: string; amount: number; currency: string }>('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount: totalAmount })
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: order.amount,
        currency: order.currency,
        name: "IchiHub Services",
        description: `Payment for ${serviceName}`,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on backend
            await api('/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            
            setIsProcessing(false);
            setIsSuccess(true);
            setTimeout(() => {
              setIsSuccess(false);
              onSuccess();
              onClose();
            }, 2000);
          } catch (error) {
            console.error('Payment verification failed:', error);
            addToast('Payment verification failed. Please contact support.', 'error');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: "Test User",
          email: "test@ichihub.com",
          contact: "9999999999"
        },
        theme: {
          color: "#FF5A1F" // brand-accent
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
        addToast(response.error.description || 'Payment failed', 'error');
        setIsProcessing(false);
      });
      rzp1.open();

    } catch (error) {
      console.error('Order creation failed:', error);
      addToast('Could not initialize payment. Please try again.', 'error');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500">Thank you for your payment to {providerName}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Complete Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-900">{serviceName}</p>
                <p className="text-xs text-gray-500">by {providerName}</p>
              </div>
              <p className="font-bold text-gray-900">₹{baseAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Tipping */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add a tip (Optional)</h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[0, 10, 15, 20].map((percent) => (
                <button
                  key={percent}
                  onClick={() => { setTipPercentage(percent); setCustomTip(''); }}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    tipPercentage === percent && !customTip
                      ? 'bg-brand-accent text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {percent === 0 ? 'None' : `${percent}%`}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Custom tip amount (₹)"
              value={customTip}
              onChange={(e) => {
                setCustomTip(e.target.value);
                setTipPercentage(0);
              }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
            />
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Method</h3>
            <div className="space-y-3">
              {/* UPI */}
              <label className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-brand-accent bg-brand-accentLight' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="payment_method" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="hidden" />
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <Smartphone size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">UPI / QR</p>
                  <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'upi' ? 'border-brand-accent' : 'border-gray-300'}`}>
                  {paymentMethod === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-brand-accent" />}
                </div>
              </label>

              {/* Card */}
              <label className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-brand-accent bg-brand-accentLight' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="payment_method" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="hidden" />
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                  <CreditCard size={20} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Credit / Debit Card</p>
                  <p className="text-xs text-gray-500">Visa, Mastercard, RuPay</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-brand-accent' : 'border-gray-300'}`}>
                  {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-brand-accent" />}
                </div>
              </label>

              {/* Cash */}
              <label className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-brand-accent bg-brand-accentLight' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="payment_method" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="hidden" />
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <Banknote size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay after service is done</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-brand-accent' : 'border-gray-300'}`}>
                  {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-brand-accent" />}
                </div>
              </label>
            </div>

            {/* Expanded details based on payment method */}
            {paymentMethod === 'upi' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
                <div className="w-32 h-32 bg-white border border-gray-200 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-xs text-gray-400 font-medium">QR Code Placeholder</span>
                </div>
                <p className="text-xs text-gray-500 text-center">Scan with any UPI app to pay</p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <input type="text" placeholder="Card Number" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent" />
                <div className="flex gap-3">
                  <input type="text" placeholder="MM/YY" className="w-1/2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent" />
                  <input type="text" placeholder="CVV" className="w-1/2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white mt-auto sticky bottom-0 z-10">
          <div className="flex justify-between items-end mb-4">
            <span className="text-sm font-medium text-gray-500">Total to Pay</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</span>
              {tipAmount > 0 && <p className="text-xs text-brand-accent font-medium">Includes ₹{tipAmount.toFixed(2)} tip</p>}
            </div>
          </div>
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full btn-primary py-3.5 text-base font-bold flex items-center justify-center gap-2"
          >
            {isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
