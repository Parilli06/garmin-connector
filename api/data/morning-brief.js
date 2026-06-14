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

    const trainingReadiness = await safeCall(() =>
      garmin.get(`https://connectapi.garmin.com/metrics-service/metrics/trainingreadiness/${date}`)
    )
    const trainingStatus = await safeCall(() =>
      garmin.get(`https://connectapi.garmin.com/metrics-service/metrics/trainingstatus/aggregated/${date}`)
    )

    const sleepBodyBattery = sleep?.sleepBodyBattery
    const bodyBatteryAtWakeup = sleepBodyBattery?.length > 0
      ? sleepBodyBattery[sleepBodyBattery.length - 1]?.value ?? null
      : null

    res.json({
      sleep_score: sleep?.dailySleepDTO?.sleepScores?.overall?.value ?? null,
      hrv: sleep?.avgOvernightHrv ?? null,
      body_battery: bodyBatteryAtWakeup,
      training_readiness: trainingReadiness?.metricsTrainingReadinessDTO?.trainingReadinessScore
        ?? trainingReadiness?.trainingReadinessScore ?? null,
      training_status: trainingStatus?.metricsTrainingStatusDTO?.trainingStatusFeedback
        ?? trainingStatus?.trainingStatus ?? null,
    })
  } catch (e) {
    console.error('Garmin error:', e.message)
    res.status(500).json({ error: e.message })
  }
}
