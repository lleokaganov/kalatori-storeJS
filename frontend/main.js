
var lovilka='';
var alertmajax=0;
var mojaxsalt='';

if(typeof(page_onstart)=='undefined') page_onstart=[];
if(typeof(useropt)=='undefined') useropt={};
if(typeof(wintempl)=='undefined') wintempl="<div id='{id}_body'>{s}</div><i id='{id}_close' title='Close' class='can'></i>";
if(typeof(wintempl_cls)=='undefined') wintempl_cls='pop2 zoomIn animated';
if(typeof(mnogouser)=='undefined') mnogouser=0;
if(typeof(admin)=='undefined') admin=0;
if(typeof(adm)=='undefined') adm=1;
if(typeof(num)=='undefined') num=1;
if(typeof(unic)=='undefined') unic=0;
if(typeof(www_design)=='undefined') www_design='./';

// удаляем ненужные history закрытых окон
/*
if(window.addEventListener && window.history) setInterval(function() {
    if(Object.keys(mHelps).length) return;
    var w=document.location.href.split('?')[1];
    if(w && w.indexOf('win_')===0 && window.history.back) window.history.back();
},10);
*/

if(user_opt('ani')) page_onstart.push("LOADS(www_css+'animate.css',function(){wintempl_cls=wintempl_cls.replace(/animated/g,'')},function(){useropt.ani=0});");
else wintempl_cls=wintempl_cls.replace(/animated/g,'');

if(user_opt('er')) window.onerror=function(e,url,n) { // стукач об ошибках JS у пользователей
    console.log('LL_ERROR:'+e+"|"+n+"|"+url+'|'+lovilka+'|'+s);
    return true;
}

var alertmajax=0; // if(admin) setTimeout('var alertmajax=1',4000);

// обращения, которые обязаны идти только через секретный xdomain
var ifrnames=[
    'editor.php:editform',
    // 'editor.php:tags',
    'editor.php:settings_win',
    'editor.php:editform_new',
    'editor.php:newform',
    // 'editor.php:findreplace',
    'editor.php:xclipboard',
    'adminsite.php:edit',
    // 'adminsite.php:new',
    'login.php:getinfo' /*,'foto.php:album'*/
];

//function basename(path) { return path.replace(/^.*[\/\\]/g,''); }
function c_save(n,v,d,p) {
    // d=window.navigator.userAgent.indexOf('NokiaE90')<0?d:0; // заебала Нокия не понимать куки для домена
    if(v===false||v===null) return false; var N=new Date(); N.setTime(N.getTime()+(v==''?-1:3153600000000));
    document.cookie=n+'='+encodeURIComponent(v)+';expires='+N.toGMTString()+';'
    +'SameSite=Lax;'
    +'path='+(p==undefined?'/':p)+';'+(d!==0?'domain=.'+MYHOST+';':'');
}

var zindexstart=100; // начало отсчета слоев для окон
var activid=false; // id активного окна
var hid=1; // счетчик окон
var mHelps={}; // массив для окон: id:[hotkey,zindex]
var hotkey=[]; // [code,(ctrlKey,shiftKey,altKey,metaKey),func]
var hotkey_def=[]; // хоткеи главного окна
var nonav=0; // отключить навигацию и буквенные хоткеи И СИСТЕМУ ОПЕЧАТОК

if(window.top===window && mnogouser) page_onstart.push("if(ux=='c' || 1) ifhelpc(xdom,'xdomain','xdomain');");

if(admin) page_onstart.push("LOADS(www_js+'adm.js?rand='+Math.random(),function(){adm()})");

//========================================================
if(typeof(hotkey_default)!='function') hotkey_default=function(){
    hotkey=[];

    setkey('Escape','',function(e){ clean(isHelps())},true,1); // закрыть последнее окно
    setkey('Enter','ctrl',function(e){if(!isHelps()) helper_go()},true,1); // если не открыто окон - окно правки

    if(adm) {
	setkey('Digit1','ctrl',function(e){keyalert=(keyalert?0:1);talert('Key scan '+(keyalert?'ON':'off'),1000);},false); // включение сканкодов
	// setkey('x','alt',function(e){alert('Scroll W/H='+getScrollW()+'/'+getScrollH()+'\ndocument.compatMode='+document.compatMode+'\nwindow.opera'+window.opera+'\ngetWin W/H='+getWinW()+'/'+getWinH()+'\ngetWin W0/H0='+getWinW0()+'/'+getWinH0()+'\ngetDoc W/H='+getDocW()+'/'+getDocH());},false);
	setkey('KeyE','',function(e){majax('editor.php',{a:'editform',num:num,comments:(dom('commpresent')?1:0)})},false); // редактор заметки
	setkey('KeyN','',function(e){majax('editor.php',{a:'newform',hid:++hid})},false); // новая заметка
    }

    setkey('KeyU','',function(e){majax('login.php',{a:'getinfo'})},true); // личная карточка
};

page_onstart.push("hotkey_default()");

//========================================================

keykeys={ctrl:8,shift:4,alt:2,meta:1};

// setkey(
// [0] 'key' or keys[]
// [1] ,'ctrl shift alt meta' через проелы абы как лишь бы было
// [2] ,function(){} - если функции нет (''), то удалить
// [3] ,o Что вернуть return hotkey[i][3];
// [4] ,nav Должен отсутствовать если не навигационное ибо if(nonav && !hotkey[i][4]) return true; // навигация отключена для навигационных
// setkey('ArrowLeft','',function(e){})

function setkey(k,v,f,o,nav) { nav=nav?1:0; if(typeof(k)!='object') k=[k];
 for(var i=0;i<k.length;i++) {
    setkey0(k[i],v,f,o,nav);
    if(mHelps[activid]) mHelps[activid][0]=hotkey.slice(); else hotkey_def=hotkey.slice(); // и запомнить в массиве
 }
}

function setkey0(k,v,f,o,nav){ // повесить функцию на нажатие клавиши
    var e=0; for(var i in keykeys) if(v.indexOf(i)>=0) e+=keykeys[i]; // сетка всяких шифтов-контролов
    for(var i in hotkey) if(hotkey[i][0]==k && hotkey[i][1]==e){ // если уже есть - изменить
	if(!f || f=='') delete hotkey[i]; else hotkey[i]=[k,e,f,o,nav];
	return;
    }
    if(!f || f=='') return; // если нет, и не задана функция, - просто выйти
    if(e) hotkey.push([k,e,f,o,nav]); else hotkey.unshift([k,e,f,o,nav]); // иначе - задать с конца списка или с начала
}

function rel_redirect(id){ var e=dom(id); if(user_opt('n') && e && e.href && !isHelps()) {
    if(id=='PrevLink'){ var b=document.body,i=curX-startX; if(i<0)i=-i; b.style.left=i+'px'; setOpacity(b,0.5); }
    else if(id=='NextLink'){ var b=document.body,i=curX-startX; if(i<0)i=-i; b.style.right=i+'px'; setOpacity(b,0.5); }
    document.location.href=e.href; }
}


///////// ЭТУ ВСЮ ХУЙНЮ ПЕРЕДЕЛАТЬ БЫ
function cphash(a) {
    var b={}; for(var i in a) {
    if(typeof(a[i])!='undefined'){
    if(typeof(a[i])=='object' && typeof(a[i]['innerHTML'])!='string') b[i]=cphash(a[i]); else b[i]=a[i];}
    }
    b.push=a.push; b.unshift=a.unshift; // йобаный патч!
    return b;
}

function cpmas(a) { var b=[]; for(var i=0;i<a.length;i++){
    if(typeof(a[i])!='undefined'){
    if(typeof(a[i])=='object' && typeof(a[i]['innerHTML'])!='string') b[i]=cphash(a[i]); else b[i]=a[i];}
} return b; }

function isHelps(){ var max=0,id=false; for(var k in mHelps){ if(mHelps[k][1]>=max){max=mHelps[k][1];id=k;} } return id; }// найти верхнее окно или false

var print_r_id=0;
var print_rid={};

function printr_f(ev,e,i){ ev.stopPropagation(); print_r(print_rid[i]);
    if(e.className!='ll') { dom(e,"[Object]"); e.className='ll'; return; }
    e.className=''; e.style.marginLeft='30px'; dom(e,print_r(print_rid[i],0,1)+'\n');
}

function print_r(a,n,skoka) {
 if(skoka===0) return '@'; if(!skoka) skoka=10;
    var s='',t='',v,tp,vl,vv; if(!n)n=0; for(j=0;j<n*10;j++) t+=' ';
    if(typeof(a)!='object') return a;

    for(var j in a){
	if(typeof(j)=='undefined') { s='\nundefined'+s; continue; }
	tp=typeof(a[j]); v=a[j];
	try{ vv=''+v; } catch(x) { vv='(((Uncaught)))'; }

	if(tp=='function') {
	    // vl="<div style='color:orange;display:inline-table'>function</div>";
	    var z=(print_r_id++); print_rid[z]=v;
	    vl="<div style='color:orange;display:inline-table'>function(<div onclick=\"printr_f(event,this,'"+z+"')\" class='ll'>___</div>)</div>";
	}
	else if(tp=='number' || tp=='boolean') vl="<span style='color:lightgreen'>"+vv+'</span>';
	else if(tp=='undefined') vl="<span style='color:#ccc'>"+tp+"</span>";
	else if(tp=='string') vl="<div style='color:green;display:inline-table;'>"+vv+'</div>';
	else if(tp=='object' && !v) vl="<span style='color:#ccc'>null</span>";
	else if(tp=='object') {
	    var z=(print_r_id++); print_rid[z]=v; // cphash(v); // {}; Object.assign(print_rid[z],v);
	    vl = "<div onclick=\"printr_f(event,this,'"+z+"')\" class='ll'>"+vv+"</div>";
	}
	else vl='['+vv+"] <span style='color:green'>"+typeof(v)+'</span>';
	s='\n'+t+j+' = '+vl+s;
    }
    return s;
}



function in_array(s,a){ for(var l in a) if(a[l]==s) return l; return false; }


function newin(e) { return (e?e.classList.contains('newin'):e); }

clean=function(id,animtrue,History) {
    if(id===null||id===undefined) return;

    if(typeof(id)=='object') {
        if(typeof(id.id)!='undefined'&&id.id!='') id=id.id; // если есть имя, то взять имя
        else { var t='tmp_'+(hid++); id.id=t; id=t; } // иначе блять присвоить
    }

    var e=dom(id), nin=newin(e);

    if(nin && !History && window.addEventListener && window.history.back) {
	var w=document.location.href.split('?')[1];
	if(w && w.indexOf('win_'+id)===0) {
	    // вернуть, но тихо
	    window.removeEventListener('popstate', HistoryEvent);
	    window.history.back();
	    setTimeout(function(){ window.addEventListener('popstate', HistoryEvent, false);},50);
       }
    }

    if(typeof(mHelps[id])!='undefined' && !nin) { // окно было
        delete(mHelps[id]); // удалить окно
        mHelps_sort(top); // пересортировать
        if(!isHelps()) { hotkey=hotkey_def.slice(); nonav=0; } // восстановить дефаулты
    }

    if(e) {
	var clen=function(){
	    if(nin) dom.on( (e.previousSibling?e.previousSibling:document.body) );
	    e.parentNode.removeChild(e);
	};

        if( nin || typeof(e.onanimationend)!='object' || in_array(id,['tenek','ajaxgif'])) clen(); // dom.off(id); setTimeout(clen,10);
        else { // animate
	    dom.off(e.querySelector('.winret'));
	    anim(e,(nin ? 'slideOutRight' : 'zoomOut'),clen,animtrue); // .zoomInRight .rotateOutUpLeft
	}
    } else if(typeof(idrename)!='undefined'&&typeof(idrename[id])!='undefined') { clean(idrename[id]); }
    dom.off('tip');
};

var JSload={};

function mHelps_sort(top) { // сортировка окон по слоям возрастания с предлежащим окном тени
    if(top=='salert') return;

    var mam=[],k=zindexstart,id=0; for(var i in mHelps) mam.push([i,mHelps[i][1]]);
    if(!mam.length){ // если нету распахнутых окошек
	clean('tenek');
	hotkey=hotkey_def.slice();
	activid=false;
	bukadump();
	return;
    }
    mam.sort(function(i,j){return i[1]>j[1]?1:0});

    for(var i=0;i<mam.length;i++){
	id=mam[i][0];
	if(id==top || !top && (i+1)==mam.length) continue;
	mHelps[id][1]=k; dom(id).style.zIndex=k++;
    } if(top) id=top;

    if(!mHelps[id]) { clean('tenek'); return; }

    if(typeof(document.body.style.pointerEvents)=='string') {
	var T=dom('tenek'); if(!T) { newdiv('',{id:'tenek',cls:'tenek'}); T=dom('tenek'); }
	T.style.zIndex=k++;
    }

    mHelps[id][1]=k; dom(id).style.zIndex=k;
    hotkey=mHelps[id][0].slice();
    activid=id;
    bukadump();
}

