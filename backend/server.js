// npm install nedb --save

const { createBLAKE3 } = require('hash-wasm');

// const fetch = require('node-fetch');
// import fetch from 'node-fetch';

// настройки баз
const DB_DEBUG = 1; // каждый раз переписывать файлы баз
const Datastore = require('nedb');
const db_item = new Datastore({ filename: 'items.db', autoload: true }); // товары
const db_order = new Datastore({ filename: 'order.db', autoload: true }); // заказы
const db_order_events = new Datastore({ filename: 'order_events.db', autoload: true }); // лог заказа
const db_unic = new Datastore({ filename: 'unic.db', autoload: true }); // покупатели
const db_unic_address = new Datastore({ filename: 'unic_address.db', autoload: true }); // адреса покупателей
const db_saler = new Datastore({ filename: 'saler.db', autoload: true }); // продавцы

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

function err(res,text) {
    return res.json({...json_def,...{error: text}});
}

function ok(res,result) {
    return res.json({...json_def,...{result: result}});
}


//                        _
//          ___    __ _  | |   ___   _ __
//         / __|  / _` | | |  / _ \ | '__|
//         \__ \ | (_| | | | |  __/ | |
//         |___/  \__,_| |_|  \___| |_|
//
//

// Info about all salers
app.post('/salers_info', async (req, res) => {
    var sls = await DB.Find(db_saler,{});
    ok(res,sls);
});

// Saler create/update account
app.post('/saler', async (req, res) => {
    var unic = await unic_check(req.body.unic); // Check unic
    if(!unic || !unic.email || !unic.login) err(res,"wrong login");
    var sl = await DB.Find(db_saler, { _id: unic._id },'_1');
    ok(res,sl);
});

// Saler create/update account
app.post('/saler_create', async (req, res) => {
    var unic = await unic_check(req.body.unic); // Check unic
    if(!unic || !unic.email || !unic.login) err(res,"wrong login");
    var sl = await DB.Find(db_saler, { _id: unic._id },'_1');
    var a={
	name: req.body.name, // Store name
	about: req.body.about, // About Store
	acc: {}, // accounts
    };
    SET.CUR_ALLOWED.split(' ').forEach(x=>{ if(req.body[x]) a.acc[x] = req.body[x]; });
    var id = await DB.AddUpdate(db_saler, { _id: unic._id }, a);
    ok(res,id);
});

// Saler add/update his item ('id' optional)
app.post('/saler_add_item', async (req, res) => {
    var unic = await unic_check(req.body.unic); // Check unic
    if(!unic || !unic.email || !unic.login) err(res,"wrong login");
    var sl = await DB.Find(db_saler, { _id: unic._id },'_1');
    var a={ Time: unixtime(), unic: unic._id };
    "name Text price noaddr quantity instock".split(' ').forEach(x => a[x]=req.body[x] );
    // todo: download & resize photos
    // a.imgs = req.body.imgs;
    var id = await DB.AddUpdate(db_item, { $and: [{ _id: id }, { unic: unic._id }] }, a);
    ok(res,id);
});



//          _   _
//         (_) | |_    ___   _ __ ___
//         | | | __|  / _ \ | '_ ` _ \
//         | | | |_  |  __/ | | | | | |
//         |_|  \__|  \___| |_| |_| |_|
//
//

// Get all items
app.post('/items', async (req, res) => {
    // const pp = await DB.Find(db_item,{ instock: 1 });
    const pp = await DB.Find(db_item,{ $and: [{ instock: 1 }, { quantity: { $gt: 0 } }] });
    ok(res, pp);
});

// Get one item
app.post('/item', async (req, res) => {
    const p = await DB.Find(db_item,{ _id: req.body.id },'_1');
    ok(res,p);
});

//                          _
//          _   _   _ __   (_)   ___
//         | | | | | '_ \  | |  / __|
//         | |_| | | | | | | | | (__
//          \__,_| |_| |_| |_|  \___|
//
//

