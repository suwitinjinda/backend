const express = require('express');
const app = express();
const bodyParser = require('body-parser');
// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/forex', { useNewUrlParser: true, useUnifiedTopology: true });


const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("Connected mongoDB successfully");
});

// cross-origin resource sharing set up
var cors = require('cors');
var corsOption = {
    origin: "http://localhost:3000",
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['x-auth-token', 'Access-Control-Allow-Credentials', 'Access-Control-Allow-Origin']
};
app.use(cors(corsOption));
const port = 3001;
app.listen(port, () => console.log('App listening on port ' + port));



const Schema = mongoose.Schema;

const rawSchema = new Schema({
    name: String,
    accountid: Number,
    mode: Number,
    SYMBOL: String,
    swapLongTrade: Number,
    swapShortTrade: Number,
    PositionProfit: Number,
    PositionSwap: Number,
    date: String,
    time: String,
    unixstamp: Number

});
const addP = new Schema({
    name: String,
    pair1: { company: String, accountid: Number, SYMBOL: String, },
    pair2: { company: String, accountid: Number, SYMBOL: String, },
    status: String
});

// const port = process.env.PORT || 3001;

// Define a route for the root URL
app.get('/', (req, res) => {
    console.log("Hello")
    res.send('Hello, World!');
});
app.get('/data', async (req, res) => {
    const Rawdata = mongoose.model('swap', rawSchema);

    Rawdata.find().then(data => {
        // console.log(data)
        if (data[0] == undefined) {
            console.log("success")
            res.send({ status: "ok", data: "no data" })
        } else {
            console.log("success")
            res.send({ status: "ok", data: data })
        }
    }).
        catch(error => {
            console.log(error)
            res.send({ status: "failed", data: error })
        })

});
app.post('/check', async (req, res) => {
    // Access the JSON data sent in the request body   
    const requestData = req.body;
    let payload = JSON.parse(requestData.data)
    let payload1 = { ...payload, ...getDate() }
    console.log(payload1);

    const Person = mongoose.model('swap', rawSchema);

    const newSwap = new Person({
        company: payload1.company,
        accountid: payload1.accountid,
        mode: payload1.mode,
        SYMBOL: payload1.SYMBOL,
        swapLongTrade: payload1.swapLongTrade,
        swapShortTrade: payload1.swapShortTrade,
        PositionProfit: payload1.PositionProfit,
        PositionSwap: payload1.PositionSwap,
        date: payload1.data,
        time: payload1.time,
        unixstamp: payload1.unixstamp
    });

    try {
        await newSwap.save();
        console.log('Saved:', newSwap);
        res.send(newSwap);
    } catch (error) {
        res.status(500).send(error);
    }

});
app.post('/addData', async (req, res) => {
    // Access the JSON data sent in the request body   
    const requestData = req.body;
    let payload = JSON.parse(requestData.data)
    let payload1 = { ...payload, ...getDate() }
    console.log(payload1);

    // const data = mongoose.model('swap', rawSchema);

    // const newSwap = new Person({
    //     company: payload1.company,
    //     accountid: payload1.accountid,
    //     mode: payload1.mode,
    //     SYMBOL: payload1.SYMBOL,
    //     swapLongTrade: payload1.swapLongTrade,
    //     swapShortTrade: payload1.swapShortTrade,
    //     PositionProfit: payload1.PositionProfit,
    //     PositionSwap: payload1.PositionSwap,
    //     date: payload1.data,
    //     time: payload1.time,
    //     unixstamp: payload1.unixstamp
    // });

    // try {
    //     await newSwap.save();
    //     console.log('Saved:', newSwap);
    //     res.send(newSwap);
    // } catch (error) {
    //     res.status(500).send(error);
    // }

});
// Start the server
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });

function getDate() {
    // current timestamp in milliseconds
    const tdate = new Date();
    const localDate = tdate.toLocaleDateString();
    // console.log(localDate);
    const wdate = new Date();
    const localTime = wdate.toLocaleTimeString();
    // console.log(localTime);
    let date1 = { date: localDate, time: localTime, unixstamp: new Date().getTime() };
    return date1;
}
