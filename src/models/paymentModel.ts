import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
      userId: { type: Number, required: true },
    utr: { type: String, required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    screenshotUrl: { type: String, required: true },
    status: { type: String, default: 'paid' },
    paymentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
