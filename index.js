const express = require('express')
const morgan = require('morgan')
require('express-async-errors');
const cors = require('cors');

const courseRoute = require('./routes/course.route');
const userRoute = require('./routes/user.route');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1/course', courseRoute);
app.use('/api/v1/user', userRoute);

app.get('/err', (req, res) => {
    throw new Error('Error');
})

app.use((req, res, next) => {
    res.status(404).json({
        error_message: 'Endpoint not found'
    });
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        error_message: 'Something broke!'
    });
})

const port = 3000;
app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})