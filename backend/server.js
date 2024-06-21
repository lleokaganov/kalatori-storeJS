// npm install nedb --save

const { createBLAKE3 } = require('hash-wasm');

// const fetch = require('node-fetch');
// import fetch from 'node-fetch';

// настройки баз
const Datastore = require('nedb');
const db_items = new Datastore({ filename: 'items.db', autoload: true }); // товары
const db_order = new Datastore({ filename: 'order.db', autoload: true }); // заказы
const db_order_events = new Datastore({ filename: 'order_events.db', autoload: true }); // лог заказа
const db_unic = new Datastore({ filename: 'unic.db', autoload: true }); // покупатели
const db_unic_address = new Datastore({ filename: 'unic_address.db', autoload: true }); // адреса покупателей

// Read Config
const fs = require('fs');
// var SET={...{port:3000},...process.env};
var SET={};
var txt = fs.readFileSync('config.txt', 'utf8');
txt.split('\n').forEach(s => {
        if( s=!'' && !s.trim().startsWith('#') && (m=s.match(/^\s*(\w+)\s*=\s*(.+?)\s*$/i))) SET[m[1]]=m[2];
});
console.log('config.txt:',SET);

// настройки сервера
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
// const port = 3000;

const json_def = {
    api_version: "Shop-JS 0.0.2",
    server_url: `http://localhost:${SET.port}`,
};

// Разрешить всем
// app.use(bodyParser.json());
// app.use(express.json());

// Middleware для принудительного парсинга JSON
app.use((req, res, next) => {
    let data=''; req.on('data', chunk => { data += chunk; } );
    req.on('end', () => {
        try { req.body = JSON.parse(data); } catch (e) { req.body = {}; }
        next();
    });
});