// Create/update unic
app.post('/unic_create', async (req, res) => {
    var a={login: req.body.login}, password = req.body.password;
    if(!a.login) { // Create random password
	a.login=''; password='';
	const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',cl=c.length;
        for(let i=0; i<cl; i++) password += c.charAt(Math.floor(Math.random()*cl));
    } else {
	a.email=req.body.email;
	if(!(/^[^\s@]+@[^\s@]+\.[^\s@\.]+$/).test(a.email)) return err(res,"email wrong format");
	if(a.login.length < 3) return err(res,"login too short");
	if(password.length < 1) return err(res,"password too short");
    }
    a.blake3 = await blake3(a.login,password);
    var id,unic = await unic_check(req.body.unic); // Check unic
    if(!unic) id = await DB.Add(db_unic,{...a,...{time: unixtime()}});
    else await DB.AddUpdate(db_unic, { _id: (id=unic._id) } , unic);
    ok(res, id+'-'+a.blake3);
});

// Login by login/password
app.post('/unic_login', async (req, res) => { // Check unic
    const a = {login: req.body.login, password: req.body.password};
    a.blake3 = await blake3(a.login,a.password);
    var ud = await DB.Find(db_unic, { blake3: a.blake3, login: a.login },'_1');
    if(!ud) { await delay(3); return ok(res,''); }
    ok(res, ud._id+'-'+ud.blake3 );
});

//                      _       _
//           __ _    __| |   __| |  _ __    ___   ___   ___
//          / _` |  / _` |  / _` | | '__|  / _ \ / __| / __|
//         | (_| | | (_| | | (_| | | |    |  __/ \__ \ \__ \
//          \__,_|  \__,_|  \__,_| |_|     \___| |___/ |___/
//
//

// Get addresses by unic
app.post('/addresses', async (req, res) => {
    var unic = await unic_check(req.body.unic); // Check unic
    if(!unic) return err(res,"empty unic");
    var pp = [];
    if(unic) pp = await DB.Find(db_unic_address,{ unic: unic });
    ok(res,pp);
});

// Add address
app.post('/add_address', async (req, res) => {
    var unic = await unic_check(req.body.unic); // Check unic
    if(!unic) return err(res,"empty unic");
    var data = {
	time: unixtime(),
	unic: unic,
    };
    "Fullname Country City Address Zip Email Phone aComment".split(' ').forEach(x=>data[x]=req.body.address[x]);
    var id = await DB.AddUpdate(db_unic_address, { $and: [{ _id: req.body.address.aid }, { unic: unic }] } , data);
    if(!id) return err(res, "error db");
    ok(res, id===true ? req.body.address.aid : id );
});

// Del address
app.post('/del_address', async (req, res) => {
    // Check unic
    var unic = await unic_check(req.body.unic);
    if(!unic) return err(res, "empty unic");

    var id = await DB.Del(db_unic_address, { $and: [{ _id: req.body.aid }, { unic: unic }] });
    console.log(id);
    ok(res,'OK');
});

//                             _
//           ___    _ __    __| |   ___   _ __
//          / _ \  | '__|  / _` |  / _ \ | '__|
//         | (_) | | |    | (_| | |  __/ | |
//          \___/  |_|     \__,_|  \___| |_|
//
//

// GET my orders
app.post('/orders', async (req, res) => {
    var unic = await unic_check(req.body.unic);
    var pp = await DB.Find(db_order,{ unic: unic });
    ok(res, pp );
});

// GET my order events history (for oid=1,2,3)
app.post('/events', async (req, res) => {
    var unic = await unic_check(req.body.unic);
    var pp = await DB.Find(db_order,{ unic: unic });
    var oid = req.body.oid.split(',');
    oid = oid.filter(id => pp.some(item => item._id === id)); // убрать, которые чужие unic
    pp = await DB.Find(db_order_events,{ oid: { $in: oid } });
    ok(res, pp );
});

