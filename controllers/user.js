const User = require("../models/user");

module.exports.signUp = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;
        const newUser = new User({ email, username, role: role || 'guest' });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            res.status(201).json({
                success: true,
                user: { _id: registeredUser._id, username: registeredUser.username, email: registeredUser.email, role: registeredUser.role }
            });
        });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

module.exports.login = async (req, res) => {
    res.json({
        success: true,
        user: { _id: req.user._id, username: req.user.username, email: req.user.email, role: req.user.role }
    });
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.json({ success: true, message: "Logged out" });
    });
};

module.exports.getMe = (req, res) => {
    if (req.user) {
        res.json({ user: { _id: req.user._id, username: req.user.username, email: req.user.email, role: req.user.role } });
    } else {
        res.json({ user: null });
    }
};

module.exports.upgradeToHost = async (req, res, next) => {
    try {
        if (req.user.role === 'host') {
            return res.status(400).json({ error: "You are already a host" });
        }
        req.user.role = 'host';
        await req.user.save();
        res.json({ success: true, user: { _id: req.user._id, username: req.user.username, email: req.user.email, role: req.user.role } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
