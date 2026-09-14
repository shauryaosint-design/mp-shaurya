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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const events = db.collection('events');

    if (req.method === 'GET') {
      const docs = await events.find({}).sort({ date: -1 }).toArray();
      const formatted = docs.map(e => ({
        id: e._id.toString(),
        title: e.title,
        category: e.category,
        date: e.date,
        status: e.status,
        desc: e.desc,
        link: e.link || ''
      }));
      return res.status(200).json(formatted);
    }

    if (req.method === 'POST') {
      const { title, category, date, status, desc, link } = req.body || {};
      if (!title || !date || !desc) {
        return res.status(400).json({ error: 'title, date and desc are required' });
      }
      const doc = {
        title,
        category: category || 'Other',
        date,
        status: status || 'upcoming',
        desc,
        link: link || ''
      };
      const result = await events.insertOne(doc);
      return res.status(201).json({
        id: result.insertedId.toString(),
        ...doc
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
