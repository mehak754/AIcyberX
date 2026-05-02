const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aicyberx';

mongoose.connect(MONGO_URI)
  .then(() => console.log(' MongoDB connected →', MONGO_URI.replace(/:([^:@]+)@/, ':<HIDDEN>@')))
  .catch(err => {
    console.error('\nMongoDB connection FAILED:', err.message);
    console.error(' Fix: Go to https://cloud.mongodb.com → Database Access → Edit user → Reset password → Update .env MONGO_URI\n');
  });


const toJSONOpts = {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; return ret; },
};

const studentSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, unique: true, required: true, lowercase: true, trim: true },
  phone:         { type: String, default: null },
  institution:   { type: String, default: null },
  grade:         { type: String, default: null },
  city:          { type: String, default: null },
  password_hash: { type: String, required: true },
  avatar_color:  { type: String, default: '#00d4ff' },
  bio:           { type: String, default: null },
  last_login:    { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: toJSONOpts,
});


const workshopSchema = new mongoose.Schema({
  title:             { type: String, required: true },
  description:       { type: String, default: null },
  date:              { type: String, default: null },
  time:              { type: String, default: null },
  location:          { type: String, default: null },
  image_url:         { type: String, default: '/assets/images/workshop-placeholder.jpg' },
  category:          { type: String, default: 'ai', enum: ['ai', 'cyber', 'competition'] },
  tags:              { type: String, default: null },
  seats_total:       { type: Number, default: 50 },
  seats_filled:      { type: Number, default: 0 },
  registration_link: { type: String, default: null },
  is_active:         { type: Boolean, default: true },
  is_featured:       { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: toJSONOpts,
});


const registrationSchema = new mongoose.Schema({
  student_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  workshop_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
  status:         { type: String, default: 'confirmed' },
  registered_at:  { type: Date, default: Date.now },
}, { toJSON: toJSONOpts });

registrationSchema.index({ student_id: 1, workshop_id: 1 }, { unique: true });


const contactMessageSchema = new mongoose.Schema({
  name:    { type: String },
  email:   { type: String },
  phone:   { type: String, default: null },
  school:  { type: String, default: null },
  message: { type: String },
  type:    { type: String, default: 'general' },
  status:  { type: String, default: 'new' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: toJSONOpts,
});


const communityJoinSchema = new mongoose.Schema({
  name:  { type: String },
  email: { type: String },
  phone: { type: String, default: null },
  city:  { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: toJSONOpts,
});


const Student       = mongoose.model('Student', studentSchema);
const Workshop      = mongoose.model('Workshop', workshopSchema);
const Registration  = mongoose.model('Registration', registrationSchema);
const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
const CommunityJoin = mongoose.model('CommunityJoin', communityJoinSchema);

async function seedWorkshops() {
  const count = await Workshop.countDocuments();
  if (count > 0) return;

  await Workshop.insertMany([
    {
      title: 'Intro to AI & Machine Learning',
      description: 'Discover how AI thinks! Hands-on session covering neural networks, image recognition, and voice AI demos. No coding experience needed.',
      date: '2024-07-15', time: '10:00 AM', location: 'Online / Zoom',
      category: 'ai', tags: 'beginner,ai,ml', seats_total: 60, is_featured: true,
    },
    {
      title: 'Cybersecurity Awareness Bootcamp',
      description: 'Learn how hackers think! Password cracking demos, phishing simulations, and how to protect yourself online.',
      date: '2024-07-22', time: '11:00 AM', location: 'Online / Zoom',
      category: 'cyber', tags: 'cyber,hacking,awareness', seats_total: 50, is_featured: true,
    },
    {
      title: 'AI Image Generation Workshop',
      description: 'Create stunning AI art! Explore tools like Stable Diffusion and DALL-E. Perfect for creative students.',
      date: '2024-08-05', time: '3:00 PM', location: 'Online / Zoom',
      category: 'ai', tags: 'ai,image,creative', seats_total: 40, is_featured: false,
    },
    {
      title: 'Ethical Hacking for Beginners',
      description: 'Understand the fundamentals of cybersecurity. Learn how networks work and common attack vectors in a safe environment.',
      date: '2024-08-12', time: '2:00 PM', location: 'Online / Zoom',
      category: 'cyber', tags: 'cyber,hacking,network', seats_total: 35, is_featured: false,
    },
    {
      title: 'AIcyberX Summer Tech Challenge',
      description: 'Annual innovation competition combining AI creativity and cybersecurity awareness. Prizes, certificates, and recognition for winners!',
      date: '2024-08-20', time: '9:00 AM', location: 'Online',
      category: 'competition', tags: 'competition,ai,cyber,prize', seats_total: 100, is_featured: true,
    },
    {
      title: 'Voice AI & NLP Hands-on Session',
      description: 'Build your own voice assistant! Explore Natural Language Processing, chatbots, and real-time voice cloning demos.',
      date: '2024-09-02', time: '4:00 PM', location: 'Online / Zoom',
      category: 'ai', tags: 'ai,voice,nlp,chatbot', seats_total: 45, is_featured: false,
    },
  ]);
  console.log(' Sample workshops seeded');
}

// Run seed after connection is ready
mongoose.connection.once('open', () => {
  seedWorkshops().catch(console.error);
});

module.exports = { Student, Workshop, Registration, ContactMessage, CommunityJoin };
