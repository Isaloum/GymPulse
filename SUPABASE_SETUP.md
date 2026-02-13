# 🔧 Supabase Setup Instructions

## Step 1: Get Your Supabase Anon Key

1. Go to [Supabase Dashboard](https://app.supabase.com/project/swkqwqtgbxymyhcnhmfv/settings/api)
2. Copy your **anon/public** key (starts with `eyJ...`)
3. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

4. Edit `.env` and paste your anon key:

```env
VITE_SUPABASE_URL=https://swkqwqtgbxymyhcnhmfv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 2: Run Database Schema

1. Go to [SQL Editor](https://app.supabase.com/project/swkqwqtgbxymyhcnhmfv/sql/new)
2. Copy the entire contents of `supabase-schema.sql`
3. Paste and click **Run**
4. Verify tables created under Table Editor

## Step 3: Import Gym Data (Optional)

Run this SQL to add your Quebec gyms to the database:

```sql
INSERT INTO gyms (id, brand, name, province, city, latitude, longitude, capacity, has_iot_sensor) VALUES
('world-gym-laval', 'World Gym', 'World Gym Québec - Laval', 'Quebec', 'Laval', 45.5802, -73.7340, 150, false),
('energie-cardio-mtl', 'Énergie Cardio', 'Énergie Cardio - Montreal Downtown', 'Quebec', 'Montreal', 45.5017, -73.5673, 200, false),
('nautilus-plus-quebec', 'Nautilus Plus', 'Nautilus Plus - Quebec City', 'Quebec', 'Quebec City', 46.8139, -71.2080, 120, false);
-- Add more gyms from your gymsDatabase.js
```

## Step 4: Test the Integration

```bash
npm run dev
```

The app will now:
- ✅ Store check-ins in Supabase (visible to all users)
- ✅ Support real IoT sensor data when available
- ✅ Fall back to simulated data for gyms without sensors
- ✅ Enable real community stats across users

## IoT Sensor Integration

To push sensor data from your ESP32/Raspberry Pi:

```javascript
// Example: Post sensor reading from IoT device
const response = await fetch('YOUR_SUPABASE_FUNCTION_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'YOUR_SERVICE_KEY'
  },
  body: JSON.stringify({
    gym_id: 'world-gym-laval',
    occupancy_count: 42,
    sensor_type: 'occupancy_sensor'
  })
});
```

## Next Steps

1. Update `src/App.jsx` to use Supabase queries instead of mock data
2. Add real-time subscriptions for live updates
3. Deploy IoT sensors at partner gyms
4. Monitor usage in Supabase Dashboard

---

**Need help?** Check [Supabase Docs](https://supabase.com/docs) or the project README.
