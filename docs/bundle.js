window.sw=function(e){var t={};function n(i){if(t[i])return t[i].exports;var s=t[i]={i:i,l:!1,exports:{}};return e[i].call(s.exports,s,s.exports,n),s.l=!0,s.exports}return n.m=e,n.c=t,n.d=function(e,t,i){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)n.d(i,s,function(t){return e[t]}.bind(null,s));return i},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=5)}([function(e,t){e.exports=window.d3},function(e,t){var n;n=function(){return this}();try{n=n||Function("return this")()||(0,eval)("this")}catch(e){"object"==typeof window&&(n=window)}e.exports=n},function(e,t){!function(){var t=function(e,n){var i=this;this.isOpened=!1,this.input=s(e),this.input.setAttribute("autocomplete","off"),this.input.setAttribute("aria-autocomplete","list"),n=n||{},function(e,t,n){for(var i in t){var s=t[i],r=e.input.getAttribute("data-"+i.toLowerCase());"number"==typeof s?e[i]=parseInt(r):!1===s?e[i]=null!==r:s instanceof Function?e[i]=null:e[i]=r,e[i]||0===e[i]||(e[i]=i in n?n[i]:s)}}(this,{minChars:2,maxItems:10,autoFirst:!1,data:t.DATA,filter:t.FILTER_CONTAINS,sort:!1!==n.sort&&t.SORT_BYLENGTH,item:t.ITEM,replace:t.REPLACE},n),this.index=-1,this.container=s.create("div",{className:"awesomplete",around:e}),this.ul=s.create("ul",{hidden:"hidden",inside:this.container}),this.status=s.create("span",{className:"visually-hidden",role:"status","aria-live":"assertive","aria-relevant":"additions",inside:this.container}),this._events={input:{input:this.evaluate.bind(this),blur:this.close.bind(this,{reason:"blur"}),keydown:function(e){var t=e.keyCode;i.opened&&(13===t&&i.selected?(e.preventDefault(),i.select()):27===t?i.close({reason:"esc"}):38!==t&&40!==t||(e.preventDefault(),i[38===t?"previous":"next"]()))}},form:{submit:this.close.bind(this,{reason:"submit"})},ul:{mousedown:function(e){var t=e.target;if(t!==this){for(;t&&!/li/i.test(t.nodeName);)t=t.parentNode;t&&0===e.button&&(e.preventDefault(),i.select(t,e.target))}}}},s.bind(this.input,this._events.input),s.bind(this.input.form,this._events.form),s.bind(this.ul,this._events.ul),this.input.hasAttribute("list")?(this.list="#"+this.input.getAttribute("list"),this.input.removeAttribute("list")):this.list=this.input.getAttribute("data-list")||n.list||[],t.all.push(this)};function n(e){var t=Array.isArray(e)?{label:e[0],value:e[1]}:"object"==typeof e&&"label"in e&&"value"in e?e:{label:e,value:e};this.label=t.label||t.value,this.value=t.value}t.prototype={set list(e){if(Array.isArray(e))this._list=e;else if("string"==typeof e&&e.indexOf(",")>-1)this._list=e.split(/\s*,\s*/);else if((e=s(e))&&e.children){var t=[];i.apply(e.children).forEach(function(e){if(!e.disabled){var n=e.textContent.trim(),i=e.value||n,s=e.label||n;""!==i&&t.push({label:s,value:i})}}),this._list=t}document.activeElement===this.input&&this.evaluate()},get selected(){return this.index>-1},get opened(){return this.isOpened},close:function(e){this.opened&&(this.ul.setAttribute("hidden",""),this.isOpened=!1,this.index=-1,s.fire(this.input,"awesomplete-close",e||{}))},open:function(){this.ul.removeAttribute("hidden"),this.isOpened=!0,this.autoFirst&&-1===this.index&&this.goto(0),s.fire(this.input,"awesomplete-open")},destroy:function(){s.unbind(this.input,this._events.input),s.unbind(this.input.form,this._events.form);var e=this.container.parentNode;e.insertBefore(this.input,this.container),e.removeChild(this.container),this.input.removeAttribute("autocomplete"),this.input.removeAttribute("aria-autocomplete");var n=t.all.indexOf(this);-1!==n&&t.all.splice(n,1)},next:function(){var e=this.ul.children.length;this.goto(this.index<e-1?this.index+1:e?0:-1)},previous:function(){var e=this.ul.children.length,t=this.index-1;this.goto(this.selected&&-1!==t?t:e-1)},goto:function(e){var t=this.ul.children;this.selected&&t[this.index].setAttribute("aria-selected","false"),this.index=e,e>-1&&t.length>0&&(t[e].setAttribute("aria-selected","true"),this.status.textContent=t[e].textContent,this.ul.scrollTop=t[e].offsetTop-this.ul.clientHeight+t[e].clientHeight,s.fire(this.input,"awesomplete-highlight",{text:this.suggestions[this.index]}))},select:function(e,t){if(e?this.index=s.siblingIndex(e):e=this.ul.children[this.index],e){var n=this.suggestions[this.index];s.fire(this.input,"awesomplete-select",{text:n,origin:t||e})&&(this.replace(n),this.close({reason:"select"}),s.fire(this.input,"awesomplete-selectcomplete",{text:n}))}},evaluate:function(){var e=this,t=this.input.value;t.length>=this.minChars&&this._list.length>0?(this.index=-1,this.ul.innerHTML="",this.suggestions=this._list.map(function(i){return new n(e.data(i,t))}).filter(function(n){return e.filter(n,t)}),!1!==this.sort&&(this.suggestions=this.suggestions.sort(this.sort)),this.suggestions=this.suggestions.slice(0,this.maxItems),this.suggestions.forEach(function(n){e.ul.appendChild(e.item(n,t))}),0===this.ul.children.length?this.close({reason:"nomatches"}):this.open()):this.close({reason:"nomatches"})}},t.all=[],t.FILTER_CONTAINS=function(e,t){return RegExp(s.regExpEscape(t.trim()),"i").test(e)},t.FILTER_STARTSWITH=function(e,t){return RegExp("^"+s.regExpEscape(t.trim()),"i").test(e)},t.SORT_BYLENGTH=function(e,t){return e.length!==t.length?e.length-t.length:e<t?-1:1},t.ITEM=function(e,t){var n=""===t.trim()?e:e.replace(RegExp(s.regExpEscape(t.trim()),"gi"),"<mark>$&</mark>");return s.create("li",{innerHTML:n,"aria-selected":"false"})},t.REPLACE=function(e){this.input.value=e.value},t.DATA=function(e){return e},Object.defineProperty(n.prototype=Object.create(String.prototype),"length",{get:function(){return this.label.length}}),n.prototype.toString=n.prototype.valueOf=function(){return""+this.label};var i=Array.prototype.slice;function s(e,t){return"string"==typeof e?(t||document).querySelector(e):e||null}function r(e,t){return i.call((t||document).querySelectorAll(e))}function o(){r("input.awesomplete").forEach(function(e){new t(e)})}s.create=function(e,t){var n=document.createElement(e);for(var i in t){var r=t[i];if("inside"===i)s(r).appendChild(n);else if("around"===i){var o=s(r);o.parentNode.insertBefore(n,o),n.appendChild(o)}else i in n?n[i]=r:n.setAttribute(i,r)}return n},s.bind=function(e,t){if(e)for(var n in t){var i=t[n];n.split(/\s+/).forEach(function(t){e.addEventListener(t,i)})}},s.unbind=function(e,t){if(e)for(var n in t){var i=t[n];n.split(/\s+/).forEach(function(t){e.removeEventListener(t,i)})}},s.fire=function(e,t,n){var i=document.createEvent("HTMLEvents");for(var s in i.initEvent(t,!0,!0),n)i[s]=n[s];return e.dispatchEvent(i)},s.regExpEscape=function(e){return e.replace(/[-\\^$*+?.()|[\]{}]/g,"\\$&")},s.siblingIndex=function(e){for(var t=0;e=e.previousElementSibling;t++);return t},"undefined"!=typeof Document&&("loading"!==document.readyState?o():document.addEventListener("DOMContentLoaded",o)),t.$=s,t.$$=r,"undefined"!=typeof self&&(self.Awesomplete=t),"object"==typeof e&&e.exports&&(e.exports=t)}()},function(e,t,n){"use strict";(function(e){var i=n(4),s=setTimeout;function r(){}function o(e){if(!(this instanceof o))throw new TypeError("Promises must be constructed via new");if("function"!=typeof e)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],d(e,this)}function a(e,t){for(;3===e._state;)e=e._value;0!==e._state?(e._handled=!0,o._immediateFn(function(){var n=1===e._state?t.onFulfilled:t.onRejected;if(null!==n){var i;try{i=n(e._value)}catch(e){return void c(t.promise,e)}l(t.promise,i)}else(1===e._state?l:c)(t.promise,e._value)})):e._deferreds.push(t)}function l(e,t){try{if(t===e)throw new TypeError("A promise cannot be resolved with itself.");if(t&&("object"==typeof t||"function"==typeof t)){var n=t.then;if(t instanceof o)return e._state=3,e._value=t,void u(e);if("function"==typeof n)return void d(function(e,t){return function(){e.apply(t,arguments)}}(n,t),e)}e._state=1,e._value=t,u(e)}catch(t){c(e,t)}}function c(e,t){e._state=2,e._value=t,u(e)}function u(e){2===e._state&&0===e._deferreds.length&&o._immediateFn(function(){e._handled||o._unhandledRejectionFn(e._value)});for(var t=0,n=e._deferreds.length;t<n;t++)a(e,e._deferreds[t]);e._deferreds=null}function d(e,t){var n=!1;try{e(function(e){n||(n=!0,l(t,e))},function(e){n||(n=!0,c(t,e))})}catch(e){if(n)return;n=!0,c(t,e)}}o.prototype.catch=function(e){return this.then(null,e)},o.prototype.then=function(e,t){var n=new this.constructor(r);return a(this,new function(e,t,n){this.onFulfilled="function"==typeof e?e:null,this.onRejected="function"==typeof t?t:null,this.promise=n}(e,t,n)),n},o.prototype.finally=i.a,o.all=function(e){return new o(function(t,n){if(!e||void 0===e.length)throw new TypeError("Promise.all accepts an array");var i=Array.prototype.slice.call(e);if(0===i.length)return t([]);var s=i.length;function r(e,o){try{if(o&&("object"==typeof o||"function"==typeof o)){var a=o.then;if("function"==typeof a)return void a.call(o,function(t){r(e,t)},n)}i[e]=o,0==--s&&t(i)}catch(e){n(e)}}for(var o=0;o<i.length;o++)r(o,i[o])})},o.resolve=function(e){return e&&"object"==typeof e&&e.constructor===o?e:new o(function(t){t(e)})},o.reject=function(e){return new o(function(t,n){n(e)})},o.race=function(e){return new o(function(t,n){for(var i=0,s=e.length;i<s;i++)e[i].then(t,n)})},o._immediateFn="function"==typeof e&&function(t){e(t)}||function(e){s(e,0)},o._unhandledRejectionFn=function(e){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",e)},t.a=o}).call(this,n(6).setImmediate)},function(e,t,n){"use strict";t.a=function(e){var t=this.constructor;return this.then(function(n){return t.resolve(e()).then(function(){return n})},function(n){return t.resolve(e()).then(function(){return t.reject(n)})})}},function(e,t,n){"use strict";n.r(t);var i=n(0),s=n(2),r=n.n(s),o=n(3);const a="2abb284",l=["child","mother","father","spouse"],c={spouse:"persons",mother:"persons",father:"persons",child:"persons",birthplace:"birthplaces",membership:"memberships",affiliation:"affiliations",occupation:"occupations",education:"educations",position:"positions"},u=i.timeParse("%Y-%m-%dT%H:%M:%SZ");let d,f,h,p,m,v;async function g(){d=await async function(){const e="localhost"===location.hostname?"../data/":`//cdn.rawgit.com/akngs/smallworld/${a}/data/`,t=["affiliations","birthplaces","educations","memberships","occupations","persons","positions","links"];!function(e){const t=document.querySelector(".message");t.textContent=e,t.classList.add("show")}("Loading...");const n=await o.a.all(t.map(t=>i.csv(e+t+".csv")));document.querySelector(".message").classList.remove("show");const s={nodes:{},nodesMap:{},links:n.pop()};return n.forEach((e,n)=>{s.nodes[t[n]]=e,e.forEach(e=>{e.ins=[],e.outs=[],e.links=[]})}),n.forEach((e,n)=>{const i={};e.forEach(e=>i[e.key]=e),s.nodesMap[t[n]]=i}),s.links.forEach(e=>{e.source=s.nodesMap.persons[e.a],e.target=s.nodesMap[c[e.rel]][e.b],delete e.a,delete e.b,e.source&&e.target?(e.source.outs.push(e),e.source.links.push(e),e.target.ins.push(e),e.target.links.push(e)):e.drop=!0}),s.links=s.links.filter(e=>!e.drop),s.nodes.persons.forEach((e,t)=>{e.birth_date&&(e.birth_date=u(e.birth_date)),e.death_date&&(e.death_date=u(e.death_date)),e.info={},i.nest().key(e=>e.rel).entries(e.outs).forEach(t=>e.info[t.key]=t.values)}),s}();const e=document.querySelector(".query input");new r.a(e,{list:d.nodes.persons.map(e=>({label:L(e),value:e.key})),minChars:1,autoFirst:!0}),e.form.addEventListener("submit",t=>{t.preventDefault(),e.value=""}),e.addEventListener("awesomplete-selectcomplete",t=>{y(t.text.value,!0),I(t.text.value),M(),e.value=""});const t=i.select("svg .root");f=t.select(".links").selectAll(".link"),h=t.select(".nodes").selectAll(".node"),m=i.forceLink(f.data()).distance(80),p=i.forceSimulation(h.data()).force("link",m).force("x",i.forceX(0).strength(.01)).force("y",i.forceY(0).strength(.01)).force("collide",i.forceCollide(10)).force("charge",i.forceManyBody().strength(-50)).on("tick",_),w(),window.addEventListener("resize",w),y("Q16080217"),M()}function y(e,t){const n=d.nodesMap.persons[e];n&&(t&&n.selected||(n.selected=t||!n.selected,n.selected&&(n.x=n.x||Math.random()-.5,n.y=n.y||Math.random()-.5),n.fullyExpanded=x(n),n.links.filter(b).forEach(e=>{e.source.fullyExpanded=x(e.source),e.target.fullyExpanded=x(e.target)})))}function b(e){return-1!==l.indexOf(e.rel)}function x(e){return 0===e.links.filter(b).filter(e=>!e.source.selected||!e.target.selected).length}function w(){i.select("svg").attr("width",innerWidth).attr("height",innerHeight).select(".root").style("transform",`translate(${.5*innerWidth}px, ${.5*innerHeight}px)`),p.alphaTarget(.3).restart()}function _(){h.classed("active",e=>e===v).classed("fully-expanded",e=>e.fullyExpanded).style("transform",e=>`translate(${e.x}px, ${e.y}px)`).select("circle").attr("r",e=>e.fullyExpanded?5:7),f.attr("x1",e=>e.source.x).attr("y1",e=>e.source.y).attr("x2",e=>e.target.x).attr("y2",e=>e.target.y)}function T(e){I(e.key),M()}function E(e){e.x=e.fx=i.event.x,e.y=e.fy=i.event.y,p.alphaTarget(.3).restart()}function k(e){e.x=e.fx=i.event.x,e.y=e.fy=i.event.y,i.select(this).style("transform",`translate(${e.x}px, ${e.y}px)`)}function A(e){e!==v&&(delete e.fx,delete e.fy),p.alphaTarget(0)}function I(e){const t=d.nodesMap.persons[e];console.log(t),v&&(delete v.fx,delete v.fy),v===t?(v=null,document.querySelector(".infobox").innerHTML=""):((v=t).fx=v.x,v.fy=v.y,function(e){const t=d.nodesMap.persons[e],n=t.info,s=i.select(".infobox").html('<div class="item occupation"><h3>직업</h3><ul></ul></div><div class="item affiliation"><h3>소속</h3><ul></ul></div><div class="item position"><h3>직위 </h3><ul></ul></div><div class="item membership"><h3>멤버십</h3><ul></ul></div><div class="item education"><h3>출신학교</h3><ul></ul></div><div class="item birthplace"><h3>출생지</h3><ul></ul></div><div class="item mother"><h3>어머니</h3><ul></ul></div><div class="item father"><h3>아버지</h3><ul></ul></div><div class="item spouse"><h3>배우자</h3><ul></ul></div><img class="item image" src="#" alt="profile"><div class="edit"></div>');s.select(".edit").html(`<a href="https://www.wikidata.org/entity/${t.key}" target="_blank">edit on wikidata</a>`),s.select(".occupation").classed("show",n.occupation),s.select(".occupation ul").selectAll("li").data(n.occupation||[]).enter().append("li").text(e=>e.target.name),s.select(".affiliation").classed("show",n.affiliation),s.select(".affiliation ul").selectAll("li").data(n.affiliation||[]).enter().append("li").text(e=>e.target.name),s.select(".position").classed("show",n.position),s.select(".position ul").selectAll("li").data(n.position||[]).enter().append("li").text(e=>e.target.name),s.select(".membership").classed("show",n.membership),s.select(".membership ul").selectAll("li").data(n.membership||[]).enter().append("li").text(e=>e.target.name),s.select(".education").classed("show",n.education),s.select(".education ul").selectAll("li").data(n.education||[]).enter().append("li").text(e=>e.target.name),s.select(".birthplace").classed("show",n.birthplace),s.select(".birthplace ul").selectAll("li").data(n.birthplace||[]).enter().append("li").text(e=>e.target.name),s.select(".mother").classed("show",n.mother),s.select(".mother ul").selectAll("li").data(n.mother||[]).enter().append("li").text(e=>L(e.target)),s.select(".father").classed("show",n.father),s.select(".father ul").selectAll("li").data(n.father||[]).enter().append("li").text(e=>L(e.target)),s.select(".spouse").classed("show",n.spouse),s.select(".spouse ul").selectAll("li").data(n.spouse||[]).enter().append("li").text(e=>L(e.target)),s.select(".child").classed("show",n.child),s.select(".child ul").selectAll("li").data(n.child||[]).enter().append("li").text(e=>L(e.target)),s.select(".image").classed("show",t.image),t.image&&s.select(".image").attr("src",t.image.replace("http:","https:"))}(v.key),i.select(this).raise(),function(e){y(e,!0);const t=d.nodesMap.persons[e];t.links&&t.links.forEach(e=>{d.nodesMap.persons[e.source.key]&&(e.source.selected||(e.source.x=t.x,e.source.y=t.y),y(e.source.key,!0)),d.nodesMap.persons[e.target.key]&&(e.target.selected||(e.target.x=t.x,e.target.y=t.y),y(e.target.key,!0))})}(t.key))}function M(){(h=h.data(d.nodes.persons.filter(e=>e.selected),e=>e.key)).exit().remove(),h=h.enter().append("g").attr("class","node person").each(function(e){i.select(this).append("circle").attr("fill","steelblue"),i.select(this).append("text").attr("class","name").style("transform","translate(8px, 8px)").text(e=>e.name)}).on("click",T).call(i.drag().on("start",E).on("drag",k).on("end",A)).merge(h),(f=f.data(d.links.filter(e=>e.source.selected&&e.target.selected))).exit().remove(),f=f.enter().append("line").merge(f).attr("class",e=>`link ${e.rel}`).attr("marker-end",e=>"child"===e.rel?"url(#arrowMarker)":""),p.nodes(h.data()),m.links(f.data()),p.alphaTarget(.3).restart()}function L(e){const t=e.name,n=e.birth_date||null,i=e.death_date||null;let s;return n?s=`${n.getFullYear()}`:i&&(s=`?-${i.getFullYear()}`),s?`${t} (${s})`:`${t}`}window.addEventListener("DOMContentLoaded",function(){g().then()})},function(e,t,n){(function(e){var i=void 0!==e&&e||"undefined"!=typeof self&&self||window,s=Function.prototype.apply;function r(e,t){this._id=e,this._clearFn=t}t.setTimeout=function(){return new r(s.call(setTimeout,i,arguments),clearTimeout)},t.setInterval=function(){return new r(s.call(setInterval,i,arguments),clearInterval)},t.clearTimeout=t.clearInterval=function(e){e&&e.close()},r.prototype.unref=r.prototype.ref=function(){},r.prototype.close=function(){this._clearFn.call(i,this._id)},t.enroll=function(e,t){clearTimeout(e._idleTimeoutId),e._idleTimeout=t},t.unenroll=function(e){clearTimeout(e._idleTimeoutId),e._idleTimeout=-1},t._unrefActive=t.active=function(e){clearTimeout(e._idleTimeoutId);var t=e._idleTimeout;t>=0&&(e._idleTimeoutId=setTimeout(function(){e._onTimeout&&e._onTimeout()},t))},n(7),t.setImmediate="undefined"!=typeof self&&self.setImmediate||void 0!==e&&e.setImmediate||this&&this.setImmediate,t.clearImmediate="undefined"!=typeof self&&self.clearImmediate||void 0!==e&&e.clearImmediate||this&&this.clearImmediate}).call(this,n(1))},function(e,t,n){(function(e,t){!function(e,n){"use strict";if(!e.setImmediate){var i,s=1,r={},o=!1,a=e.document,l=Object.getPrototypeOf&&Object.getPrototypeOf(e);l=l&&l.setTimeout?l:e,"[object process]"==={}.toString.call(e.process)?i=function(e){t.nextTick(function(){u(e)})}:function(){if(e.postMessage&&!e.importScripts){var t=!0,n=e.onmessage;return e.onmessage=function(){t=!1},e.postMessage("","*"),e.onmessage=n,t}}()?function(){var t="setImmediate$"+Math.random()+"$",n=function(n){n.source===e&&"string"==typeof n.data&&0===n.data.indexOf(t)&&u(+n.data.slice(t.length))};e.addEventListener?e.addEventListener("message",n,!1):e.attachEvent("onmessage",n),i=function(n){e.postMessage(t+n,"*")}}():e.MessageChannel?function(){var e=new MessageChannel;e.port1.onmessage=function(e){u(e.data)},i=function(t){e.port2.postMessage(t)}}():a&&"onreadystatechange"in a.createElement("script")?function(){var e=a.documentElement;i=function(t){var n=a.createElement("script");n.onreadystatechange=function(){u(t),n.onreadystatechange=null,e.removeChild(n),n=null},e.appendChild(n)}}():i=function(e){setTimeout(u,0,e)},l.setImmediate=function(e){"function"!=typeof e&&(e=new Function(""+e));for(var t=new Array(arguments.length-1),n=0;n<t.length;n++)t[n]=arguments[n+1];var o={callback:e,args:t};return r[s]=o,i(s),s++},l.clearImmediate=c}function c(e){delete r[e]}function u(e){if(o)setTimeout(u,0,e);else{var t=r[e];if(t){o=!0;try{!function(e){var t=e.callback,i=e.args;switch(i.length){case 0:t();break;case 1:t(i[0]);break;case 2:t(i[0],i[1]);break;case 3:t(i[0],i[1],i[2]);break;default:t.apply(n,i)}}(t)}finally{c(e),o=!1}}}}}("undefined"==typeof self?void 0===e?this:e:self)}).call(this,n(1),n(8))},function(e,t){var n,i,s=e.exports={};function r(){throw new Error("setTimeout has not been defined")}function o(){throw new Error("clearTimeout has not been defined")}function a(e){if(n===setTimeout)return setTimeout(e,0);if((n===r||!n)&&setTimeout)return n=setTimeout,setTimeout(e,0);try{return n(e,0)}catch(t){try{return n.call(null,e,0)}catch(t){return n.call(this,e,0)}}}!function(){try{n="function"==typeof setTimeout?setTimeout:r}catch(e){n=r}try{i="function"==typeof clearTimeout?clearTimeout:o}catch(e){i=o}}();var l,c=[],u=!1,d=-1;function f(){u&&l&&(u=!1,l.length?c=l.concat(c):d=-1,c.length&&h())}function h(){if(!u){var e=a(f);u=!0;for(var t=c.length;t;){for(l=c,c=[];++d<t;)l&&l[d].run();d=-1,t=c.length}l=null,u=!1,function(e){if(i===clearTimeout)return clearTimeout(e);if((i===o||!i)&&clearTimeout)return i=clearTimeout,clearTimeout(e);try{i(e)}catch(t){try{return i.call(null,e)}catch(t){return i.call(this,e)}}}(e)}}function p(e,t){this.fun=e,this.array=t}function m(){}s.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];c.push(new p(e,t)),1!==c.length||u||a(h)},p.prototype.run=function(){this.fun.apply(null,this.array)},s.title="browser",s.browser=!0,s.env={},s.argv=[],s.version="",s.versions={},s.on=m,s.addListener=m,s.once=m,s.off=m,s.removeListener=m,s.removeAllListeners=m,s.emit=m,s.prependListener=m,s.prependOnceListener=m,s.listeners=function(e){return[]},s.binding=function(e){throw new Error("process.binding is not supported")},s.cwd=function(){return"/"},s.chdir=function(e){throw new Error("process.chdir is not supported")},s.umask=function(){return 0}}]);