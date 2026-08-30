const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const mongoURI = 'mongodb+srv://nanhe9141singh_db_user:T3GWqfKAIrYN7HB9@cluster0.ehnp1ld.mongodb.net/desiadda?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => console.log('🎉 MongoDB Cloud connected successfully!'))
  .catch((err) => console.log('❌ Database error:', err));

const userSchema = new mongoose.Schema({
    emailOrMobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dob: { type: String, required: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    bio: { type: String, default: "DesiAdda par mera swagat hai!" },
    websiteLink: { type: String, default: "" },
    profilePic: { type: String, default: "https://i.pravatar.cc/150" },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    followers: [{ type: String }],
    following: [{ type: String }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
});
const User = mongoose.model('User', userSchema);

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "Super-Admin" }
});
const Admin = mongoose.model('Admin', adminSchema);

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, default: "Romance" },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Book = mongoose.model('Book', bookSchema);

const confessionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    audioUrl: { type: String, default: "" },
    mode: { type: String, default: "Party Mode" },
    isAnonymous: { type: Boolean, default: false },
    author: { type: String, default: "Anonymous" },
    likes: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});
const Confession = mongoose.model('Confession', confessionSchema);

const pollSchema = new mongoose.Schema({
    question: { type: String, required: true },
    option1: { type: String, required: true },
    option2: { type: String, required: true },
    votes1: [{ type: String }],
    votes2: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});
const Poll = mongoose.model('Poll', pollSchema);

const brandingSchema = new mongoose.Schema({
    siteName: { type: String, default: "DesiAdda" },
    logoUrl: { type: String, default: "" }
});
const Branding = mongoose.model('Branding', brandingSchema);

const otpStorage = {};

async function initSystem() {
    if(!await Admin.findOne({ username: "admin" })) {
        await new Admin({ username: "admin", password: "admin123", role: "Super-Admin" }).save();
    }
    if(!await Branding.findOne()) {
        await new Branding({ siteName: "DesiAdda", logoUrl: "" }).save();
    }
}
initSystem();

app.post('/send-otp', async (req, res) => {
    try {
        const { emailOrMobile, username } = req.body;
        if (username && await User.findOne({ username })) return res.status(400).json({ message: "Username pehle se maujood hai!" });
        if (await User.findOne({ emailOrMobile })) return res.status(400).json({ message: "Ye Email/Mobile pehle se registered hai!" });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStorage[emailOrMobile] = { otp, userData: req.body };
        res.json({ message: "OTP generated successfully!", mockOtp: otp });
    } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

app.post('/verify-otp', async (req, res) => {
    try {
        const { emailOrMobile, otp } = req.body;
        const record = otpStorage[emailOrMobile];
        if (!record || record.otp !== otp) return res.status(400).json({ message: "Galat OTP!" });
        record.userData.password = await bcrypt.hash(record.userData.password, 10);
        await new User(record.userData).save();
        delete otpStorage[emailOrMobile];
        res.json({ success: true, message: "Account successfully ban gaya!" });
    } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ $or: [{ username }, { emailOrMobile: username }] });
        if (!user || user.isSuspended) return res.status(401).json({ message: "Galat details ya account suspended hai!" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) res.json({ success: true, username: user.username });
        else res.status(401).json({ message: "Galat Password!" });
    } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if(admin && admin.password === password) res.json({ success: true, username: admin.username });
    else res.status(401).json({ success: false, message: "Galat Admin credentials!" });
});

app.get('/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password').populate('savedPosts');
        res.json(user);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.post('/profile/update', async (req, res) => {
    try {
        const { oldUsername, newUsername, name, bio, websiteLink, profilePic } = req.body;
        if(newUsername && newUsername !== oldUsername) {
            if(await User.findOne({ username: newUsername })) return res.status(400).json({ message: "Yeh username pehle se liya gaya hai!" });
        }
        await User.findOneAndUpdate({ username: oldUsername }, { ...(newUsername && { username: newUsername }), name, bio, websiteLink, profilePic });
        res.json({ success: true, newUsername: newUsername || oldUsername });
    } catch (e) { res.status(500).json({ message: "Error updating profile" }); }
});

app.get('/books', async (req, res) => { res.json(await Book.find().sort({ createdAt: -1 })); });
app.post('/books', async (req, res) => { await new Book(req.body).save(); res.json({ success: true }); });

app.get('/confessions', async (req, res) => { res.json(await Confession.find().sort({ createdAt: -1 })); });
app.post('/confessions', async (req, res) => { await new Confession(req.body).save(); res.json({ success: true }); });

app.get('/polls', async (req, res) => { res.json(await Poll.find().sort({ createdAt: -1 })); });
app.post('/polls', async (req, res) => { await new Poll(req.body).save(); res.json({ success: true }); });

app.get('/branding', async (req, res) => {
    const brand = await Branding.findOne();
    res.json(brand || { siteName: "DesiAdda", logoUrl: "" });
});
app.post('/branding', async (req, res) => {
    const { siteName, logoUrl } = req.body;
    await Branding.findOneAndUpdate({}, { siteName, logoUrl }, { upsert: true, new: true });
    res.json({ success: true });
});

server.listen(3000, () => { console.log('🚀 Server 3000 port par live hai!'); });