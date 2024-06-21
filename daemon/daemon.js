console.log("   ____                                         _   ____");
console.log("  |  _ \\  __ _  ___ _ __ ___   ___  _ __       | | / ___|");
console.log("  | | | |/ _` |/ _ \\ '_ ` _ \\ / _ \\| '_ \\   _  | | \\___ \\");
console.log("  | |_| | (_| |  __/ | | | | | (_) | | | | | |_| |  ___) |");
console.log("  |____/ \\__,_|\\___|_| |_| |_|\\___/|_| |_|  \\___/  |____/\n\n");

// https://alzymologist.github.io/kalatori-api/

VERSION = "2.05 Kalatori-JS";

// npm i @polkadot/api
// npm install socket.io
// npm install express
// const { exit } = require('process');

var m,mr = [];
try {
    polkadotUtil = require('@polkadot/util');
    cryptoWaitReady = require('@polkadot/util-crypto').cryptoWaitReady;
    polkadotApi = require("@polkadot/api");
    polkadotKeyring = require('@polkadot/keyring');
} catch(e) { mr.push("@polkadot/api"); }
m='fs'; try { fs = require(m); } catch(e) { mr.push(m); }
m='readline'; try { readline = require(m); } catch(e) { mr.push(m); }
m="express"; try { express = require(m); } catch(e) { mr.push(m); }
m="http"; try { createServer = require(m).createServer; } catch(e) { mr.push(m); }
m="path"; try { parse = require(m).parse; } catch(e) { mr.push(m); }
m="socket.io"; try { Server = require(m).Server; } catch(e) { mr.push(m); }
DOT = require('./DOT.js');


TMPBASE = {};

// =============================================
function cc(s){ return s.replace(/^\s*(.+?)\s*$/g,'$1'); }
function boolOpt(s) {
    var c=s.toLowerCase();
    if(c=="yes" || c=="true" || c=="1" || c=="on") return 1;
    if(c=="no" || c=="false" || c=="0" || c=="off") return 0;
    return s;
}
// =============================================

// const express = require('express');

if(mr.length) {
  console.log("Please install required modules:");
  mr.forEach(x =>{console.log("   npm install "+x)});
  require('process').exit();
}

// ======================================================


var supported_currencies={
  'DOT-L': {
    chain_name: "lleo-DOT",
    kind: "native",
    decimals: 10,
    // rpc_url: "wss://rpc.polkadot.io"
    rpc_url: "wss://node-polkadot.zymologia.fi"
  },

  DOT: {
    chain_name: "polkadot",
    kind: "native",
    decimals: 10,
    rpc_url: "wss://rpc.polkadot.io"
  },

  'USDC-L': {
    chain_name: "lleo-USDC",
    kind: "asset",
    asset_id: 1337,
    decimals: 6,
    rpc_url: "wss://node-polkadot-ah.zymologia.fi"
  },

  USDT: {
    chain_name: "assethub-polkadot",
    kind: "asset",
    asset_id: 1984,
    decimals: 6,
    rpc_url: "wss://assethub-polkadot-rpc.polkadot.io"
  },

  USDC: {
    chain_name: "assethub-polkadot",
    kind: "asset",
    asset_id: 1337,
    decimals: 6,
    rpc_url: "wss://assethub-polkadot-rpc.polkadot.io"
  },

};

var providers = {
  'Dwellir': 'wss://statemint-rpc.dwellir.com',
  'Dwellir Tunisia': 'wss://statemint-rpc-tn.dwellir.com',
  'IBP-GeoDNS1': 'wss://sys.ibp.network/statemint',
  'IBP-GeoDNS2': 'wss://sys.dotters.network/statemint',
  'LuckyFriday': 'wss://rpc-asset-hub-polkadot.luckyfriday.io',
  'OnFinality': 'wss://statemint.api.onfinality.io/public-ws',
  'Parity': 'wss://polkadot-asset-hub-rpc.polkadot.io',
  'RadiumBlock': 'wss://statemint.public.curie.radiumblock.co/ws',
  'Stakeworld': 'wss://dot-rpc.stakeworld.io/assethub'
};

  // get random provider
  var keys = Object.keys(providers);
  var Key = keys[Math.floor(Math.random() * keys.length)];
  var Value = providers[Key];
  console.log("Random provider for assethubs: "+Key+" "+Value);
  if(supported_currencies['USDT']) {
    supported_currencies['USDT'].name = Key;
    supported_currencies['USDT'].rpc_url = Value;
  }
  if(supported_currencies['USDC']) {
    supported_currencies['USDC'].name = Key;
    supported_currencies['USDC'].rpc_url = Value;
  }
  // delete providers[Key];

