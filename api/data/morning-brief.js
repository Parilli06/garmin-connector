const { GarminConnect } = require('garmin-connect')

module.exports = async function handler(req, res) {
    if (req.query.token !== process.env.API_TOKEN) {
          return res.status(401).json({ error: 'Unauthorized' })
    }

    const date = req.query.date || new Date().toISOString().split('T')[0]

    try {
        const garmin = new GarminConnect({ username: process.env.GARMIN_EMAIL, password: process.env.GARMIN_PASSWORD })
                await garmin.login()
      const dateObj = new Date(date + 'T12:00:00')

              const safeCall = async (fn) => { try { return await fn() } catch(e) { console.log('Garmin call failed:', e.message); return null } }
                const sleep = await safeCall(() => garmin.getSleepData(dateObj))
                const battery = await safeCall(() => garmin.getBodyBattery(dateObj))
                const hrv = null // getHrvData not available in garmin-connect v1.6.2

        
      res.json({
              sleep_score: sleep?.dailySleepDTO?.sleepScores?.overall?.value ?? null,
              hrv: hrv?.hrvSummary?.lastNight ?? null,
              body_battery: Array.isArray(battery) ? (battery[battery.length - 1]?.charged ?? null) : null,
              training_readiness: sleep?.dailySleepDTO?.trainingReadinessScore ?? null,
              training_status: null,
      })
    } catch (e) {
          console.error('Garmin error:', e.message)
          res.status(500).json({ error: e.message })
    }
}
