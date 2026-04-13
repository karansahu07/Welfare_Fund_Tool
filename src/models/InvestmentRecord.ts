import mongoose from 'mongoose';

const investmentRecordSchema = new mongoose.Schema({
  userId: {
    type: Number, // numeric user_id from User model
    required: true,
  },
  schemeCode: {
    type: String,
    required: true,
  },
  unitsPurchased: {
    type: Number,
    required: true,
  },
  amountInvested: {
    type: Number,
    required: true,
  },
  navAtPurchase: {
    type: Number,
    required: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

export default mongoose.models.InvestmentRecord ||
  mongoose.model('InvestmentRecord', investmentRecordSchema);