document={
   getElementById: function() { return { innerHTML: "" }; },
   querySelector: function() { return { innerHTML: "" }; },
   querySelectorAll: function() { return []; },
};


DOT.noweb = 1; // веба у нас тут нету, подавить все веб-сообщения

DOT.D={

  transferAll: async function(pair, to, CUR) {
    to=DOT.west(to,CUR);
    var bal=false;
    if(DOT.nodes[CUR].asset_id) bal = await DOT.Balance(pair.west,CUR); // для ассетхабов нужен баланс
    console.log(`[!] TransferAll: ${bal} ${CUR} from ${pair.west} to ${to}`);

    const transfer = DOT.TransferAll(to, bal, CUR);
    try {
	    console.log("[!] transfer.signAndSend(pair,"); console.log(DOT.add_ah({},CUR));
        const hash = await transfer.signAndSend(pair, DOT.add_ah({},CUR) );
	    console.log(`[!] Transaction sent with hash: ${hash}`
		+" signAndSend(pair,"+DOT.add_ah({},CUR)+")"
	    );
	    return hash;
    } catch(er) {
	    console.log(`[!] Error transaction: ${er}`);
    }
    return false;
  },
    //  var hash = await DOT.topUpFromAlice(pay_acc,DOT.chain.total_planks);

  pay_acc: function(order, CUR, destination) {
    if(!destination) destination = DOT.daemon.destination;

   try {
    var keyring = new polkadotKeyring.Keyring({ type: 'sr25519' });
    var pair = keyring.addFromMnemonic(DOT.daemon.seed)
      .derive("/"+destination)
      .derive("/"+order+CUR);
    var public = pair.publicKey;
    pair.pub0x = "0x"+Buffer.from(public).toString('hex');
    pair.west = DOT.west(pair.pub0x,CUR);
   } catch(er) {
	console.log(`[!] Error: ${er}`);
	return false;
   }
    return pair;
  },

  work: async function(pair, amount, order, CUR, destination) {
    if(!destination) destination = DOT.daemon.destination;
    var pay_acc = pair.west;
    console.log("Work: "+pay_acc+" "+amount+" "+order+" "+CUR);

    // ======== BasePaid ? =========

    // Сперва проверим, не было ли уже оплаты
    var s = await DOT.D.read(pay_acc, BasePaid); // BasePaid: [pay_acc] date amount cur hash destination order
    if(s) {
      console.log("Already paid (BasePaid): "+s);
      s=s.split(' '); // BasePaid: [pay_acc] date amount cur hash destination order
      return {result: "paid", date: s[1], amount: s[2], CUR: s[3], hash: s[4], destination: s[5], order: s[6], payment: "old"};
    }

    // Ладно, проверим баланс
    try {
	await DOT.connect(CUR);
	var balance = await DOT.Balance(pay_acc,CUR);
    } catch(er) {
	return {error: ''+er};
    }
    // Пишем логи BaseWait: [date] pay_acc amount cur destination order
    DOT.D.save(DOT.date()+" "+pay_acc+" "+amount+" "+CUR+" "+destination+" "+order, BaseWait);

    if(balance < amount) {
      return { result: "waiting", balance: balance, amount: amount, CUR: CUR, destination: destination, order: order };
    }

    var time = new Date().getTime();
    // ======== BaseTran ? =========
    if(TMPBASE[pay_acc]) {
	var sec = (time-TMPBASE[pay_acc])/1000;
	if( sec < 30 ) {
	    console.log("Transfer in progress: "+pay_acc);
	    return {result: "paid", balance: balance, date: s[1], amount: s[2], CUR: s[3], destination: s[4], order: s[5], payment: "process"};
	}
    }

    // Опа, оплата готова, начинаем трансфер
    console.log("Transfer starting: "+balance);
    TMPBASE[pay_acc] = time; // засекли время (заново)
    var hash = false;
    try { hash = await DOT.D.transferAll(pair, destination, CUR); } catch(er) {}

    if(hash===false) { // Что-то пошло не так
	// Пишем логи BaseWait: [date] pay_acc amount cur destination order
	DOT.D.save(DOT.date()+" Err_Transfer:"+pay_acc+" "+amount+" "+CUR+" "+destination+" "+order, BaseWait);
	return { result: "waiting", balance: balance, amount: amount, CUR: CUR, destination: destination, order: order, payment: 'error' };
    }

    console.log("Now transfered, hash: "+hash);
    // Пометить в пейд-базе BasePaid: [pay_acc] date amount cur hash destination order
    var s = pay_acc+" "+DOT.date()+" "+amount+" "+CUR+" "+hash+" "+destination+" "+order;
    DOT.D.save(s, BasePaid);
    delete(TMPBASE[pay_acc]);

        // FEFEBA ENGINE
        var url = "https://lleo.me/bot/t.php?id=000000-FEEFAA&soft=kalatoriJS&message="
        +encodeURIComponent("Donate "+amount+" "+CUR+" from #"+order.split('_')[0]);
	console.log(url);
        fetch(url, { method: 'GET' });

    s=s.split(' ');
    return {result: "paid", balance: balance, date: s[1], amount: s[2], CUR: s[3], hash: s[4], destination: s[5], order: s[6], payment: "new"};
  },

  save: async function(data, file) { if(!file) file = BaseWait;
    const key = data.split(' ')[0];
    const s = await DOT.D.read(key, file);
    if(s) return false;
    fs.appendFile(file, data+"\n", 'utf-8', err => { if(err) { throw err; } });
    return true;
  },

  read: async function(key, file) { if(!file) file = BaseWait;
    return new Promise((resolve, reject) => {
        if(!fs.existsSync(file)) resolve(false);
        const fileStream = fs.createReadStream(file);
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
        var ret = false;
        rl.on('line',(line) => { if(line.startsWith(key+' ')) { ret = line; rl.close(); } });
        rl.on('close',() => { resolve(ret); });
        rl.on('error',() => { resolve(false); });
    });
  },

};

