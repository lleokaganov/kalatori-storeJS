API: API https://alzymologist.github.io/kalatori-api/

================================================================================
Frontend:

1) include DOT.js

2) Make plugin workplace: <div id='polkadot_work'></div>

2) Then make some settings:

    DOT.cx.order_id = "ORDER_12345"; // Order id
    DOT.cx.total = 12.43; // Total
    DOT.cx.name = 'StoreJS'; // not needed, your store name
    DOT.cx.ajax_url = "https://localhost:3000/kalatori"; // Backend url
    DOT.cx.mainjs = "https://site.zymologia.fi/KALATORI-JS/vendor/"; // PolkadotJS files path, download it to your site!
    DOT.cx.currency = "DOT"; // Payment currence family for this order (DOT or USD)
    DOT.cx.currences = "DOT USDC USDT"; // Allowed currences
    DOT.onpaid = function(json,info) { // callback if payment success
	alert('success payment!');
	document.location.href="/success_page.html";
    },

3) Then start engine:

    DOT.design();


<html>
<head>
    <title>Kalatori Plugin Start Example</title>
    <script src="path/to/DOT.js"></script>
</head>
<body onstart="run()">

    <div id="polkadot_work"></div>

    <script>
    function run(){ // Settings
        DOT.cx = {
            order_id: "ORDER_12345",    // Order id
            total: 12.43,               // Total amount
            name: 'StoreJS',            // Your store name (optional)
            ajax_url: "https://localhost:3000/kalatori", // Backend URL
            mainjs: "https://site.zymologia.fi/KALATORI-JS/vendor/", // Path to PolkadotJS files
            currency: "USD",            // Payment currency family for this order
            currencies: "DOT USDC USDT",// Allowed currencies
            onpaid: function(json, info) { // Callback on successful payment
                alert('Success payment!');
		if(json.redirect) document.location.href = json.redirect;
            }
        };
        DOT.design();
    }
    </script>
</body>
</html>


================================================================================

Backend endpoint /kalatori

SET={
    CUR: "DOT:,
    CUR_ALLOWED: "DOT USDC USDT DOT-L USDC-L",
    DAEMON_URL: "http://localhost:16726", // https://kalatori-js.zymologia.fi
    STORE_NAME: "Some name",
};

app.all('/kalatori', async (req, res) => {
    const fetch = (await import('node-fetch')).default;

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
	const order_id = req.body.order;

        // get real currency and total from my database
        const order = MY_OWN_DATABASE_QUERY ( "SELECT total,currency FROM db_order WHERE id=order_id" );

        // query to daemon (add 3 extra parameters to query)
        const r = await kalatori_pay("order/"+encodeURIComponent(+"_"+SET.STORE_NAME),{...req.body,...{
            amount_real: order.total,
            currency_real: order.currency,
            currency_allowed: SET.CUR_ALLOWED,
        }});

        // check payment status if paid
        if(r.payment_status && r.payment_status.toLowerCase()=='paid') {
	    MY_OWN_DATABASE_QUERY ( "UPDATE db_order SET status='paid' WHERE id=order_id" );
	    // r.redirect="/success_page.html";
        }

        return res.json(r);
    }

    res.json({error: "Unknown kalatory endpoint '"+endpoint+"'"});
});