function bukadump() { // отладочник
    if(!dom('bukadump')) return;
    var s='<hr>';
    s+='<br>activid='+activid;
    s+='<p>hotkey='+print_r(hotkey,0,0).replace(/\n/g,'<br>').replace(/ /g,' ');
    s+='<hr>';
    dom('bukadump',dom.s('bukadump')+'<hr>'+s);
}

var LOADES={};

function inject(src){ loadScr(urlajax(src)); }

function urlajax(s,dir) { return ( s.indexOf('://')<0 && s.substring(0,1) != '/' ? (dir?dir:www_ajax)+s : s ); }

// умная подгрузка
// первый аргумент - имя файлы js или css или массив ['1.js','2.js','1.css']
// второй необязательный аргумент - фанкция, запускаемая по окончании удачной загрузке ВСЕХ перечисленных
// третий необязательный - функция при ошибке
function LOADS(u,f,err,sync) { if(typeof(u)=='string') u=[u];

    var s;
    for(var i=0;i<u.length;i++) { if(LOADES[u[i]]) continue;
     if(/\.css($|\?.+?$)/.test(u[i])) {
        s=document.createElement('link');
        s.type='text/css';
        s.rel='stylesheet';
        s.href=u[i];
        s.media='screen';
     } else {
        s=document.createElement('script');
        s.type='text/javascript';
        s.src=u[i];
        s.defer = true;
     }
     s.setAttribute('orign',u[i]);
     if(sync) s.async=false;
     s.onerror=( typeof(err)=='function' ? err : function(e){ idie('Not found: '+e.src); } );
     s.onload=function(e){ e=e.target;
        var k=1; LOADES[e.getAttribute('orign')]=1; for(var i=0;i<u.length;i++){ if(!LOADES[u[i]]){ k=0;break;}}
        if(k){ ajaxoff(); if(f) f(e.src); }
     };
     document.getElementsByTagName('head').item(0).appendChild(s);
    }
    if(s) ajaxon(); else if(f) f(1);
}

function LOADS_sync(u,f,err) { LOADS(u,f,err,1) }

LOADS_promice=include=function(file,sync) {
    return new Promise(function(resolve, reject) { LOADS(file,resolve,reject,sync); });
};

// создать новый <DIV class='cls' id='id'>s</div> в элементе paren (если не указан - то просто в документе)
// если указан relative - то следующим за relative
// если relative=='first'(или 0) - в начало
// если relative==['before',relative] - то перед relative
// иначе (рекомндуется писать 'last') - в конец
// rootElement=false;
function mkdiv(id,s,cls,paren,relative,display){ if(dom(id)) { dom(id,s); dom(id).className=cls; return; }
    var div=document.createElement('DIV');
    if(cls) div.className=cls;
    if(id) div.id=id;
    if(s) div.innerHTML=s;
    if(!display) div.style.display='none';
//    if(!paren) paren = rootElement | document.body;
    if(!paren) paren = document.body;

    if(relative===undefined) {
	try { paren.appendChild(div); } // paren.lastChild
	catch(u) {
	    if(admin) alert('id='+id+' paren='+paren+' s='+s);
	}
    }
    else if(relative===0||relative=='first') paren.insertBefore(div,paren.firstChild);
    else if(typeof(relative)=='object' && relative[0]=='before') paren.insertBefore(div,relative[1]);
    else paren.insertBefore(div,relative.nextSibling);
    return div;
}

function newdiv(s,ara,paren,relative,display){ if(typeof(ara)!='object') ara={};
    var div=mkdiv(ara.id,s,(ara.cls?ara.cls:ara.class),paren,relative,(display==undefined?1:display));
    if(ara.attr) for(var i in ara.attr) div.setAttribute(i,ara.attr[i]);
    return div;
}

function posdiv(id,x,y) { // позиционирование с проверкой на вылет, если аргумент '-1' - по центру экрана
    var e=dom(id),W,w,H,h,SW,SH,DW,DH;
    if(newin(e)) e=dom(id+'_body');

    e.style.position='absolute';
    w=e.clientWidth; h=e.clientHeight;
    e.style.display='none'; // перед измерением убрать
    W=getWinW(); H=getWinH(); SW=getScrollW(); SH=getScrollH();
    e.style.display='block';
    var es=e.currentStyle||window.getComputedStyle(e);
    var mL=1*es.marginLeft.replace(/px/,''),mR=1*es.marginRight.replace(/px/,'');

    if(x==-1) x=(W-w)/2+SW+mL-mR;
    if(y==-1) y=(H-h)/2+SH;
    DW=W-10; if(w<DW && x+w>DW) x=DW-w; if(x<0) x=0;
    if(y<0) y=0;
    if(!newin(e)) e.style.top=y+'px';
    e.style.left=(x-6)+'px';
}

function center(id) { dom.on(id); posdiv(id,0,0); posdiv(id,-1,-1); }

function addEvent(e,evType,fn) {
    if(e.addEventListener) { e.addEventListener(evType,fn,false); return true; }
    if(e.attachEvent) { var r = e.attachEvent('on' + evType, fn); return r; }
    e['on' + evType] = fn;
}

function removeEvent(e,evType,fn){
    if(e.removeEventListener) { e.removeEventListener(evType,fn,false); return true; }
    if(e.detachEvent) { e.detachEvent('on'+evType, fn) };
}

function hel(s,t) { ohelpc('id_'+(++hid),(t==undefined?'':s),s); }
function helps_cancel(id,f) { idd(id).querySelectorAll('.can')[0].onclick=f; }
function helpc(id,s) { helps(id,s); center(id); /* setTimeout(function(x){center(id)},500);*/ }
function ohelpc(id,z,s) { helpc(id,mk_helpbody(z,s)); }
function ohelp(id,z,s) { helps(id,mk_helpbody(z,s)); }
function mk_helpbody(z,s) { return (z==''?'':"<div class='legend'>"+z+"</div>")+"<div class='textbody'>"+s+"</div>"; }

function idie(s,t) {
    var e=typeof(s); if(e=='object') s="<pre style='max-width:"+(getWinW()-200)+"px'>"+print_r(s,0,3)+'</pre>';
    var header='';
    if(t!=undefined) { if(t.length < 120) header=h(''+t); else s=t+'<p>'+s; }
    var p=dom('idie'); if(p) { p=p.querySelectorAll('.textbody'); if(p&&p[0]) return dom.add(p[0],'<hr>'+s); }
    ohelpc('idie',header,s);
}
dier=idie;

HistoryEvent=function(e) {
    e.preventDefault();
    if( !window.history || !e ) return;
    if( !e.state || !e.state.win || !dom(e.state.win) ) {
	var wb=dom('winbody'); if(!wb) return;
	wb.childNodes.forEach(ee=>{clean(ee)});
	dom.on(document.body);
	return;
    }
    var id=dom(e.state.win).id;
    var w=document.location.href.split('?')[1];
    if(!w || !w.indexOf('win_')===0) return;

    var ee=dom('winbody').childNodes;
    for(var i=ee.length-1;i>=0;i--) { if(ee[i].id != id) clean(ee[i]); else break; }
};
// set Listener history

if(window.addEventListener) window.addEventListener('popstate', HistoryEvent,false);

winret=function(e){ if(window.history.back) window.history.back(); else clean(e.parentNode); };

// var wintempl="<div class='corners'><div class='inner'><div class='content' id='{id}_body' align=left>{text}</div></div></div>";
// var wintempl_cls='popup';
// var wintempl_cls='pop2';
// var wintempl="<div id='{id}_body'>{s}</div><i id='{id}_close' title='Close' class='can'></i>";
function helps(id,s,pos,cls,wt) {

 if(!user_opt('nowin')) {

    if(!dom('winbody')) {
         var d=document.createElement('DIV'),b=document.body,bp=b.parentNode;
	 d.id='winbody'; bp.insertBefore(d,bp.firstChild);
    }

  if(useropt.mobwin && !in_array(id,['salert','idie','dier','fotooper'])) {
    if(!dom(id)) {
	var em=dom('winbody');
	dom.off(document.body); em.childNodes.forEach(e=>{dom.off(e)});
//	rootElement.setAttribute('scrollTop',(document.documentElement.scrollTop || document.body.scrollTop));
//	rootElement.setAttribute('scrollLeft',(document.documentElement.scrollLeft || document.body.scrollLeft));

	newdiv("<div class='winret' onclick='winret(this)' style='font-size:50px;index:30;position:absolute;top:5px;left:5px;cursor:pointer;width:100%;text-align:left;'>&#9664;</div>\
<div style='margin: 80px 10px 0 10px; text-align:left' class='"+cls+"' id='"+id+"_body'>"+s+"</div>",{id:id,cls:'newin animate fadeInLeft'},
em);
	init_tip(dom(id));

	if(window.history && window.history.pushState) {
		window.history.pushState({win:id},'?win_'+id,'?win_'+id);
	}


    } else { if(dom(id+'_body')) dom(id+'_body',s); }

    hotkey=hotkey_def.slice(); // обнулить для окна все шоткеи
    return;
  }

}

if(!dom(id)) {

    if(!wt) wt=wintempl;
    mkdiv(id,wt.replace(/\{id\}/g,id).replace(/\{s\}/g,s),wintempl_cls+(cls?' '+cls:''),undefined,undefined,1);
    if(dom(id+'_close')) dom(id+'_close').onclick=function(e){clean(id)};

    init_tip(dom(id));

    onMoveObject(dom(id),false,
        function(e) {
            if(e.className=='legend' || e.id==id+'_body') return dom(id);
            return ( e.id==id ? e : false );
        }
    );
//  ===========================================================================

++hid;

if(!pos) posdiv(id,mouse_x,mouse_y);

mHelps[id]=[hotkey.slice(),999999]; // сделать самым верхним

} else dom(id+'_body',s);

hotkey=hotkey_def.slice(); // обнулить для окна все шоткеи
setTimeout("mHelps_sort('"+id+"');",10); // пересортировать
addEvent(dom(id),'click',function(){ mHelps_sort(this.id); });
}

// координаты мыши
var mouse_x=mouse_y=0;
document.onmousemove = function(e){ e=e||window.event;
  if(e.pageX || e.pageY) { mouse_x=e.pageX; mouse_y=e.pageY; }
  else if(e.clientX || e.clientY) {
    mouse_x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
    mouse_y = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
  }
try{e=dom('ajaxgif'); e.style.top=15+mouse_y+'px'; e.style.left=15+mouse_x+'px';}catch(e){}
};


function setOpacity(e,n) { var o=getOpacityProperty(); if(!e || !o) return;
    if(o=='filter') { n *= 100; // Internet Exploder 5.5+
    // Если уже установлена прозрачность, то меняем её через коллекцию filters, иначе добавляем прозрачность через style.filter
    var oAlpha = e.filters['DXImageTransform.Microsoft.alpha'] || e.filters.alpha;
    if(oAlpha) oAlpha.opacity=n;
    else e.style.filter += 'progid:DXImageTransform.Microsoft.Alpha(opacity='+n+')'; // чтобы не затереть другие фильтры +=
    } else e.style[o]=n; // Другие браузеры
}

function getOpacityProperty() {
    if(typeof(document.body.style.opacity)=='string') return 'opacity'; // CSS3 compliant (Moz 1.7+, Safari 1.2+, Opera 9)
    else if(typeof(document.body.style.MozOpacity)=='string') return 'MozOpacity'; // Mozilla 1.6 и младше, Firefox 0.8 
    else if(typeof(document.body.style.KhtmlOpacity)=='string') return 'KhtmlOpacity'; // Konqueror 3.1, Safari 1.1
    else if(document.body.filters && navigator.appVersion.match(/MSIE ([\d.]+);/)[1]>=5.5) return 'filter'; // IE 5.5+
    return false;
}

function getScrollH(){ return document.documentElement.scrollTop || document.body.scrollTop; }
function getScrollW(){ return document.documentElement.scrollLeft || document.body.scrollLeft; }

