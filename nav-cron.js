import mongoose from 'mongoose';
import cron from 'node-cron';
import fetch from 'node-fetch';
import NavHistory from './models/NavHistory.js'; // Adjust path as needed

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected for NAV cron job');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

async function getNavAndSave() {
  const schemeCode = '122639';
  const url = `https://api.mfapi.in/mf/${schemeCode}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const latestNAV = data.data[0];

    await NavHistory.findOneAndUpdate(
      { schemeCode, date: latestNAV.date },
      {
        schemeCode,
        schemeName: data.meta.scheme_name,
        date: latestNAV.date,
        nav: parseFloat(latestNAV.nav),
      },
      { upsert: true, new: true }
    );

    console.log(`[${new Date().toLocaleTimeString()}] ✅ NAV Saved: ₹${latestNAV.nav}`);
  } catch (error) {
    console.error('❌ Error saving NAV:', error.message);
  }
}

// Schedule at 10:00 AM every day
cron.schedule('0 10 * * *', () => {
  console.log('⏱️ Running NAV fetch job...');
  getNavAndSave();
});
