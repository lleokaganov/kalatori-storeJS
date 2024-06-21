// Shop engine




if(typeof(SHOP_SET)) SHOP_SET={
    ipcountry: "US",
    CUR: "DOT",
    CUR_ALLOWED: "USDC-L DOT-L",
    url: "http://10.1.1.7:3000/{action}",
    countries_txt: "./template/countries.txt",
};



page_onstart.push("SHOP.init()");

SHOP={

//           ___    ____    ____    _____   ____
//          / _ \  |  _ \  |  _ \  | ____| |  _ \
//         | | | | | |_) | | | | | |  _|   | |_) |
//         | |_| | |  _ <  | |_| | | |___  |  _ <
//          \___/  |_| \_\ |____/  |_____| |_| \_\
//

    error: function(s){ console.error(s); idie(s); return false; },
    ORDER: {

	template_list: `
<table class='shop_order_table'>{for(orders):

<tr valign='top' class='shop_order' oid='{#oid}'>

    <td>{for(items):
	<div style='font-size:10px; white-space:nowrap;'>
	    <img class='shop_order_img' src='{#item.imgs.0}'> <span class='shop_order_span'>{#item.name}</span>
	</div>
    }</td>

    <td>{case(CurrentStatus):
	    {new: <font color='grey'>Waiting for payment</font>}
	    {processing: <font color='lightgreen'>Payd, processing</font>}
	    {shipped: <font color='lightgreen'>Shipped</font>}
	    {delivered: <font color='green'>Delivered, closed</font>}
	    {*: <font color='red'>{#CurrentStatus}</font>}
	}
	<p>
	{for(events):
	<div class='br'>{#eTime} {case(Status):
	    {new: Waiting for payment}
	    {processing: Payd, processing}
	    {shipped: Shipped}
	    {delivered: Delivered, closed}
	    {cancelled: Cancelled}
	    {returned: Returned}
	    {*: unknown error}
	}</div>
	<div class='br'>{#Comment}</div>
    }</td>

    <td>{#total} {#CUR}</td>

</tr>

}</table>
`,

    list: async function() {
        var pp = await SHOP.API('orders');
	if(!pp) return salert("You have no orders",1000);

	// подгрузить все товары, о которых ещё нет локальной информации
	var items={};
	pp.forEach(p => { p.List.split('|').forEach(d=>{ d=1*d.split(':')[0]; if(!SHOP.ITEMS[d]) items[d]=1; }) });
	items = Object.keys(items).join(',');
	if(items!='') {
	    // Подгрузить в SHOP.ITEMS недостающие
	}

	// подгрузить все истории заказов
	var events=[];
	pp.forEach(p => { events.push(p.oid); });
        events = await SHOP.API('events',{oid: events.join(',')});
	if(!events) return SHOP.error('Error events history');

	// собрать
	pp.forEach(p => {
		// Расшифровать все товары
		p.items=[];
		p.List.split('|').forEach(d=>{
		    var [id,quantity] = d.split(':');
		    p.items.push({item:SHOP.ITEMS[id],quantity:quantity});
		});
		// Расшифровать все истории
		p.events=[];
		events.forEach(e => { if(p.oid==e.oid) p.events.push(e) });
		// Расшифровать адрес
		// надо ли?
	});

	// Сортируем pp по новейшим событиям в истории:

	pp.sort((a, b) => {
	    const maxTimeA = Math.max(...a.events.map(event => new Date(event.eTime).getTime()));
	    const maxTimeB = Math.max(...b.events.map(event => new Date(event.eTime).getTime()));
	    return maxTimeB - maxTimeA;
	});

// dier(pp); return;

	ohelpc('orders','&#128203; my orders',
	    mpers(SHOP.ORDER.template_list,{orders:pp, CUR: SHOP_SET.CUR})
	);

  },


    },




//             _      ____    ____    ____
//            / \    |  _ \  |  _ \  |  _ \
//           / _ \   | | | | | | | | | |_) |
//          / ___ \  | |_| | | |_| | |  _ <
//         /_/   \_\ |____/  |____/  |_| \_\
//

    ADDR: {

	template: {

	    addresses: `
{for(addresses):

<div aid='{#aid}' class='shop_address'>
    <label>
	<input class='mv' name="addr" type="radio" value="{#addrnum}"{checked}> {#Fullname}, {#Address}, {#City}, {#Zip}, {country}<br>{#Email}, {#Phone}, {#aComment}
    </label>
    <div style='position:absolute;top:0;right:0;'>
	<input type='button' class='kn mv' value='delete' onclick='SHOP.ADDR.del()'>
	<input type='button' class='kn mv' value='edit' onclick='SHOP.ADDR.edit()'>
    </div>
</div>
}

<div align='right'><input type='button' class='kn mv' value='new' onclick='SHOP.ADDR.new()'></div>
`,

	    new:`
<div style='position:relative'>
<i class="can4" tiptitle="Close" onclick="SHOP.ADDR.reload()"></i>
<p><form id='shop_addressForm'>
<input name='aid' type='hidden' value='{#aid}'>
<table border=0 cellspacing='5'>
<tr><td>Full name: </td><td><input name='Fullname' type='text' class='td_addr' value='{#Fullname}'></td></tr>
<tr><td>Country: </td><td><select name='Country' class='countries' selected='{#Country}'>{countries}</select></td></tr>
<tr><td>City: </td><td><input name='City' type='text' class='td_addr' value='{#City}'></td></tr>
<tr><td>Address: </td><td><input name='Address' type='text' class='td_addr' value='{#Address}'></td></tr>
<tr><td>Zip/Post code: </td><td><input name='Zip' type='text' size='7' value='{#Zip}'></td></tr>
<tr><td>Email: </td><td><input name='Email' type='text' class='td_addr' value='{#Email}'></td></tr>
<tr><td>Phone: </td><td><input name='Phone' type='text' class='td_addr' value='{#Phone}'></td></tr>
<tr><td>Comment: </td><td><textarea name='aComment' class='td_addr' style='height:30px'>{#aComment}</textarea></td></tr>
</table>
</form>
<input type='button' class='kn mv' value='Save' onclick='SHOP.ADDR.save()'>
</div>
`,

	},

	// load countries base - once
	load_countries: async function() {
	    if(!this.countries_opt) {
		var s = await loadFile(SHOP_SET.countries_txt);
		var cs = [], co = '';
		s.split("\n").forEach(l => { if(l.indexOf('|')>=0) cs.push(l.split('|')); }); // KE|..|Кения|Kenya|Kenya
		cs.forEach(l => co+="<option value='"+l[0]+"'>"+l[3]+"&nbsp;&nbsp;&nbsp;&nbsp;"+l[1]+"</option>" );
		this.countries = cs;
		this.countries_opt = co;
	    }
	},

	// Print address_page 'cart_address'

	reload: async function() {
	    var div = dom('cart_address'); if(!div) return alert('errdiv');
	    dom(div,ajaxgif);
	    var r = await SHOP.API('addresses'); if(!r) return SHOP.error('Error events history');
    	    var R={};
	    if(!r) return R;
	    for(var p of r) {
		if(p._id) p.aid=p._id; // NoDB patch
		// Fix country, checked
		var c = SHOP.ADDR.countries.find(x => x[0] === p.Country);
		p.country = c[1]+'&nbsp;'+c[3];
		p.def = 1*p.def;
		p.checked = (p.def ? ' checked' : '');
		R[''+p.aid]=p;
	    }
	    SHOP.ADDR.all=R;
	    dom(div,mpers(SHOP.ADDR.template.addresses,{addresses: Object.values(R)}));
	},

	setdef: function(aid) {
	    for(var i in SHOP.ADDR.all) {
		SHOP.ADDR.all[i].def=(i==aid?1:0);
		SHOP.ADDR.all[i].checked=(i==aid?' checked':'');
	    }
	},

	div: function(){ return event.target.closest('DIV.shop_address'); },
	aid: function(e){ if(!e) e=event.target; return e.closest('DIV.shop_address').getAttribute('aid'); },

	del: async function(){
	    if(!confirm("Delete address?")) return;
	    var div = SHOP.ADDR.div(), aid = SHOP.ADDR.aid();
	    var s = await SHOP.API('del_address',{aid:aid});
	    if(!s) return SHOP.error('Server error');
	    if(s=='OK') SHOP.ADDR.reload();
	},

	edit: function(){
	    var aid = SHOP.ADDR.aid();
	    dom('cart_address', mpers( SHOP.ADDR.template.new, {...this.all[aid],...{ countries: SHOP.ADDR.countries_opt }} ));
	    SHOP.fixSelect();
	},

	save: async function(){
	    console.log('Address save');

	    await SHOP.unis_check(); // получим unis если не было

	    var div = SHOP.ADDR.div();
	    var ara={}, e=dom('shop_addressForm'); if(!e) return;
	    var errors=[];
	    for(var i=0;i<e.elements.length;i++) {
		var q = e.elements[i];
		q.classList.remove('shop_input_error');
		console.log(q.name+' = '+q.value);
		if(!in_array(q.name,['aid','Email','Phone','aComment','Zip']) && q.value == '') {
		    errors.push(q.name);
		    q.classList.add('shop_input_error');
		}
		ara[q.name] = q.value;
	    }
	    if(!errors.length) {
		var aid = await SHOP.API('add_address',{address:ara});
		if(aid) SHOP.ADDR.reload();
		else return SHOP.error('Server error');
	    } else {
		console.log(errors);
	    }
	},

	new: function() {
	    dom('cart_address', mpers( SHOP.ADDR.template.new, {
		    countries: SHOP.ADDR.countries_opt,
		    Country: SHOP_SET.ipcountry,
	    } ));
	    SHOP.fixSelect();
	},

    },






    API: async function(action,data) {
	if(!data) data={};
	data.action = action;
	data.num = num;
	data.unic = (typeof(unis)=='undefined' ? false : unis);
	var url = mpers(SHOP_SET.url,data);
	try {
    	    const response = await fetch(url, {
        	method: 'POST',
        	body: JSON.stringify(data),
    	    });
    	    if(!response.ok) throw new Error(`HTTP error status: ${response.status}`);
	    const r = await response.json();
	    if(r.error || !r.result) return SHOP.error('Error API.'+action+': '+r.error);
	    return r.result;
	} catch(er) {
	    return SHOP.error('Error during API call: '+er);
	}
    },

    CART: {},
    ITEMS: {},

    size: 210,

    template_cart: `<div class='shop_cart_img'><div class='shop_cart_img1 mv0' onclick='SHOP.myCart()'>&#128722;&nbsp;<span id='shop_cart_n'>{n}</span></div>
<div id='shop_cur_select' style='border:1px solid #ccc;'>{#CUR}</div>
</div>`,

    template_orders: `<div class='shop_orders_img mv0' onclick='SHOP.ORDER.list()'>&#128203;</div>`,

// Список товаров на экране
    template_items: `<div class='shop_items thmbns'>{for(items):

<ins shop_item='{id}' class='shop_item thmbn' style='width:{size}px'>
  <div class='shop_rth rth'>
    <div class='shop_name'>{#name}</div>
    <div class='shop_imgs'>
	    <center><img class='shop_img' src='{#imgs.0}'></center>
    </div>
    <div class='shop_body'><div>{#nl2br:Text}</div></div>
    <br class='q'>
    <div class='r'>{#quantity} pcs</div>
    <div class='shop_price'>{#price} {CUR}</div>
    <input class='shop_add' type='button' value='&#128722; Add to cart' onclick='SHOP.addCart()'>
  </div>
</ins>

}</div>`,

// Список товаров в корзине
    template_tab_items: `<table class='shop_tab'>{for(items):
<tr class='shop_tab_tr' shop_item='{#id}'>
    <td class='shop_tab_img'>
	    <center><img class='shop_img' src='{#imgs.0}'></center>
    </td>
    <td class='items-row'>
        <b>{#name}</b>
	<p><div class='shop_body'><div>{#nl2br:Text}</div></div>
    </td>
    <td><input type='text' size='2' value='{#quantity}' onchange='SHOP.nChange()'> * {#price} {#CUR}</td>
    <td align='right' class='shop_total'><span>{#total}</span> {#CUR}</td>
</tr>
}</table>`,

 checkout: async function() {
    var r={
	    list: JSON.parse(JSON.stringify(SHOP.CART)),
	    total: SHOP.cart_calc_total(),
	    currency: SHOP_SET.CUR,
    };
    var e = dom('cart_address');
    if(e) {
	var i = e.querySelector("INPUT[type='radio']:checked");
	if(!i) return salert("Select address!",2000);
	r.aid = SHOP.ADDR.aid(i);
    }
    var r = await SHOP.API('order',r);
    if(!r) return SHOP.error('Server error: checkout');
    ohelpc('shop_pay','Payment',"<div id='polkadot_work'>"+ajaxgif+"</div>");
    LOADS("./DOT.js?"+Math.random(),function(){
        DOT.cx.order_id = r.oid;
        DOT.cx.total = r.total;
        DOT.cx.name = 'LLeoStoreJS';
	DOT.cx.ajax_url = mpers(SHOP_SET.url,{action:'kalatori'});
        DOT.cx.mainjs = "https://site.zymologia.fi/KALATORI-JS/vendor/";
        DOT.cx.currency = SHOP_SET.CUR; // DOT
	DOT.cx.currences = SHOP_SET.CUR_ALLOWED; // DOT-L USDC USDT
	DOT.onpaid = function(json,info) {
	    dom('polkadot_work',"Tnx a lot!!!");
	    alert('success payment!');
	},
        DOT.design();
    });
 },

 checkoutAnswer: function(s){
	dier(h(s));
 },

  nChange: function() {
    var ev = window.event.target;
    var tr = ev.closest('.shop_tab_tr');
    var item = tr.getAttribute('shop_item');

    var n = 1*ev.value;
    if(isNaN(n)) return;

    if(n==0) {
	tr.parentNode.removeChild(tr);
        delete(SHOP.CART[item]);
    } else {
	SHOP.CART[item] = n;
    }

    tr.querySelector(".shop_total SPAN").innerHTML = SHOP.ceil(n * SHOP.ITEMS[item].price);
    SHOP.cartChanged();
  },

  ceil: function(x) { return Math.ceil(100*x)/100; },



  myCart: async function() {
    var items=[];
    var total=0;
    var noaddr=1;

    for(var item in SHOP.CART) {
	var ara = SHOP.ITEMS[item];
	if(!ara) { delete(SHOP.CART[item]); SHOP.cartChanged();	continue; } // ну нет такого товара больше
	ara.quantity = SHOP.CART[item];
	ara.total = SHOP.ceil( ara.price * ara.quantity );
	total += ara.total;
	items.push(ara);
	noaddr *= ara.noaddr;
    }

    if(total) {
	ohelpc('cart','&#128722; my cart',
	    mpers(SHOP.template_tab_items,{items:items,CUR: SHOP_SET.CUR})
	    +"<div id='cart_address' class='shop_delivery_address'></div>"
    	    +"<div class='mv0 shop_tab_total' onclick='SHOP.checkout()'>Checkout <span id='shop_total'>"+SHOP.ceil(total)+"</span> "+SHOP_SET.CUR+"</div>"
	);
	if(noaddr==0) {
	    await SHOP.ADDR.load_countries();
	    dom('cart_address',ajaxgif);
	    SHOP.ADDR.reload();
	}
    }
  },

  addCart: function(e) {
    var ev = window.event.target;
    e = ev.closest('ins');
    var item = e.getAttribute('shop_item');
    if(typeof(SHOP.CART[item])!='number') SHOP.CART[item]=0;
    SHOP.CART[item]++;
    SHOP.cartChanged();
  },

 cartLoad: function(){
    var s=f_read('shop_cart');
    if(!s || s.indexOf(':')<0) return;
    s=s.split(',');
    SHOP.CART={};
    for(var l of s) {
	l=l.split(':');
	SHOP.CART[l[0]]=1*l[1];
    }
 },

 cartChanged: function(){
    var o=[]; for(var item in SHOP.CART) { var n=SHOP.CART[item]; if(n) o.push(item+':'+n); }
    f_save('shop_cart',o.join(','));
    dom('shop_cart_n', SHOP.cart_calc_n() );
    dom('shop_total', SHOP.cart_calc_total() );
 },

 init: async function() {
    unis=f_read('unis');
    SHOP.cartLoad();
    SHOP.load();
 },


 unis_check: async function() {
    // restore unis
    unis=f_read('unis');
    if(!unis) {
	unis = await SHOP.API('unic_create');
        if(!unis) return SHOP.error('Server error: unic_create');
	f_save('unis',unis);
	console.log('Unis created: ',r);
    }
 },

 load: async function(from,limit) {

    // место магазина
    var e = dom('shop_place'); if(!e) { document.body.id='shop_place'; e=document.body; } // return SHOP.error('no e');
    // currency
    var l = e.getAttribute('shop_curency'); if(l) SHOP_SET.CUR=l;

    var r = await SHOP.API('items',{
	    from: (1*from ? from : 0),
	    limit: (1*limit ? limit : 10000)
    });
    if(!r) return SHOP.error('Server error: load');

    for(var p of r) {
	if(p._id) p.id=p._id;
	SHOP.ITEMS[p.id] = p; // запомнить
    }

    dom(e,"<style>"+SHOP.css+"</style>"
	+mpers(SHOP.template_cart,{n:SHOP.CART.length,CUR:SHOP_SET.CUR})
	+mpers(SHOP.template_orders,{n:SHOP.CART.length})
	+mpers(SHOP.template_items,{items:r, CUR:SHOP_SET.CUR, size:SHOP.size})
    );

    SHOP.load_curs();

    // количество позиций
    dom('shop_cart_n', SHOP.cart_calc_n() );
 },

 load_curs: async function(){
    var C = await loadFile('https://lleo.me/tmp/currences.json');
    C = JSON.parse(C);
    var cur={};
    var o='';
    for(var c in C.currences) {
	var img=C.names[c][1]; if(img.length > 5) img="<img src='"+h(img)+"' width='16' height='16'>";
	cur[c]={
	    code:c,
	    value:C.currences[c],
	    name:C.names[c][0],
	    img:img
	};
	o+=mpers("<option value='{#v.code}'{sel}>{#v.name}</option>",{v:cur[c],sel:(cur[c].code==SHOP_SET.CUR?' selected':'')});
    }
    o="<select>"+o+"</select>";
    // dier(cur);
    dom('shop_cur_select',o);
 },

 cart_calc_n: function() {
    var k = 0; Object.entries(SHOP.CART).forEach(([key, value]) => { k += 1*value; });
    return k;
 },

 cart_calc_total: function() {
    var k = 0; Object.entries(SHOP.CART).forEach(([key, value]) => {
	k += SHOP.ceil(value * SHOP.ITEMS[key].price);
    });
    return SHOP.ceil(k);
 },

// =====================================================

 fixSelect: function(){
    document.querySelectorAll('SELECT').forEach(e => {
	var x = e.getAttribute('selected');
	e.querySelectorAll('option').forEach(o => {
	    if(o.value != x) o.removeAttribute("selected");
	    else o.setAttribute("selected","1");
	});
    });
 },

 css: ``,

};
