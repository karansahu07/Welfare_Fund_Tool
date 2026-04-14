'use client';

import { useState, useEffect } from 'react';
import { CloudUpload, CalendarDays } from 'lucide-react';
import CryptoJS from 'crypto-js';

export default function PaymentPage() {
  const [utrId, setUtrId] = useState('');
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [paymentDate, setPaymentDate] = useState(today);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }

    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
    }

    // 🔐 Decrypt if data is encrypted
    const encryptedData = localStorage.getItem('user');
    if (encryptedData) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, 'your-secret-key');
        const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

        const extractedName = decrypted?.auth?.user?.username;
        const extractedEmail = decrypted?.auth?.user?.email;
        const extractedId = decrypted?.auth?.user?._id;

        if (extractedName) setUserName(extractedName);
        if (extractedEmail) setUserEmail(extractedEmail);
        if (extractedId) setUserId(extractedId);
      } catch (error) {
        console.error('Failed to decrypt user data:', error);
      }
    }
  }, []);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!screenshot) {
      alert('Please upload a screenshot before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('utr', utrId);
    formData.append('name', userName || 'Anonymous');
    formData.append('email', userEmail || 'anonymous@example.com');
    formData.append('userId', userId || '');
    formData.append('amount', amount);
    formData.append('paymentDate', paymentDate);
    formData.append('screenshot', screenshot);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        if (data.navStatus === 'allocated') {
          alert(`Payment saved! ✅\nUnits allocated: ${Number(data.unitsAllocated).toFixed(4)}\nNAV used: ₹${data.navUsed} (${data.navDate})`);
        } else {
          alert("Payment saved! ⏳\nNo NAV available for the selected date. Units will be allocated once NAV data is available.");
        }
        setUtrId('');
        setAmount('');
        setScreenshot(null);
        setPreview(null);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-white to-purple-200 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-90 backdrop-blur-md shadow-xl rounded-2xl px-10 pt-8 pb-10 w-full max-w-2xl"
      >
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-800 drop-shadow">
          💳 UTR / Payment Submission
        </h2>

        {/* Payment Date Picker */}
        <div className="mb-6">
          <label className="block text-lg text-gray-700 font-semibold mb-2">
            <CalendarDays className="inline-block mr-2 text-blue-500" size={20} />
            Payment Date
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            max={today}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 text-base"
            required
          />
          {paymentDate !== today && (
            <p className="text-sm text-amber-600 mt-1">⚠️ You are submitting for a past date: {new Date(paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          )}
        </div>

        {/* UTR Input */}
        <div className="mb-6">
          <label className="block text-lg text-gray-700 font-semibold mb-2">
            UTR / Payment ID
          </label>
          <input
            type="text"
            value={utrId}
            onChange={(e) => setUtrId(e.target.value)}
            placeholder="e.g. 123456789XYZ"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 text-base"
            required
          />
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="block text-lg text-gray-700 font-semibold mb-2">
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 1000"
            min="1"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 text-base"
            required
          />
        </div>

        {/* Screenshot Upload */}
        <div className="mb-6">
          <label className="block text-lg text-gray-700 font-semibold mb-2">
            Upload Payment Screenshot
          </label>

          <label className="flex flex-col items-center justify-center w-full h-48 bg-gray-50 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:bg-blue-50 transition">
            <CloudUpload size={40} className="text-blue-500 mb-2" />
            <span className="text-sm text-gray-600">Click or drag image here</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotChange}
              className="hidden"
              required
            />
          </label>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-6">
            <p className="text-gray-600 mb-2 font-medium">Preview:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
              src={preview}
              alt="Payment Screenshot Preview"
              className="w-full max-h-96 object-contain rounded-lg border shadow-md"
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition text-lg shadow-md"
        >
          Submit Payment Details
        </button>
      </form>
    </div>
  );
}
