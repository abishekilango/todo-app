const express = require("express");

const app = express();

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.use(express.static("public"));

const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;
const MongoClient = mongodb.MongoClient;
const url = process.env.MONGODB_URL;

let collection;

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    if (err) throw err;
    const db = client.db("tododb");
    collection = db.collection("todos");
});

app.get("/", (req, res) => {
    res.render("index");
});

let todoData = [];

app.get("/api/todos", async (req, res) => {
    if (todoData.length === 0) {
        collection.find({}).toArray()
        .then(data => {
            res.send(data);
            todoData = data;
        })
        .catch(err => {
            console.log(err);
        });
    } else {
        res.send(todoData);
    }
});

app.get("/api/newTab", async (req, res) => {
    const id = new ObjectID();
    const query = { _id: id, title: "", list: [] };
    collection.insertOne(query)
    .then(() => {
        res.send(query);
        todoData.push(query);
    })
    .catch(err => {
        console.log(err);
    });
});

app.post("/api/deleteTab", async (req, res) => {
    const query = { _id: new ObjectID(req.body.tabId) };
    collection.deleteOne(query)
    .then(() => {
        res.send("success");
        for (let i = 0; i < todoData.length; i++) {
            if (todoData[i]._id.toString() === req.body.tabId) {
                todoData.splice(i,1);
                break;
            }
        }
    })
    .catch(err => {
        console.log(err);
    });
});

app.post("/api/postItem", async (req, res) => {
    const filQuery = { _id: new ObjectID(req.body.tabId) };
    const updQuery = { 
        $push: { 
            list: { 
                $each: [ { item: req.body.newItem, checked: false } ],
                $position: req.body.idx
            } 
        } 
    };
    collection.updateOne(filQuery, updQuery)
    .then(() => {
        res.send("success");
        for (let i = 0; i < todoData.length; i++) {
            if (todoData[i]._id.toString() === req.body.tabId) {
                todoData[i].list.push({ "item": req.body.newItem, "checked": false });
                break;
            }
        }
    })
    .catch(err => {
        console.log(err);
    });
});

app.post("/api/updateTitle", async (req, res) => {
    const filQuery = { _id: new ObjectID(req.body.tabId) };
    const updQuery = { $set: { "title": req.body.item } };
    collection.updateOne(filQuery, updQuery)
    .then(() => {
        res.send("success");
        for (let i = 0; i < todoData.length; i++) {
            if (todoData[i]._id.toString() === req.body.tabId) {
                todoData[i].title = req.body.item;
                break;
            }
        }
    })
    .catch(err => {
        console.log(err);
    });
});

app.post("/api/updateItem", async (req, res) => {
    const filQuery = { _id: new ObjectID(req.body.tabId) };
    const updQuery = { 
        $set: { [`list.${req.body.idx}.item`]: req.body.item } 
    };
    collection.updateOne(filQuery, updQuery)
    .then(() => {
        res.send("success");
        for (let i = 0; i < todoData.length; i++) {
            if (todoData[i]._id.toString() === req.body.tabId) {
                todoData[i].list[req.body.idx].item = req.body.item;
                break;
            }
        }
    })
    .catch(err => {
        console.log(err);
    });
});

app.post("/api/checkItem", async (req, res) => {
    const filQuery = { 
        _id: new ObjectID(req.body.tabId),
    };
    const updQuery = { 
        $set: { [`list.${req.body.idx}.checked`]: req.body.checked } 
    };
    collection.updateOne(filQuery, updQuery)
    .then(() => {
        res.send("success");
        for (let i = 0; i < todoData.length; i++) {
            if (todoData[i]._id.toString() === req.body.tabId) {
                todoData[i].list[req.body.idx].checked = req.body.checked;
                break;
            }
        }
    })
    .catch(err => {
        console.log(err);
    });
});

app.post("/api/deleteItem", async (req, res) => {
    const query = { _id: new ObjectID(req.body.tabId) };
    collection.findOne(query)
    .then(doc => {
        doc.list.splice(req.body.idx, 1);
        collection.findOneAndReplace(query, doc)
        .then(() => {
            res.send("success");
            for (let i = 0; i < todoData.length; i++) {
                if (todoData[i]._id.toString() === req.body.tabId) {
                    todoData[i].list.splice(req.body.idx,1);
                    break;
                }
            }
        })
        .catch(err => {
            console.log(err);
        });
    })
    .catch(err => {
        console.log(err);
    });
});

let port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server started at port ${port}`);
});