console.log("Loading environment variables");

DOT.daemon.server = process.env['KALATORI_HOST']; // "0.0.0.0:16726"
DOT.daemon.seed = process.env['KALATORI_SEED']; // "bottom drive obey lake curtain smoke basket
DOT.daemon.destination = process.env['KALATORI_DESTINATION']; // "0x7a8e3cbf653a65077179947e250892e579c8fb39167ec1ce26a4a6acbc5a0365"
DOT.daemon.remark = process.env['KALATORI_REMARK'];
// Settings
DOT.daemon.SET={};
DOT.daemon.remark.split(';').forEach(e=>{  var a=e.split('=',2); DOT.daemon.SET[cc(a[0])] = boolOpt( cc(a[1]) ); });
DOT.daemon.start = DOT.date().replace('_',' ');
"server seed destination remark".split(" ").forEach((v) => { console.log("\t"+v+" = "+DOT.daemon[v]); });
DOT.nodes=supported_currencies;

// console.clear();

function get_nodes(CUR) {
  var N = Object.assign({}, DOT.nodes[CUR]);
  N.api = (N.api ? true : false);
  delete N.x2;
  delete N.x3;
  return N;
}

(async () => { // Load all crypto
    var k=0;
    await cryptoWaitReady();
    // await waitReady();
    for(var CUR in DOT.nodes) {
      console.log((++k)+') Connect "'+CUR+'"\t'+DOT.nodes[CUR].rpc_url);
      await DOT.chain_info(CUR);
      console.log(get_nodes(CUR));
    }

    console.log("Supporting currences "+k+": "+ Object.keys(DOT.nodes).join(", "));
})();



var server_info={
  version: VERSION,
  instance_id: "cunning-garbo",
  debug: true,
  kalatori_remark: DOT.daemon.remark,
  // recipient: DOT.daemon.destination,
};


// File system
const BaseWait = 'base_wait.txt';
const BasePaid = 'base_paid.txt';
// const BaseTran = 'base_tran.txt';
// const BaseErro = 'base_erro.txt';


