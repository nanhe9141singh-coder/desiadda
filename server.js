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

const postSchema = new mongoose.Schema({
    username: { type: String, required: true },
    content: { type: String },
    image: { type: String },
    category: { type: String, default: "Desi" },
    likes: [{ type: String }],
    comments: [{ username: String, text: String, createdAt: { type: Date, default: Date.now } }],
    createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

const reelSchema = new mongoose.Schema({
    username: { type: String, required: true },
    videoUrl: { type: String, required: true },
    caption: { type: String },
    likes: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});
const Reel = mongoose.model('Reel', reelSchema);

const storySchema = new mongoose.Schema({
    username: { type: String, required: true },
    userPic: { type: String, required: true },
    image: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }
});
const Story = mongoose.model('Story', storySchema);

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

const otpStorage = {};

async function initSystem() {
    if(!await Admin.findOne({ username: "admin" })) {
        await new Admin({ username: "admin", password: "admin123", role: "Super-Admin" }).save();
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
        if (isMatch) {
            res.json({ success: true, username: user.username });
        } else {
            res.status(401).json({ message: "Galat Password!" });
        }
    } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

app.get('/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).populate('savedPosts');
        res.json(user);
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.post('/profile/update', async (req, res) => {
    try {
        const { oldUsername, newUsername, name, bio, websiteLink, profilePic } = req.body;
        await User.findOneAndUpdate({ username: oldUsername }, { username: newUsername, name, bio, websiteLink, profilePic });
        res.json({ success: true, newUsername });
    } catch (e) { res.status(500).json({ message: "Error" }); }
});

app.get('/posts', async (req, res) => {
    res.json(await Post.find().sort({ createdAt: -1 }));
});

app.post('/posts', async (req, res) => {
    await new Post(req.body).save();
    res.json({ success: true });
});

app.post('/posts/:id/like', async (req, res) => {
    const post = await Post.findById(req.params.id);
    const user = req.body.username;
    if(post.likes.includes(user)) post.likes.pull(user);
    else post.likes.push(user);
    await post.save();
    res.json({ success: true });
});

app.get('/reels', async (req, res) => {
    res.json(await Reel.find().sort({ createdAt: -1 }));
});

app.post('/reels', async (req, res) => {
    await new Reel(req.body).save();
    res.json({ success: true });
});

app.get('/stories', async (req, res) => {
    res.json(await Story.find().sort({ createdAt: -1 }));
});

app.post('/stories', async (req, res) => {
    await new Story(req.body).save();
    res.json({ success: true });
});

app.get('/messages/:u1/:u2', async (req, res) => {
    const msgs = await Message.find({ $or: [{ sender: req.params.u1, receiver: req.params.u2 }, { sender: req.params.u2, receiver: req.params.u1 }] }).sort({ createdAt: 1 });
    res.json(msgs);
});

server.listen(3000, () => {
    console.log('🚀 Server 3000 port par live hai!');
});