app.use((req, res, next) => {

    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    // res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.setHeader('Access-Control-Allow-Origin', (req.headers.origin?req.headers.origin:'*') );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type, x-requested-with');

    console.log('Received '+req.path, req.body);
    // print req.query
    console.log('Received query:',req.query);

    // if(req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Работа сервера

app.post('/items', async (req, res) => {   
    // const pp = await DB.Find(db_items,{ instock: 1 });
    const pp = await DB.Find(db_items,{ $and: [{ instock: 1 }, { quantity: { $gt: 0 } }] });
    res.json({...json_def,...{result: pp}});
});

app.post('/unic_create', async (req, res) => {
    // Create random password
    var randomString='';
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',cl=c.length;
    for(let i=0; i<cl; i++) randomString += c.charAt(Math.floor(Math.random()*cl));
    // Create blake3 hash
    const hash = await createBLAKE3();
    hash.update(SET.unic_salt+randomString);
    const unicHash = hash.digest();
    var id = await DB.Add(db_unic,{ login:0, blake3:unicHash, time: Math.floor(Date.now() / 1000) });
    res.json({...json_def,...{result: id+'-'+unicHash}});
});


app.post('/addresses', async (req, res) => {
    // Check unic
    var unic = await unic_check(req.body.unic);
    if(!unic) return res.json({...json_def,...{error: "empty unic"}});

    var pp = [];
        console.log("unic:",unic);
    // select where unic=unic
    if(unic) pp = await DB.Find(db_unic_address,{ unic: unic });
        console.log("pp:",pp);
    res.json({...json_def,...{result: pp}});
});

app.post('/add_address', async (req, res) => {
    // Check unic
    var unic = await unic_check(req.body.unic);
    if(!unic) return res.json({...json_def,...{error: "empty unic"}});

    var data = {
	time: Math.floor(Date.now() / 1000),
	unic: unic,
    };
    "Fullname Country City Address Zip Email Phone aComment".split(' ').forEach(x=>data[x]=req.body.address[x]);
    var id = await DB.AddUpdate(db_unic_address, { $and: [{ _id: req.body.address.aid }, { unic: unic }] } , data);
    console.log(id);
    res.json({...json_def,...{result: req.body.address.aid}});
});

app.post('/del_address', async (req, res) => {
    // Check unic
    var unic = await unic_check(req.body.unic);
    if(!unic) return res.json({...json_def,...{error: "empty unic"}});

    var id = await DB.Del(db_unic_address, { $and: [{ _id: req.body.aid }, { unic: unic }] });
    console.log(id);
    res.json({...json_def,...{result: 'OK'}});
});



app.post('/order', async (req, res) => {
    // Check unic
    var unic = await unic_check(req.body.unic);
    if(!unic) return res.json({...json_def,...{error: "empty unic"}});
    // Check currency
    if(req.body.currency != SET.CUR) return res.json({...json_def,...{error: "Allowed currency is '"+SET['CUR']+"', not `"+req.body.currency+"`"}});

    const ids = Object.keys(req.body.list);
    const pp = await DB.Find(db_items,{ _id: { $in: ids } });
    // Find currency and test quantity
    var total=0; for(var id of ids) {
	    var quantity=req.body.list[id];
        // Найти товар по id
	    var price=false; for(var p of pp) {
            if(p._id!=id) continue;
            // Check quantity
            if(p.quantity<quantity) return res.json({...json_def,...{error: "Only "+p.quantity+" \""+p.name+"\" available"}});
            price=p.price;
            break;
        }
        if(price === false) res.json({...json_def,...{error: "item #"+id+" not found"}});
        total += price * quantity;
    }

    console.log("total: "+total);
    console.log("req.body.total: "+req.body.total);

    if(total != req.body.total) return res.json({...json_def,...{error: "total price mismatch"}});

    // Create order
    var data = {
        time: Math.floor(Date.now() / 1000),
        unic: unic,
        aid: req.body.aid,
        CurrentStatus: 'new',
        List: req.body.list,
        total: total,
        currency: SET.CUR,
    };
    var oid = await DB.Add(db_order, data);
    // Add to order events
    await DB.Add(db_order_events, {
        oid: oid,
        Status: 'new',
        Comment: 'Create new order',
    });
    res.json({...json_def,...{result: {oid: oid, total: total}}});
});







// ==========================================================
// Функции
app.all('/kalatori', async (req, res) => {

    console.log('Received kalatori!');
    console.log('Received kalatori:',req.body);
    console.log('Received query:',req.query);

    const fetch = (await import('node-fetch')).default;

    // Ajax query to daemon: API https://alzymologist.github.io/kalatori-api/
    async function kalatori_pay(endpoint,data) {
        const response = await fetch(SET.DAEMON_URL+'/v2/'+endpoint, data ?
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        } : { method: 'GET' }
        );
        return await response.json();
    }

    const endpoint = req.query.endpoint;

    if(endpoint=='status') {
        var r = await kalatori_pay("status");
        return res.json(r);
    }

    if(endpoint=='order') {
        const oid = req.body.order;
        // get real currency and total where oid=oid
        const order = await DB.Find(db_order,{ _id: oid },'_1');
        if(!order) return res.json({error: "Order '"+oid+"' not exist"});
        // query to daemon
        const r = await kalatori_pay("order/"+encodeURIComponent(oid+"_"+SET.STORE_NAME),{...req.body,...{
            amount_real: order.total,
            currency_real: order.currency,
            currency_allowed: SET.CUR_ALLOWED,
        }});
        // check payment status
        if(r.payment_status && r.payment_status.toLowerCase()=='paid') {
            // Update order and history
            const time = Math.floor(Date.now() / 1000);
            const status = 'processing';
            await DB.AddUpdate(db_order,{ _id: oid },{ CurrentStatus: status, time: time });
            await DB.Add(db_order_events,{ oid: oid, Status: status, time: time, Comment: 'Paid with Kalatori by '+req.body.currency });
            // Make callback if needed
            if(req.body.callback && SET.callback) {
                console.log('Callback to: '+req.body.callback);
                const response = await fetch(req.body.callback, { method: 'GET' });
                if(response.status!=200) return res.json({error: "Callback error: "+response.status});
                r.redirect = "./success_paymens.html";
            }
        }
        return res.json(r);
    }

    res.json({error: "Unknown kalatory endpoint '"+endpoint+"'"});
});










// Запускаем сервер
app.listen(SET.port, () => {
	console.log(`Server is running on http://localhost:${SET.port}`);
});


// Обработчик для несуществующих маршрутов (404)
// app.use((req, res) => {
//    console.log(res);
//    if(!res.writableEnded) res.status(404).json({ error: 'Not Found' });
// });

async function unic_check(unic) {
    if(!unic) return false;
    var p = await DB.Find(db_unic,{ _id: unic.split('-')[0], blake3: unic.split('-')[1] },'_1');
    return (p.login===0 || p.login===1 ? unic.split('-')[0] : false);
}

// ==========================================================
// Функции DB

DB={
  Find: function(db,query,opt) { // { instock: 1 }
    return new Promise((resolve, reject) => {
        db[opt==='_1'?'findOne':'find'](query, (err, p) => {
            if(err) reject(err); // Ошибка при поиске
            else resolve(p); // Возвращаем найденные товары
        });
    });
 },

  Add: function(db,data) {
    return new Promise((resolve, reject) => {
        db.insert(data,(err,newDoc) => {
            if(err) reject(err);
            else resolve(newDoc._id);
        });
    });
  },

  Del: function(db,query) { // { _id: idToRemove, unic: unicToRemove }
    return new Promise((resolve, reject) => {
        db.remove(query, {}, (err, numRemoved) => {
            if(err) reject(err);
            else resolve(numRemoved);
        });
    });
  },

  AddUpdate: function(db,query,data) { // query = { _id: id }
    return new Promise((resolve, reject) => {
        db.update(query, { $set: data }, { upsert: true }, (err, numReplaced, upsert) => {
            if (err) reject(err);
            else resolve(upsert);
        });
    });
  },
};