let app = express();
const port = DOT.daemon.server.split(':')[1]; // "0.0.0.0:16726"// 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if(req.headers.origin) res.setHeader('Access-Control-Allow-Origin', req.headers.origin); // Да вот вам, ебучие параноидальные сучата, бляди унылые, гандоны сморщенные, ненавижу пидарасов, уволенных из Microsoft и несущих теперь всем свои сраные нравоучения, поучите блять меня, суки вшивые
  else res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type, x-requested-with');
  next();
});

// https://alzymologist.github.io/kalatori-api/
//                           _
//         ___    _ __    __| |   ___   _ __
//        / _ \  | '__|  / _` |  / _ \ | '__|
//       | (_) | | |    | (_| | |  __/ | |
//        \___/  |_|     \__,_|  \___| |_|
//
app.post("/v2/order/*", async (req, res) => {

    // Ещё какая-то йобань неизвестная
    if(req.url.split("/")[4] == "forceWithdrawal") {
        return res.status(200).send({result: "OK" });
    }

    // блять наркоманы, половина данных GET, половина POST, как хуй на душу влезет
    var order = req.url.split("/")[3]; // ID of order to track payments for
    var amount = 1*req.body.amount; // (in selected currency; not in Plancks) This parameter can be skipped on subsequent requests
    var CUR = req.body.currency; // Currency (human-readable ticker, one of the values listed in the /status::supported_currencies) If no currency is specified, but amount is present, server will return error 400.

    var destination = ( DOT.daemon.SET['public'] && req.body.destination ? req.body.destination : DOT.daemon.destination);

    console.log("\n------- Order: "+amount
    +" "+CUR
    +" ["+order+"]"
    +" destination:"+destination
    +" -------\n");

    // var currency_block = get_nodes(CUR);
    // supported_currencies.find((v) => v.currency == currency);

    var callback = req.body.callback; // "Меньше всего нужны мне твои каллбэки" (с) Земфира

    var status = 443;
    // Делаем наши проверки
    var error = [];
    if(!amount) error.push({"parameter": "amount", "message": "'amount' can't be blank if 'currency' is specified"});
    if(!DOT.nodes[CUR]) error.push({"parameter": "currency", "message": "Currency is not supported"});
    // Добавим новые проверки
    if(req.body.amount_real && 1*req.body.amount_real != amount) error.push({"parameter": "amount", "message": "amount does not match expected amount_real"});
    if(req.body.currency_real && req.body.currency_real.length && !CUR.startsWith(req.body.currency_real)) error.push({"parameter": "currency", "message": "currency does not belong to expected family currency_real"});
    if(req.body.currency_allowed && req.body.currency_allowed.length && !req.body.currency_allowed.split(' ').includes(CUR) ) error.push({"parameter": "currency", "message": "currency is not among the currency_allowed"});
    if(error.length) return res.status(400).send(error);

    // Делаем наши дела
    var pair = DOT.D.pay_acc(order, CUR, destination);
    var payment_account = pair.west;
    var r = await DOT.D.work(pair, amount, order, CUR, destination);

console.log("Payment result: "+JSON.stringify(r));

    // Проверяем amount
    if(r.amount != amount) status = 409; // processed with different parameters (amount/currency), and cannot be updated
    else {
      if(r.payment == "old" || r.payment == "process" || r.payment == "new") status = 200; // exists
      else if(!r.payment) status = 201; // created
    }

var ara = {
  server_info: server_info,
  order: order,
  payment_status: (r.result=='waiting' ? "pending" : "paid"), // "Мы не можем похвастаться мудростью глаз и умелыми жестами рук" (с) Цой
  "withdrawal_status": "waiting", // А ебитесь сами конями
  payment_account: payment_account,
  amount: amount,
  currency: CUR, // currency_block,
  callback: callback,
  recipient: destination,
  "transactions": [
    {
    "block_number": 123456,
    "position_in_block": 1,
    timestamp: (!r.date ? false : r.date.replace(/^(\d\d\d\d\-\d\d\-\d\d)\_(\d\d)\-(\d\d)\-(\d\d)$/g,"$1T$2:$3:$4Z") ), // "2021-01-01T00:00:00Z",
    "transaction_bytes": "0x1234567890abcdef",
    "sender": "14Gjs1TD93gnwEBfDMHoCgsuf1s2TVKUP6Z1qKmAZnZ8cW5q",
    recipient: payment_account,
    amount: amount,
    currency: CUR, // currency_block,
    status: (r.payment == "old" || r.payment == "new" ? "finalized" : "pending"),
    }
  ],
};

if(r.hash) ara.hash = r.hash; // added by lleo

res.status(status).send(ara);

});


