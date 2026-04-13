import mongoose from 'mongoose';

const navHistorySchema = new mongoose.Schema({
  schemeCode: {
    type: String,
    required: true,
  },
  schemeName: {
    type: String,
    required: true,
  },
  date: {
    type: String, // Format: "05-Jun-2025"
    required: true,
  },
  nav: {
    type: Number,
    required: true,
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.NavHistory ||
  mongoose.model('NavHistory', navHistorySchema);