app.post('/order', async (req, res) => {
    // Check unic
    var unic = await unic_check(req.body.unic);
    if(!unic) return err(res, "empty unic");
    // Check currency
    if(req.body.currency != SET.CUR) return err(res, "Allowed currency is '"+SET['CUR']+"', not `"+req.body.currency+"`");

    const ids = Object.keys(req.body.list);
    const pp = await DB.Find(db_item,{ _id: { $in: ids } });
    // Find currency and test quantity
    var total=0; for(var id of ids) {
	    var quantity=req.body.list[id];
        // Найти товар по id
	    var price=false; for(var p of pp) {
            if(p._id!=id) continue;
            // Check quantity
            if(p.quantity<quantity) return err(res, "Only "+p.quantity+" \""+p.name+"\" available");
            price=p.price;
            break;
        }
        if(price === false) err(res, "item #"+id+" not found");
        total += price * quantity;
    }

    console.log("total: "+total);
    console.log("req.body.total: "+req.body.total);

    if(total != req.body.total) return err(res,"total price mismatch");

    // Create order
    var data = {
        time: unixtime(),
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
    ok(res, {oid: oid, total: total});
});






// ==========================================================
// Функции
app.all('/kalatori', async (req, res) => {

    console.log('Received kalatori:',req.body);
    console.log('Received query:',req.query);

    const fetch = (await import('node-fetch')).default;

    // Ajax query to daemon: API https://alzymologist.github.io/kalatori-api/
    async function kalatori_pay(endpoint,data) {
	console.log("=======  "+SET.DAEMON_URL+'/v2/'+endpoint+" ",data);
        const response = await fetch(SET.DAEMON_URL+'/v2/'+endpoint, data ?
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        } : { method: 'GET' }
        );
	var txt = await response.text();
	console.log("=======> ["+txt+"]");
	try {
	    txt = JSON.parse(txt);
	} catch(er){ console.log("========> Json parse error: "+er); return ''; }
	return txt;
//        return await response.json();
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
        if(!order) return err(res,"Order '"+oid+"' not exist");
        // query to daemon

	var ara={...req.body,...{
            amount_real: order.total,
            currency_real: order.currency,
            currency_allowed: SET.CUR_ALLOWED,
        }};

	console.log("============> SEND: ",ara);

        const r = await kalatori_pay("order/"+encodeURIComponent(oid+"_"+SET.STORE_NAME),ara);

	console.log("============> RECIEVE: ",r);

        // check payment status
        if(r.payment_status && r.payment_status.toLowerCase()=='paid') {
            // Update order and history
            const status = 'processing';
            await DB.AddUpdate(db_order,{ _id: oid },{ CurrentStatus: status, time: unixtime() });
            await DB.Add(db_order_events,{ oid: oid, Status: status, time: unixtime(), Comment: 'Paid with Kalatori by '+req.body.currency });
            // Make callback if needed
            if(req.body.callback && SET.callback) {
                console.log('Callback to: '+req.body.callback);
                const response = await fetch(req.body.callback, { method: 'GET' });
                if(response.status!=200) return err(res, "Callback error: "+response.status);
                r.redirect = "./success_paymens.html";
            }
        }
        return res.json(r);
    }

    err(res, "Unknown kalatory endpoint '"+endpoint+"'");
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
    if(!unic || !unic.split) return false;
    var p = await DB.Find(db_unic,{ _id: unic.split('-')[0], blake3: unic.split('-')[1] },'_1');
console.log(" unic_check=["+unic+"]");
console.log(" unic_check=",p);
    return (p ? p : false);
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
            else {
		if(!DB_DEBUG) resolve(numRemoved);
		else { db.persistence.compactDatafile(); db.on('compaction.done', () => { resolve(numRemoved); }); }
	    }
        });
    });
  },

  AddUpdate: function(db,query,data,upsert) { // query = { _id: id }
    console.log("~~~ DB.AddUpdate query:",query);
    console.log("~~~ DB.AddUpdate data:",data);
    return new Promise((resolve, reject) => {
	// db.update(query, data, { upsert: true }, (err, numReplaced, upsert) => {
    	db.update(query, { $set: data }, { upsert: (upsert!=undefined?upsert:true) }, (err, numReplaced, upsert) => {
            if(err) {
		console.error('Update error:', err);
		reject(err);
	    } else {
	        console.log('numReplaced:', numReplaced);
		console.log('upsert:', upsert);
		if(!DB_DEBUG) resolve( upsert && upsert._id ? upsert._id : true );
		else { db.persistence.compactDatafile(); db.on('compaction.done', () => { resolve(upsert && upsert._id ? upsert._id : true); }); }
	    }
        });
    });
  },

  Update: function(db, query, data) { // то же, просто upsert другой
    return DB.AddUpdate(db,query,data,false);
  },

  Re: function(db) {
    return new Promise((resolve, reject) => {
	db.persistence.compactDatafile();
	db.on('compaction.done', () => { resolve(); });
    });
  },

};

function unixtime() {
    return Math.floor(Date.now() / 1000);
}

function delay(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function blake3(login,password) {
    const hash = await createBLAKE3();
    hash.update(SET.unic_salt+login+password);
    return hash.digest();
}