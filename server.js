const express = require('express');
const bodyParser = require('body-parser');

var morgan = require('morgan');
const app = express();
var cors = require('cors');

//parse application/json
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors({origin: '*'}));

app.use(function(req, res, next){
    // // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
})

//panggil routes
var routes = require('./routes');
routes(app);

//daftarkan menu routes dari index
app.use('/api', require('./middleware'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.warn(`App listening on ${PORT}`);
})  