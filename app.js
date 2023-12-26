const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/forex', { useNewUrlParser: true, useUnifiedTopology: true });


const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("Connected mongoDB successfully");
});

const frontendURI = "13.211.158.114";
// cross-origin resource sharing set up
var cors = require('cors');
var corsOption = {
    origin: 'http://' + frontendURI + ':3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['x-auth-token', 'Access-Control-Allow-Credentials', 'Access-Control-Allow-Origin']
};
app.use(cors(corsOption));
const port = 3001;
app.listen(port, () => console.log('App listening on port ' + port));



const Schema = mongoose.Schema;

const rawSchema = new Schema({
    company: String,
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
    pair1: { company: String, accountid: Number, SYMBOL: String, order: String, lot: Number },
    pair2: { company: String, accountid: Number, SYMBOL: String, order: String, lot: Number },
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
        res.send({ status: "ok", data: data })
        // if (data[0] == undefined) {
        //     // console.log("success")
        //     res.send({ status: "ok", data: "no data" })
        // } else {
        //     // console.log("success")
        //     res.send({ status: "ok", data: data })
        // }
    }).
        catch(error => {
            console.log(error)
            res.send({ status: "failed", data: error })
        })

});
app.get('/datapair', async (req, res) => {
    const Rawdata = mongoose.model('pair', addP);
    Rawdata.find().then(data => {
        console.log(data)
        res.send({ status: "ok", data: data })



    }).
        catch(error => {
            console.log(error)
            res.send({ status: "failed", data: error })
        })

});
app.post('/datapairdelete', async (req, res) => {
    console.log(req.body)
    let id = req.body.id;
    const Removedata = mongoose.model('pair', addP);
    Removedata.findByIdAndDelete(id)
        .then(data => {
            console.log(data)
            return res.status(200).send({ status: "ok", data: data })
        })
        .catch(error => {
            console.error(error);
            return res.send({ status: "error", data: error })
        });

});
app.post('/closeposition', async (req, res) => {
    console.log(req.body)
    let id = req.body.id;
    const data = mongoose.model('pair', addP);

    data.findByIdAndUpdate(id, { status: "close" }, { new: true })
        .then((doc) => {
            console.log('Updated document:', doc);
            return res.status(200).send({ status: "ok", data: doc })
        })
        .catch((err) => {
            console.log('Error:', err);
            return res.send({ status: "error", data: err })
        });

});
app.post('/order', async (req, res) => {
    console.log(req.body)
    let id = req.body.id;
    let p1order = req.body.pair1Order
    let p2order = req.body.pair2Order
    let lot = req.body.lot
    const data = mongoose.model('pair', addP);

    data.findByIdAndUpdate(id, { status: p1order + "/" + p2order, "pair1.order": p1order, "pair1.lot": lot, "pair2.order": p2order, "pair2.lot": lot }, { new: true })
        .then((doc) => {
            console.log('Updated document:', doc);
            return res.status(200).send({ status: "ok", data: doc })
        })
        .catch((err) => {
            console.log('Error:', err);
            return res.send({ status: "error", data: err })
        });

});
app.post('/statusreset', async (req, res) => {
    console.log(req.body)
    let id = req.body.id;
    const data = mongoose.model('pair', addP);

    data.findByIdAndUpdate(id, { status: "" }, { new: true })
        .then((doc) => {
            console.log('Updated document:', doc);
            return res.status(200).send({ status: "ok", data: doc })
        })
        .catch((err) => {
            console.log('Error:', err);
            return res.send({ status: "error", data: err })
        });

});
app.post('/check', async (req, res) => {
    // Access the JSON data sent in the request body   
    const requestData = req.body;
    let payload = JSON.parse(requestData.data)
    let payload1 = { ...payload, ...getDate() }
    console.log(payload1);
    const dataP = mongoose.model('pair', addP);
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
        // console.log('Saved:', newSwap);

        dataP.find().then(data => {
            // console.log(data)
            data.filter(d => {
                if (d.pair1.accountid == payload1.accountid && d.pair1.SYMBOL === payload1.SYMBOL) {
                    console.log(d)
                    res.send(d.pair1.lot + "," + d.pair1.order + "," + d.status)
                } else if ((d.pair2.accountid == payload1.accountid && d.pair2.SYMBOL == payload1.SYMBOL)) {
                    console.log(d)
                    res.send(d.pair2.lot + "," + d.pair2.order + "," + d.status)
                }
                else {
                    res.send("error")
                }


            });

        }).
            catch(error => {
                console.log(error)
                // res.send({ status: "failed", data: error })
            })


        // res.send(newSwap);
    } catch (error) {
        res.status(500).send(error);
    }

});
app.post('/addData', async (req, res) => {
    // Access the JSON data sent in the request body   
    const requestData = req.body;
    // let payload = JSON.parse(requestData.data)
    // let payload1 = { ...payload, ...getDate() }
    console.log(requestData);
    // res.send("OK");
    const data = mongoose.model('pair', addP);

    const newAddP = new data({
        name: requestData.pairName,
        pair1: { company: requestData.pair1[0].company, accountid: requestData.pair1[0].accountid, SYMBOL: requestData.pair1[0].SYMBOL, order: "", lot: 0 },
        pair2: { company: requestData.pair2[0].company, accountid: requestData.pair2[0].accountid, SYMBOL: requestData.pair2[0].SYMBOL, order: "", lot: 0 },
        status: ""
    });

    try {
        await newAddP.save();
        console.log('Saved:', newAddP);
        res.send({ status: "ok", data: newAddP });
    } catch (error) {
        res.status(500).send({ status: "fail", data: error });
    }

});


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
