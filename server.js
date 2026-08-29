const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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
    isPrivate: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    verificationRequested: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    socketId: { type: String, default: null },
    followers: [{ type: String }],
    following: [{ type: String }],
    followRequests: [{ type: String }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    highlights: [{ title: String, image: String }]
});
const User = mongoose.model('User', userSchema);

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "Super-Admin" }
});
const Admin = mongoose.model('Admin', adminSchema);

const settingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true }
});
const Setting = mongoose.model('Setting', settingSchema);

const monetizationSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    price: { type: Number, default: 99 }
});
const MonetizationSetting = mongoose.model('MonetizationSetting', monetizationSchema);

const storyBookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String, default: "Desi Romance" },
    coverImage: { type: String, default: "https://picsum.photos/300/400" },
    synopsis: { type: String, required: true },
    chapters: [{ chapterNumber: Number, title: String, content: String }],
    likes: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});
const StoryBook = mongoose.model('StoryBook', storyBookSchema);

const postSchema = new mongoose.Schema({
    username: { type: String, required: true },
    content: { type: String },
    image: { type: String },
    category: { type: String, default: "Desi" },
    location: { type: String, default: "" },
    isArchived: { type: Boolean, default: false },
    isBoosted: { type: Boolean, default: false },
    pollQuestion: { type: String, default: "" },
    pollOptions: [{ text: String, votes: [{ type: String }] }],
    likes: [{ type: String }],
    comments: [{ 
        username: String, 
        text: String, 
        likes: [{ type: String }],
        replies: [{ username: String, text: String, createdAt: { type: Date, default: Date.now } }] 
    }], 
    createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

const confessionSchema = new mongoose.Schema({
    username: { type: String, default: "Anonymous" },
    text: { type: String, required: true },
    vibe: { type: String, default: "☕ Chill Vibe" },
    createdAt: { type: Date, default: Date.now }
});
const Confession = mongoose.model('Confession', confessionSchema);

const reelSchema = new mongoose.Schema({
    username: { type: String, required: true },
    videoUrl: { type: String, required: true },
    caption: { type: String },
    location: { type: String, default: "" },
    likes: [{ type: String }],
    comments: [{ username: String, text: String }],
    createdAt: { type: Date, default: Date.now }
});
const Reel = mongoose.model('Reel', reelSchema);

const storySchema = new mongoose.Schema({
    username: { type: String, required: true },
    userPic: { type: String, required: true },
    image: { type: String, required: true },
    caption: { type: String, default: "" },
    musicUrl: { type: String, default: "" },
    viewers: [{ type: String }],
    createdAt: { type: Date, default: Date.now, expires: 86400 } 
});
const Story = mongoose.model('Story', storySchema);

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    text: { type: String, required: true },
    imageUrl: { type: String, default: null },
    audioUrl: { type: String, default: null },
    sharedPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

const notificationSchema = new mongoose.Schema({
    recipient: { type: String, required: true },
    sender: { type: String, required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

const otpStorage = {}; 

async function initSystem() {
    let superAdmin = await Admin.findOne({ username: "admin" });
    if (!superAdmin) {
        await new Admin({ username: "admin", password: "admin123", role: "Super-Admin" }).save();
    }
    
    let adminUser = await User.findOne({ username: "admin" });
    if (!adminUser) {
        let hashedAdminPwd = await bcrypt.hash("admin123", 10);
        await new User({
            emailOrMobile: "admin@desiadda.com",
            password: hashedAdminPwd,
            dob: "2000-01-01",
            name: "DesiAdda Admin",
            username: "admin",
            bio: "Main is platform ka Super-Admin hoon!",
            isVerified: true
        }).save();
    }

    if(!await MonetizationSetting.findOne({ key: 'verifiedBadge' })) {
        await new MonetizationSetting({ key: 'verifiedBadge', enabled: false, price: 149 }).save();
    }
    
    let count = await StoryBook.countDocuments();
    if(count < 1000) {
        console.log("📚 Seeding 1000+ Stories into Story Book Library...");
        let genres = ["Desi Romance", "Thriller", "Comedy", "Sci-Fi", "Horror", "Mystery", "Drama"];
        let authors = ["AnoopWriter", "DesiKavavi", "SahityaGuru", "Kalamkaar", "StoryWeaver", "Roohdar"];
        let bulkStories = [];
        
        for(let i = 1; i <= 1000; i++) {
            let genre = genres[i % genres.length];
            let author = authors[i % authors.length];
            bulkStories.push({
                title: `Kahani #${i}: ${genre} Safar`,
                author: author,
                genre: genre,
                coverImage: `https://picsum.photos/seed/story${i}/300/400`,
                synopsis: `Yeh ek behtareen ${genre.toLowerCase()} kahani hai jo aapko shuru se ant tak bandh kar rakhegi. Padhiye iska romanchak safar.`,
                chapters: [
                    { chapterNumber: 1, title: "Pehla Kadam", content: `Chapter 1 ki shuruat hoti hai ek haseen subah se. Sab kuch normal lag raha tha, par achanak... (Kahani #${i} ka aarambh)` },
                    { chapterNumber: 2, title: "Naya Mod", content: `Chapter 2 me kahani ek naya mor leti hai. Pareshaniyan badhti hain aur rahasya khulte hain.` }
                ],
                likes: []
            });
        }
        await StoryBook.insertMany(bulkStories);
        console.log("🎉 1000 Stories Successfully Seeded!");
    }
}
initSystem();

app.get('/stories/books', async (req, res) => {
    try {
        let genre = req.query.genre;
        let limit = parseInt(req.query.limit) || 40; // Fast loading with pagination limit
        let query = genre && genre !== 'All' ? { genre } : {};
        let books = await StoryBook.find(query).sort({ createdAt: -1 }).limit(limit);
        res.json(books);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/stories/books/add', async (req, res) => {
    try {
        const { title, author, genre, synopsis, coverImage, firstChapterTitle, firstChapterContent } = req.body;
        let newBook = new StoryBook({
            title, author, genre, synopsis,
            coverImage: coverImage || "https://picsum.photos/300/400",
            chapters: [{ chapterNumber: 1, title: firstChapterTitle || "Introduction", content: firstChapterContent }]
        });
        await newBook.save();
        res.json({ success: true, message: "New book published successfully!" });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/stories/books/:id/chapter', async (req, res) => {
    try {
        const { title, content } = req.body;
        let book = await StoryBook.findById(req.params.id);
        let nextChapNum = book.chapters.length + 1;
        book.chapters.push({ chapterNumber: nextChapNum, title, content });
        await book.save();
        res.json({ success: true, message: "Chapter added successfully!" });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        if (!admin || admin.password !== password) {
            return res.status(401).json({ success: false, message: "Galat Admin Username ya Password!" });
        }
        res.json({ success: true, username: admin.username, role: admin.role });
    } catch (error) { res.status(500).json({ message: "Admin Error" }); }
});

app.get('/admin/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/admin/verify-user', async (req, res) => {
    try {
        const { username, isVerified } = req.body;
        await User.findOneAndUpdate({ username }, { isVerified, verificationRequested: false });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/admin/suspend-user', async (req, res) => {
    try {
        const { username, isSuspended } = req.body;
        await User.findOneAndUpdate({ username }, { isSuspended });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.delete('/admin/user/:username', async (req, res) => {
    try {
        let usernameToDelete = req.params.username;
        await User.findOneAndDelete({ username: usernameToDelete });
        await Post.deleteMany({ username: usernameToDelete });
        await Reel.deleteMany({ username: usernameToDelete });
        await Story.deleteMany({ username: usernameToDelete });
        await Message.deleteMany({ $or: [{ sender: usernameToDelete }, { receiver: usernameToDelete }] });
        await Notification.deleteMany({ $or: [{ sender: usernameToDelete }, { recipient: usernameToDelete }] });
        res.json({ message: "User aur uska sara data successfully delete ho gaya!" });
    } catch (error) { res.status(500).json({ message: "Error deleting user" }); }
});

app.get('/admin/team', async (req, res) => {
    try { res.json(await Admin.find().select('-password')); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/admin/create-team', async (req, res) => {
    try {
        const { username, password } = req.body;
        if(await Admin.findOne({ username })) return res.status(400).json({ message: "Username exists" });
        await new Admin({ username, password, role: "Sub-Admin" }).save();
        res.json({ message: "Sub-Admin created!" });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.delete('/admin/team/:username', async (req, res) => {
    try {
        await Admin.findOneAndDelete({ username: req.params.username });
        res.json({ message: "Team member removed" });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/admin/monetization', async (req, res) => {
    try { res.json(await MonetizationSetting.find()); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/admin/monetization/update', async (req, res) => {
    try {
        const { key, enabled, price } = req.body;
        await MonetizationSetting.findOneAndUpdate({ key }, { enabled, price }, { upsert: true });
        res.json({ success: true, message: "Monetization settings update ho gayi!" });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/monetization/status', async (req, res) => {
    try {
        let settings = await MonetizationSetting.find();
        let statusObj = {};
        settings.forEach(s => { statusObj[s.key] = { enabled: s.enabled, price: s.price }; });
        res.json(statusObj);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/payment/verify-success', async (req, res) => {
    try {
        const { username, type } = req.body;
        if(type === 'verifiedBadge') {
            await User.findOneAndUpdate({ username }, { isVerified: true, verificationRequested: false });
            res.json({ success: true, message: "Aapka account successfully Verified ho gaya!" });
        }
    } catch (error) { res.status(500).json({ message: "Payment Error" }); }
});

app.get('/settings/logo', async (req, res) => {
    try {
        let logo = await Setting.findOne({ key: 'websiteLogo' });
        let logoImg = await Setting.findOne({ key: 'websiteLogoImg' });
        res.json({ 
            logoText: logo ? logo.value : 'DesiAdda',
            logoImg: logoImg ? logoImg.value : ''
        });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/admin/settings/logo', async (req, res) => {
    try {
        const { logoText, logoImg } = req.body;
        if(logoText !== undefined) {
            await Setting.findOneAndUpdate({ key: 'websiteLogo' }, { value: logoText }, { upsert: true });
        }
        if(logoImg !== undefined) {
            await Setting.findOneAndUpdate({ key: 'websiteLogoImg' }, { value: logoImg }, { upsert: true });
        }
        res.json({ message: "Logo successfully update ho gaya!" });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/admin/update-credentials', async (req, res) => {
    try {
        const { oldUsername, newUsername, newPassword } = req.body;
        const admin = await Admin.findOne({ username: oldUsername });
        if (!admin) return res.status(404).json({ message: "Admin not found" });
        admin.username = newUsername;
        if (newPassword) admin.password = newPassword;
        await admin.save();
        res.json({ message: "Credentials updated successfully!", newUsername });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/ai/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        let tags = ["#desiadda", "#trending", "#viral", "#creator", "#india", "#explore", "#instagood", "#vibe"];
        let captions = [
            `Zindagi ke haseen pal ${prompt ? '(' + prompt + ')' : ''} ✨ #desiadda #vibe`,
            `Kuch alag, kuch khaas! ${prompt ? prompt : ''} 🔥 #trending #desi`,
            `Apne andaz me jiyo! 💯 #viral #desiadda #lifestyle`
        ];
        let randomCaption = captions[Math.floor(Math.random() * captions.length)];
        let randomTags = tags.sort(() => 0.5 - Math.random()).slice(0, 5).join(' ');
        res.json({ success: true, suggestion: `${randomCaption} ${randomTags}` });
    } catch (error) { res.status(500).json({ message: "AI Error" }); }
});

app.post('/send-otp', async (req, res) => {
    try {
        const { emailOrMobile, username } = req.body;
        if (username && await User.findOne({ username })) return res.status(400).json({ message: "Username pehle se maujood hai!" });
        if (await User.findOne({ emailOrMobile })) return res.status(400).json({ message: "Ye Email/Mobile pehle se registered hai!" });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStorage[emailOrMobile] = { otp, userData: req.body };
        res.json({ message: "OTP bhej diya gaya hai!", mockOtp: otp });
    } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

app.post('/verify-otp', async (req, res) => {
    try {
        const { emailOrMobile, otp } = req.body;
        const record = otpStorage[emailOrMobile];
        if (!record || record.otp !== otp) return res.status(400).json({ message: "Galat OTP!" });
        const hashedPassword = await bcrypt.hash(record.userData.password, 10);
        record.userData.password = hashedPassword;
        await new User(record.userData).save();
        delete otpStorage[emailOrMobile];
        res.json({ message: "Account successfully ban gaya!" });
    } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ $or: [{ username: username }, { emailOrMobile: username }] });
        if (!user) return res.status(401).json({ message: "Galat Username/Password!" });
        if (user.isSuspended) return res.status(403).json({ message: "Aapka account admin dwara suspend kar diya gaya hai!" });

        let isMatch = user.password.startsWith('$2b$') || user.password.startsWith('$2a$') 
            ? await bcrypt.compare(password, user.password) 
            : (password === user.password);

        if (isMatch) {
            user.isOnline = true;
            await user.save();
            res.json({ message: "Login Successful", success: true, username: user.username, darkMode: user.darkMode });
        } else {
            res.status(401).json({ message: "Galat Username/Password!" });
        }
    } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

app.post('/profile/change-password', async (req, res) => {
    try {
        const { username, oldPassword, newPassword } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "User nahi mila!" });

        let isMatch = user.password.startsWith('$2b$') || user.password.startsWith('$2a$') 
            ? await bcrypt.compare(oldPassword, user.password) 
            : (oldPassword === user.password);

        if (!isMatch) return res.status(400).json({ message: "Purana password galat hai!" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Password successfully change ho gaya!" });
    } catch (error) { res.status(500).json({ message: "Server error!" }); }
});

app.post('/settings/darkmode', async (req, res) => {
    try {
        const { username, darkMode } = req.body;
        await User.findOneAndUpdate({ username }, { darkMode });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/confessions', async (req, res) => {
    try {
        const { text, vibe, isAnonymous, username } = req.body;
        let postUser = isAnonymous ? "🤫 Anonymous Secret" : username;
        await new Confession({ username: postUser, text, vibe }).save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/confessions', async (req, res) => {
    try { res.json(await Confession.find().sort({ createdAt: -1 })); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/posts/:id/vote', async (req, res) => {
    try {
        const { username, optionIndex } = req.body;
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ message: "Post nahi mili" });
        post.pollOptions.forEach(opt => { opt.votes = opt.votes.filter(u => u !== username); });
        post.pollOptions[optionIndex].votes.push(username);
        await post.save();
        res.json({ message: "Vote recorded!", success: true });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/users/suggestions/:username', async (req, res) => {
    try {
        const currentUser = await User.findOne({ username: req.params.username });
        if(!currentUser) return res.json([]);
        let following = currentUser.following || [];
        following.push(currentUser.username);
        const suggestions = await User.find({ username: { $nin: following }, isSuspended: false })
            .select('username name profilePic isVerified isOnline')
            .limit(5);
        res.json(suggestions);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/request-verification', async (req, res) => {
    try {
        await User.findOneAndUpdate({ username: req.body.username }, { verificationRequested: true });
        res.json({ message: "Verification request admin ke paas bhej di gayi hai!" });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/search/:query', async (req, res) => {
    try {
        const users = await User.find({ $or: [{ username: { $regex: req.params.query, $options: 'i' } }, { name: { $regex: req.params.query, $options: 'i' } }] }).select('username name profilePic isVerified isOnline'); 
        res.json(users);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/hashtag/:tag', async (req, res) => {
    try {
        const tag = `#${req.params.tag}`;
        const posts = await Post.find({ content: { $regex: tag, $options: 'i' } }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/explore/:category', async (req, res) => {
    try {
        let category = req.params.category;
        let posts = await Post.find({ category }).sort({ isBoosted: -1, createdAt: -1 });
        res.json(posts);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/trending/hashtags', async (req, res) => {
    try {
        let posts = await Post.find().select('content');
        let tagCounts = {};
        posts.forEach(p => {
            if(p.content) {
                let matches = p.content.match(/#(\w+)/g);
                if(matches) {
                    matches.forEach(t => {
                        tagCounts[t] = (tagCounts[t] || 0) + 1;
                    });
                }
            }
        });
        let sortedTags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).slice(0, 5).map(item => item[0]);
        if(sortedTags.length === 0) sortedTags = ["#desiadda", "#trending", "#viral", "#vibe", "#india"];
        res.json(sortedTags);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/follow', async (req, res) => {
    try {
        const { currentUser, targetUser } = req.body;
        if (currentUser === targetUser) return res.status(400).json({ message: "Khud ko follow nahi kar sakte!" });
        const user1 = await User.findOne({ username: currentUser }); 
        const user2 = await User.findOne({ username: targetUser });   
        if (!user1 || !user2) return res.status(404).json({ message: "User nahi mila!" });

        let isFollowing = user1.following && user1.following.includes(targetUser);
        if (isFollowing) {
            await User.updateOne({ username: currentUser }, { $pull: { following: targetUser } });
            await User.updateOne({ username: targetUser }, { $pull: { followers: currentUser } });
            res.json({ message: "Unfollowed" });
        } else {
            await User.updateOne({ username: currentUser }, { $addToSet: { following: targetUser } });
            await User.updateOne({ username: targetUser }, { $addToSet: { followers: currentUser } });
            await new Notification({ recipient: targetUser, sender: currentUser, type: 'follow', message: `${currentUser} ne aapko follow kiya hai.` }).save();
            res.json({ message: "Followed" });
        }
    } catch (error) { res.status(500).json({ message: "Server error" }); }
});

app.get('/profile/:username', async (req, res) => {
    try { 
        let user = await User.findOne({ username: req.params.username }).populate('savedPosts');
        if(!user && req.params.username === 'admin') {
            user = { username: 'admin', name: 'DesiAdda Admin', bio: 'Super-Admin account', isVerified: true, profilePic: 'https://i.pravatar.cc/150' };
        }
        res.json(user); 
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/profile/update', async (req, res) => {
    try {
        const { oldUsername, newUsername, name, bio, websiteLink, profilePic, isPrivate } = req.body;
        if (oldUsername !== newUsername && await User.findOne({ username: newUsername })) return res.status(400).json({ message: "Username pehle se maujood hai!" });
        await User.findOneAndUpdate({ username: oldUsername }, { username: newUsername, name, bio, websiteLink, profilePic, isPrivate }, { upsert: true });
        if (oldUsername !== newUsername) {
            await Post.updateMany({ username: oldUsername }, { username: newUsername });
            await Reel.updateMany({ username: oldUsername }, { username: newUsername });
            await Story.updateMany({ username: oldUsername }, { username: newUsername });
        }
        res.json({ message: "Profile update ho gayi!", newUsername });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/users/list', async (req, res) => {
    try { res.json(await User.find({ username: { $in: req.body.usernames } }).select('username name profilePic isVerified isOnline socketId')); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/posts', async (req, res) => {
    try { 
        let pollOptionsParsed = req.body.pollOptions ? req.body.pollOptions.map(opt => ({ text: opt, votes: [] })) : [];
        await new Post({ ...req.body, pollOptions: pollOptionsParsed, isArchived: false, isBoosted: false, likes: [], comments: [] }).save(); 
        res.json({ message: "Post saved!" }); 
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/posts', async (req, res) => {
    try { 
        let posts = await Post.find().sort({ isBoosted: -1, createdAt: -1 });
        res.json(posts); 
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/posts/:id', async (req, res) => {
    try { res.json(await Post.findById(req.params.id)); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/posts/user/:username', async (req, res) => {
    try { res.json(await Post.find({ username: req.params.username }).sort({ createdAt: -1 })); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/posts/:id/like', async (req, res) => {
    try {
        const { username } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post.likes) post.likes = [];
        let index = post.likes.indexOf(username);
        if (index > -1) post.likes.splice(index, 1);
        else {
            post.likes.push(username);
            if (post.username !== username) await new Notification({ recipient: post.username, sender: username, type: 'like', message: `${username} ne aapki post ko like kiya hai.` }).save();
        }
        await post.save();
        res.json({ likesCount: post.likes.length, likes: post.likes });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/posts/:id/save', async (req, res) => {
    try {
        const { username, postId } = req.body;
        const user = await User.findOne({ username });
        if(!user) return res.status(404).json({ message: "User not found" });
        if(user.savedPosts.includes(postId)) {
            user.savedPosts.pull(postId);
            await user.save();
            res.json({ saved: false, message: "Removed from saved" });
        } else {
            user.savedPosts.push(postId);
            await user.save();
            res.json({ saved: true, message: "Post saved!" });
        }
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/posts/:id/comment', async (req, res) => {
    try {
        const { username, text } = req.body;
        const post = await Post.findById(req.params.id);
        post.comments.push({ username, text, likes: [], replies: [] });
        await post.save();
        res.json({ message: "Comment added!" });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/posts/:postId/comment/:commentIndex/like', async (req, res) => {
    try {
        const { username } = req.body;
        const post = await Post.findById(req.params.postId);
        let comment = post.comments[req.params.commentIndex];
        if(!comment.likes) comment.likes = [];
        let idx = comment.likes.indexOf(username);
        if(idx > -1) comment.likes.splice(idx, 1);
        else comment.likes.push(username);
        await post.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/posts/:postId/comment/:commentIndex/reply', async (req, res) => {
    try {
        const { username, text } = req.body;
        const post = await Post.findById(req.params.postId);
        post.comments[req.params.commentIndex].replies.push({ username, text });
        await post.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/reels', async (req, res) => {
    try { await new Reel({ ...req.body, likes: [] }).save(); res.json({ message: "Reel upload ho gayi!" }); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/reels', async (req, res) => {
    try { res.json(await Reel.find().sort({ createdAt: -1 })); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/messages/:user1/:user2', async (req, res) => {
    try {
        const messages = await Message.find({ $or: [{ sender: req.params.user1, receiver: req.params.user2 }, { sender: req.params.user2, receiver: req.params.user1 }] }).populate('sharedPostId').sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/notifications/:username', async (req, res) => {
    try { 
        await Notification.updateMany({ recipient: req.params.username, isRead: false }, { isRead: true });
        res.json(await Notification.find({ recipient: req.params.username }).sort({ createdAt: -1 })); 
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/notifications/unread/:username', async (req, res) => {
    try {
        let count = await Notification.countDocuments({ recipient: req.params.username, isRead: false });
        res.json({ unreadCount: count });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/stories', async (req, res) => {
    try { await new Story(req.body).save(); res.json({ message: "Story uploaded!" }); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.get('/stories', async (req, res) => {
    try { res.json(await Story.find().sort({ createdAt: -1 })); } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/story/view', async (req, res) => {
    try {
        const { storyId, username } = req.body;
        await Story.findByIdAndUpdate(storyId, { $addToSet: { viewers: username } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

app.post('/highlights/add', async (req, res) => {
    try {
        const { username, title, image } = req.body;
        await User.findOneAndUpdate({ username }, { $push: { highlights: { title, image } } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Error" }); }
});

io.on('connection', (socket) => {
    socket.on('user_online', async (username) => {
        if(username) {
            await User.findOneAndUpdate({ username }, { isOnline: true, socketId: socket.id });
            io.emit('status_change', { username, isOnline: true });
        }
    });

    socket.on('send_message', async (data) => {
        try {
            const msg = new Message(data);
            await msg.save();
            let populatedMsg = await Message.findById(msg._id).populate('sharedPostId');
            io.emit('receive_message', populatedMsg);
        } catch (error) { console.log("Socket error:", error); }
    });

    socket.on('typing', (data) => {
        io.emit('display_typing', data);
    });

    socket.on('call_user', (data) => {
        User.findOne({ username: data.targetUser }).then(user => {
            if(user && user.socketId) {
                io.to(user.socketId).emit('incoming_call', { caller: data.caller, signal: data.signal, callType: data.callType });
            }
        });
    });

    socket.on('answer_call', (data) => {
        User.findOne({ username: data.targetUser }).then(user => {
            if(user && user.socketId) {
                io.to(user.socketId).emit('call_accepted', data.signal);
            }
        });
    });

    socket.on('ice_candidate', (data) => {
        User.findOne({ username: data.targetUser }).then(user => {
            if(user && user.socketId) {
                io.to(user.socketId).emit('ice_candidate', data.candidate);
            }
        });
    });

    socket.on('hang_up', (data) => {
        User.findOne({ username: data.targetUser }).then(user => {
            if(user && user.socketId) {
                io.to(user.socketId).emit('call_ended');
            }
        });
    });

    socket.on('disconnect', async () => {
        await User.findOneAndUpdate({ socketId: socket.id }, { isOnline: false, socketId: null });
    });
});

server.listen(3000, () => {
    console.log('🚀 DesiAdda Ultimate Server http://localhost:3000 par chal raha hai');
});