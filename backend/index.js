var express = require("express");

var app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

const router = express.Router();

// app.get("/",async function(req,res){
//     //let data = await callToDataLayerFunction
//     console.log("Request received for nothing");
//     res.json({"response": "Hello!"});
//     return;
// });

app.use("/", router);

app.listen(8000);
console.log('Express started on port 8000');