function getWinW(){ return window.innerWidth || (document.compatMode=='CSS1Compat' && !window.opera ? document.documentElement.clientWidth : document.body.clientWidth); }
function getWinH(){ return window.innerHeight || (document.compatMode=='CSS1Compat' && !window.opera ? document.documentElement.clientHeight : document.body.clientHeight); }

function getDocH(){ return document.compatMode!='CSS1Compat' ? document.body.scrollHeight : document.documentElement.scrollHeight; }
function getDocW(){ return document.compatMode!='CSS1Compat' ? document.body.scrollWidth : document.documentElement.scrollWidth; }

// --- процедуры pins ---
function insert_n(e) { var v=e.value;
    var t1=v.substring(0,e.selectionStart); // текст перед
    var t2=v.substring(e.selectionEnd,v.length); // текст после
    var pp=GetCaretPosition(e);
    e.value=t1.replace(/\s+$/,'') + "\n" + t2.replace(/^\s+/,'');
    setCaretPosition(e,pp);
}

function ti(id,tmpl) { // заменить выделенное на tmpl, в котором {select} заменится на выделенное
    var e=dom(id),v=e.value,ss=e.selectionStart,es=e.selectionEnd;
    var s=tmpl.replace(/\{select\}/g,v.substring(ss,es));
    GetCaretPosition(e); e.value=v.substring(0,ss)+s+v.substring(es,v.length); setCaretPosition(e,ss+s.length);
    e.selectionStart=ss; e.selectionEnd=ss+s.length;
}

function tin(id,s) { // заменить выделенное на s
    var e=dom(id),v=e.value,ss=e.selectionStart,es=e.selectionEnd;
    GetCaretPosition(e); e.value=v.substring(0,ss)+s+v.substring(es,v.length); setCaretPosition(e,ss+s.length);
}

var scrollTop=0;

function GetCaretPosition(e) { var p=0; // IE Support
    if(document.selection){ e.focus(); var s=document.selection.createRange(); s.moveStart('character',-e.value.length); p=s.text.length; } // Firefox support
    else if(e.selectionStart || e.selectionStart=='0') p=e.selectionStart;
    scrollTop=e.scrollTop; return p;
}

function setCaretPosition(e,p) {
    if(e.setSelectionRange){ e.focus(); e.setSelectionRange(p,p); }
    else if(e.createTextRange){ var r=e.createTextRange(); r.collapse(true); r.moveEnd('character',p); r.moveStart('character',p); r.select(); }
    e.scrollTop = scrollTop;
}