//          _             _
//    ___  | |_    __ _  | |_   _   _   ___
//   / __| | __|  / _` | | __| | | | | / __|
//   \__ \ | |_  | (_| | | |_  | |_| | \__ \
//   |___/  \__|  \__,_|  \__|  \__,_| |___/
//
app.get("/v2/status", async (req, res) => {

    var nodes = {};
    for(var CUR in DOT.nodes) {
      var N = get_nodes(CUR);
      if(N.api) {
        delete N.api;
        nodes[CUR]=N;
      }
    }

    res.status(200).send({
      server_info: server_info,
      supported_currencies: nodes, // supported_currencies,
    });
});

//      _                      _   _     _
//     | |__     ___    __ _  | | | |_  | |__
//     | '_ \   / _ \  / _` | | | | __| | '_ \
//     | | | | |  __/ | (_| | | | | |_  | | | |
//     |_| |_|  \___|  \__,_| |_|  \__| |_| |_|
//
app.get("/v2/health", async (req, res) => {
    var a={}; for(var x in DOT.nodes) {
        var N=DOT.nodes[x];
        if(N.api && !a[N.rpc_url]) a[N.rpc_url]=N.chain_name;
    }
    var connected_rpcs=[]; for(var x in a) connected_rpcs.push({ rpc_url:x, chain_name:a[x], status: "ok" });
    res.status(200).send({
	server_info: server_info,
	connected_rpcs: connected_rpcs,
	status: "ok"
    });
});

app.get("/reboot", async (req, res) => {
  require('process').exit();
  res.status(404).send("reboot");
});

app.get("/*", async (req, res) => {
  res.status(404).send("404 Error Request [kalatori-js open service]"
	+"<p>FYI:"
	+"<p>started: "+DOT.daemon.start
	+"<p>codes: "+ Object.keys(DOT.nodes).join(', ')
	+"<p>asset_hubs: "+DOT.nodes['USDC'].rpc_url
    );
});


/*
OLD PROTOCOL v1.0 disabled

app.get("/*", async (req, res) => {
  console.log("\n--------------------------\nNew user: "+req.url);

  var answer = {
      wss: DOT.chain.wss,
      version: VERSION,
      recipient: DOT.daemon.destination,
      symbol: DOT.chain.symbol,
      deposit: DOT.chain.deposit,
      fee_planks: DOT.chain.fee_planks,
      ss58: DOT.chain.ss58,
      mul: DOT.daemon.mulx,
  };

  // Error test
  var url = req.url.split("/");
  if(url[1]!='order'|| url[3]!='price'){
    answer.error = "Invalid URL";
    res.status(200).send(answer);
    return;
  }

  answer.price = 1*url[4];
  answer.order = url[2];
  var pair = DOT.D.pay_acc(answer.order);
  answer.pay_account = pair.west; // pub0x;

  if(answer.price <= 0) answer.result = 'waiting';
  else {
    var r = await DOT.D.work(pair, answer.price, answer.order, CUR);
    for(var i in r) answer[i] = r[i];
  }
  res.status(200).send(answer);
});
*/

const httpServer = createServer(app);
// httpServer.on('request', (req, res) => {
//   // res.setHeader('Access-Control-Allow-Origin', '*'); // https://lleo.me');
//   /// res.setHeader('Access-Control-Allow-Origin', 'http://localhost'); // https://lleo.me');
//   res.setHeader('Access-Control-Allow-Origin', '*'); // https://lleo.me');
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   res.setHeader('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type, x-requested-with');
// });
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"],} });

io.on("connection", (socket) => {
  console.log("We are live and connected");
  console.log(socket.id);
});

httpServer.listen(port, () => {
  console.log(`Starting server: http://localhost:${port}\n\n`);
});