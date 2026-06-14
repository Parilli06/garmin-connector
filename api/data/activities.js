const { GarminConnect } = require('garmin-connect')

module.exports = async function handler(req, res) {
  if (req.query.token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const date = req.query.date || new Date().toISOString().split('T')[0]
  try {
    const garmin = new GarminConnect({ username: process.env.GARMIN_EMAIL, password: process.env.GARMIN_PASSWORD })
    await garmin.login()
    const activities = await garmin.getActivities(0, 5)
    const dayActivities = activities.filter(a =>
      a.startTimeLocal && a.startTimeLocal.startsWith(date)
    )
    res.json(dayActivities)
  } catch (e) {
    console.error('Garmin activities error:', e.message)
    res.status(500).json({ error: e.message })
  }
}
