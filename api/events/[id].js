const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('frommpgi');
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    const { db } = await connectToDatabase();
    const events = db.collection('events');

    if (req.method === 'GET') {
      const event = await events.findOne({ _id: new ObjectId(id) });
      if (!event) return res.status(404).json({ error: 'Event not found' });
      return res.status(200).json({
        id: event._id.toString(),
        title: event.title,
        category: event.category,
        date: event.date,
        status: event.status,
        desc: event.desc,
        link: event.link || ''
      });
    }

    if (req.method === 'PUT') {
      const { title, category, date, status, desc, link } = req.body || {};
      const result = await events.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { title, category, date, status, desc, link: link || '' } },
        { returnDocument: 'after' }
      );
      if (!result) return res.status(404).json({ error: 'Event not found' });
      return res.status(200).json({
        id: result._id.toString(),
        title: result.title,
        category: result.category,
        date: result.date,
        status: result.status,
        desc: result.desc,
        link: result.link || ''
      });
    }

    if (req.method === 'DELETE') {
      const result = await events.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Event not found' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
