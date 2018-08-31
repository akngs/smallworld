window.sw=function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=4)}([function(e,t){e.exports=window.d3},function(e,t){var n;n=function(){return this}();try{n=n||Function("return this")()||(0,eval)("this")}catch(e){"object"==typeof window&&(n=window)}e.exports=n},function(e,t,n){"use strict";(function(e){var r=n(3),o=setTimeout;function i(){}function c(e){if(!(this instanceof c))throw new TypeError("Promises must be constructed via new");if("function"!=typeof e)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],f(e,this)}function s(e,t){for(;3===e._state;)e=e._value;0!==e._state?(e._handled=!0,c._immediateFn(function(){var n=1===e._state?t.onFulfilled:t.onRejected;if(null!==n){var r;try{r=n(e._value)}catch(e){return void u(t.promise,e)}a(t.promise,r)}else(1===e._state?a:u)(t.promise,e._value)})):e._deferreds.push(t)}function a(e,t){try{if(t===e)throw new TypeError("A promise cannot be resolved with itself.");if(t&&("object"==typeof t||"function"==typeof t)){var n=t.then;if(t instanceof c)return e._state=3,e._value=t,void l(e);if("function"==typeof n)return void f(function(e,t){return function(){e.apply(t,arguments)}}(n,t),e)}e._state=1,e._value=t,l(e)}catch(t){u(e,t)}}function u(e,t){e._state=2,e._value=t,l(e)}function l(e){2===e._state&&0===e._deferreds.length&&c._immediateFn(function(){e._handled||c._unhandledRejectionFn(e._value)});for(var t=0,n=e._deferreds.length;t<n;t++)s(e,e._deferreds[t]);e._deferreds=null}function f(e,t){var n=!1;try{e(function(e){n||(n=!0,a(t,e))},function(e){n||(n=!0,u(t,e))})}catch(e){if(n)return;n=!0,u(t,e)}}c.prototype.catch=function(e){return this.then(null,e)},c.prototype.then=function(e,t){var n=new this.constructor(i);return s(this,new function(e,t,n){this.onFulfilled="function"==typeof e?e:null,this.onRejected="function"==typeof t?t:null,this.promise=n}(e,t,n)),n},c.prototype.finally=r.a,c.all=function(e){return new c(function(t,n){if(!e||void 0===e.length)throw new TypeError("Promise.all accepts an array");var r=Array.prototype.slice.call(e);if(0===r.length)return t([]);var o=r.length;function i(e,c){try{if(c&&("object"==typeof c||"function"==typeof c)){var s=c.then;if("function"==typeof s)return void s.call(c,function(t){i(e,t)},n)}r[e]=c,0==--o&&t(r)}catch(e){n(e)}}for(var c=0;c<r.length;c++)i(c,r[c])})},c.resolve=function(e){return e&&"object"==typeof e&&e.constructor===c?e:new c(function(t){t(e)})},c.reject=function(e){return new c(function(t,n){n(e)})},c.race=function(e){return new c(function(t,n){for(var r=0,o=e.length;r<o;r++)e[r].then(t,n)})},c._immediateFn="function"==typeof e&&function(t){e(t)}||function(e){o(e,0)},c._unhandledRejectionFn=function(e){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",e)},t.a=c}).call(this,n(5).setImmediate)},function(e,t,n){"use strict";t.a=function(e){var t=this.constructor;return this.then(function(n){return t.resolve(e()).then(function(){return n})},function(n){return t.resolve(e()).then(function(){return t.reject(n)})})}},function(e,t,n){"use strict";n.r(t),n.d(t,"data",function(){return i}),n.d(t,"linksSel",function(){return c}),n.d(t,"nodesSel",function(){return s}),n.d(t,"force",function(){return a}),n.d(t,"forceLink",function(){return u}),n.d(t,"activeNode",function(){return l}),n.d(t,"findNodes",function(){return f}),n.d(t,"toggleNode",function(){return d}),n.d(t,"expandNode",function(){return p});var r=n(0),o=n(2);let i,c,s,a,u,l;function f(e){return i.nodes.persons.filter(t=>t.name===e)}function d(e,t){const n=i.nodesMap.persons[e];if(t&&n.selected)return;n.selected=t||!n.selected;const r=document.querySelector(`#person-${e}`);n.selected?(n.x=n.x||Math.random()-.5,n.y=n.y||Math.random()-.5,r.classList.add("selected")):r.classList.remove("selected"),n.fullyExpanded=m(n),n.links.filter(e=>-1!==["child","father","mother"].indexOf(e.rel)).forEach(e=>{e.source.fullyExpanded=m(e.source),e.target.fullyExpanded=m(e.target)})}function p(e){d(e,!0);const t=i.nodesMap.persons[e];t.links&&t.links.forEach(e=>{i.nodesMap.persons[e.source.key]&&(e.source.selected||(e.source.x=t.x,e.source.y=t.y),d(e.source.key,!0)),i.nodesMap.persons[e.target.key]&&(e.target.selected||(e.target.x=t.x,e.target.y=t.y),d(e.target.key,!0))})}async function h(){const e=[];(i=await async function(){const e=["affiliations","birthplaces","educations","memberships","occupations","persons","positions","links"],t=await o.a.all(e.map(e=>r.csv("//cdn.rawgit.com/akngs/smallworld/90ff0cf2/data/"+e+".csv"))),n={nodes:{},nodesMap:{},links:t.pop()};t.forEach((t,r)=>{n.nodes[e[r]]=t,t.forEach(e=>{e.ins=[],e.outs=[],e.links=[]})}),t.forEach((t,r)=>{const o={};t.forEach(e=>o[e.key]=e),n.nodesMap[e[r]]=o});const i={spouse:"persons",father:"persons",mother:"persons",child:"persons",birthplace:"birthplaces",membership:"memberships",affiliation:"affiliations",occupation:"occupations",education:"educations",position:"positions"};return n.links.forEach(e=>{e.source=n.nodesMap.persons[e.a],e.target=n.nodesMap[i[e.rel]][e.b],delete e.a,delete e.b,e.source&&e.target?(e.source.outs.push(e),e.source.links.push(e),e.target.ins.push(e),e.target.links.push(e)):e.drop=!0}),n.links=n.links.filter(e=>!e.drop),n}()).nodes.persons.forEach(t=>{e.push(`<li id="person-${t.key}" data-key="${t.key}">${t.name}</li>`)}),document.querySelector(".panels .persons").innerHTML=e.join(""),document.querySelector(".panels .persons").addEventListener("click",function(e){d(e.target.dataset.key),_()});const t=document.querySelector("svg").clientWidth,n=document.querySelector("svg").clientHeight,l=r.select("svg").attr("width",t).attr("height",n).select(".root").style("transform",`translate(${.5*t}px, ${.5*n}px)`);c=l.select(".links").selectAll(".link"),s=l.select(".nodes").selectAll(".node"),u=r.forceLink(c.data()).distance(50),a=r.forceSimulation(s.data()).force("link",u).force("center",r.forceCenter(0,0)).force("x",r.forceX(0).strength(.01)).force("y",r.forceY(0).strength(.01)).force("collide",r.forceCollide(10)).force("charge",r.forceManyBody().strength(-50)).on("tick",y),d("Q45785"),d("Q12589753"),_()}function m(e){return 0===e.links.filter(e=>-1!==["child","father","mother"].indexOf(e.rel)).filter(e=>!e.source.selected||!e.target.selected).length}function y(){T()}function v(e){l=l===e?null:e,r.select(this).raise(),p(e.key),_()}function g(e){e.x=e.fx=r.event.x,e.y=e.fy=r.event.y,a.alphaTarget(.3).restart()}function w(e){e.x=e.fx=r.event.x,e.y=e.fy=r.event.y,r.select(this).style("transform",`translate(${e.x}px, ${e.y}px)`)}function x(e){delete e.fx,delete e.fy,a.alphaTarget(0)}function _(){(s=s.data(i.nodes.persons.filter(e=>e.selected),e=>e.key)).exit().remove(),s=s.enter().append("g").attr("class","node person").each(function(e){r.select(this).append("circle").attr("fill","steelblue"),r.select(this).append("text").attr("class","name").style("transform","translate(8px, 8px)").text(e.name)}).on("click",v).call(r.drag().on("start",g).on("drag",w).on("end",x)).merge(s),(c=c.data(i.links.filter(e=>e.source.selected&&e.target.selected))).exit().remove(),c=c.enter().append("line").attr("class","link").attr("stroke","#444").merge(c),a.nodes(s.data()),u.links(c.data()),a.alphaTarget(.3).restart()}function T(){s.classed("active",e=>e===l).classed("fully-expanded",e=>e.fullyExpanded).style("transform",e=>`translate(${e.x}px, ${e.y}px)`).select("circle").attr("r",e=>e.fullyExpanded?5:8),c.attr("x1",e=>e.source.x).attr("y1",e=>e.source.y).attr("x2",e=>e.target.x).attr("y2",e=>e.target.y)}window.addEventListener("DOMContentLoaded",function(){h().then()})},function(e,t,n){(function(e){var r=void 0!==e&&e||"undefined"!=typeof self&&self||window,o=Function.prototype.apply;function i(e,t){this._id=e,this._clearFn=t}t.setTimeout=function(){return new i(o.call(setTimeout,r,arguments),clearTimeout)},t.setInterval=function(){return new i(o.call(setInterval,r,arguments),clearInterval)},t.clearTimeout=t.clearInterval=function(e){e&&e.close()},i.prototype.unref=i.prototype.ref=function(){},i.prototype.close=function(){this._clearFn.call(r,this._id)},t.enroll=function(e,t){clearTimeout(e._idleTimeoutId),e._idleTimeout=t},t.unenroll=function(e){clearTimeout(e._idleTimeoutId),e._idleTimeout=-1},t._unrefActive=t.active=function(e){clearTimeout(e._idleTimeoutId);var t=e._idleTimeout;t>=0&&(e._idleTimeoutId=setTimeout(function(){e._onTimeout&&e._onTimeout()},t))},n(6),t.setImmediate="undefined"!=typeof self&&self.setImmediate||void 0!==e&&e.setImmediate||this&&this.setImmediate,t.clearImmediate="undefined"!=typeof self&&self.clearImmediate||void 0!==e&&e.clearImmediate||this&&this.clearImmediate}).call(this,n(1))},function(e,t,n){(function(e,t){!function(e,n){"use strict";if(!e.setImmediate){var r,o=1,i={},c=!1,s=e.document,a=Object.getPrototypeOf&&Object.getPrototypeOf(e);a=a&&a.setTimeout?a:e,"[object process]"==={}.toString.call(e.process)?r=function(e){t.nextTick(function(){l(e)})}:function(){if(e.postMessage&&!e.importScripts){var t=!0,n=e.onmessage;return e.onmessage=function(){t=!1},e.postMessage("","*"),e.onmessage=n,t}}()?function(){var t="setImmediate$"+Math.random()+"$",n=function(n){n.source===e&&"string"==typeof n.data&&0===n.data.indexOf(t)&&l(+n.data.slice(t.length))};e.addEventListener?e.addEventListener("message",n,!1):e.attachEvent("onmessage",n),r=function(n){e.postMessage(t+n,"*")}}():e.MessageChannel?function(){var e=new MessageChannel;e.port1.onmessage=function(e){l(e.data)},r=function(t){e.port2.postMessage(t)}}():s&&"onreadystatechange"in s.createElement("script")?function(){var e=s.documentElement;r=function(t){var n=s.createElement("script");n.onreadystatechange=function(){l(t),n.onreadystatechange=null,e.removeChild(n),n=null},e.appendChild(n)}}():r=function(e){setTimeout(l,0,e)},a.setImmediate=function(e){"function"!=typeof e&&(e=new Function(""+e));for(var t=new Array(arguments.length-1),n=0;n<t.length;n++)t[n]=arguments[n+1];var c={callback:e,args:t};return i[o]=c,r(o),o++},a.clearImmediate=u}function u(e){delete i[e]}function l(e){if(c)setTimeout(l,0,e);else{var t=i[e];if(t){c=!0;try{!function(e){var t=e.callback,r=e.args;switch(r.length){case 0:t();break;case 1:t(r[0]);break;case 2:t(r[0],r[1]);break;case 3:t(r[0],r[1],r[2]);break;default:t.apply(n,r)}}(t)}finally{u(e),c=!1}}}}}("undefined"==typeof self?void 0===e?this:e:self)}).call(this,n(1),n(7))},function(e,t){var n,r,o=e.exports={};function i(){throw new Error("setTimeout has not been defined")}function c(){throw new Error("clearTimeout has not been defined")}function s(e){if(n===setTimeout)return setTimeout(e,0);if((n===i||!n)&&setTimeout)return n=setTimeout,setTimeout(e,0);try{return n(e,0)}catch(t){try{return n.call(null,e,0)}catch(t){return n.call(this,e,0)}}}!function(){try{n="function"==typeof setTimeout?setTimeout:i}catch(e){n=i}try{r="function"==typeof clearTimeout?clearTimeout:c}catch(e){r=c}}();var a,u=[],l=!1,f=-1;function d(){l&&a&&(l=!1,a.length?u=a.concat(u):f=-1,u.length&&p())}function p(){if(!l){var e=s(d);l=!0;for(var t=u.length;t;){for(a=u,u=[];++f<t;)a&&a[f].run();f=-1,t=u.length}a=null,l=!1,function(e){if(r===clearTimeout)return clearTimeout(e);if((r===c||!r)&&clearTimeout)return r=clearTimeout,clearTimeout(e);try{r(e)}catch(t){try{return r.call(null,e)}catch(t){return r.call(this,e)}}}(e)}}function h(e,t){this.fun=e,this.array=t}function m(){}o.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];u.push(new h(e,t)),1!==u.length||l||s(p)},h.prototype.run=function(){this.fun.apply(null,this.array)},o.title="browser",o.browser=!0,o.env={},o.argv=[],o.version="",o.versions={},o.on=m,o.addListener=m,o.once=m,o.off=m,o.removeListener=m,o.removeAllListeners=m,o.emit=m,o.prependListener=m,o.prependOnceListener=m,o.listeners=function(e){return[]},o.binding=function(e){throw new Error("process.binding is not supported")},o.cwd=function(){return"/"},o.chdir=function(e){throw new Error("process.chdir is not supported")},o.umask=function(){return 0}}]);