//======================================== jog
function valid_up(l) {
    var u=('#'+l).replace(/^#(\d+)\-[0-9ABCDEF]{32}$/gi,"$1"); return isNaN(u)||u==0?false:l;
}

var unic_rest_flag=0; function unic_rest(i) { return 0; // заебало! временно отключим!
    /*
    if(unic_rest_flag) return;
    var upo=valid_up(i?fc_read('up'):f5_read('up')); // прочитать из одного или другого хранилища
    if(up!=upo && upo!==false) { unic_rest_flag=1; return majax('restore_unic.php',{up:up,upo:upo,num:num,i:i}); } // восстановить!
    if(up!='candidat') return (i?fc_save('up',up):f5_save('up',up));
    */
}
// page_onstart.push('unic_rest(0)'); // заебало! временно отключим!

var jog=false,f5s=false;

c_read=function(n) {
    var a=' '+document.cookie+';'; var c=a.indexOf(' '+n+'='); if(c==-1) return false; a=a.substring(c+n.length+2);
    return decodeURIComponent(a.substring(0,a.indexOf(';')))||false;
};
fc_read=fc_save=function(n,v){ return false; };
f_read=function(n){ return f5_read(n)||c_read(n); };

f_save=f5_save=l_save=function(k,v){
    if(k.length>500) idie('f_save error k.length='+k.length);
    if(v.length>20000) idie('f_save error v.length='+v.length);
    try { return window.localStorage&&window.localStorage.setItem?window.localStorage.setItem(k,v):false; } catch(e) { return err_store(e,arguments.callee.name); }
};

f5_read=l_read=function(k){
    try { k=window.localStorage.getItem(k); return (k===false||k===null?false:k); }
    catch(e) { return err_store(e,arguments.callee.name); }
};

l_del=function(k){
    try { return window.localStorage&&window.localStorage.removeItem?window.localStorage.removeItem(k):false; } catch(e) { return err_store(e,arguments.callee.name); }
};

err_store=function(e,fnam) { // да блять, иногда даже они рушатся

if(e.name=='NS_ERROR_FILE_CORRUPTED') alert("\
Опс, да у вас ебанулось браузерное хранилище!\nУ меня такое было, когда я скопировал папку от старого Firefox в новый.\
\n\nНе думаю, что проблема ограничится лишь этим сайтом. Надо найти и ручками ёбнуть файлы типа:\
\n~/.mozilla/firefox/3t20ifl1.default/webappsstore.sqlite\
\n~/.mozilla/firefox/3t20ifl1.default/webappsstore.sqlite-wal");

    else alert('Error '+fnam+'(): '+e.name);
    return false;
}

time=function(){ return new Date().getTime(); };

// comments
var komsel_n=0,komsel_v='';
var comnum=0;
if(typeof(commenttmpl)=='undefined') var commenttmpl='';
function kus(unic) { if(unic) majax('login.php',{a:'getinfo',unic:unic}); }// личная карточка
function kd(e) { if(confirm('Delete?')) majax('comment.php',{a:'del',id:ecom(e).id}); } // del
function ked(e) { majax('comment.php',{a:'edit',comnu:comnum,id:ecom(e).id,commenttmpl:commenttmpl}); } // edit
function ksc(e) { majax('comment.php',{a:'scr',id:ecom(e).id,commenttmpl:commenttmpl}); } // screen/unscreen
function ko(e) { majax('comment.php',{a:'ans',id:ecom(e).id,commenttmpl:commenttmpl}); } // ans-0-1-undef
function rul(e) { majax('comment.php',{a:'rul',id:ecom(e).id,commenttmpl:commenttmpl}); } // rul-не rul
function ka(e) { e=ecom(e); majax('comment.php',{a:'comform',id:e.id,lev:e.style.marginLeft,comnu:comnum,commenttmpl:commenttmpl}); } // answer
function kpl(e) { majax('comment.php',{a:'plus',id:ecom(e).id,commenttmpl:commenttmpl}); } // +
function kmi(e) { majax('comment.php',{a:'minus',id:ecom(e).id,commenttmpl:commenttmpl}); } // -
function kl(e) { if(komsel_n!==0) dom(komsel_n).style.border=komsel_v;
    komsel_n=ecom(e).id; komsel_v=dom(komsel_n).style.border;
    dom(komsel_n).style.border='5px dotted red'; return true;
} // link
function opc(e,num) { e=ecom(e); majax('comment.php',{a:'pokazat',dat:num,oid:e.id,lev:e.style.marginLeft,comnu:comnum,commenttmpl:commenttmpl}); } // показать
function ecom(e){while((e.id==''||e.id==undefined)&&e.parentNode!=undefined) e=e.parentNode; return e.id==undefined?0:e;}

function skm(e) { var i=ecom(e).id; hide_comm(i); comhif5(i,1); } // убрать коммент

function comhif5(i,z) { var n='hidcom'+num,r=f5_read(n); if(!r) r=[]; else r=r.split(',');
    if(z) { if(!in_array(i,r)) r.push(i); } else { var l=in_array(i,r); if(false!==r) r.splice(l,1); }
    f5_save(n,r.join(','));
}

function restore_comm(e) {
    e=e||window.event,i=e.target.id.replace(/scc_/g,''),s='scc_'+i;
    majax('comment.php',{a:'why_hidden_comm',e:e.target.id,unic:dom(i).getAttribute('unic')});
}
function hide_comm(i) { i=i.replace(/scc_/g,''); var s='scc_'+i; if(!dom(s)) dom(i,"<div id='"+s+"'>"+dom.s(i)+"</div>"); dom.off(s); setTimeout("addEvent(dom('"+i+"'),'click',restore_comm)",10); }

// bigfoto - заебался отдельно пристыковывать
// BigLoadImg("http://lleo.aha.ru/tmp/img.php?text="+Math.random());
// Два варианта вызова: либо модулем для серии фоток, либо без второго параметра просто bigfoto('somepath/file.jpg')
// <img style='border:1px solid #ccc' onclick="return bigfoto('/backup/kniga_big.gif')" src="/backup/kniga_small.gif">

var BigImgMas={},bigtoti=0,bigtotp=0;
function bigfoto(i,p){
    if(typeof(i)=='object') i=i.href;
    var TDATA=(p!=undefined && isNaN(p) ? p : false); // переданы ли полезные слова вторым аргументом?

    var Z=( p==undefined || TDATA!==false ); var n=Z?i:i+','+p;

    if(typeof(BigImgMas[n])=='undefined'){
        if(!Z && !dom("bigfot"+p+"_"+i)) return false;
        // ajaxon();
        BigImgMas[n]=new Image();
        BigImgMas[n].src=Z?n:dom("bigfot"+p+"_"+i).href;
    }

    if(!Z) { bigtoti=i; bigtotp=p; }
    if(BigImgMas[n].width*BigImgMas[n].height==0) { setTimeout('bigfoto('+(Z ? '"'+n+'"' : n)+')',200); return false; }
    // ajaxoff();

    if(Z) var tt="<div id='bigfostr' class=r>"+(TDATA===false?n:TDATA)+"</div>";
    else {
	var g=i; while(dom('bigfot'+p+'_'+g)) g++;
	var tt=(g>1?(i+1)+" / "+g:'')+(dom('bigfott'+p+'_'+i)?"    <div style='display:inline;' title='nexпредыдущая/следующая: стрелки клавиатуры' id='bigfottxt'>"+dom.s('bigfott'+p+'_'+i)+'</div>':'');
	if(tt!=''||admin) tt="<div id='bigfostr' class=r"+(admin?" title='Admin, click to edit!' onclick=\"majax('editor.php',{a:'bigfotoedit',num:"+dom.s('bigfotnum'+p)+",i:"+i+",p:"+p+"})\"":"")+">"+tt+"</div>";
    }
    var navl=Z?'':"<div id='bigfotol' style='position:absolute;top:0px;left:0px;'"+((!i)?'>':" title='prev' onclick='bigfoto(bigtoti-1,bigtotp)' onmouseover=\"dom.on('bigfotoli')\" onmouseout=\"dom.off('bigfotoli')\"><i id='bigfotoli' style='position:absolute;top:0px;left:3px;display:none;' class='e_DiKiJ_l'></i>")+"</div>";
    var navr=Z?'':"<div id='bigfotor' style='position:absolute;top:0px;right:0px;'"+((g==i+1)?'>':" title='next' onclick='bigfoto(bigtoti+1,bigtotp)' onmouseover=\"dom.on('bigfotori')\" onmouseout=\"dom.off('bigfotori')\"><i id='bigfotori' style='position:absolute;right:3px;display:none;' class='e_DiKiJ_r'></i>")+"</div>";

helps('bigfoto',"<div style='position:relative'>"+(admin?"<div id='bigfoto_opt' style='position:absolute;display:inline;bottom:-18px;right:-5px'>\
<i class='knop e_finish' title='Options' onclick=\"majax('foto.php',{a:'options',img:'"+BigImgMas[n].src+"',p:'"+p+"',num:num})\"></i>\
</div>":'')+navl+"<img id='bigfotoimg' src='"+BigImgMas[n].src+"' onclick=\"clean('bigfoto')\">"+navr+"</div>"+tt,1);

    var w=BigImgMas[n].width,h=BigImgMas[n].height,e=dom('bigfotoimg');
    var H=(getWinH()-20); if(h>H && H>480) { w=w*(H/h); h=H; e.style.height=H+'px'; }
    var W=(getWinW()-50); if(w>W && W>640) { h=h*(W/w); w=W; e.style.width=W+'px'; }
    if(dom('bigfostr')) dom('bigfostr').style.width=w+'px';

    if(!Z){
        dom('bigfotol').style.width=dom('bigfotor').style.width=w/4+'px';
        dom('bigfotol').style.height=dom('bigfotor').style.height=h+'px';
        if(dom('bigfotoli')) dom('bigfotoli').style.top=(h-16)/2+'px';
        if(dom('bigfotori')) dom('bigfotori').style.top=(h-16)/2+'px';
        setkey(['ArrowLeft','4'],'',function(){bigfoto(bigtoti-1,bigtotp)},false);
        setkey(['ArrowRight','7'],'',function(){bigfoto(bigtoti+1,bigtotp)},false);
    }
    // dom.on('bigfoto');
    center('bigfoto');
    return false;
}

// tip

function init_tip(w) { w=w||document;

    if(window.identicon_ready) identicon_init(w);

if(!dom('tip')) {
    mkdiv('tip','','b-popup bubble-node b-popup-noclosecontrol');
    dom('tip','<div class="b-popup-outer"><div class="b-popup-inner"><div id="rtip"></div><i class="i-popup-arr i-popup-arrtl"><i class="i-popup-arr-brdr-outer"><i class="i-popup-arr-brdr-inner"><i class="i-popup-arr-bg"></i></i></i></i><i class="i-popup-close"></i></div></div>');
}
    if(w.id=='tip') return;

    if(useropt.mat && (!w.id || '#'!=w.id.replace(/(editor|cm)\d+/g,'#'))) delmat(w===document?w.body:w); // и сюда же заодно всрём обработку мата

var attr,j,i,a,s,e,t,el=['a','label','input','img','span','div','textarea','area','select','i','td','tr','blockquote'];
for(j=0;j<el.length;j++){ t=el[j]; e=w.getElementsByTagName(t); if(e){ for(i=0;i<e.length;i++){ a=e[i];

if(t=='img' && user_opt('i')) { // для ошибки при загрузки картинок
    a.setAttribute('onerror','erimg(this)');
    a.setAttribute('src',a.getAttribute('src'));
} else if(t=='input'||t=='textarea'||t=='select') { // и отключить навигацию для INPUT и TEXTAREA
	if( (t=='input'||t=='textarea') && a.onFocus==undefined) addEvent(a,'focus',function(){nonav=1});
	attr=a.getAttribute('ramsave');
	if(attr!==null && !a.defaultValue) { // если указан атрибут ramsave='name', то сохранять в памяти браузера эту переменную и восстанавливать
		if(attr=='') {
		    attr=(a.id?a.id:(a.name?a.name:attr)); // если =1, то имя такое же, как id или name
		    a.setAttribute('ramsave',attr);
		}
		var vv=f5_read(attr) || a.getAttribute('placeholder') || '';
		    if(a.type=='checkbox') a.checked=1*vv;
		    else if(a.type=='radio') a.checked=(a.value==vv?1:0);
		    else a.value=vv;
		addEvent(a,'change',function(){
		    f5_save(this.getAttribute('ramsave'), ( this.type=='checkbox' || (this.type!='radio' && this.checked) ? (this.checked?1:0) : this.value ) );
		});
	}
}

    attr=a.getAttribute('title')||a.getAttribute('alt');

    if(attr=='play') {
	var za=dom.s(a),url=za.split(' ')[0],text=za.substring(url.length+1),cls;
	if(text=='') text=url;
	if(/(mp3|ogg|wav|flac)$/.test(url)) { // mp3
	    cls='ll pla';
	    if(text.indexOf('<')<0) text="<img style='vertical-align:middle;padding-right:10px;' src='"+www_design+"img/play.png' width='22' height='22'>"+text;
	} else {
	    cls='ll plv';
	    if(text.indexOf('<')<0) text="<i style='vertical-align:middle;padding-right:10px;' class='e_play-youtube'></i>"+text;
	}
	a.className=cls;
	// addEvent(a,'click',function(){ changemp3x(url,text,this); });
	a.setAttribute('media-url',url);
	a.setAttribute('media-text',text);
	addEvent(a,'click',function(){ changemp3x('','',this); });
	// a.onclick="changemp3x('"+url+"','"+text+"',this);";
	dom(a,text);
	a.style.margin='10px';
	tip_a_set(a,'Play Media');
	a.style.display='block';
    }
    else if(attr=='cpbuf') addEvent(a,'click',cpbuf);

    else tip_a_set(a,attr);

}}}
}

function erimg(e){ e.onerror='';
    tip_a_set(e,'image error<br>'+h(e.src));
    e.src=www_design+'img/kgpg_photo.png';
}

function tip_pos(){ posdiv('tip',mouse_x-35,mouse_y+25); }

function tip_a_set(a,s) { if(s && a.onMouseOver==undefined) {
    a.setAttribute('tiptitle',s); a.removeAttribute('title'); a.removeAttribute('alt');
    addEvent(a,'mouseover',function(){ dom('rtip',s); tip_pos(); });
    addEvent(a,'mouseout',function(){ dom.off('tip') });
    addEvent(a,'mousemove',function(){ tip_pos() });
    addEvent(a,'dblclick',function(){ salert(this.getAttribute('tiptitle'),5000); });
}}

page_onstart.push("init_tip()");

//==========
// процедура правки v2.1
//
// (с)LLeo 2009 для проекта блогодвижка http://lleo.aha.ru/blog/
//
// за бесценные советы, дизайн вспывающего окошка и процедуры работы с выделением - спасибо Михаилу Валенцеву http://valentsev.ru

var leftHelper;
var topHelper;
var site_id;
var Nx = 630;
if(!hashpresent) var hashpresent='1';
var keyalert=0;

// 1 - Браузеры. 2 - IE. 3 - Неизвестно.
var browsertype=(document.createRange)?1:(-[1,])?3:2;

window.onload=function(e) { e=e||window.event;
    // document.onkeyup = function(e){ };
    document.onkeydown = function(e) { e=e||window.event;
        // var k=(e.key?e.key:e.keyCode?e.keyCode:e.which?e.which:null); if(k===0) return;
        var kod=(e.code?e.code:null),ct=e.metaKey+2*e.altKey+4*e.shiftKey+8*e.ctrlKey;

        if(keyalert) { setTimeout("talert('Code: "+kod+" Alt: "+ct+"',2000)",50); return false; }

        for(var i in hotkey) if( hotkey[i][0]==kod && hotkey[i][1]==(hotkey[i][1]&ct)) {
            if(nonav && !hotkey[i][4]) return true; // навигация отключена для навигационных
            setTimeout("hotkey["+i+"][2]('"+kod+" "+ct+"')",10);
            return hotkey[i][3];
        }
    };

    // === / KEYBOARD ===
    window.onresize=function(){ screenWidth=document.body.clientWidth; }; window.onresize();

    // === MOUSE ===
    document.onmouseup=function(e){ e=e||window.event;
        if(isHelps() || nonav) return; // Если уже есть открытые окна - нах правку!
        opecha.o=((document.selection)?document.selection.createRange().text:window.getSelection())+'';

        var n=(browsertype==1?(window.getSelection().anchorNode?window.getSelection().anchorNode:'')
        :(browsertype==2?document.selection.createRange().parentElement():'')
        );

        if(browsertype==3 || !n || !opecha.o.length || opecha.o.length>1024) return;

        while((n.tagName!='DIV' || n.id=='' || n.id==undefined) && n.parentNode!=undefined) n=n.parentNode;
        if(n.id==undefined) return;
        opecha.id=n.id;

        if(user_opt('ope')) return helper_go();

        if(!opecha.n) return;
        opecha.n--;
        salert("Опечатка? Выделите и Нажмите Ctrl+Enter",1000);
        setkey('Enter','ctrl',function(e){clean('salert');helper_go();},false);
    };

    for(var inok=page_onstart.length-1;inok>=0;inok--) { var F=page_onstart[inok],TF=typeof(F);
        try{
	    if(TF=='function') F(); else if(TF=='string') eval(F);
	    else ErrorUnknownOnstartCallFunction();
	} catch(e){ salert('Error ostart: '+h(e.name+":"+e.message)+"<br>"+h(e.stack)+'<p>'+h(page_onstart[inok])+"<hr>"+F); }
    } page_onstart=[];
};
// end window.onload

onstart=function(F) { page_onstart.push(F); return page_onstart.length-1; }

var opecha={n:1,o:'',id:0};

// Сам обработчик опечаток
function helper_go() {
    if(!opecha.id) return; var o=opecha.o,oid=opecha.id,b=stripp(dom.s(oid));
    majax('ajax_pravka.php',{a:'textarea',num:num,n:scount(b,stripp(nl2brp(o))),oid:oid,o:o,ss:b.indexOf(nl2brp(o))});
}

function scount(str,s) { var i=0,c=0; while((i=str.indexOf(s,++i))>0) c++; return c; }
function nl2brp(s) { return s.replace(/\n\n/g,"<p>").replace(/\n/g,"<br>"); }
function brp2nl(s) { return s.replace(/<p>/gi,"\n\n").replace(/<br>/gi,"\n"); }
function stripp(s) { return s.replace(/<\/p>/gi,""); }

function salert(l,t) {
    var p=dom('salert');
    if(p){ p=p.querySelectorAll('textbody'); if(p && p[0]) { dom.add(p[0],'<hr>'+l); return false; } }
    helpc('salert',"<div style='padding:20px' class='textbody'>"+l+"</div>");
    if(t) setTimeout("clean('salert')",t);
    return false;
}

//-------------------------------------------------------------------------

function talert(s,t){ mkdiv('talert',s,'qTip'); posdiv('talert',-1,-1); if(t) setTimeout("clean('talert')",t); }

function gethash_c(){ return 1*document.location.href.replace(/^.*?#(\d+)$/g,'$1'); }

function plays(url,silent){ // silent: 1 - только загрузить, 0 - петь, 2 - петь НЕПРЕМЕННО, невзирая на настройки
    if(silent!=2 && typeof('user_opt')!='undefined' && !user_opt('s')) return; // если в опциях запрещено
    var audio = new Audio(url);
    if(silent!=1) audio.play();
//    newdiv("<audio style='position:absolute;width:1px;height:1px;overflow:hidden;left:-40px;top:0;opacity:0'"+(silent==1?'':" autoplay='autoplay'")+" src=\""+url+"\"></audio>",{id:'plays'+(silent==1?playsid++:'')});
}

function user_opt(s) { return typeof(useropt[s])=='undefined'?0:useropt[s]; };
function go(s) { window.top.location=s; }

h=function(s){
    // var t=typeof(s); if(t=="number"||t=="bigint"||t=="symbol") s=''+s; t=typeof(s); if(t!="string") return alert("H: error type ["+t+"] for ["+s+"]");
    s=''+s;
    return s.replace(/\&/sg,'&'+'amp;').replace(/\</sg,'&'+'lt;').replace(/\>/sg,'&'+'gt;').replace(/\'/sg,'&'+'#039;').replace(/\"/sg,'&'+'#034;'); // '
}

h.dump = function(s){ return "<pre>"+h(s).replace(/\t/sg,blue('\\'+'t')).replace(/\r/sg,blue('\\'+'r')).replace(/\n/sg,blue('\\'+'n\n'))+"</pre>"; }

function uh(s){ return s.replace(/\&lt\;/g,'<').replace(/\&gt\;/g,'>').replace(/\&\#039\;'/g,"'").replace(/\&\#034\;"/g,'"').replace(/\&amp\;/g,'&'); }

function trim(s){ return s.replace(/\r/s,'').replace(/^\s+/s,'').replace(/\s+$/g,''); }

// {_PLAY:

var youtubeapiloaded=0;
var mp3imgs={play:www_design+'img/play.png',pause:www_design+'img/play_pause.png',playing:www_design+'img/play_go.gif'};

stopmp3x=function(ee){ ee.src=mp3imgs.play; setTimeout("clean('audiosrcx_win')",50); };

changemp3x=function(url,name,ee,mode,viewurl,download_name) { //  // strt

    if(url=='') url=ee.getAttribute('media-url');
    if(name=='') name=ee.getAttribute('media-text'); if(!name) name='';

    if(-1!=name.indexOf('</i>')) name=name.substring(name.split('</i>')[0].length+4);
    // else if(-1!=name.indexOf('<img ')) name=name.substring(name.split('>')[0].length+1); 
    name=name.replace(/<[^>]+>/gi,'');

    var start=0,e;
    var s=name.replace(/^\s*([\d\:]+)\s.*$/gi,'$1'); if(s!=name&&-1!=s.indexOf(':')) { s=s.split(':'); for(var i=0;i<s.length;i++) start=60*start+1*s[i]; }

    var WWH="style='width:"+(Math.floor((getWinW()-50)*0.9))+"px;height:"+(Math.floor((getWinH()-50)*0.9))+"px;'";

    if(/(youtu\.be\/|youtube\.com\/)/.test(url) || (url.indexOf('.')<0 && /(^|\/)(watch\?v\=|)([^\s\?\/\&]+)($|\"|\'|\?.*|\&.*)/.test(url))) { // "

	var tt=url.split('?start=');
	if(tt[1]) { start=1*tt[1]; url=tt[0]; } // ?start=1232343 в секундах
	else {
	  var exp2=/[\?\&]t=([\dhms]+)$/gi; if(exp2.test(url)) { var tt=url.match(exp2)[0]; // ?t=7m40s -> 460 sec
	    if(/\d+s/.test(tt)) start+=1*tt.replace(/^.*?(\d+)s.*?$/gi,"$1");
	    if(/\d+m/.test(tt)) start+=60*tt.replace(/^.*?(\d+)m.*?$/gi,"$1");
	    if(/\d+h/.test(tt)) start+=3600*tt.replace(/^.*?(\d+)h.*?$/gi,"$1");
	  }
	}

	if(-1!=url.indexOf('://youtu') || -1!=url.indexOf('://www.youtu')) url=url.match(/(youtu\.be\/|youtube\.com\/)(embed\/|watch\?v\=|)([^\?\/]+)/)[3];

	return ohelpc('audiosrcx_win','YouTube '+h(name),"<div id=audiosrcx><center>\
<iframe "+WWH+" src=\"https://www.youtube.com/embed/"+h(url)+"?rel=0&autoplay=1"+(start?'&start='+start:'')+"\" frameborder='0' allowfullscreen></iframe>\
</center></div>");
    }

    if(/([0-9a-z]{8}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{4}\-[0-9a-z]{12})/.test(url)) { // Peertube
	return ohelpc('audiosrcx_win','PeerTube '+h(name),"<div id=audiosrcx><center>\
<iframe "+WWH+" sandbox='allow-same-origin allow-scripts allow-popups' src=\""+h(url)+"\" frameborder='0' allowfullscreen></iframe>\
</div>");
    }

    if(/\.(mp4|avi|webm|mkv)$/.test(url)) s='<div>'+name+'</div><div><center><video controls autoplay id="audiidx" src="'+h(url)
	+'" width="640" height="480"><span style="border:1px dotted red">ВАШ БРАУЗЕР НЕ ПОДДЕРЖИВАЕТ MP4, МЕНЯЙТЕ ЕГО</span></video></center></div>';

    else if(/\.(jpg)$/.test(url)) { // panorama JPG
	s='<div>'+name+"</div><div id='panorama' "+WWH+"></div>";
	ohelpc('audiosrcx_win','<a class=r href="'+h(url)+'" title="download">'+h(url.replace(/^.*\//g,''))+'</a>','<div id=audiosrcx>'+s+'</div>');
	return LOADS(["//cdnjs.cloudflare.com/ajax/libs/three.js/r69/three.min.js",wwwhost+'extended/panorama.js'],function(){panorama_jpg('panorama',url)});
    }

    else s='<div>'+name+'</div><div><center><audio controls autoplay id="audiidx"><source src="'+h(url)
	+'" type="audio/mpeg; codecs=mp3"><span style="border:1px dotted red">ВАШ БРАУЗЕР НЕ ПОДДЕРЖИВАЕТ MP3, МЕНЯЙТЕ ЕГО</span></audio></center></div>';

    if(!viewurl) viewurl=url.replace(/^.*\//g,'');
    if(!download_name) download_name=url.replace(/^.*\//g,'');

    if(e=dom('audiidx')) {
        if(ee && ee.src && -1!=ee.src.indexOf('play_pause')){ ee.src=mp3imgs.playing; return e.play(); }
        if(ee && ee.src && -1!=ee.src.indexOf('play_go')){ ee.src=mp3imgs.pause; return e.pause(); }
        dom('audiosrcx',s);
        posdiv('audiosrcx_win',-1,-1);
        e=dom('audiidx');
        e.currentTime=start;
    } else {
        ohelpc('audiosrcx_win','<a class=r href="'+h(url)+'" title="Download: '+h(download_name)+'" download="'+h(download_name)+'">'+h(viewurl)+'</a>','<div id=audiosrcx>'+s+'</div>');
        e=dom('audiidx');
        e.currentTime=start;
    }

    if(ee) addEvent(e,'ended',function(){ stopmp3x(ee) });
    if(ee) addEvent(e,'pause',function(){ if(e.currentTime==e.duration) stopmp3x(ee); else ee.src=mp3imgs.pause; });
    if(ee) addEvent(e,'play',function(){ ee.src=mp3imgs.playing; });
}


/*----------------------- */

var fkey=0;
function fpkey() {
    return;
/*
    try{
        var q,i,h=0,s,v=document.createElement('canvas'),c=v.getContext('2d'),t='i9asdm..$#po((^@KbXrww!~cz';
        c.textBaseline="top";c.font="16px 'Arial'";c.textBaseline="alphabetic";c.rotate(.05);c.fillStyle="#f60";c.fillRect(125,1,62,20);c.fillStyle="#069";c.fillText(t,2,15);
        c.fillStyle="rgba(102,200,0,0.7)";c.fillText(t,4,17);c.shadowBlur=10;c.shadowColor="blue";c.fillRect(-20,10,234,5);s=v.toDataURL();
        if(s.length==0) return 0;for(i=0;i<s.length;i++){q=s.charCodeAt(i);h=((h<<5)-h)+q;h=h&h;} return h;
    }catch(e){return 0;}
*/
}

function cot(e){e.style.display='none';e.nextSibling.style.display='inline';}
function delmat(e){ e.innerHTML=e.innerHTML.replace(/(\s|>)(подъеб|подъёб|заеб|заёб|отъеб|отъёб|бля|бляд|блят|въеб|выеб|долбое|ёб|ебал|ебан|ебен|ебл|ебущ|ебуч|заеб|манд|муда|муде|муди|мудо|пидар|пидор|пизд|уеб|хуе|хуё|хуй|хую|хуя|хуи)/gi,"$1<span style='cursor:pointer' onclick=\"this.innerHTML='$2'\">***</span>"); }


/*********************** majax ***********************/

var ajaxmgif = "<img src='"+www_design+"img/ajaxm.gif'>";
var ajaxgif = "<img src='"+www_design+"img/ajax.gif'>";
function ajaxon(){ var id='ajaxgif'; mkdiv(id,ajaxgif,'popup'); posdiv(id,15+mouse_x,15+mouse_y); } // @
// LLLLLLLLLLLL    ajaxonn=ajaxon;  // @
function ajaxoff(){ clean('ajaxgif'); } // @
var majax_lastu='',majax_lasta={},majax_err=1; // @
function tryer(er,e,js){ alert(er+': '+e.name+'\n\n'+js);} // @

function mjax(url,a,id) { // @
    if(!id) id='im_'+(++hid);
    var pref=xdomain+www_ajax;
    if(url.indexOf('://')<0 && url.substring(0,1)!='/') { if(typeof(postMessage)=='function') url=pref+url; else url=pref+'frame.htm#'+url; }
    helpc(id+'_r',"<iframe style='width:300px;height:100px;margin:0;padding:0;max-width:none !important;' frameborder=0 hspace=0 marginheight=0 marginwidth=0 vspace=0 \
scrolling='no' \
onload='ajaxoff()' name='"+id+"' id='"+id+"'></iframe>");
    ajaxon();
    postToIframe(a,url+'?mjax='+id+'&w='+getWinW()+'&h='+getWinH(),id);
}

function old_majax(url,a,js) { majax_lasta=cphash(a); majax_lastu=url; // @
    ajaxform(0,url,a,js);
}

function mijax(u,a) {
    // if(typeof(up)!='undefined') a['up']=up;  НЕТ БЛЯТЬ! НЕ СВЕТИТЬ СВОЮ АВТОРИЗАЦИЮ НА ЧУЖОМ САЙТЕ
     u=urlajax(u);
     u+='?minj='+(new Date()).getTime();
    for(var i in a) u+='&'+encodeURIComponent(i)+'='+encodeURIComponent(a[i]);
    loadScr(u);
}

function form_addpole(e,n,v) { // #
    if(n!='id'&&n!='action'&&n!='name'&&e[n]) return e[n].value=v;
    var t; if(browsertype==2//browser.isIE
    ){t=document.createElement("<input type='hidden' name='"+h(n)+"' value='"+h(v)+"'>"); e.appendChild(t);}
    else{ t=document.createElement("input"); e.appendChild(t); t.type="hidden"; t.name=n; t.value=v; }
}

function mojaxform(e,url,ara) {return mojax(url,ara,'','FORM',e); }

function old_ajaxform(e,url,ara) { url=urlajax(url); var z='lajax_'+(hid++);
    url=url+'?lajax='+z+'&rando='+Math.random();
    ara=addara(ara);
    mkdiv(z+'_ifr',"<iframe width=1 height=1 frameborder=0 hspace=0 marginheight=0 marginwidth=0 vspace=0 name='"+z+"' id='"+z+"'></iframe>",'popup');
    if(typeof(e)=='object') { // уже форма есть
	e.id=z+'_form0';
	e.target=z; e.enctype='multipart/form-data'; e.action=url; e.method='POST';
	e.setAttribute("target",z); e.setAttribute("enctype",'multipart/form-data'); e.setAttribute("action",url); e.setAttribute("method",'POST');
	if(ara) for(var i in ara) if(typeof(i)=='string') form_addpole(e,i,ara[i]);
	ajaxon(); return true;
    }
    postToIframe(ara,url,z);
}

mojax_get_pole_ara=get_pole_ara=function(w,onlych) { var k=0,ara={names:''}; var el=['input','textarea','select']; w=dom(w);
        for(var j=0;j<el.length;j++){ var e=w.getElementsByTagName(el[j]); for(i=0;i<e.length;i++)
                        if(typeof(e[i].name)!='undefined' && e[i].name!=''
&& ( onlych!=1 || e[i].type=='hidden' || typeof(e[i].defaultValue)=='undefined' || e[i].value!=e[i].defaultValue)
) {
    var b=el[j]+':'+e[i].type;

    if(b=='input:radio' && !e[i].checked) continue; // только нажатые

    else if(b=='input:file') {
	if(e[i].value=='') continue; // пустых файлов нам не надо
	var p=e[i].files,nf=e[i].name.replace(/\[\]/g,'_'),q; for(q=0;q<p.length;q++) { ara[nf+q]=p[q]; ara['names']+=' '+nf+q; k++; }
	continue;
    } else if(b=='input:checkbox') {
	ara[e[i].name]=e[i].checked?1:0;
    } else {
        ara[e[i].name]=e[i].value;
	if(typeof(e[i].defaultValue)!='undefined') e[i].defaultValue=e[i].value;
    }

    ara['names']+=' '+e[i].name; k++;
}
        }
        return (k==0?false:ara);
};


function find_form(e) { while(e.tagName!='FORM'&&e.parentNode!=undefined) e=e.parentNode; if(e.parentNode==undefined) idie('e.form error'); return e; }

function mojax_send_this_form(e,mjphp,m,onlych) { while(e.tagName!='FORM'&&e.parentNode!=undefined) e=e.parentNode; // ---
    if(e.parentNode==undefined) return false; var ara=mojax_get_pole_ara(e,onlych);
    if(ara===false) return false; for(var i in m) ara[i]=m[i]; majax(mjphp,ara); return false;
}
function old_send_this_form(e,mjphp,m,onlych) { while(e.tagName!='FORM'&&e.parentNode!=undefined) e=e.parentNode; // ---
    if(e.parentNode==undefined) return false; var ara=get_pole_ara(e,onlych);
    if(ara===false) return false; for(var i in m) ara[i]=m[i]; majax(mjphp,ara); return false;
}


// функция постит объект-хэш content в виде формы с нужным action, target
// напр. postToIframe({a:5,b:6}, '/count.php', 'frame1')

function repostToIframe(id,a){ var f=dom(id+'_form');
    if(!f) f=dom(id+'_form0');
    if(!f) idie('Repostiframe err:'+h(id));
    if(!a) a={}; a.repostform=1*(!f.repostform?0:1*f.repostform.value+1);
    for(var x in a) form_addpole(f,x,a[x]);
    f.submit();
} // еще раз ту же форму запостить, только можно добавить данные

function postToIframe(ara,url,id){
    ara=addara(ara);
    var f=document.createElement("form"); f.style.display="none"; f.id=id+'_form';
    f.enctype="application/x-www-form-urlencoded"; f.method="POST"; document.body.appendChild(f);
    f.action=url; f.target=id; f.setAttribute("target",id);
    for(var x in ara) form_addpole(f,x,ara[x]);
    f.submit();
}

ifhelpc=function(src,id,head,X,Y){ if(!id) id='ifram'; X=(!X?1:X);Y=(!Y?1:Y);
    if(!head) head='iframe '+h(src);
    if(typeof(postMessage)!='function') src=www_ajax+'frame.htm#'+src;
    var s="<iframe name='"+id+"_ifr' id='"+id+"_ifr' src='"+src+"' onload='ajaxoff();' style='width:"+X+"px;height:"+Y+"px;'></iframe>";
    if(id=='xdomain') newdiv(s,{id:id});
    else { ohelpc(id,head,s); ajaxon(); }
};


/***************** MAJAX NEW **********************/
/*
function md5(s) { var e='',c,z,f=s.length;
    for(var i=0;i<f;i++) { c=s[i];z=c.charCodeAt(0); e+=z<256 ?c:String.fromCharCode(z&0x00FF)+String.fromCharCode((z&0xFF00)>>8); }
    return smd5(e);
}
*/

function md5 ( str ) {  // Calculate the md5 hash of a string Webtoolkit.info (http://www.webtoolkit.info/) namespaced by: Michael White (http://crestidg.com)
        var RotateLeft = function(lValue, iShiftBits) { return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits)); };
        var AddUnsigned = function(lX,lY) {
                var lX4,lY4,lX8,lY8,lResult;
                lX8 = (lX & 0x80000000);
                lY8 = (lY & 0x80000000);
                lX4 = (lX & 0x40000000);
                lY4 = (lY & 0x40000000);
                lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
                if(lX4 & lY4) return(lResult ^ 0x80000000 ^ lX8 ^ lY8);
                if(lX4 | lY4) if(lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8); else return(lResult ^ 0x40000000 ^ lX8 ^ lY8);
                else return (lResult ^ lX8 ^ lY8);
            };
        var F = function(x,y,z) { return (x & y) | ((~x) & z); };
        var G = function(x,y,z) { return (x & z) | (y & (~z)); };
        var H = function(x,y,z) { return (x ^ y ^ z); };
        var I = function(x,y,z) { return (y ^ (x | (~z))); };

        var FF = function(a,b,c,d,x,s,ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); };
        var GG = function(a,b,c,d,x,s,ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); };
        var HH = function(a,b,c,d,x,s,ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); };
        var II = function(a,b,c,d,x,s,ac) { a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac)); return AddUnsigned(RotateLeft(a, s), b); };

        var ConvertToWordArray = function(str) {
                var lWordCount;
                var lMessageLength = str.length;
                var lNumberOfWords_temp1=lMessageLength + 8;
                var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
                var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
                var lWordArray=Array(lNumberOfWords-1);
                var lBytePosition = 0;
                var lByteCount = 0;
                while ( lByteCount < lMessageLength ) {
                    lWordCount = (lByteCount-(lByteCount % 4))/4;
                    lBytePosition = (lByteCount % 4)*8;
                    lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount)<<lBytePosition));
                    lByteCount++;
                }
                lWordCount = (lByteCount-(lByteCount % 4))/4;
                lBytePosition = (lByteCount % 4)*8;
                lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
                lWordArray[lNumberOfWords-2] = lMessageLength<<3;
                lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
                return lWordArray;
            };

        var WordToHex = function(lValue) {
                var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
                for (lCount = 0;lCount<=3;lCount++) {
                    lByte = (lValue>>>(lCount*8)) & 255;
                    WordToHexValue_temp = "0" + lByte.toString(16);
                    WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
                }
                return WordToHexValue;
            };

        var x=Array();
        var k,AA,BB,CC,DD,a,b,c,d;
        var S11=7, S12=12, S13=17, S14=22;
        var S21=5, S22=9 , S23=14, S24=20;
        var S31=4, S32=11, S33=16, S34=23;
        var S41=6, S42=10, S43=15, S44=21;

        // str = this.utf8_encode(str);
        x = ConvertToWordArray(str);
        a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

        for(k=0;k<x.length;k+=16) {
            AA=a; BB=b; CC=c; DD=d;
            a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
            d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
            c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
            b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
            a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
            d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
            c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
            b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
            a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
            d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
            c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
            b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
            a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
            d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
            c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
            b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
            a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
            d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
            c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
            b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
            a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
            d=GG(d,a,b,c,x[k+10],S22,0x2441453);
            c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
            b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
            a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
            d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
            c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
            b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
            a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
            d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
            c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
            b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
            a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
            d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
            c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
            b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
            a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
            d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
            c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
            b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
            a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
            d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
            c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
            b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
            a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
            d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
            c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
            b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
            a=II(a,b,c,d,x[k+0], S41,0xF4292244);
            d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
            c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
            b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
            a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
            d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
            c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
            b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
            a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
            d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
            c=II(c,d,a,b,x[k+6], S43,0xA3014314);
            b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
            a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
            d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
            c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
            b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
            a=AddUnsigned(a,AA);
            b=AddUnsigned(b,BB);
            c=AddUnsigned(c,CC);
            d=AddUnsigned(d,DD);
        }
        var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
        return temp.toLowerCase();
}

//================================================================================
function is_XHR(){ return typeof(XMLHttpRequest)!='undefined' || typeof(XDomainRequest)!='undefined'; }
function majax(url,ara,js,METHOD,form,size) {
    if(mnogouser==1) { var k=url+':'+ara.a; for(var i of ifrnames) if(k==i) return mjax(url,ara); }
    return is_XHR()?mojax(url,ara,js,METHOD,form,size):old_majax(url,ara,js);
}
function ajaxform(e,url,ara) { return is_XHR()?mojaxform(e,url,ara):old_ajaxform(e,url,ara); }
function send_this_form(e,mjphp,m,onlych) { return is_XHR()?mojax_send_this_form(e,mjphp,m,onlych):old_send_this_form(e,mjphp,m,onlych); }

var lastzig='';

arazig=function(ara) {
    var r=[]; for(var i in ara) r.push(i); r=r.sort(); var zig=''; for(var i in r) {
	if(typeof(ara[r[i]])!='object') zig+=r[i]+','; // +'='+lenlen(''+ara[r[i]])+','; // фотки не считаем вообще, нахуй
    }
    var m=md5(mojaxsalt+'|'+zig);
    lastzig=mojaxsalt+'|'+zig+'/'+m;
    return m;
};

progress=function(name,now,total,text) { name='progress'+(name?'_'+name:'');
    if(!dom(name)) { if(!total) return;
            helpc(name,"\
<div id='"+name+"_proc' style='text-align:center;font-size:23px;font-weight:bold;color:#555;'>0 %</div>\
<div id='"+name+"_tab' style='width:"+Math.floor(getWinW()/2)+"px;border:1px solid #666;'>\
<div id='"+name+"_bar' style='width:0;height:10px;background-color:red;'></div></div>");
    } else if(!total) return clean(name);
    var proc=Math.floor(1000*(now/total))/10;
    var W=1*dom(name+'_tab').style.width.replace(/[^\d]+/g,'');
    dom(name+'_bar').style.width=Math.floor(proc*(W/100))+'px';
    if(!text) text=''+proc+' %'; else text=text.replace(/\%\%/g,proc);
    dom(name+'_proc',text);
};

function sizer(x) {  var i=0; for(;x>=1024;x/=1024,i++){} return Math.round(x,2)+['b','Kb','Mb','Gb','Tb','Pb'][i]; } // если отправка более 30кб - показывать прогресс

ProgressFunc=function(e){ progress('ajax',e.loaded,e.total,sizer(e.total)+': %% %'); };

function catcherr(txt,e,code){
    ohelpc('JSerr','JS error: '+h(txt),"<font color=red><b><big>"+h(e.name)+": "+h(e.message)+"</big></b></font>"
	+"<br><b>"+h(majax_lastu)+' {'+h(print_r(majax_lasta))+" }</b>"
        +"<div style='border:1px dotted red'>"+h(e.stack)+"</div>"
    +h(code).replace(/\n/g,"<br>"));
}

function addara(ara) {
    if(typeof(hashpage)!='undefined') ara.hashpage=hashpage;
    if(typeof(up)!='undefined') ara.up=up;
    if(typeof(acn)!='undefined') ara.acn=acn;
    if(typeof(ux)!='undefined') ara.ux=ux;
    if(typeof(upx)!='undefined') ara.upx=upx;
    if(typeof(mylang)!='undefined') ara.mylang=mylang;
    return ara;
}

function mojax(url,ara,js,METHOD,form) { if(!url.indexOf) { alert('Mojax error url: '+url); return false; } url=urlajax(url);
    majax_lasta=cphash(ara); majax_lastu=url; // для отладки
    ara=addara(ara);

    if(!METHOD) { // выбрать метод
	var ara_len=0; for(var i in ara) ara_len++;
	var DD=Math.max(36*ara_len,256); // сколько байт добавит POST form-data?
	U=0; for(var i in ara) {
	    if(typeof(ara[i])=='object') { METHOD='FORM'; break; }
	    U+=(encodeURIComponent(i+ara[i]).length - (i+ara[i]).length); // сколько байт добавит каждый следующий form-urlencoded?
	    if(U>DD) { METHOD='FILE'; break; } // как только стало дороже - FILE
	}
	if(!METHOD) { if(U<256 && (''+document.location).substring(0,7)!='http://') METHOD='GET'; else METHOD='POST'; } // если речь о копейках, то просто GET, иначе POST form-urlencoded
    }

    ajaxon();

    var x = new XMLHttpRequest();

    x.onload=x.onerror=function(){
        if(this.status==200) {
	    ajaxoff();
	    progress('ajax');
	    if(js) { try{ if(typeof(js)=='string') eval(js); else if(js(x.responseText)===true) return; } catch(e){catcherr("Mojax JS",e,js)} }
	    var m=x.responseText.split('**'+'/');
	    if(!m[1]&&m[0]!='/'+'**') { var er='',ev=m[0]; }
	    else { var er=m[0].replace(/^\/[\*]+/g,''),ev=m[1]; }
	    if(er!='') ohelpc('SerErr','Server Error',h(er).replace(/\n/g,"<p>"));
	    ev=ev.replace(/\&\#10017\;\&\#10017;\//g,'**'+'/');
	    try{eval(ev)}catch(e){catcherr("Mojax RESULT",e,ev)}
	} else { salert('Mojax Error ['+url+']: '+this.status+': '+this.statusText,2000); ajaxoff(); }
      };

    if(METHOD=='GET') {
	var o=''; for(var i in ara) o+='&'+h(i)+'='+encodeURIComponent(ara[i]); o='zi='+arazig(ara)+o; // кидаем зигу
	x.open("GET",url+'?'+o,true);
	x.send();
	return; // нельзя false!!!!
    }

    if(METHOD=='POST') {
	var o=''; for(var i in ara) o+='&'+h(i)+'='+encodeURIComponent(ara[i]); o='zi='+arazig(ara)+o.replace(/%20/g,'+'); // кидаем зигу
	x.open("POST",url,true);
	x.setRequestHeader('Content-type','application/x-www-form-urlencoded');
	// x.setRequestHeader('Content-length',o.length);
	// x.setRequestHeader('Connection','close');
	x.send(o);
	return; // нельзя false!!!!
    }

    if(METHOD=='FILE') {
	var boundary=md5(String(Math.random()).slice(2));
	var o=['\r\n']; for(var i in ara) o.push('Content-Disposition: form-data; name="'+i+'"\r\n\r\n'+ara[i]+'\r\n');
	o.push('Content-Disposition: form-data; name="zi"\r\n\r\n'+arazig(ara)+'\r\n');
	o=o.join('--'+boundary+'\r\n')+'--'+boundary+'--\r\n';

	if(o.length>20*1024) x.upload.onprogress=ProgressFunc;
	x.open("POST",url,true);
	x.setRequestHeader('Content-Type','multipart/form-data; boundary='+boundary);
	x.setRequestHeader('Content-length',o.length);
	x.setRequestHeader('Connection','close');
	x.send(o);
	return; // нельзя false!!!!
    }

    if(METHOD=='FORM') {
	// if(!form) { idie('mojax error: FORM'); return false; }

	var FD=new FormData();
	var a=(form ? get_pole_ara(form) || {} : {});

	for(var i in ara) a[i]=ara[i];
	var size=0; for(var i in a) { FD.append(i,a[i]); size+=typeof(a[i])=='object'?a[i].size:(''+a[i]).length; }
	if(size>20*1024) x.upload.onprogress=ProgressFunc;
	FD.append('zi',arazig(a)); // кидаем зигу
	x.open("POST",url,true);
	x.send(FD);
	return false;
    }

    idie('Mojax: unknoun method');
    return false;
}

/// animate
function noanim(e) { e.className=(e.className||'').replace(/ *[a-z0-9]+ animated/gi,''); };

function anim(e,i,fn,animeffect) {
    if(!e) return -1; // нет объекта
    if(!user_opt('ani')&&!animeffect) { if(fn)fn(); return -2; } // нет анимации
    noanim(e); var c=e.className; e.className=(c==''?i:c+' '+i)+' animated';
    if( typeof(dom(e).onanimationend) != 'object' ) {
	if(!e.animate) { if(fn)fn(); return -3; } // совсем нет анимации
	setTimeout(function(){noanim(e);if(fn)fn();},1000); // если нет события конца анимации - то просто таймаут секунду
	return -4;
    }
    var fs=function(){ removeEvent(e,'animationend',fs); noanim(e); if(fn)fn(); };
    addEvent(e,'animationend',fs);
    return 0;
}

// AJAX from ESP8266 v3
AJAX=function(url,opt,s) {

  if(!opt) opt={}; else if(typeof(opt)=='function') opt={callback:opt};
  var async=(opt.async!==undefined?opt.async:true);
  try{
    if(!async && !opt.callback) opt.callback=function(){};
    if(!opt.noajax) ajaxon();
    var xhr=new XMLHttpRequest();

    xhr.onreadystatechange=function(){
      // idie('readyState='+this.readyState+' status='+this.status);
    try{
      if(this.readyState==4) {
        if(!opt.noajax) ajaxoff();
	progress('ajax');
	if(this.status==200 && this.responseText!=null) {
            if(this.callback) this.callback(this.responseText,url,s);
            else eval(this.responseText);
	} else if(this.status==500) {
	    if(this.onerror) this.onerror(this.responseText,url,s);
	    else if(opt.callback) opt.callback(false,url,s);
	}
      }
     } catch(e){
	    dier(e);
	    alert('Error Ajax: '+e.name
		+'\n\n'+e.message
		+'\n\n'+e.stack
		+'\n\n'
		+this.responseText);
	}
    };

    for(var i in opt) xhr[i]=opt[i];
    // if(opt.error) xhr.onerror=opt.error;
    // if(opt.timeout) xhr.timeout=opt.timeout;
    // if(opt.ontimeout) xhr.ontimeout=opt.ontimeout;
    // dier(xhr);

    xhr.open((opt.method?opt.method:(s?'POST':'GET')),url,async);

    if(s) {
        if(typeof(s)=='object' && !(s instanceof FormData) ) {
          var formData = new FormData();
          for(var i in s) formData.append(i,s[i]);
          var k=0; Array.from(formData.entries(),([key,D])=>(k+=(typeof(D)==='string'?D.length:D.size)));
          if(k>20*1024) xhr.upload.onprogress=ProgressFunc;
          xhr.send(formData);
        } else xhr.send(s);
    } else xhr.send();

    if(!async) return ( (xhr.status == 200 && xhr.readyState == 4)?xhr.responseText:false ); //xhr.statusText=='OK' // в хроме не работает блять

  } catch(e) { if(!async) return false; }
};

function AGET(url,s) { return AJAX(url,{noajax:1,async:false},s); } // асинхронно просто вернуть результат

function AJ(url,callback,s) { AJAX(url,{callback:callback,noajax:1},s); }

function AJC(name,period,url,callback,s) { if(!period) period=600;
    var t=1*(f5_read(name+'_time'));
    var V=''+f5_read(name);
    var T=parseInt(new Date().getTime()/1000);
    if( (T < (t+period) ) && V!='') { if(callback) callback(V,url); } // вернуть кэш
    // иначе начать AJAX
    var xhr=new XMLHttpRequest(); xhr.onreadystatechange=function(){ if(this.readyState==4 && this.status==200 && this.responseText!=null) {
            f5_save(name,this.responseText);
            f5_save(name+'_time',T);
            if(callback) callback(this.responseText,url);
    }};
    xhr.open((s?'POST':'GET'),url);
    if(s) xhr.send(s); else xhr.send();
}


// ==============================================
// кандидаты на ближайший изго нахуй (начинам отслеживать, понадобится ли что-то из этого, начиная с 4 декабря 2019):
loadCSS=function(src){ return LOADS(www_css+src); };
loadScript=function(src,f){ return LOADS(urlajax(src,www_js),f); };
loadStyle=loadScr=LOADS;


function loadScriptBefore(src,runtext){ // ########### DEL ###########
    if(unic==4) alert("loadScriptbefore: "+src);
    if(JSload[src]=='load') return eval(runtext); if(JSload[src]) return; JSload[src]=runtext; loadScript(src);
}


var playsid=0;
playswf=function(a,silent){ if(unic==4) alert('playswf');

a=a.replace(/\.mp3$/gi,''); // silent: 1 - ФПМШЛП ЪБЗТХЪЙФШ, 0 - РЕФШ, 2 - РЕФШ оертенеооп, ОЕ ЧЪЙТБС ОБ ОБУФТПКЛЙ
if(silent!=2 && typeof('user_opt')!='undefined' && !user_opt('s')) return; // если в опциях запрещено
var s=www_design+'mp3playerns.swf?autostart='+(silent==1?'no':'yes')+'&file='+a+'.mp3';
var id='plays'+(silent==1?playsid++:'');
mkdiv(id,"<div style='position:absolute;width:1px;height:1px;overflow:hidden;left:-40px;top:0;opacity:0'>\
<audio"+(silent==1?'':" autoplay='autoplay'")+">\
<source src='"+a+".mp3' type='audio/mpeg; codecs=mp3'>\
<object width='1' height='1' \
style='width:1px;height:1px;overflow:hidden;position:absolute;left:-400px;top:0;border:0;'>\
<param name='movie' value='"+s+"' />\
<embed src='"+s+"' width='1' height='1' loop='false' type='application/x-shockwave-flash'>\
</embed></object></audio></div>");
dom.on(id);
} // <source src='"+a+".ogg' type='audio/ogg; codecs=vorbis'>\

//=======================================================
// выносим внедряющиеся скрипты нахуй

/*

if(typeof(MutationObserver) == 'function') { try {

var JS_BL="ulogin.ru highcharts.com rgraph.net RGraph.SVG revolvermaps.com jquery.com /"+"*lleo*"+"/ (i,s,o,g,r,a,m) google-analytics.com (m,e,t,r,i,k,a) yandex.ru/metrika counter.yadro.ru ipadfinger4()".split(" ");
// if(admin) JS_BL="";

var JS_POGAN=[];

poganAlert=function(){
    newdiv('Scripts:'+JS_POGAN.length,{id:'poganAlert',cls:'rama'});
    var e=dom('poganAlert').style;
    e.position='absolute'; e.top='50px'; e.left='50px'; e.zIndex='50'; e.cursor='pointer'; e.align='left';
    e.background='red';
    dom('poganAlert').onclick=function(){
	var lim=150;
	var o='<b>Чужой говнокод пытался влезть в страницу (она ведь не https), но мы его засекли на подлёте и вычистили нахуй:</b>';
	for(var i in JS_POGAN) { var l=JS_POGAN[i].replace(/\r/,'').replace(/\n/,' '); o+="<p>"+(1*i+1)+'. '+h(l.length<lim?l:l.substring(0,lim)+" [...]"); }
	o+="<p><b>Если вы считаете, что это было что-то родное, и страница без этого плохо работает, пожалуйста, напишите мне.</b>";
	clean('poganAlert');
	helpc('poganAlertList2','<div class=r>'+o+'</div>');
	JS_POGAN=[];
    };
}; page_onstart.push("setTimeout('if(JS_POGAN.length) poganAlert()',1000)");

const observer = new MutationObserver(function(mutationsList, observer) {
    for(let mutation of mutationsList) for(let node of mutation.addedNodes) {
	if(node.nodeName == "SCRIPT") {
		var s=node.src; if(s=='' && typeof(node.textContent)!='undefined') s=node.textContent;
		if(-1!=s.indexOf('://'+MYHOST) || -1 != s.indexOf('://kz.'+MYHOST)) continue;
		    var naiden=0;
		    for(var i in JS_BL) { if(JS_BL[i]=='') continue; if(-1 != s.indexOf(JS_BL[i])) { naiden=1; break; } }
		    if(!naiden) { node.parentNode.removeChild(node); JS_POGAN.push(s); } // alert('Заблокирован подозрительный скрипт: '+s);
	}
    }
}); observer.observe(document,{ attributes: true, childList: true, subtree: true });

} catch(e) { alert('Err 12!'); }

}
*/

//=========================================================

// скопировать
cpbuf=function(e,message){ if(typeof(e)=='object') e=e.innerHTML; // navigator.clipboard.writeText(e);
    var area = document.createElement('textarea');
    document.body.appendChild(area);
    area.value = e;
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
    if(message===undefined) message=1000;
    if(message) salert('Copypasted:<p><b>'+(h(e).replace(/\n/g,'<br>'))+'</b>',1*message);
};

cpbufh=function(e,message){ if(typeof(e)=='object') e=e.innerHTML;
    e=e.replace(/<\/p>/gi,'')
	.replace(/<p>/gi,"\n\n")
	.replace(/<br>/gi,"\n");
    cpbuf(e,message);
};

Mailbox={
    write:function(e){MAIL("Mail.write("+e+")")}
};

MAIL=function(cmd){ var ff=function(){eval(cmd)}; if(typeof(Mail)=='object') ff(); else Mbox.preload(ff); };
Mbox={
  preload:function(f,p){ LOADS([www_js+'jsonpro.js?'+Math.random(),www_css+'chat.css?'+Math.random()],function(x,p){f(p)}); },
/*
  mail:function(){ Mailbox.load(function(){Mail.All()}); },
  write:function(x){ Mailbox.load(function(){Mail.write({to:x})}); },
  Tread:function(x){ Mailbox.load(function(){Mail.Tread(x)}); },
*/
  check:function(){
    AJ(www_ajax+'json.php?a=mails&start=0&limit=20&his&time=0&new&opt=id,unicfrom,unicto,timecreate,timeread,text,answerid',function(p){
        if(p!='[]') Mbox.preload(function(x){Mail.New(x)},p);
	else doclass('mail_count',function(w){clean(w)});
    });
  },

};

/*****************************/
NFC={
    to: false,
    on: function(){
	if(NFC.to) clearTimeout(NFC.to);
	newdiv("<div style='display:table;height:100%;width:100%;'>"
		+"<div style='display:table-cell;vertical-align:middle;text-align:center'>"
		    +"<img src='"+www_design+"img/ajax.gif'>"
		+"</div>"
	    +"</div>",{id:'NFC.tenek',cls:'tenek'});
	var T=dom('NFC.tenek');
	T.style.backgroundColor="rgba(0, 0, 0, 0.8)";
	T.style.zIndex=999999;
	NFC.to=setTimeout('NFC.off()',10000);
    },
    off: function(){ clean('NFC.tenek'); },
    ndef: false,
    is: function() { return ("NDEFReader" in window) },
    scan: async (m) => {
      if(!NFC.is()) {
	salert("Увы, этот браузер не поддерживает чтение NFC-карт",4000);
      } else try {
        NFC.ndef = new NDEFReader();
        NFC.ndef.onreadingerror = (ev) => { NFC.off(); idie("Error! Cannot read the NFC tag."); };
        NFC.ndef.onreading = (ev) => { if(!dom('NFC.tenek')) return;
	    NFC.off();
            if(!m) idie('Serial Number: <b><font color=green>'+h(ev.serialNumber)+'</font></b>');
            else if(m=='set') majax('module.php',{mod:'LOGIN',a:'setNFC',NFC:ev.serialNumber});
            else if(m=='login') majax('module.php',{mod:'LOGIN',a:'logNFC',NFC:ev.serialNumber});
        };
	await NFC.ndef.scan();
        NFC.on();
      } catch(error) { idie('Error NFC: '+h(error)); }
    }
};

// Обновить картинку внутри кэша вашего сраного браузера, адов хак
recacheIMG=function(img,agetli) {
    var wd=document.querySelectorAll("IMG[src='"+img+"']");
    for(var q of wd) {
	//    q.style.width=q.clientWidth+'px';
	//    q.style.height=q.clientHeight+'px';
            q.onload=function(x){x=x.target; x.onload=false; setTimeout(function(){x.src=img},300); };
            q.src=wwwhost+'design/img/ajax.gif';
    }

    if(img.indexOf('://')<0) var imgw=img;
    else var imgw=img.replace(/^[^\:]+\:\/\/[^\/]+/,'');
    imgw=imgw.substr(wwwhost.length);
    if(!agetli) var s=AGET(wwwhost+'cf?'+encodeURI(imgw));

    var ifr = document.createElement("iframe");
    ifr.setAttribute("src",img);
    ifr.style.width = '1px';
    ifr.style.height = '1px';
    ifr.style.position = 'absolute';
    ifr.style.top = '0px';
    ifr.style.left = '0px';
    ifr.onload = ifr.onerror = function() {
        if(ifr.getAttribute('loadonce')!='yes') {
            ifr.setAttribute('loadonce','yes');
            ifr.contentWindow.location.reload(true);
        } else {
	    clean(ifr);
            for(var q of wd) q.onload=function(x){x=x.target; x.onload=false; x.src=img;};
        }
    }
    document.body.appendChild(ifr);
};

function dobavil(id,s,ara) { newdiv(s,ara,dom(id),'last'); }
function dobavil1(id,s,ara) { newdiv(s,ara,dom(id),'first'); }

/*
function functionStack(d){
  const error = new Error();
  const firefoxMatch = (error.stack.split('\n')[0 + d].match(/^.*(?=@)/) || [])[0];
  const chromeMatch = ((((error.stack.split('at ') || [])[1 + d] || '').match(/(^|\.| <| )(.*[^(<])( \()/) || [])[2] || '').split('.').pop();
  const safariMatch = error.stack.split('\n')[0 + d];
  // firefoxMatch ? console.log('firefoxMatch', firefoxMatch) : void 0;
  // chromeMatch ? console.log('chromeMatch', chromeMatch) : void 0;
  // safariMatch ? console.log('safariMatch', safariMatch) : void 0;
  return firefoxMatch || chromeMatch || safariMatch;
}
function_name=function(){ return functionStack(2);  };
*/

lightgreen=function(s) { return "<font color='"+arguments.callee.name+"'>"+s+"</font>"; }
green=function(s) { return "<font color='"+arguments.callee.name+"'>"+s+"</font>"; }
red=function(s) { return "<font color='"+arguments.callee.name+"'>"+s+"</font>"; }
blue=function(s) { return "<font color='"+arguments.callee.name+"'>"+s+"</font>"; }

// новые окна
// onMoveObject(elem,fn,fntest)
// elem - элемент, который предлагается двигать по экрану (видимо него position:absolute должно быть)
// fn(e,x,y) - сама функция движения элемента e по смещению x и y, лучше поставить false и довериться дефолтной
// fntest(e) - функция проверки: если разрешено двигать за этот элемент, возвращает элемент, иначе false
//    это сделано потому, что в основном элементе могут быть всякие поля и внутренности, за которые двигать не надо
//    эти две функции можно не указывать
npx=function(s) { return 1 * (s ? (''+s).replace(/[^\d\-\.]/g,'') : 0); }; // parseFloat('0'+s);
onMoveObject=function(elem,fn,fntest) { elem=dom(elem);
    elem.style.cursor='move';

    if(!fn) fn=function(e,dx,dy) {
        var x,max=20;
        x=npx(e.style.left)+dx; x=Math.max(x,max-npx(e.clientWidth)); x=Math.min(x,getDocW()-max); e.style.left=x+'px';
        x=npx(e.style.top)+dy; x=Math.max(x,max-npx(e.clientHeight)); x=Math.min(x,getDocH()-max); e.style.top=x+'px';
    };

    var m="touchstart touchmove touchend mousedown".split(' ');
    for(var l of m) elem.addEventListener(l,function(event) {
        var e=event.target;
        if(fntest && (e=fntest(e))===false) return;
        try{ event.preventDefault(); event.stopPropagation(); }catch(er){}

        var mStart=function(x,y) { e.LastMovX=x; e.LastMovY=y; e.classList.add('active-mov'); };
        var fnRun=function(x,y) { fn(e, x-e.LastMovX, y-e.LastMovY); e.LastMovX=x; e.LastMovY=y; };

        var pnt=e; while(pnt.parentNode) pnt=pnt.parentNode; // Ищем Адама

        var fnMove=function(ev) { fnRun(ev.clientX,ev.clientY); try { ev.preventDefault(); }catch(er){} return false; };
        var fnUp=function(){ e.classList.remove('active-mov');pnt.removeEventListener("mousemove",fnMove); pnt.removeEventListener("mouseup",fnUp); };
        // нажали пальцем
        if(event.type == 'touchstart') { mStart(event.targetTouches[0].pageX, event.targetTouches[0].pageY); }
        // нажали мышь
        if(event.type == 'mousedown') { mStart(event.clientX, event.clientY); pnt.addEventListener("mousemove",fnMove); pnt.addEventListener("mouseup",fnUp); }
        // отпустили палец
        if(event.type == 'touchend') { e.classList.remove('active-mov'); }
        // тянем пальцем
        if(event.type == 'touchmove') { // только 1 касание
            if(event.targetTouches.length == 1) fnRun(event.targetTouches[0].pageX,event.targetTouches[0].pageY);
        }
    });
};

// новые функции DOM чтоб не стыдно было за быдлоимена

dom=function(e,text){
    if(typeof(e)!='object') e=document.getElementById(e);
    if(text==undefined) return e;
    dom.s(e,text);
};

dom.s=function(e,text) {
    if(typeof(e)!='object') e=dom(e); if(!e) return '';
    if(text==undefined) return ( e.value!=undefined ? e.value : e.innerHTML );
    if(e.value!=undefined) e.value=text;
    else { if(e.innerHTML!=undefined) e.innerHTML=text; init_tip(e); }
};

dom.add=function(e,s,ara) { newdiv(s,ara,dom(e),'last'); };

dom.add1=function(e,s,ara) { newdiv(s,ara,dom(e),'first'); };

dom.on=function(e){ if(e=dom(e)) e.style.display='block'; };

dom.off=function(e){ if(e=dom(e)) { e.style.display='none'; if(e.id!='tip') dom.off('tip'); } };

// old
idd=zabil=dom; vzyal=dom.s; zakryl=dom.off; otkryl=dom.on;
function tudasuda(id) { if((id=dom(id))) if(id.style.display=='none') dom.on(id); else dom.off(id); }
function doclass(cla,f,s,node) { (node?node:document).querySelectorAll('.'+cla).forEach(e=>{f(e,s)}); }
function ifclass(id,l){ return dom(id).classList.contains(l) }
function classAdd(id,l){ dom(id).classList.add(l) }
function classDel(id,l){ dom(id).classList.remove(l) }
function zabilc(cla,s) { document.querySelectorAll('.'+cla).forEach(e=>{dom(e,s)}) }

//======================================================= mpers

/*
function mpers(s,a) {
    return s.replace(/\{([^\{\}]+)\}/g,function(t0,t1){
        if(typeof(a[t1])!='undefined') return a[t1]; // есть есть такое {значение} - вернуть его
        if(t1.match(/[\s\,\.]+/g)!==null) return t0; // если и имена переменных что-то через запятую - то просто вернуть
	var f=t1.substring(0,1),i=t1.substring(1);
	if(f=='#') return (typeof(a[i])=='undefined'?'': h(a[i]) );
        return '';
    });
}
*/

unixtime2str = function(x,s='Y-m-d H:i:s') { // convert unixtime to string
    var d = new Date(x * 1000); // Convert Unix time to milliseconds
    function dd(x) { return ("0"+x).slice(-2) }
    return s.replace('Y',d.getFullYear())
	.replace('m',dd(d.getMonth()+1) ) // Months are zero-based
	.replace('d',dd(d.getDate()) )
	.replace('H',dd(d.getHours()) )
	.replace('i',dd(d.getMinutes()) )
	.replace('s',dd(d.getSeconds()) );
};

loadFile = async function(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error(`Failed to load file: ${error.message}`);
    }
};

// mpers

mpersf=async function(file,ar){
    if(typeof("MPERS_TEMPLATES")!='object') MPERS_TEMPLATES={};
    if(!MPERS_TEMPLATES[file]) MPERS_TEMPLATES[file] = await loadFile(file);
    return mpers(MPERS_TEMPLATES[file],ar);
};

mpers=function(s,ar){
    var stop=1000,s0=false,c;
    while(--stop && s0!=s && (c=mpers.find(s)) ) {
	x=mpers.do(ar, c.substring(1,c.length-1) );
	if(x!==false) { s0=s; s=s.replace(c,x); }
    }
    return s;
};

mpers.ar=function(ar,name){
    var v = ar;
    if(name=='') return ar;
    name.split('.').forEach(n => {
	if(typeof(v[n])==undefined) return undefined;
	v = v[n];
    });
    return v;
},

mpers.do=function(ar,s) {
    var m,v,x='',X;

    // Простые переменные {name}, {#name}
    if(null !== (m=s.match(/^(\#|)([0-9a-zA-Z_\.]+)$/)) ) {
	var [,mod,name] = m;
	if((v=mpers.ar(ar,name))===undefined) return '';
	return (mod=='#' ? h(v) : v);
    }

    // Операторы {opt(name):value} if(), for(), case(), date()
    if(null !== (m = s.match(/^([a-z]+)\(([0-9a-zA-Z_\.]*)\)\:([\s\S]*)/m) ) ) {
	var [,opt,name,value] = m;
	if((v=mpers.ar(ar,name))===undefined) return '';

	if(opt=='if') return (1*v ? value : '');

	if(opt=='for') {
	    try { v.forEach((l,i)=> x+=mpers(value,{...{i:i}, ...ar, ...l}) ); } catch(e){
    console.error('mpers '+e+'\nfor('+name+'){\n'+value+'\n}');
    console.error('v('+typeof(v)+')=');
    console.error(v);
    console.error('-------- ar:');
    console.error(ar);
}
	    return x;
	}

	if(opt=='case') {
	    var st=100, c;
	    while(--st && (c=mpers.find(value)) ) {
		if(null !== (m=c.match(/^\{([^\:]*)\:([\s\S]*)\}$/m)) ) {
		    var [,id,val] = m;
		    if(id==v) return val;
		    if(id=='*'||id=='default') x=val;
		}
		value = value.replace(c,'');
	    }
	    return x;
	}

	if(opt=='date') { // date(time)Y-m-d H:i:s
	    return unixtime2str(v,value);
	}

	return false; // не наш случай
    }

    // {oper:text}
    if(null !== (m=s.match(/^([0-9a-z\#\.]+)\:([\s\S]*)/m)) ) {
     var [,oper,text] = m;

     // операции с текстом
     if(oper=='no') return '';

     // операции с текстом или переменной
     v = mpers.ar(ar,text);
     x = (v!==undefined ? v : text);
     if(oper=='#') return h(x);
     if(oper=='nl2br') return x.replace(/\n/g,"<br/>");
     if(oper=='#nl2br') return h(x.replace(/\n/g,"<br/>")); // \n в <br\> и еще экранировать HTML-сущности
     if(oper=='url'||oper=='urlencode') return encodeURIComponent(x);
     if(oper=='urldecode') return x=decodeURIComponent(x);

     // операции с переменной
     if(! /^[0-9a-z_\.]+$/.test(text) ) return false; // не имя переменной
     if(v===undefined) return ''; // нет переменной в массиве
     if(oper=='c') return v.replace(/^\s+/g,'').replace(/\s+$/g,'');
     if(oper=='length') return v.length; // число символов в тексте
     if(oper=='date') return unixtime2str(v,'Y-m-d H:i:s'); // число в дату
     if(oper=='dat') return unixtime2str(v,'Y-m-d H:i'); // число в дату без секунд
     if(oper=='day') return unixtime2str(v,'Y-m-d'); // число в дату дня
     if(oper=='.') return (1*v).toFixed(0); // {.00:}123.456 -> 123.4
     if(oper=='.0') return (1*v).toFixed(1); // {.00:}123.456 -> 123.4
     if(oper=='.00') return (1*v).toFixed(2); // 123.456 -> 123.45
     if(oper=='.0000') return (1*v).toFixed(4); // 123.456 -> 123.4560
     return false;
    }

    return false;
};

// Поиск содержимого между парными скобками
mpers.find = function(s){
    var k, start=0, i, a,b, stop=1000, len=s.length;
    while( --stop ) {
	    k=1, start=s.indexOf('{',start); // }
	    if(start<0) return false;

	    i=start+1;
	    while( --stop && k!=0 && i<len ) { // пока есть чо
		a = s.indexOf('{',i); if( a<0 ) a=len;
		b = s.indexOf('}',i); if( b<0 ) b=len;
		if(a==b) break;
		if(a<b) { k++; i=a+1; } else { k--; i=b+1; }
	    }
	    if(k==0) return s.substring(start,i);
	    start++;
    }
};

