const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./src/db');
require('dotenv').config();
const cors = require('cors'); // Import cors

const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const guestRoutes = require('./src/routes/guest');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ // Use cors middleware
    origin: 'http://localhost:3000', // Allow requests from your React app's origin
    credentials: true // Allow cookies/sessions to be sent
}));
app.use(express.json());


app.use(session({
    store: new pgSession({
        pool : pool,
        tableName : 'session'
    }),
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/guest', guestRoutes);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});