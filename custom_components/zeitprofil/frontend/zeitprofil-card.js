/* zeitprofil-card – built from frontend/src, do not edit */
var ae=globalThis,le=ae.ShadowRoot&&(ae.ShadyCSS===void 0||ae.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ye=Symbol(),Re=new WeakMap,Y=class{constructor(i,e,t){if(this._$cssResult$=!0,t!==ye)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=i,this.t=e}get styleSheet(){let i=this.o,e=this.t;if(le&&i===void 0){let t=e!==void 0&&e.length===1;t&&(i=Re.get(e)),i===void 0&&((this.o=i=new CSSStyleSheet).replaceSync(this.cssText),t&&Re.set(e,i))}return i}toString(){return this.cssText}},Le=r=>new Y(typeof r=="string"?r:r+"",void 0,ye),w=(r,...i)=>{let e=r.length===1?r[0]:i.reduce((t,s,n)=>t+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+r[n+1],r[0]);return new Y(e,r,ye)},Fe=(r,i)=>{if(le)r.adoptedStyleSheets=i.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of i){let t=document.createElement("style"),s=ae.litNonce;s!==void 0&&t.setAttribute("nonce",s),t.textContent=e.cssText,r.appendChild(t)}},$e=le?r=>r:r=>r instanceof CSSStyleSheet?(i=>{let e="";for(let t of i.cssRules)e+=t.cssText;return Le(e)})(r):r;var{is:_t,defineProperty:bt,getOwnPropertyDescriptor:yt,getOwnPropertyNames:$t,getOwnPropertySymbols:xt,getPrototypeOf:wt}=Object,de=globalThis,Ue=de.trustedTypes,kt=Ue?Ue.emptyScript:"",Et=de.reactiveElementPolyfillSupport,G=(r,i)=>r,xe={toAttribute(r,i){switch(i){case Boolean:r=r?kt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,i){let e=r;switch(i){case Boolean:e=r!==null;break;case Number:e=r===null?null:Number(r);break;case Object:case Array:try{e=JSON.parse(r)}catch{e=null}}return e}},We=(r,i)=>!_t(r,i),Ve={attribute:!0,type:String,converter:xe,reflect:!1,useDefault:!1,hasChanged:We};Symbol.metadata??=Symbol("metadata"),de.litPropertyMetadata??=new WeakMap;var P=class extends HTMLElement{static addInitializer(i){this._$Ei(),(this.l??=[]).push(i)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(i,e=Ve){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(i)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(i,e),!e.noAccessor){let t=Symbol(),s=this.getPropertyDescriptor(i,t,e);s!==void 0&&bt(this.prototype,i,s)}}static getPropertyDescriptor(i,e,t){let{get:s,set:n}=yt(this.prototype,i)??{get(){return this[e]},set(o){this[e]=o}};return{get:s,set(o){let l=s?.call(this);n?.call(this,o),this.requestUpdate(i,l,t)},configurable:!0,enumerable:!0}}static getPropertyOptions(i){return this.elementProperties.get(i)??Ve}static _$Ei(){if(this.hasOwnProperty(G("elementProperties")))return;let i=wt(this);i.finalize(),i.l!==void 0&&(this.l=[...i.l]),this.elementProperties=new Map(i.elementProperties)}static finalize(){if(this.hasOwnProperty(G("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(G("properties"))){let e=this.properties,t=[...$t(e),...xt(e)];for(let s of t)this.createProperty(s,e[s])}let i=this[Symbol.metadata];if(i!==null){let e=litPropertyMetadata.get(i);if(e!==void 0)for(let[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let s=this._$Eu(e,t);s!==void 0&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(i){let e=[];if(Array.isArray(i)){let t=new Set(i.flat(1/0).reverse());for(let s of t)e.unshift($e(s))}else i!==void 0&&e.push($e(i));return e}static _$Eu(i,e){let t=e.attribute;return t===!1?void 0:typeof t=="string"?t:typeof i=="string"?i.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(i=>this.enableUpdating=i),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(i=>i(this))}addController(i){(this._$EO??=new Set).add(i),this.renderRoot!==void 0&&this.isConnected&&i.hostConnected?.()}removeController(i){this._$EO?.delete(i)}_$E_(){let i=new Map,e=this.constructor.elementProperties;for(let t of e.keys())this.hasOwnProperty(t)&&(i.set(t,this[t]),delete this[t]);i.size>0&&(this._$Ep=i)}createRenderRoot(){let i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Fe(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(i=>i.hostConnected?.())}enableUpdating(i){}disconnectedCallback(){this._$EO?.forEach(i=>i.hostDisconnected?.())}attributeChangedCallback(i,e,t){this._$AK(i,t)}_$ET(i,e){let t=this.constructor.elementProperties.get(i),s=this.constructor._$Eu(i,t);if(s!==void 0&&t.reflect===!0){let n=(t.converter?.toAttribute!==void 0?t.converter:xe).toAttribute(e,t.type);this._$Em=i,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(i,e){let t=this.constructor,s=t._$Eh.get(i);if(s!==void 0&&this._$Em!==s){let n=t.getPropertyOptions(s),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:xe;this._$Em=s;let l=o.fromAttribute(e,n.type);this[s]=l??this._$Ej?.get(s)??l,this._$Em=null}}requestUpdate(i,e,t,s=!1,n){if(i!==void 0){let o=this.constructor;if(s===!1&&(n=this[i]),t??=o.getPropertyOptions(i),!((t.hasChanged??We)(n,e)||t.useDefault&&t.reflect&&n===this._$Ej?.get(i)&&!this.hasAttribute(o._$Eu(i,t))))return;this.C(i,e,t)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(i,e,{useDefault:t,reflect:s,wrapped:n},o){t&&!(this._$Ej??=new Map).has(i)&&(this._$Ej.set(i,o??e??this[i]),n!==!0||o!==void 0)||(this._$AL.has(i)||(this.hasUpdated||t||(e=void 0),this._$AL.set(i,e)),s===!0&&this._$Em!==i&&(this._$Eq??=new Set).add(i))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let i=this.scheduleUpdate();return i!=null&&await i,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,n]of this._$Ep)this[s]=n;this._$Ep=void 0}let t=this.constructor.elementProperties;if(t.size>0)for(let[s,n]of t){let{wrapped:o}=n,l=this[s];o!==!0||this._$AL.has(s)||l===void 0||this.C(s,void 0,n,l)}}let i=!1,e=this._$AL;try{i=this.shouldUpdate(e),i?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(t){throw i=!1,this._$EM(),t}i&&this._$AE(e)}willUpdate(i){}_$AE(i){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(i)),this.updated(i)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(i){return!0}update(i){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(i){}firstUpdated(i){}};P.elementStyles=[],P.shadowRootOptions={mode:"open"},P[G("elementProperties")]=new Map,P[G("finalized")]=new Map,Et?.({ReactiveElement:P}),(de.reactiveElementVersions??=[]).push("2.1.2");var Te=globalThis,je=r=>r,ce=Te.trustedTypes,Be=ce?ce.createPolicy("lit-html",{createHTML:r=>r}):void 0,qe="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,Je="?"+C,Pt=`<${Je}>`,O=document,Z=()=>O.createComment(""),q=r=>r===null||typeof r!="object"&&typeof r!="function",Me=Array.isArray,St=r=>Me(r)||typeof r?.[Symbol.iterator]=="function",we=`[ 	
\f\r]`,X=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ke=/-->/g,Ye=/>/g,D=RegExp(`>|${we}(?:([^\\s"'>=/]+)(${we}*=${we}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ge=/'/g,Xe=/"/g,Qe=/^(?:script|style|textarea|title)$/i,Ce=r=>(i,...e)=>({_$litType$:r,strings:i,values:e}),p=Ce(1),S=Ce(2),ei=Ce(3),z=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),Ze=new WeakMap,H=O.createTreeWalker(O,129);function et(r,i){if(!Me(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return Be!==void 0?Be.createHTML(i):i}var At=(r,i)=>{let e=r.length-1,t=[],s,n=i===2?"<svg>":i===3?"<math>":"",o=X;for(let l=0;l<e;l++){let a=r[l],h,c,d=-1,f=0;for(;f<a.length&&(o.lastIndex=f,c=o.exec(a),c!==null);)f=o.lastIndex,o===X?c[1]==="!--"?o=Ke:c[1]!==void 0?o=Ye:c[2]!==void 0?(Qe.test(c[2])&&(s=RegExp("</"+c[2],"g")),o=D):c[3]!==void 0&&(o=D):o===D?c[0]===">"?(o=s??X,d=-1):c[1]===void 0?d=-2:(d=o.lastIndex-c[2].length,h=c[1],o=c[3]===void 0?D:c[3]==='"'?Xe:Ge):o===Xe||o===Ge?o=D:o===Ke||o===Ye?o=X:(o=D,s=void 0);let m=o===D&&r[l+1].startsWith("/>")?" ":"";n+=o===X?a+Pt:d>=0?(t.push(h),a.slice(0,d)+qe+a.slice(d)+C+m):a+C+(d===-2?l:m)}return[et(r,n+(r[e]||"<?>")+(i===2?"</svg>":i===3?"</math>":"")),t]},J=class r{constructor({strings:i,_$litType$:e},t){let s;this.parts=[];let n=0,o=0,l=i.length-1,a=this.parts,[h,c]=At(i,e);if(this.el=r.createElement(h,t),H.currentNode=this.el.content,e===2||e===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(s=H.nextNode())!==null&&a.length<l;){if(s.nodeType===1){if(s.hasAttributes())for(let d of s.getAttributeNames())if(d.endsWith(qe)){let f=c[o++],m=s.getAttribute(d).split(C),g=/([.?@])?(.*)/.exec(f);a.push({type:1,index:n,name:g[2],strings:m,ctor:g[1]==="."?Ee:g[1]==="?"?Pe:g[1]==="@"?Se:U}),s.removeAttribute(d)}else d.startsWith(C)&&(a.push({type:6,index:n}),s.removeAttribute(d));if(Qe.test(s.tagName)){let d=s.textContent.split(C),f=d.length-1;if(f>0){s.textContent=ce?ce.emptyScript:"";for(let m=0;m<f;m++)s.append(d[m],Z()),H.nextNode(),a.push({type:2,index:++n});s.append(d[f],Z())}}}else if(s.nodeType===8)if(s.data===Je)a.push({type:2,index:n});else{let d=-1;for(;(d=s.data.indexOf(C,d+1))!==-1;)a.push({type:7,index:n}),d+=C.length-1}n++}}static createElement(i,e){let t=O.createElement("template");return t.innerHTML=i,t}};function F(r,i,e=r,t){if(i===z)return i;let s=t!==void 0?e._$Co?.[t]:e._$Cl,n=q(i)?void 0:i._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),n===void 0?s=void 0:(s=new n(r),s._$AT(r,e,t)),t!==void 0?(e._$Co??=[])[t]=s:e._$Cl=s),s!==void 0&&(i=F(r,s._$AS(r,i.values),s,t)),i}var ke=class{constructor(i,e){this._$AV=[],this._$AN=void 0,this._$AD=i,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(i){let{el:{content:e},parts:t}=this._$AD,s=(i?.creationScope??O).importNode(e,!0);H.currentNode=s;let n=H.nextNode(),o=0,l=0,a=t[0];for(;a!==void 0;){if(o===a.index){let h;a.type===2?h=new Q(n,n.nextSibling,this,i):a.type===1?h=new a.ctor(n,a.name,a.strings,this,i):a.type===6&&(h=new Ae(n,this,i)),this._$AV.push(h),a=t[++l]}o!==a?.index&&(n=H.nextNode(),o++)}return H.currentNode=O,s}p(i){let e=0;for(let t of this._$AV)t!==void 0&&(t.strings!==void 0?(t._$AI(i,t,e),e+=t.strings.length-2):t._$AI(i[e])),e++}},Q=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(i,e,t,s){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=i,this._$AB=e,this._$AM=t,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let i=this._$AA.parentNode,e=this._$AM;return e!==void 0&&i?.nodeType===11&&(i=e.parentNode),i}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(i,e=this){i=F(this,i,e),q(i)?i===u||i==null||i===""?(this._$AH!==u&&this._$AR(),this._$AH=u):i!==this._$AH&&i!==z&&this._(i):i._$litType$!==void 0?this.$(i):i.nodeType!==void 0?this.T(i):St(i)?this.k(i):this._(i)}O(i){return this._$AA.parentNode.insertBefore(i,this._$AB)}T(i){this._$AH!==i&&(this._$AR(),this._$AH=this.O(i))}_(i){this._$AH!==u&&q(this._$AH)?this._$AA.nextSibling.data=i:this.T(O.createTextNode(i)),this._$AH=i}$(i){let{values:e,_$litType$:t}=i,s=typeof t=="number"?this._$AC(i):(t.el===void 0&&(t.el=J.createElement(et(t.h,t.h[0]),this.options)),t);if(this._$AH?._$AD===s)this._$AH.p(e);else{let n=new ke(s,this),o=n.u(this.options);n.p(e),this.T(o),this._$AH=n}}_$AC(i){let e=Ze.get(i.strings);return e===void 0&&Ze.set(i.strings,e=new J(i)),e}k(i){Me(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,t,s=0;for(let n of i)s===e.length?e.push(t=new r(this.O(Z()),this.O(Z()),this,this.options)):t=e[s],t._$AI(n),s++;s<e.length&&(this._$AR(t&&t._$AB.nextSibling,s),e.length=s)}_$AR(i=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);i!==this._$AB;){let t=je(i).nextSibling;je(i).remove(),i=t}}setConnected(i){this._$AM===void 0&&(this._$Cv=i,this._$AP?.(i))}},U=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(i,e,t,s,n){this.type=1,this._$AH=u,this._$AN=void 0,this.element=i,this.name=e,this._$AM=s,this.options=n,t.length>2||t[0]!==""||t[1]!==""?(this._$AH=Array(t.length-1).fill(new String),this.strings=t):this._$AH=u}_$AI(i,e=this,t,s){let n=this.strings,o=!1;if(n===void 0)i=F(this,i,e,0),o=!q(i)||i!==this._$AH&&i!==z,o&&(this._$AH=i);else{let l=i,a,h;for(i=n[0],a=0;a<n.length-1;a++)h=F(this,l[t+a],e,a),h===z&&(h=this._$AH[a]),o||=!q(h)||h!==this._$AH[a],h===u?i=u:i!==u&&(i+=(h??"")+n[a+1]),this._$AH[a]=h}o&&!s&&this.j(i)}j(i){i===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,i??"")}},Ee=class extends U{constructor(){super(...arguments),this.type=3}j(i){this.element[this.name]=i===u?void 0:i}},Pe=class extends U{constructor(){super(...arguments),this.type=4}j(i){this.element.toggleAttribute(this.name,!!i&&i!==u)}},Se=class extends U{constructor(i,e,t,s,n){super(i,e,t,s,n),this.type=5}_$AI(i,e=this){if((i=F(this,i,e,0)??u)===z)return;let t=this._$AH,s=i===u&&t!==u||i.capture!==t.capture||i.once!==t.once||i.passive!==t.passive,n=i!==u&&(t===u||s);s&&this.element.removeEventListener(this.name,this,t),n&&this.element.addEventListener(this.name,this,i),this._$AH=i}handleEvent(i){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,i):this._$AH.handleEvent(i)}},Ae=class{constructor(i,e,t){this.element=i,this.type=6,this._$AN=void 0,this._$AM=e,this.options=t}get _$AU(){return this._$AM._$AU}_$AI(i){F(this,i)}};var Tt=Te.litHtmlPolyfillSupport;Tt?.(J,Q),(Te.litHtmlVersions??=[]).push("3.3.3");var tt=(r,i,e)=>{let t=e?.renderBefore??i,s=t._$litPart$;if(s===void 0){let n=e?.renderBefore??null;t._$litPart$=s=new Q(i.insertBefore(Z(),n),n,void 0,e??{})}return s._$AI(r),s};var Ie=globalThis,y=class extends P{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let i=super.createRenderRoot();return this.renderOptions.renderBefore??=i.firstChild,i}update(i){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(i),this._$Do=tt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return z}};y._$litElement$=!0,y.finalized=!0,Ie.litElementHydrateSupport?.({LitElement:y});var Mt=Ie.litElementPolyfillSupport;Mt?.({LitElement:y});(Ie.litElementVersions??=[]).push("4.2.2");var he=r=>r.callWS({type:"zeitprofil/list"});var it=(r,i,e,t)=>r.callWS({type:"zeitprofil/save",entry_id:i,revision:e,schedule:t}),st=(r,i,e)=>r.connection.subscribeMessage(e,{type:"zeitprofil/subscribe",entry_id:i}),nt=(r,i,e,t)=>r.callWS({type:"zeitprofil/holidays",entry_id:i,start:e,end:t}),ot=(r,i,e)=>e===null?r.callService("zeitprofil","clear_override",{config_entry_id:i}):r.callService("zeitprofil","set_override",{config_entry_id:i,profile:e}),rt=(r,i,e,t,s,n)=>r.callService("zeitprofil","add_exception",{config_entry_id:i,from:e,to:t,profile:s,note:n});function Ct(r){if(!Number.isFinite(r)||r<=0)return 1;let i=r.toFixed(6).replace(/0+$/,"").replace(/\.$/,""),e=i.indexOf(".");return e<0?0:i.length-e-1}function pe(r,i,e){let t=Ct(i);return new Intl.NumberFormat(e,{minimumFractionDigits:0,maximumFractionDigits:t}).format(r)}function I(r,i,e,t){let s=pe(r,i,t);return e?`${s}\xA0${e}`:s}function Ne(r){let i=r.trim().replace(/\s/g,"").replace(",",".");return i===""||!/^-?\d*(\.\d*)?$/.test(i)?Number.NaN:Number(i)}function at(r,i,e=5){let t=i-r;if(t<=0)return[r];let s=t/e,n=10**Math.floor(Math.log10(s)),o=[1,2,2.5,5,10].map(h=>h*n),l=o.find(h=>h>=s)??o[o.length-1],a=[];for(let h=Math.ceil(r/l)*l;h<=i+1e-9;h+=l)a.push(Math.round(h*1e6)/1e6);return a}var ue={"card.name":"Time profile","card.description":"Shows today's plan and lets everyone edit the daily plans.","card.loading":"Loading\u2026","card.no_instance":"No time profile has been set up yet.","card.not_found":"This time profile no longer exists. Please choose another one in the card settings.","card.connection_error":"Connection problem: {message}","today.title":"Today: {profile}","today.now":"now {value}","today.next":"from {time} \u2192 {value}","today.disabled":"Paused \u2013 nothing is sent to the device.","today.unavailable":"The device is not reachable right now.","today.reason.weekday":"weekly plan","today.reason.holiday":"holiday","today.reason.exception":"exception","today.reason.override":"chosen by hand","today.mode":"Mode","today.mode.auto":"Automatic","today.until":"until {time}","today.add_holiday":"Add holiday","today.edit":"Edit","today.close_editor":"Close editor","holiday.title":"Add holiday","holiday.from":"From","holiday.to":"To","holiday.profile":"Plan during this time","holiday.note":"Note","holiday.note_default":"Holiday","holiday.save":"Add","holiday.cancel":"Cancel","holiday.added":"Holiday added.","editor.tab.profiles":"Daily plans","editor.tab.week":"Weekly plan","editor.tab.exceptions":"Holidays & exceptions","editor.save":"Save","editor.discard":"Discard","editor.undo":"Undo","editor.redo":"Redo","editor.saved":"Saved.","editor.saving":"Saving\u2026","editor.unsaved":"You have unsaved changes.","editor.confirm_leave":"You have unsaved changes. Discard them?","editor.confirm_discard":"Discard all changes?","editor.conflict":"Changed in the meantime \u2013 reload?","editor.reload":"Reload","editor.fix_errors":"Please fix the marked problems before saving.","profiles.add":"New plan","profiles.new_name":"New plan","profiles.name":"Name","profiles.color":"Color","profiles.duplicate":"Duplicate","profiles.delete":"Delete plan","profiles.copy_suffix":"(copy)","profiles.confirm_delete":'Delete the plan "{name}"?',"profiles.in_use":'"{name}" cannot be deleted because it is still used: {usages}. Choose another plan there first.',"profiles.last":"The last plan cannot be deleted.","profiles.copy_from":"Copy curve from","profiles.copy":"Copy","profiles.confirm_copy":'Replace all points of "{target}" with those of "{source}"?',"profiles.snap":"Snap to","profiles.snap_minutes":"{minutes} min","profiles.hint":"Tap the line to add a point. Drag points to move them.","profiles.continues":"continues into the next day","point.selected":"Selected point","point.time":"Time","point.value":"Temperature","point.value_generic":"Value","point.delete":"Delete point","point.add":"+ Point","point.minus":"Lower","point.plus":"Higher","point.table":"All points","point.full":"A plan can have at most {max} points.","point.min":"A plan needs at least one point.","point.taken":"There is already a point at {time}.","week.title":"Which plan applies on which day?","week.holiday":"On holidays:","week.no_holiday_source":"No holiday calendar is set up. An administrator can add one in the integration settings.","week.preview":"Month overview","week.prev_month":"Previous month","week.next_month":"Next month","week.legend_holiday":"holiday","week.legend_exception":"exception","week.day.mon":"Monday","week.day.tue":"Tuesday","week.day.wed":"Wednesday","week.day.thu":"Thursday","week.day.fri":"Friday","week.day.sat":"Saturday","week.day.sun":"Sunday","exceptions.title":"Holidays and other exceptions","exceptions.empty":"No exceptions yet.","exceptions.add":"+ Exception","exceptions.from":"From","exceptions.to":"To","exceptions.profile":"Plan","exceptions.note":"Note","exceptions.delete":"Delete","exceptions.past":"over","exceptions.active":"today","exceptions.remove_past":"Remove past entries","exceptions.auto_cleanup":"Remove past entries automatically","error.too_few_points":"At least {min} point is needed.","error.too_many_points":"At most {max} points are allowed.","error.invalid_time":"The time {time} is not valid.","error.time_not_on_grid":"Times must be on a {grid} minute step ({time}).","error.duplicate_time":"There are two points at {time}.","error.times_not_sorted":"The points are not in time order ({time}).","error.invalid_value":"Please enter a number ({time}).","error.value_out_of_range":"{value} at {time} is outside {min} \u2026 {max}.","error.no_profiles":"At least one plan is needed.","error.too_many_profiles":"At most {max} plans are allowed.","error.invalid_profile_id":"Invalid plan.","error.empty_name":"Please enter a name.","error.name_too_long":"The name is too long (at most {max} characters).","error.reserved_name":'"{name}" cannot be used as a name.',"error.duplicate_name":'The name "{name}" is used twice.',"error.invalid_color":"Please choose a color.","error.unknown_profile":"The chosen plan does not exist.","error.invalid_date":"Please enter a valid date.","error.date_range_reversed":"The end is before the start.","error.note_too_long":"The note is too long (at most {max} characters).","error.too_many_exceptions":"At most {max} exceptions are allowed.","error.profile_in_use":'"{name}" is still used: {usages}.',"error.invalid_format":"Invalid data.","error.unknown":"Problem: {code}","usage.holiday_profile":"holidays","usage.exception":"exception {number}","config.instance":"Time profile","config.view":"View","config.view.compact":"Compact (today, editor on demand)","config.view.full":"Full (editor always open)","config.allow_edit":"Allow editing for users without admin rights","config.title":"Title (optional)"},It={"card.name":"Zeitprofil","card.description":"Zeigt den heutigen Plan und l\xE4sst alle die Tagespl\xE4ne bearbeiten.","card.loading":"Wird geladen \u2026","card.no_instance":"Es wurde noch kein Zeitprofil eingerichtet.","card.not_found":"Dieses Zeitprofil gibt es nicht mehr. Bitte in den Karteneinstellungen ein anderes w\xE4hlen.","card.connection_error":"Verbindungsproblem: {message}","today.title":"Heute: {profile}","today.now":"jetzt {value}","today.next":"ab {time} \u2192 {value}","today.disabled":"Pausiert \u2013 es wird nichts an das Ger\xE4t gesendet.","today.unavailable":"Das Ger\xE4t ist gerade nicht erreichbar.","today.reason.weekday":"Wochenplan","today.reason.holiday":"Feiertag","today.reason.exception":"Ausnahme","today.reason.override":"von Hand gew\xE4hlt","today.mode":"Modus","today.mode.auto":"Automatik","today.until":"bis {time}","today.add_holiday":"Urlaub eintragen","today.edit":"Bearbeiten","today.close_editor":"Editor schlie\xDFen","holiday.title":"Urlaub eintragen","holiday.from":"Von","holiday.to":"Bis","holiday.profile":"Plan in dieser Zeit","holiday.note":"Notiz","holiday.note_default":"Urlaub","holiday.save":"Eintragen","holiday.cancel":"Abbrechen","holiday.added":"Urlaub eingetragen.","editor.tab.profiles":"Tagespl\xE4ne","editor.tab.week":"Wochenplan","editor.tab.exceptions":"Urlaub & Ausnahmen","editor.save":"Speichern","editor.discard":"Verwerfen","editor.undo":"R\xFCckg\xE4ngig","editor.redo":"Wiederholen","editor.saved":"Gespeichert.","editor.saving":"Wird gespeichert \u2026","editor.unsaved":"Es gibt ungespeicherte \xC4nderungen.","editor.confirm_leave":"Es gibt ungespeicherte \xC4nderungen. Verwerfen?","editor.confirm_discard":"Alle \xC4nderungen verwerfen?","editor.conflict":"Wurde inzwischen ge\xE4ndert \u2013 neu laden?","editor.reload":"Neu laden","editor.fix_errors":"Bitte vor dem Speichern die markierten Probleme beheben.","profiles.add":"Neuer Plan","profiles.new_name":"Neuer Plan","profiles.name":"Name","profiles.color":"Farbe","profiles.duplicate":"Duplizieren","profiles.delete":"Plan l\xF6schen","profiles.copy_suffix":"(Kopie)","profiles.confirm_delete":"Den Plan \u201E{name}\u201C l\xF6schen?","profiles.in_use":"\u201E{name}\u201C kann nicht gel\xF6scht werden, weil er noch verwendet wird: {usages}. Bitte dort zuerst einen anderen Plan w\xE4hlen.","profiles.last":"Der letzte Plan kann nicht gel\xF6scht werden.","profiles.copy_from":"Kurve kopieren von","profiles.copy":"Kopieren","profiles.confirm_copy":"Alle Punkte von \u201E{target}\u201C durch die von \u201E{source}\u201C ersetzen?","profiles.snap":"Einrasten auf","profiles.snap_minutes":"{minutes} Min.","profiles.hint":"Auf die Linie tippen f\xFCgt einen Punkt hinzu. Punkte lassen sich verschieben.","profiles.continues":"geht in den n\xE4chsten Tag \xFCber","point.selected":"Ausgew\xE4hlter Punkt","point.time":"Uhrzeit","point.value":"Temperatur","point.value_generic":"Wert","point.delete":"Punkt l\xF6schen","point.add":"+ Punkt","point.minus":"Niedriger","point.plus":"H\xF6her","point.table":"Alle Punkte","point.full":"Ein Plan kann h\xF6chstens {max} Punkte haben.","point.min":"Ein Plan braucht mindestens einen Punkt.","point.taken":"Um {time} gibt es schon einen Punkt.","week.title":"Welcher Plan gilt an welchem Tag?","week.holiday":"An Feiertagen gilt:","week.no_holiday_source":"Es ist kein Feiertagskalender eingerichtet. Ein Administrator kann ihn in den Einstellungen der Integration hinzuf\xFCgen.","week.preview":"Monats\xFCbersicht","week.prev_month":"Vorheriger Monat","week.next_month":"N\xE4chster Monat","week.legend_holiday":"Feiertag","week.legend_exception":"Ausnahme","week.day.mon":"Montag","week.day.tue":"Dienstag","week.day.wed":"Mittwoch","week.day.thu":"Donnerstag","week.day.fri":"Freitag","week.day.sat":"Samstag","week.day.sun":"Sonntag","exceptions.title":"Urlaub und andere Ausnahmen","exceptions.empty":"Noch keine Ausnahmen.","exceptions.add":"+ Ausnahme","exceptions.from":"Von","exceptions.to":"Bis","exceptions.profile":"Plan","exceptions.note":"Notiz","exceptions.delete":"L\xF6schen","exceptions.past":"vorbei","exceptions.active":"heute","exceptions.remove_past":"Vergangene entfernen","exceptions.auto_cleanup":"Vergangene automatisch entfernen","error.too_few_points":"Es wird mindestens {min} Punkt ben\xF6tigt.","error.too_many_points":"H\xF6chstens {max} Punkte sind erlaubt.","error.invalid_time":"Die Uhrzeit {time} ist ung\xFCltig.","error.time_not_on_grid":"Uhrzeiten m\xFCssen auf {grid} Minuten genau sein ({time}).","error.duplicate_time":"Um {time} gibt es zwei Punkte.","error.times_not_sorted":"Die Punkte sind nicht nach Uhrzeit sortiert ({time}).","error.invalid_value":"Bitte eine Zahl eingeben ({time}).","error.value_out_of_range":"{value} um {time} liegt au\xDFerhalb von {min} \u2026 {max}.","error.no_profiles":"Mindestens ein Plan wird ben\xF6tigt.","error.too_many_profiles":"H\xF6chstens {max} Pl\xE4ne sind erlaubt.","error.invalid_profile_id":"Ung\xFCltiger Plan.","error.empty_name":"Bitte einen Namen eingeben.","error.name_too_long":"Der Name ist zu lang (h\xF6chstens {max} Zeichen).","error.reserved_name":"\u201E{name}\u201C kann nicht als Name verwendet werden.","error.duplicate_name":"Der Name \u201E{name}\u201C ist doppelt vergeben.","error.invalid_color":"Bitte eine Farbe w\xE4hlen.","error.unknown_profile":"Der gew\xE4hlte Plan existiert nicht.","error.invalid_date":"Bitte ein g\xFCltiges Datum eingeben.","error.date_range_reversed":"Das Ende liegt vor dem Anfang.","error.note_too_long":"Die Notiz ist zu lang (h\xF6chstens {max} Zeichen).","error.too_many_exceptions":"H\xF6chstens {max} Ausnahmen sind erlaubt.","error.profile_in_use":"\u201E{name}\u201C wird noch verwendet: {usages}.","error.invalid_format":"Ung\xFCltige Daten.","error.unknown":"Problem: {code}","usage.holiday_profile":"Feiertage","usage.exception":"Ausnahme {number}","config.instance":"Zeitprofil","config.view":"Ansicht","config.view.compact":"Kompakt (Heute, Editor bei Bedarf)","config.view.full":"Voll (Editor immer offen)","config.allow_edit":"Bearbeiten auch ohne Admin-Rechte erlauben","config.title":"Titel (optional)"},Nt={en:ue,de:It};function fe(r){return(r?.locale?.language??r?.language??"en").toLowerCase().startsWith("de")?"de":"en"}function k(r){let i=Nt[r]??ue;return(e,t={})=>(i[e]??ue[e]??e).replace(/\{(\w+)\}/g,(n,o)=>o in t?String(t[o]):`{${o}}`)}function lt(r){return r in ue}var Dt=["stufe","linear","weich","kurve"];function v(r){let[i,e]=r.split(":");return Number(i)*60+Number(e)}function N(r){let i=Math.round(r),e=Math.floor(i/60),t=i%60;return`${String(e).padStart(2,"0")}:${String(t).padStart(2,"0")}`}function ee(r){if(r.length!==5)throw new Error(`expected 5 days, got ${r.length}`);let i=[];return r.forEach((e,t)=>{let s=(t-2)*1440;for(let[n,o]of e)i.push([n+s,o])}),i}function Ht(r,i){let e=r.length;if(e<2)return new Array(e).fill(0);let t=[],s=[];for(let o=0;o<e-1;o++)t.push(r[o+1]-r[o]),s.push((i[o+1]-i[o])/t[o]);let n=new Array(e).fill(0);n[0]=s[0],n[e-1]=s[e-2];for(let o=1;o<e-1;o++){let l=s[o-1],a=s[o];if(l===0||a===0||l<0!=a<0){n[o]=0;continue}let h=2*t[o]+t[o-1],c=t[o]+2*t[o-1];n[o]=(h+c)/(h/l+c/a)}return n}function Ot(r,i){let e=0,t=r.length-1;if(i<r[0])return-1;if(i>=r[t])return t;for(;t-e>1;){let s=Math.floor((e+t)/2);r[s]<=i?e=s:t=s}return e}var R=class{constructor(i,e){this.mode=e;if(i.length===0)throw new Error("timeline is empty");if(!Dt.includes(e))throw new Error(`unknown mode ${String(e)}`);this.xs=i.map(t=>t[0]),this.ys=i.map(t=>t[1]),this.tangents=e==="kurve"?Ht(this.xs,this.ys):[]}at(i){let{xs:e,ys:t}=this,s=Ot(e,i);if(s<0)return t[0];if(s>=e.length-1)return t[t.length-1];let n=e[s],o=e[s+1],l=t[s],a=t[s+1];if(this.mode==="stufe")return l;let h=o-n,c=(i-n)/h;if(this.mode==="linear")return l+(a-l)*c;if(this.mode==="weich")return l+(a-l)*(c*c*(3-2*c));let d=c*c,f=d*c,m=2*f-3*d+1,g=f-2*d+c,E=-2*f+3*d,b=f-d;return m*l+g*h*this.tangents[s]+E*a+b*h*this.tangents[s+1]}};function me(r,i){return i<=0?r:Math.round(Math.floor(r/i+.5)*i*1e6)/1e6}function $(r,i,e){return Math.max(i,Math.min(e,r))}var dt=1,A=48,_=5,V=20,ct=200,L=40,te=100,W=["mon","tue","wed","thu","fri","sat","sun"],ge=["#e67e22","#27ae60","#2980b9","#8e44ad","#c0392b","#16a085","#f1c40f","#7f8c8d"],zt=/^([01]\d|2[0-3]):[0-5]\d$/,Rt=/^\d{4}-\d{2}-\d{2}$/,Lt=/^#[0-9a-fA-F]{6}$/,Ft=/^[a-z0-9_]{1,40}$/;function x(r){return JSON.parse(JSON.stringify(r))}function De(r){return r.points.map(i=>[v(i.t),i.v])}function ht(r){if(typeof r!="string"||!Rt.test(r))return!1;let i=new Date(`${r}T00:00:00Z`);return!Number.isNaN(i.getTime())&&i.toISOString().startsWith(r)}function Ut(r,i,e,t){let s=[],n=(a,h,c={})=>s.push({code:a,path:h,params:c});r.length<dt&&n("too_few_points",i,{min:dt}),r.length>A&&n("too_many_points",i,{max:A});let o,l=new Set;return r.forEach((a,h)=>{let c=`${i}.${h}`;if(typeof a.t!="string"||!zt.test(a.t)){n("invalid_time",c,{time:String(a.t)});return}let d=v(a.t);d%_&&n("time_not_on_grid",c,{time:a.t,grid:_}),l.has(d)?n("duplicate_time",c,{time:a.t}):o!==void 0&&d<o&&n("times_not_sorted",c,{time:a.t}),l.add(d),o=d,typeof a.v!="number"||Number.isNaN(a.v)?n("invalid_value",c,{time:a.t}):(a.v<e||a.v>t)&&n("value_out_of_range",c,{time:a.t,value:a.v,min:e,max:t})}),s}function pt(r,i,e){let t=[],s=(c,d,f={})=>t.push({code:c,path:d,params:f}),n=r.profiles??{},o=Object.keys(n);o.length===0&&s("no_profiles","profiles"),o.length>V&&s("too_many_profiles","profiles",{max:V});let l=new Set;for(let c of o){let d=n[c],f=`profiles.${c}`;Ft.test(c)||s("invalid_profile_id",f);let m=typeof d.name=="string"?d.name:"";if(!m.trim())s("empty_name",`${f}.name`);else if(m.length>L)s("name_too_long",`${f}.name`,{max:L});else{let g=m.trim().toLowerCase();g==="auto"?s("reserved_name",`${f}.name`,{name:m}):l.has(g)&&s("duplicate_name",`${f}.name`,{name:m}),l.add(g)}(typeof d.color!="string"||!Lt.test(d.color))&&s("invalid_color",`${f}.color`),t.push(...Ut(d.points??[],`${f}.points`,i,e))}let a=(c,d)=>{(typeof c!="string"||!(c in n))&&s("unknown_profile",d,{profile:String(c)})};for(let c of W)a(r.week?.[c],`week.${c}`);a(r.holiday_profile,"holiday_profile");let h=r.exceptions??[];return h.length>ct&&s("too_many_exceptions","exceptions",{max:ct}),h.forEach((c,d)=>{let f=`exceptions.${d}`,m=ht(c.from),g=ht(c.to);m||s("invalid_date",`${f}.from`),g||s("invalid_date",`${f}.to`),m&&g&&c.to<c.from&&s("date_range_reversed",f),a(c.profile,`${f}.profile`),(c.note??"").length>te&&s("note_too_long",`${f}.note`,{max:te})}),t}function ut(r,i){let e=W.filter(t=>r.week[t]===i).map(t=>`week.${t}`);return r.holiday_profile===i&&e.push("holiday_profile"),r.exceptions.forEach((t,s)=>{t.profile===i&&e.push(`exceptions.${s}`)}),e}function j(r){let i=r.getFullYear(),e=String(r.getMonth()+1).padStart(2,"0"),t=String(r.getDate()).padStart(2,"0");return`${i}-${e}-${t}`}function B(r){let[i,e,t]=r.split("-").map(Number);return new Date(i,e-1,t,12)}function ve(r,i){let e=B(r);return e.setDate(e.getDate()+i),j(e)}function Vt(r){let i=B(r).getDay();return W[(i+6)%7]}function ft(r,i,e){for(let t of r.exceptions)if(t.from<=i&&i<=t.to)return{profileId:t.profile,reason:"exception"};return e(i)?{profileId:r.holiday_profile,reason:"holiday"}:{profileId:r.week[Vt(i)],reason:"weekday"}}function He(r,i){let e=i.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/ß/g,"ss").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,30)||"profil",t=e,s=2;for(;t in r.profiles;)t=`${e}_${s++}`;return t}function Oe(r){let i=new Set(Object.values(r.profiles).map(e=>e.color.toLowerCase()));return ge.find(e=>!i.has(e))??ge[0]}function ze(r,i){let e=v(i.t),t=r.findIndex(s=>v(s.t)>e);return t<0&&(t=r.length),r.splice(t,0,i),t}function mt(r){let i=r.map(o=>v(o.t)).sort((o,l)=>o-l);if(i.length===0)return 720;let e,t=0;for(let o=0;o<i.length;o++){let l=i[o],h=(o+1<i.length?i[o+1]:i[0]+1440)-l;h>t&&(t=h,e=l+h/2)}if(e===void 0||t<2*_)return;let s=Math.round(e/15)*15;s>=1440&&(s-=1440);let n=new Set(i);for(let o=0;o<1440;o+=_)for(let l of[1,-1]){let a=((s+l*o)%1440+1440)%1440;if(!n.has(a))return a}}var K=w`
  :host {
    --zp-gap: 12px;
    --zp-radius: 10px;
    --zp-touch: 44px;
    color: var(--primary-text-color);
    font-family: var(--paper-font-body1_-_font-family, inherit);
  }
  button,
  .button {
    min-height: var(--zp-touch);
    min-width: var(--zp-touch);
    padding: 0 14px;
    border-radius: var(--zp-radius);
    border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.4));
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    font-size: 15px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    -webkit-tap-highlight-color: transparent;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button.primary {
    background: var(--primary-color, #03a9f4);
    border-color: var(--primary-color, #03a9f4);
    color: var(--text-primary-color, #fff);
    font-weight: 500;
  }
  button.danger {
    color: var(--error-color, #db4437);
    border-color: var(--error-color, #db4437);
  }
  button.icon {
    padding: 0;
    width: var(--zp-touch);
    font-size: 20px;
  }
  button.flat {
    border-color: transparent;
    background: transparent;
  }
  input,
  select {
    min-height: var(--zp-touch);
    box-sizing: border-box;
    border-radius: var(--zp-radius);
    border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.4));
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font: inherit;
    font-size: 16px; /* prevents zooming on iOS */
    padding: 0 10px;
    max-width: 100%;
  }
  input[type="checkbox"] {
    min-height: 0;
    width: 24px;
    height: 24px;
    accent-color: var(--primary-color);
  }
  label.field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: var(--secondary-text-color);
  }
  label.check {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: var(--zp-touch);
    cursor: pointer;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .grow {
    flex: 1 1 auto;
  }
  .muted {
    color: var(--secondary-text-color);
    font-size: 13px;
  }
  .notice {
    padding: 10px 12px;
    border-radius: var(--zp-radius);
    background: rgba(127, 127, 127, 0.12);
    font-size: 14px;
  }
  .notice.error {
    background: rgba(219, 68, 55, 0.12);
    color: var(--error-color, #db4437);
  }
  .notice.warning {
    background: rgba(255, 152, 0, 0.15);
  }
  .notice.success {
    background: rgba(67, 160, 71, 0.15);
  }
  .swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex: none;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
`;var ie=44,Wt=10,M=14,jt=26,gt=120,Bt=8,_e=44,se=class extends y{constructor(){super();this.tapStart=null;this.points=[],this.context=null,this.mode="kurve",this.min=20,this.max=70,this.step=.5,this.unit=null,this.language="en",this.color="var(--primary-color, #03a9f4)",this.snapMinutes=15,this.editable=!1,this.nowMinute=null,this.nowValue=null,this.selected=null,this.height=220,this.showContinuation=!0,this._width=320,this._drag=null}connectedCallback(){super.connectedCallback(),typeof ResizeObserver<"u"&&(this.resizeObserver=new ResizeObserver(e=>{let t=Math.round(e[0]?.contentRect.width??0);t>0&&t!==this._width&&(this._width=t)}),this.resizeObserver.observe(this))}disconnectedCallback(){super.disconnectedCallback(),this.resizeObserver?.disconnect()}willUpdate(e){e.has("points")&&this._drag&&!this.editable&&(this._drag=null)}get domainEnd(){return this.showContinuation?1440+gt:1440}get plotWidth(){return Math.max(10,this._width-ie-Wt)}get plotHeight(){return Math.max(10,this.height-M-jt)}xFor(e){return ie+e/this.domainEnd*this.plotWidth}yFor(e){let t=this.max-this.min||1;return M+(1-(e-this.min)/t)*this.plotHeight}minuteAt(e){return(e-ie)/this.plotWidth*this.domainEnd}valueAt(e){let t=this.max-this.min||1;return this.min+(1-(e-M)/this.plotHeight)*t}get shownPoints(){return this._drag?.points??this.points}timeline(e){if(e.length===0)return null;let t=e.map(o=>[v(o.t),o.v]),s=this.context,n=s?[s[0],s[1],t,s[2],s[3]]:[t,t,t,t,t];return ee(n)}curveValue(e){let t=this.timeline(this.shownPoints);return t?new R(t,this.mode).at(e):null}snapTime(e){let t=Math.max(_,this.snapMinutes||_);return Math.round(e/t)*t}snapValue(e){return $(me($(e,this.min,this.max),this.step),this.min,this.max)}timeLimits(e,t){let s=t>0?v(e[t-1].t)+_:0,n=t<e.length-1?v(e[t+1].t)-_:1440-_;return[s,n]}movePoint(e,t,s,n){let[o,l]=this.timeLimits(e,t),a=$(this.snapTime(s),o,l),h=$(Math.round(a/_)*_,o,l),c=e.map(d=>({...d}));return c[t]={t:N(h),v:this.snapValue(n)},c}emitChange(e,t){this.dispatchEvent(new CustomEvent("points-changed",{detail:{points:e,selected:t},bubbles:!0,composed:!0}))}emitSelect(e){this.dispatchEvent(new CustomEvent("point-selected",{detail:{index:e},bubbles:!0,composed:!0}))}emitNotice(e){this.dispatchEvent(new CustomEvent("curve-notice",{detail:e,bubbles:!0,composed:!0}))}localPosition(e){let t=this.renderRoot.querySelector(".chart")?.getBoundingClientRect();return{x:e.clientX-(t?.left??0),y:e.clientY-(t?.top??0)}}addPointAt(e){if(!this.editable)return;let t=this.snapTime(this.minuteAt(e));if(t<0||t>=1440)return;let s=this.points.findIndex(h=>v(h.t)===t);if(s>=0){this.emitSelect(s),this.emitNotice({key:"point.taken",params:{time:N(t)}});return}if(this.points.length>=A){this.emitNotice({key:"point.full",params:{max:A}});return}let n=this.curveValue(t),o=this.snapValue(n??(this.min+this.max)/2),l=this.points.map(h=>({...h})),a=l.findIndex(h=>v(h.t)>t);a<0&&(a=l.length),l.splice(a,0,{t:N(t),v:o}),this.emitChange(l,a)}onChartPointerDown(e){if(!this.editable||e.button>0)return;let{x:t,y:s}=this.localPosition(e);this.tapStart={x:t,y:s,pointerId:e.pointerId}}onChartPointerUp(e){let t=this.tapStart;if(this.tapStart=null,!t||t.pointerId!==e.pointerId||this._drag)return;let{x:s,y:n}=this.localPosition(e);Math.hypot(s-t.x,n-t.y)>Bt||this.addPointAt(s)}onChartPointerCancel(){this.tapStart=null}onHandlePointerDown(e,t){if(!this.editable)return;e.stopPropagation(),e.preventDefault();let s=e.currentTarget;s.setPointerCapture?.(e.pointerId),s.focus?.({preventScroll:!0});let{x:n,y:o}=this.localPosition(e);this._drag={index:t,pointerId:e.pointerId,startX:n,startY:o,moved:!1,points:this.points.map(l=>({...l}))},this.emitSelect(t)}onHandlePointerMove(e){let t=this._drag;if(!t||t.pointerId!==e.pointerId)return;e.preventDefault();let{x:s,y:n}=this.localPosition(e);if(!t.moved&&Math.hypot(s-t.startX,n-t.startY)<3)return;let o=this.movePoint(this.points,t.index,this.minuteAt(s),this.valueAt(n));this._drag={...t,moved:!0,points:o}}onHandlePointerUp(e){let t=this._drag;if(!t||t.pointerId!==e.pointerId)return;this._drag=null;let s=t.points.some((n,o)=>n.t!==this.points[o].t||n.v!==this.points[o].v);t.moved&&s&&this.emitChange(t.points,t.index)}onHandlePointerCancel(){this._drag=null}onHandleKeyDown(e,t){if(!this.editable)return;let s=this.points[t],n=v(s.t),o=s.v,l=Math.max(_,this.snapMinutes);switch(e.key){case"ArrowLeft":n-=l;break;case"ArrowRight":n+=l;break;case"ArrowUp":o+=this.step;break;case"ArrowDown":o-=this.step;break;default:return}e.preventDefault(),this.emitChange(this.movePoint(this.points,t,n,o),t)}curvePath(e,t,s){let n=this.timeline(e);if(!n)return"";let o=new R(n,this.mode),l=Math.max(24,Math.round(this.plotWidth/2)),a=(s-t)/l,h=[],c=null;for(let d=0;d<=l;d++){let f=t+d*a,m=$(o.at(f),this.min,this.max),g=this.xFor(f).toFixed(1),E=this.yFor(m).toFixed(1);this.mode==="stufe"&&c!==null&&m!==c&&h.push(`L${g},${this.yFor(c).toFixed(1)}`),h.push(`${d===0?"M":"L"}${g},${E}`),c=m}return h.join("")}renderGrid(){let e=at(this.min,this.max,this.height<180?3:5),s=this._width<420?[0,6,12,18,24]:[0,3,6,9,12,15,18,21,24],n=M+this.plotHeight;return S`
      ${e.map(o=>S`
          <line class="grid" x1=${ie} x2=${this.xFor(this.domainEnd)}
            y1=${this.yFor(o)} y2=${this.yFor(o)}></line>
          <text class="label y" x=${ie-6} y=${this.yFor(o)+4}>${I(o,.1,null,this.language)}</text>`)}
      ${s.map(o=>S`
          <line class="grid" x1=${this.xFor(o*60)} x2=${this.xFor(o*60)}
            y1=${M} y2=${n}></line>
          <text class="label x" x=${this.xFor(o*60)} y=${n+17}>${o}</text>`)}
      ${this.showContinuation?S`<rect class="next-day" x=${this.xFor(1440)} y=${M}
              width=${this.xFor(this.domainEnd)-this.xFor(1440)}
              height=${this.plotHeight}></rect>
              <text class="label x" x=${this.xFor(1440+gt/2)}
                y=${M+12}>+1</text>`:u}
    `}renderNow(){if(this.nowMinute===null)return u;let e=this.xFor(this.nowMinute);return S`
      <line class="now" x1=${e} x2=${e} y1=${M} y2=${M+this.plotHeight}></line>
      ${this.nowValue!==null?S`<circle class="now-dot" cx=${e} cy=${this.yFor($(this.nowValue,this.min,this.max))} r="6"></circle>`:u}
    `}renderHandles(e){let t=this._drag;return e.map((s,n)=>{let o=v(s.t),l=this.xFor(o),a=this.yFor($(s.v,this.min,this.max)),h=n===this.selected,c=`${s.t} \xB7 ${I(s.v,this.step,this.unit,this.language)}`;return p`
        <div
          class="handle ${h?"selected":""} ${t?.index===n?"dragging":""}"
          style="transform: translate(${l-_e/2}px, ${a-_e/2}px)"
          role="slider"
          tabindex=${this.editable?0:-1}
          aria-label=${c}
          aria-valuemin=${this.min}
          aria-valuemax=${this.max}
          aria-valuenow=${s.v}
          aria-valuetext=${c}
          data-index=${n}
          @pointerdown=${d=>this.onHandlePointerDown(d,n)}
          @pointermove=${d=>this.onHandlePointerMove(d)}
          @pointerup=${d=>this.onHandlePointerUp(d)}
          @pointercancel=${()=>this.onHandlePointerCancel()}
          @lostpointercapture=${d=>this.onHandlePointerUp(d)}
          @keydown=${d=>this.onHandleKeyDown(d,n)}
          @click=${d=>{d.stopPropagation(),this.emitSelect(n)}}
        >
          <span class="dot" style="border-color: ${this.color}"></span>
        </div>
      `})}renderTooltip(){let e=this._drag;if(!e?.moved)return u;let t=e.points[e.index],s=$(this.xFor(v(t.t)),50,this._width-50),n=this.yFor(t.v),o=n>48;return p`<div
      class="tooltip"
      style="left: ${s}px; top: ${o?n-40:n+26}px"
      role="status"
    >
      ${t.t} · ${I(t.v,this.step,this.unit,this.language)}
    </div>`}render(){let e=this.shownPoints,t=this.curvePath(e,0,1440),s=this.showContinuation?this.curvePath(e,1440,this.domainEnd):"";return p`
      <div
        class="chart"
        style="height: ${this.height}px"
        @pointerdown=${this.onChartPointerDown}
        @pointerup=${this.onChartPointerUp}
        @pointercancel=${this.onChartPointerCancel}
      >
        <svg
          width=${this._width}
          height=${this.height}
          viewBox="0 0 ${this._width} ${this.height}"
          role="img"
          aria-hidden="true"
        >
          ${this.renderGrid()}
          <path class="curve" d=${t} style="stroke: ${this.color}"></path>
          ${s?S`<path class="curve continuation" d=${s} style="stroke: ${this.color}"></path>`:u}
          ${this.renderNow()}
          ${this.editable?u:e.map(n=>S`<circle class="marker" cx=${this.xFor(v(n.t))}
                    cy=${this.yFor($(n.v,this.min,this.max))} r="3"
                    style="fill: ${this.color}"></circle>`)}
        </svg>
        ${this.editable?this.renderHandles(e):u} ${this.renderTooltip()}
      </div>
    `}};se.properties={points:{attribute:!1},context:{attribute:!1},mode:{},min:{type:Number},max:{type:Number},step:{type:Number},unit:{},language:{},color:{},snapMinutes:{type:Number,attribute:"snap-minutes"},editable:{type:Boolean,reflect:!0},nowMinute:{attribute:!1},nowValue:{attribute:!1},selected:{attribute:!1},height:{type:Number},showContinuation:{type:Boolean,attribute:"show-continuation"},_width:{state:!0},_drag:{state:!0}},se.styles=w`
    :host {
      display: block;
      position: relative;
      user-select: none;
      -webkit-user-select: none;
    }
    .chart {
      position: relative;
      width: 100%;
      overflow: hidden;
      touch-action: pan-y;
    }
    svg {
      position: absolute;
      inset: 0;
      display: block;
    }
    .grid {
      stroke: var(--divider-color, rgba(127, 127, 127, 0.25));
      stroke-width: 1;
    }
    .label {
      fill: var(--secondary-text-color, #727272);
      font-size: 11px;
      font-family: inherit;
    }
    .label.y {
      text-anchor: end;
    }
    .label.x {
      text-anchor: middle;
    }
    .next-day {
      fill: var(--secondary-text-color, #727272);
      opacity: 0.08;
    }
    .curve {
      fill: none;
      stroke-width: 3;
      stroke-linejoin: round;
      stroke-linecap: round;
    }
    .curve.continuation {
      stroke-dasharray: 6 6;
      opacity: 0.6;
    }
    .now {
      stroke: var(--error-color, #db4437);
      stroke-width: 2;
      stroke-dasharray: 3 3;
    }
    .now-dot {
      fill: var(--error-color, #db4437);
      stroke: var(--card-background-color, #fff);
      stroke-width: 2;
    }
    .handle {
      position: absolute;
      left: 0;
      top: 0;
      width: ${_e}px;
      height: ${_e}px;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: none;
      cursor: grab;
      border-radius: 50%;
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    .handle.dragging {
      cursor: grabbing;
      z-index: 2;
    }
    .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--card-background-color, #fff);
      border: 3px solid;
      box-sizing: border-box;
      transition: transform 0.1s;
    }
    .handle.selected .dot,
    .handle:focus-visible .dot {
      transform: scale(1.5);
      box-shadow: 0 0 0 4px rgba(127, 127, 127, 0.3);
    }
    .handle.dragging .dot {
      transform: scale(1.7);
    }
    .tooltip {
      position: absolute;
      transform: translateX(-50%);
      background: var(--primary-text-color, #212121);
      color: var(--card-background-color, #fff);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      pointer-events: none;
      z-index: 3;
    }
  `;customElements.get("zeitprofil-curve")||customElements.define("zeitprofil-curve",se);var Kt=["\xB0C","\xB0F","K","C","F"],Yt=[5,15,30,60],Gt=100,ne=class extends y{constructor(){super();this.t=k("en");this.onBeforeUnload=e=>{this.dirty&&(e.preventDefault(),e.returnValue="")};this.language="en",this._undo=[],this._redo=[],this._tab="profiles",this._profileId="",this._selected=null,this._snap=15,this._issues=[],this._message=null,this._saving=!1,this._conflict=!1,this._month="",this._holidays={}}connectedCallback(){super.connectedCallback(),window.addEventListener("beforeunload",this.onBeforeUnload)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("beforeunload",this.onBeforeUnload),clearTimeout(this.messageTimer)}willUpdate(e){e.has("language")&&(this.t=k(this.language)),e.has("data")&&this.data&&!this._saving&&(this._draft?this.data.revision!==this._baseRevision&&(this.dirty?this._conflict=!0:this.resetTo(this.data)):this.resetTo(this.data)),this._month||(this._month=`${j(new Date).slice(0,8)}01`)}updated(e){(e.has("_tab")||e.has("_month"))&&this._tab==="week"&&this.loadHolidays(this._month),(e.has("_draft")||e.has("_base"))&&this.dispatchEvent(new CustomEvent("dirty-changed",{detail:{dirty:this.dirty},bubbles:!0,composed:!0}))}resetTo(e){this._base=x(e.schedule),this._draft=x(e.schedule),this._baseRevision=e.revision,this._undo=[],this._redo=[],this._issues=[],this._conflict=!1,this._profileId in this._draft.profiles||(this._profileId=Object.keys(this._draft.profiles)[0]??"",this._selected=null);let t=this._draft.profiles[this._profileId]?.points??[];this._selected!==null&&this._selected>=t.length&&(this._selected=null)}get dirty(){return this._draft!==void 0&&JSON.stringify(this._draft)!==JSON.stringify(this._base)}change(e){let t=x(this._draft);e(t),JSON.stringify(t)!==JSON.stringify(this._draft)&&(this._undo=[...this._undo,this._draft].slice(-Gt),this._redo=[],this._draft=t,this._issues=[])}undo(){let e=this._undo[this._undo.length-1];e&&(this._redo=[...this._redo,this._draft],this._undo=this._undo.slice(0,-1),this._draft=e,this.fixSelection())}redo(){let e=this._redo[this._redo.length-1];e&&(this._undo=[...this._undo,this._draft],this._redo=this._redo.slice(0,-1),this._draft=e,this.fixSelection())}discard(e=!0){e&&this.dirty&&!window.confirm(this.t("editor.confirm_discard"))||(this.resetTo(this.data),this._draft=x(this._base))}fixSelection(){this._profileId in this._draft.profiles||(this._profileId=Object.keys(this._draft.profiles)[0]??"",this._selected=null);let e=this._draft.profiles[this._profileId]?.points.length??0;this._selected!==null&&this._selected>=e&&(this._selected=null)}confirmLeave(){return this.dirty?window.confirm(this.t("editor.confirm_leave"))?(this.discard(!1),!0):!1:!0}showMessage(e,t=4e3){this._message=e,clearTimeout(this.messageTimer),t>0&&(this.messageTimer=setTimeout(()=>this._message=null,t))}async save(){let e=pt(this._draft,this.data.config.min,this.data.config.max);if(e.length){this._issues=e,this.showMessage({kind:"error",text:this.t("editor.fix_errors")},0);return}this._saving=!0;try{let t=await it(this.hass,this.data.entry_id,this._baseRevision,this._draft);t.ok?(this._base=x(this._draft),this._baseRevision=t.revision,this._undo=[],this._redo=[],this._issues=[],this._conflict=!1,this.showMessage({kind:"success",text:this.t("editor.saved")})):t.conflict?this._conflict=!0:(this._issues=t.errors,this.showMessage({kind:"error",text:this.t("editor.fix_errors")},0))}catch(t){this.showMessage({kind:"error",text:this.t("card.connection_error",{message:t.message??t})},0)}finally{this._saving=!1}}reloadAfterConflict(){this.resetTo(this.data),this._message=null}get config(){return this.data.config}get profile(){return this._draft.profiles[this._profileId]}valueLabel(){return Kt.includes(this.config.unit??"")?this.t("point.value"):this.t("point.value_generic")}fmt(e){return I(e,this.config.step,this.config.unit,this.language)}normalizeValue(e){let{min:t,max:s,step:n}=this.config;return $(me($(e,t,s),n),t,s)}describeIssue(e){let t=`error.${e.code}`,s={...e.params};typeof s.value=="number"&&(s.value=this.fmt(s.value)),typeof s.min=="number"&&e.code==="value_out_of_range"&&(s.min=this.fmt(s.min),s.max=this.fmt(s.max)),Array.isArray(s.usages)&&(s.usages=this.describeUsages(s.usages));let n=lt(t)?this.t(t,s):this.t("error.unknown",{code:e.code}),o=/^profiles\.([^.]+)/.exec(e.path),l=o?this._draft.profiles[o[1]]:void 0;return l&&e.code!=="profile_in_use"?`${l.name}: ${n}`:n}describeUsages(e){return e.map(t=>{if(t.startsWith("week."))return this.t(`week.day.${t.slice(5)}`);if(t==="holiday_profile")return this.t("usage.holiday_profile");let s=Number(t.split(".")[1]);return this._draft.exceptions[s]?.note||this.t("usage.exception",{number:s+1})}).join(", ")}issuesFor(e){return this._issues.filter(t=>t.path===e||t.path.startsWith(`${e}.`))}selectProfile(e){this._profileId=e,this._selected=null}addProfile(){if(Object.keys(this._draft.profiles).length>=V)return;let e=this.t("profiles.new_name"),t=new Set(Object.values(this._draft.profiles).map(o=>o.name.toLowerCase()));for(let o=2;t.has(e.toLowerCase());o++)e=`${this.t("profiles.new_name")} ${o}`;let s=He(this._draft,e),n=this.normalizeValue((this.config.min+this.config.max)/2);this.change(o=>{o.profiles[s]={name:e,color:Oe(o),points:[{t:"06:00",v:n}]}}),this.selectProfile(s)}duplicateProfile(){let e=this.profile;if(!e||Object.keys(this._draft.profiles).length>=V)return;let t=`${e.name} ${this.t("profiles.copy_suffix")}`.slice(0,L),s=new Set(Object.values(this._draft.profiles).map(o=>o.name.toLowerCase()));for(let o=2;s.has(t.toLowerCase());o++)t=`${e.name} ${o}`.slice(0,L);let n=He(this._draft,t);this.change(o=>{o.profiles[n]={...x(e),name:t,color:Oe(o)}}),this.selectProfile(n)}deleteProfile(){let e=this.profile;if(!e)return;if(Object.keys(this._draft.profiles).length<=1){this.showMessage({kind:"warning",text:this.t("profiles.last")});return}let t=ut(this._draft,this._profileId);if(t.length){this.showMessage({kind:"warning",text:this.t("profiles.in_use",{name:e.name,usages:this.describeUsages(t)})},8e3);return}if(!window.confirm(this.t("profiles.confirm_delete",{name:e.name})))return;let s=this._profileId;this.change(n=>{delete n.profiles[s]}),this.selectProfile(Object.keys(this._draft.profiles)[0])}renameProfile(e){let t=this._profileId;this.change(s=>{s.profiles[t].name=e.slice(0,L)})}recolorProfile(e){let t=this._profileId;this.change(s=>{s.profiles[t].color=e})}copyCurveFrom(e){let t=this._draft.profiles[e],s=this.profile;if(!t||!s||e===this._profileId||!window.confirm(this.t("profiles.confirm_copy",{target:s.name,source:t.name})))return;let n=this._profileId;this.change(o=>{o.profiles[n].points=x(t.points)}),this._selected=null}setPoints(e,t){let s=this._profileId;this.change(n=>{n.profiles[s].points=e}),this._selected=t}addPoint(){let e=this.profile;if(!e)return;if(e.points.length>=A){this.showMessage({kind:"warning",text:this.t("point.full",{max:A})});return}let t=mt(e.points);if(t===void 0)return;let s=this.renderRoot.querySelector("zeitprofil-curve"),n=this.normalizeValue(s?.curveValue(t)??(this.config.min+this.config.max)/2),o=x(e.points),l=ze(o,{t:N(t),v:n});this.setPoints(o,l)}deletePoint(e){let t=this.profile;if(!t)return;if(t.points.length<=1){this.showMessage({kind:"warning",text:this.t("point.min")});return}let s=x(t.points);s.splice(e,1),this.setPoints(s,null)}setPointTime(e,t){let s=this.profile;if(!s||!/^\d{1,2}:\d{2}/.test(t)){this.requestUpdate();return}let n=v(t.slice(0,5));n=Math.round(n/_)*_,n>=1440&&(n=1440-_);let o=N(n);if(s.points.some((c,d)=>d!==e&&c.t===o)){this.showMessage({kind:"warning",text:this.t("point.taken",{time:o})}),this.requestUpdate();return}let l=x(s.points),[a]=l.splice(e,1),h=ze(l,{...a,t:o});this.setPoints(l,h)}setPointValue(e,t){let s=this.profile;if(!s||Number.isNaN(t)){this.requestUpdate();return}let n=x(s.points);n[e]={...n[e],v:this.normalizeValue(t)},this.setPoints(n,e)}nudgePoint(e,t){let s=this.profile?.points[e];s&&this.setPointValue(e,s.v+t*this.config.step)}setWeekday(e,t){this.change(s=>{s.week[e]=t})}setHolidayProfile(e){this.change(t=>{t.holiday_profile=e})}today(){return this.data.state.now.slice(0,10)}addException(){let e=this.today(),t=Object.keys(this._draft.profiles).find(s=>/urlaub|holiday|vacation/i.test(s))??this._draft.holiday_profile;this.change(s=>{s.exceptions.push({from:e,to:ve(e,6),profile:t,note:this.t("holiday.note_default")})})}updateException(e,t,s){this.change(n=>{let o=n.exceptions[e];o[t]=t==="note"?s.slice(0,te):s,t==="from"&&o.to<s&&(o.to=s)})}deleteException(e){this.change(t=>{t.exceptions.splice(e,1)})}removePastExceptions(){let e=this.today();this.change(t=>{t.exceptions=t.exceptions.filter(s=>s.to>=e)})}async loadHolidays(e){if(!this.config.holiday_source||this._holidays[e]||!this.hass)return;let t=e,s=B(e),n=j(new Date(s.getFullYear(),s.getMonth()+1,0,12));try{let o=await nt(this.hass,this.data.entry_id,t,n);this._holidays={...this._holidays,[e]:new Set(o.holidays)}}catch{this._holidays={...this._holidays,[e]:new Set}}}shiftMonth(e){let t=B(this._month);this._month=j(new Date(t.getFullYear(),t.getMonth()+e,1,12))}profileOptions(e){return Object.entries(this._draft.profiles).map(([t,s])=>p`<option value=${t} ?selected=${t===e}>${s.name}</option>`)}renderTabs(){return p`<div class="tabs" role="tablist">
      ${[["profiles","editor.tab.profiles"],["week","editor.tab.week"],["exceptions","editor.tab.exceptions"]].map(([t,s])=>p`<button
            role="tab"
            class="tab ${this._tab===t?"active":""}"
            aria-selected=${this._tab===t}
            @click=${()=>this._tab=t}
          >
            ${this.t(s)}
          </button>`)}
    </div>`}renderProfileChips(){return p`<div class="chips" role="tablist">
      ${Object.entries(this._draft.profiles).map(([e,t])=>p`<button
            class="chip ${e===this._profileId?"active":""}"
            role="tab"
            aria-selected=${e===this._profileId}
            style="--chip-color: ${t.color}"
            @click=${()=>this.selectProfile(e)}
          >
            <span class="swatch" style="background: ${t.color}"></span>${t.name||"\u2026"}
          </button>`)}
      <button
        class="chip add"
        ?disabled=${Object.keys(this._draft.profiles).length>=V}
        @click=${()=>this.addProfile()}
      >
        + ${this.t("profiles.add")}
      </button>
    </div>`}renderProfileSettings(e){return p`<div class="profile-settings">
      <label class="field grow">
        ${this.t("profiles.name")}
        <input
          type="text"
          .value=${e.name}
          maxlength=${L}
          @change=${t=>this.renameProfile(t.target.value)}
        />
      </label>
      <div class="field">
        <span class="muted">${this.t("profiles.color")}</span>
        <div class="colors" role="radiogroup" aria-label=${this.t("profiles.color")}>
          ${ge.map(t=>p`<button
                class="color ${e.color.toLowerCase()===t?"active":""}"
                role="radio"
                aria-checked=${e.color.toLowerCase()===t}
                aria-label=${t}
                style="background: ${t}"
                @click=${()=>this.recolorProfile(t)}
              ></button>`)}
        </div>
      </div>
      <div class="row">
        <button @click=${()=>this.duplicateProfile()}>${this.t("profiles.duplicate")}</button>
        <button class="danger" @click=${()=>this.deleteProfile()}>
          ${this.t("profiles.delete")}
        </button>
      </div>
    </div>`}renderSelectedPoint(e){let t=this._selected;if(t===null||!e.points[t])return u;let s=e.points[t];return p`<div class="selected-point" aria-live="polite">
      <div class="muted">${this.t("point.selected")}</div>
      <div class="row">
        <label class="field">
          ${this.t("point.time")}
          <input
            type="time"
            step="300"
            .value=${s.t}
            @change=${n=>this.setPointTime(t,n.target.value)}
          />
        </label>
        ${this.renderValueInput(t,s)}
        <button class="danger" @click=${()=>this.deletePoint(t)}>
          ${this.t("point.delete")}
        </button>
      </div>
    </div>`}renderPlainValueInput(e,t){return p`<input
      class="value"
      type="text"
      inputmode="decimal"
      aria-label=${this.valueLabel()}
      .value=${pe(t.v,this.config.step,this.language)}
      @change=${s=>this.setPointValue(e,Ne(s.target.value))}
    />`}renderValueInput(e,t,s=!0){let n=p`<div class="stepper">
      <button
        class="icon"
        aria-label=${this.t("point.minus")}
        @click=${()=>this.nudgePoint(e,-1)}
      >
        −
      </button>
      <input
        class="value"
        type="text"
        inputmode="decimal"
        aria-label=${this.valueLabel()}
        .value=${pe(t.v,this.config.step,this.language)}
        @change=${o=>this.setPointValue(e,Ne(o.target.value))}
      />
      <button
        class="icon"
        aria-label=${this.t("point.plus")}
        @click=${()=>this.nudgePoint(e,1)}
      >
        +
      </button>
    </div>`;return s?p`<div class="field">
          <span class="muted">${this.valueLabel()}${this.config.unit?` (${this.config.unit})`:""}</span>
          ${n}
        </div>`:n}renderPointTable(e){return p`<table class="points">
        <caption class="muted">
          ${this.t("point.table")}
        </caption>
        <thead>
          <tr>
            <th>${this.t("point.time")}</th>
            <th>${this.valueLabel()}${this.config.unit?` (${this.config.unit})`:""}</th>
            <th><span class="sr-only">${this.t("point.delete")}</span></th>
          </tr>
        </thead>
        <tbody>
          ${e.points.map((t,s)=>p`<tr
                class=${s===this._selected?"selected":""}
                data-index=${s}
                @focusin=${()=>this._selected=s}
              >
                <td>
                  <input
                    type="time"
                    step="300"
                    aria-label=${this.t("point.time")}
                    .value=${t.t}
                    @change=${n=>this.setPointTime(s,n.target.value)}
                  />
                </td>
                <td>${this.renderPlainValueInput(s,t)}</td>
                <td>
                  <button
                    class="icon flat delete"
                    aria-label=${this.t("point.delete")}
                    title=${this.t("point.delete")}
                    ?disabled=${e.points.length<=1}
                    @click=${()=>this.deletePoint(s)}
                  >
                    🗑
                  </button>
                </td>
              </tr>`)}
        </tbody>
      </table>
      <button
        class="add-point"
        ?disabled=${e.points.length>=A}
        @click=${()=>this.addPoint()}
      >
        ${this.t("point.add")}
      </button>`}renderProfilesTab(){let e=this.profile;if(!e)return this.renderProfileChips();let t=Object.entries(this._draft.profiles).filter(([n])=>n!==this._profileId),s=this.issuesFor(`profiles.${this._profileId}`);return p`
      ${this.renderProfileChips()} ${this.renderProfileSettings(e)}
      ${s.length?p`<div class="notice error">
            ${s.map(n=>p`<div>${this.describeIssue(n)}</div>`)}
          </div>`:u}
      <div class="chart-wrapper">
        <zeitprofil-curve
          editable
          .points=${e.points}
          .context=${null}
          .mode=${this.config.interpolation}
          .min=${this.config.min}
          .max=${this.config.max}
          .step=${this.config.step}
          .unit=${this.config.unit}
          .language=${this.language}
          .color=${e.color}
          .snapMinutes=${this._snap}
          .selected=${this._selected}
          @points-changed=${n=>this.setPoints(n.detail.points,n.detail.selected)}
          @point-selected=${n=>this._selected=n.detail.index}
          @curve-notice=${n=>this.showMessage({kind:"warning",text:this.t(n.detail.key,n.detail.params)})}
        ></zeitprofil-curve>
      </div>
      <div class="row chart-footer">
        <span class="muted grow">${this.t("profiles.hint")}</span>
        <label class="field inline">
          ${this.t("profiles.snap")}
          <select
            @change=${n=>this._snap=Number(n.target.value)}
          >
            ${Yt.map(n=>p`<option value=${n} ?selected=${n===this._snap}>
                  ${this.t("profiles.snap_minutes",{minutes:n})}
                </option>`)}
          </select>
        </label>
      </div>
      ${this.renderSelectedPoint(e)} ${this.renderPointTable(e)}
      ${t.length?p`<div class="row copy">
            <label class="field grow">
              ${this.t("profiles.copy_from")}
              <select id="copy-source">
                ${t.map(([n,o])=>p`<option value=${n}>${o.name}</option>`)}
              </select>
            </label>
            <button
              class="copy-button"
              @click=${()=>this.copyCurveFrom(this.renderRoot.querySelector("#copy-source").value)}
            >
              ${this.t("profiles.copy")}
            </button>
          </div>`:u}
    `}renderWeekTab(){let e=this._draft;return p`
      <h3>${this.t("week.title")}</h3>
      <div class="week">
        ${W.map(t=>{let s=e.profiles[e.week[t]]?.color??"transparent";return p`<label class="week-row" style="--row-color: ${s}">
            <span class="day">${this.t(`week.day.${t}`)}</span>
            <select
              data-day=${t}
              @change=${n=>this.setWeekday(t,n.target.value)}
            >
              ${this.profileOptions(e.week[t])}
            </select>
          </label>`})}
        <label
          class="week-row holiday"
          style="--row-color: ${e.profiles[e.holiday_profile]?.color??"transparent"}"
        >
          <span class="day">${this.t("week.holiday")}</span>
          <select
            @change=${t=>this.setHolidayProfile(t.target.value)}
          >
            ${this.profileOptions(e.holiday_profile)}
          </select>
        </label>
        ${this.config.holiday_source?u:p`<div class="muted">${this.t("week.no_holiday_source")}</div>`}
      </div>
      ${this.renderMonth()}
    `}renderMonth(){let e=B(this._month),t=e.getFullYear(),s=e.getMonth(),n=new Date(t,s+1,0).getDate(),o=(e.getDay()+6)%7,l=this._holidays[this._month]??new Set,a=this.today(),h=new Intl.DateTimeFormat(this.language,{month:"long",year:"numeric"}).format(e),c=W.map((f,m)=>new Intl.DateTimeFormat(this.language,{weekday:"short"}).format(new Date(2024,0,1+m,12))),d=[];for(let f=0;f<o;f++)d.push(p`<div class="cell empty"></div>`);for(let f=1;f<=n;f++){let m=j(new Date(t,s,f,12)),g=ft(this._draft,m,be=>l.has(be)),E=this._draft.profiles[g.profileId],b=g.reason==="holiday"?"\u2605":g.reason==="exception"?"\u2708":"";d.push(p`<div
          class="cell ${m===a?"today":""}"
          style="--cell-color: ${E?.color??"transparent"}"
          title="${m}: ${E?.name??""}"
        >
          <span class="num">${f}</span><span class="mark">${b}</span>
        </div>`)}return p`<div class="month">
      <div class="month-header">
        <button
          class="icon"
          aria-label=${this.t("week.prev_month")}
          @click=${()=>this.shiftMonth(-1)}
        >
          ‹
        </button>
        <strong>${this.t("week.preview")}: ${h}</strong>
        <button
          class="icon"
          aria-label=${this.t("week.next_month")}
          @click=${()=>this.shiftMonth(1)}
        >
          ›
        </button>
      </div>
      <div class="calendar">
        ${c.map(f=>p`<div class="cell head">${f}</div>`)} ${d}
      </div>
      <div class="legend">
        ${Object.values(this._draft.profiles).map(f=>p`<span class="row"
              ><span class="swatch" style="background: ${f.color}"></span>${f.name}</span
            >`)}
        <span>★ ${this.t("week.legend_holiday")}</span>
        <span>✈ ${this.t("week.legend_exception")}</span>
      </div>
    </div>`}renderExceptionsTab(){let e=this.today(),t=this._draft.exceptions,s=t.some(n=>n.to<e);return p`
      <h3>${this.t("exceptions.title")}</h3>
      ${t.length===0?p`<div class="muted">${this.t("exceptions.empty")}</div>`:u}
      <div class="exceptions">
        ${t.map((n,o)=>{let l=n.to<e,a=n.from<=e&&e<=n.to,h=this.issuesFor(`exceptions.${o}`),c=this._draft.profiles[n.profile]?.color??"transparent";return p`<div
            class="exception ${l?"past":""}"
            style="--row-color: ${c}"
            data-index=${o}
          >
            <div class="row">
              <label class="field">
                ${this.t("exceptions.from")}
                <input
                  type="date"
                  .value=${n.from}
                  @change=${d=>this.updateException(o,"from",d.target.value)}
                />
              </label>
              <label class="field">
                ${this.t("exceptions.to")}
                <input
                  type="date"
                  .value=${n.to}
                  min=${n.from}
                  @change=${d=>this.updateException(o,"to",d.target.value)}
                />
              </label>
              ${l?p`<span class="badge">${this.t("exceptions.past")}</span>`:u}
              ${a?p`<span class="badge active">${this.t("exceptions.active")}</span>`:u}
            </div>
            <div class="row">
              <label class="field grow">
                ${this.t("exceptions.profile")}
                <select
                  @change=${d=>this.updateException(o,"profile",d.target.value)}
                >
                  ${this.profileOptions(n.profile)}
                </select>
              </label>
              <label class="field grow">
                ${this.t("exceptions.note")}
                <input
                  type="text"
                  maxlength=${te}
                  .value=${n.note??""}
                  @change=${d=>this.updateException(o,"note",d.target.value)}
                />
              </label>
              <button class="danger" @click=${()=>this.deleteException(o)}>
                ${this.t("exceptions.delete")}
              </button>
            </div>
            ${h.length?p`<div class="notice error">
                  ${h.map(d=>p`<div>${this.describeIssue(d)}</div>`)}
                </div>`:u}
          </div>`})}
      </div>
      <div class="row">
        <button class="primary-outline" @click=${()=>this.addException()}>
          ${this.t("exceptions.add")}
        </button>
        ${s?p`<button @click=${()=>this.removePastExceptions()}>
              ${this.t("exceptions.remove_past")}
            </button>`:u}
      </div>
      <label class="check">
        <input
          type="checkbox"
          .checked=${this._draft.auto_cleanup}
          @change=${n=>{let o=n.target.checked;this.change(l=>{l.auto_cleanup=o})}}
        />
        ${this.t("exceptions.auto_cleanup")}
      </label>
    `}renderFooter(){let e=this._issues.filter(t=>!(this._tab==="profiles"&&t.path.startsWith(`profiles.${this._profileId}`))&&!(this._tab==="exceptions"&&t.path.startsWith("exceptions.")));return p`
      ${this._conflict?p`<div class="notice warning row">
            <span class="grow">${this.t("editor.conflict")}</span>
            <button @click=${()=>this.reloadAfterConflict()}>${this.t("editor.reload")}</button>
          </div>`:u}
      ${e.length?p`<div class="notice error">
            ${e.map(t=>p`<div>${this.describeIssue(t)}</div>`)}
          </div>`:u}
      ${this._message?p`<div class="notice ${this._message.kind}" role="status">${this._message.text}</div>`:this.dirty?p`<div class="muted unsaved">${this.t("editor.unsaved")}</div>`:u}
      <div class="footer">
        <button
          class="icon"
          title=${this.t("editor.undo")}
          aria-label=${this.t("editor.undo")}
          ?disabled=${this._undo.length===0}
          @click=${()=>this.undo()}
        >
          ↶
        </button>
        <button
          class="icon"
          title=${this.t("editor.redo")}
          aria-label=${this.t("editor.redo")}
          ?disabled=${this._redo.length===0}
          @click=${()=>this.redo()}
        >
          ↷
        </button>
        <span class="grow"></span>
        <button ?disabled=${!this.dirty||this._saving} @click=${()=>this.discard()}>
          ${this.t("editor.discard")}
        </button>
        <button
          class="primary save"
          ?disabled=${!this.dirty||this._saving}
          @click=${()=>this.save()}
        >
          ${this._saving?this.t("editor.saving"):this.t("editor.save")}
        </button>
      </div>
    `}render(){if(!this._draft)return u;let e;switch(this._tab){case"week":e=this.renderWeekTab();break;case"exceptions":e=this.renderExceptionsTab();break;default:e=this.renderProfilesTab()}return p`${this.renderTabs()}
      <div class="body" role="tabpanel">${e}</div>
      ${this.renderFooter()}`}};ne.properties={hass:{attribute:!1},data:{attribute:!1},language:{},_draft:{state:!0},_base:{state:!0},_baseRevision:{state:!0},_undo:{state:!0},_redo:{state:!0},_tab:{state:!0},_profileId:{state:!0},_selected:{state:!0},_snap:{state:!0},_issues:{state:!0},_message:{state:!0},_saving:{state:!0},_conflict:{state:!0},_month:{state:!0},_holidays:{state:!0}},ne.styles=[K,w`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--zp-gap);
      }
      h3 {
        margin: 4px 0;
        font-size: 16px;
        font-weight: 500;
      }
      .tabs {
        display: flex;
        border-bottom: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        overflow-x: auto;
        scrollbar-width: none;
      }
      .tab {
        flex: 1 1 0;
        min-width: 0;
        padding: 4px 6px;
        line-height: 1.2;
        border: none;
        border-radius: 0;
        background: none;
        border-bottom: 3px solid transparent;
        color: var(--secondary-text-color);
        font-weight: 500;
      }
      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }
      .body {
        display: flex;
        flex-direction: column;
        gap: var(--zp-gap);
        min-width: 0;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chip {
        border-radius: 22px;
        border-width: 2px;
      }
      .chip.active {
        border-color: var(--chip-color);
        background: color-mix(in srgb, var(--chip-color) 18%, transparent);
        font-weight: 500;
      }
      .chip.add {
        border-style: dashed;
      }
      .profile-settings {
        display: flex;
        flex-wrap: wrap;
        gap: var(--zp-gap);
        align-items: flex-end;
      }
      .profile-settings .field.grow {
        min-width: 160px;
      }
      .colors {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .color {
        width: var(--zp-touch);
        height: var(--zp-touch);
        min-width: 0;
        padding: 0;
        border-radius: 50%;
        border: 3px solid transparent;
      }
      .color.active {
        border-color: var(--primary-text-color);
        box-shadow: inset 0 0 0 3px var(--card-background-color, #fff);
      }
      .chart-wrapper {
        margin: 0 -4px;
      }
      .chart-footer select {
        min-width: 100px;
      }
      .field.inline {
        flex-direction: row;
        align-items: center;
        gap: 8px;
      }
      .selected-point {
        padding: 10px;
        border-radius: var(--zp-radius);
        background: rgba(127, 127, 127, 0.08);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .selected-point .row {
        align-items: flex-end;
      }
      .stepper {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .stepper input.value {
        width: 5.5em;
        text-align: center;
      }
      table.points {
        width: 100%;
        border-collapse: collapse;
      }
      table.points caption {
        text-align: left;
        padding-bottom: 4px;
      }
      table.points th {
        text-align: left;
        font-size: 13px;
        font-weight: 500;
        color: var(--secondary-text-color);
        padding: 4px;
      }
      table.points td {
        padding: 4px;
        border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
      }
      table.points tr.selected td {
        background: rgba(127, 127, 127, 0.1);
      }
      table.points input[type="time"] {
        width: 100%;
        min-width: 6.5em;
      }
      table.points input.value {
        width: 100%;
        min-width: 4em;
        text-align: center;
      }
      table.points th:last-child,
      table.points td:last-child {
        width: var(--zp-touch);
      }
      .add-point {
        align-self: flex-start;
      }
      .copy {
        align-items: flex-end;
      }
      .week {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .week-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-left: 10px;
        border-left: 6px solid var(--row-color);
        border-radius: 4px;
      }
      .week-row .day {
        flex: 0 0 8.5em;
      }
      .week-row select {
        flex: 1 1 auto;
        min-width: 0;
      }
      .week-row.holiday {
        margin-top: 8px;
      }
      .month-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin: 8px 0;
      }
      .calendar {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 3px;
      }
      .cell {
        min-height: 40px;
        border-radius: 6px;
        background: color-mix(in srgb, var(--cell-color) 35%, transparent);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .cell.head {
        min-height: 24px;
        background: none;
        color: var(--secondary-text-color);
        font-size: 12px;
      }
      .cell.empty {
        background: none;
      }
      .cell.today {
        outline: 2px solid var(--primary-text-color);
      }
      .cell .mark {
        font-size: 11px;
        line-height: 1;
        min-height: 11px;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 14px;
        margin-top: 8px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .legend .row {
        gap: 4px;
      }
      .exceptions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .exception {
        padding: 10px;
        border-radius: var(--zp-radius);
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        border-left: 6px solid var(--row-color);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .exception .row {
        align-items: flex-end;
      }
      .exception.past {
        opacity: 0.55;
      }
      .exception input[type="date"] {
        min-width: 9.5em;
      }
      .badge {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 12px;
        background: rgba(127, 127, 127, 0.2);
        margin-bottom: 12px;
      }
      .badge.active {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
      .footer {
        position: sticky;
        bottom: 0;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px 0 4px;
        background: var(--card-background-color, var(--ha-card-background, #fff));
        border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        z-index: 1;
      }
      @media (max-width: 400px) {
        .week-row .day {
          flex-basis: 6.5em;
        }
        .footer {
          display: grid;
          grid-template-columns: var(--zp-touch) var(--zp-touch) 1fr 1fr;
          gap: 6px;
        }
        .footer .grow {
          display: none;
        }
        .footer button:not(.icon) {
          padding: 0 6px;
        }
      }
      @media (max-width: 340px) {
        .footer {
          grid-template-columns: var(--zp-touch) var(--zp-touch) 1fr;
        }
        .footer .save {
          grid-column: 1 / -1;
        }
      }
    `];customElements.get("zeitprofil-editor")||customElements.define("zeitprofil-editor",ne);var oe=class extends y{constructor(){super();this.receivedAt=Date.now();this.t=k("en");this.language="en";this._data=null,this._error=null,this._editorOpen=!1,this._holidayForm=null,this._notice=null,this._tick=0}static getConfigElement(){return document.createElement("zeitprofil-card-editor")}static getStubConfig(){return{view:"compact",allow_edit:!0}}setConfig(e){if(!e)throw new Error("Invalid configuration");let t=this._config?.entry_id!==e.entry_id;this._config={view:"compact",allow_edit:!0,...e},t&&this.resubscribe()}getCardSize(){return this._config?.view==="full"?14:5}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}connectedCallback(){super.connectedCallback(),this.timer=setInterval(()=>this._tick+=1,3e4),this.hass&&this._config&&this.resubscribe()}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this.timer),this.teardown()}willUpdate(e){if(e.has("hass")&&this.hass){let t=fe(this.hass);t!==this.language&&(this.language=t,this.t=k(t)),!this.unsubscribe&&this._config&&this.resubscribe()}}async teardown(){let e=this.unsubscribe;if(this.unsubscribe=void 0,this.subscribedEntry=void 0,e)try{await(await e)()}catch{}}async resubscribe(){if(!this.hass||!this._config||!this.isConnected)return;let e=this._config.entry_id;if(!e){try{e=(await he(this.hass))[0]?.entry_id}catch(s){this._error=this.t("card.connection_error",{message:s.message});return}if(!e){this._error=this.t("card.no_instance");return}}if(e===this.subscribedEntry&&this.unsubscribe)return;await this.teardown(),this.subscribedEntry=e,this._error=null;let t=st(this.hass,e,s=>{this._data=s,this.receivedAt=Date.now()});this.unsubscribe=t;try{await t}catch(s){this.unsubscribe=void 0,this.subscribedEntry=void 0;let n=s.code;this._error=n==="not_found"?this.t("card.not_found"):this.t("card.connection_error",{message:s.message??n})}}get canEdit(){return this._config.allow_edit!==!1||this.hass?.user?.is_admin===!0}get editor(){return this.renderRoot.querySelector("zeitprofil-editor")}toggleEditor(){if(this._editorOpen){if(this.editor&&!this.editor.confirmLeave())return;this._editorOpen=!1}else this._editorOpen=!0}nowMinute(e){let t=v(e.state.now.slice(11,16))+Number(e.state.now.slice(17,19))/60,s=(Date.now()-this.receivedAt)/6e4;return Math.min(1440,t+Math.max(0,s))}fmt(e){let t=this._data.config;return I(e,t.step,t.unit,this.language)}async changeMode(e){try{await ot(this.hass,this._data.entry_id,e==="auto"?null:e)}catch(t){this._notice=t.message}}openHolidayForm(){let e=this._data,t=e.state.now.slice(0,10),n=Object.keys(e.schedule.profiles).find(o=>/urlaub|holiday|vacation/i.test(o))??e.schedule.holiday_profile;this._holidayForm={from:t,to:ve(t,6),profile:n,note:this.t("holiday.note_default")}}async submitHoliday(){let e=this._holidayForm;if(!e||!e.from)return;let t=e.to&&e.to>=e.from?e.to:e.from;try{await rt(this.hass,this._data.entry_id,e.from,t,e.profile,e.note),this._holidayForm=null,this._notice=this.t("holiday.added"),setTimeout(()=>this._notice=null,4e3)}catch(s){this._notice=s.message}}renderToday(e){let{state:t,schedule:s,config:n}=e,o=s.profiles[t.profile_id],l=t.timeline.map(b=>b.profile_id),a=[l[0],l[1],l[3],l[4]].map(b=>s.profiles[b]?De(s.profiles[b]):[]),h=this.nowMinute(e),c=o?De(o):[],d=ee([a[0],a[1],c,a[2],a[3]]),f=d.length?new R(d,n.interpolation).at(h):null,m=[this.t("today.title",{profile:o?.name??"?"}),this.t("today.now",{value:this.fmt(t.value)})];t.next_point&&m.push(this.t("today.next",{time:t.next_point.hhmm,value:this.fmt(t.next_point.value)}));let g="";if(t.reason!=="weekday"&&(g=this.t(`today.reason.${t.reason}`),t.reason==="override"&&t.override?.until)){let b=new Date(t.override.until);g+=` \xB7 ${this.t("today.until",{time:new Intl.DateTimeFormat(this.language,{weekday:"short",hour:"2-digit",minute:"2-digit"}).format(b)})}`}let E=t.override?t.override.profile:"auto";return p`
      <div class="summary">
        <div class="headline">${m.join(" \xB7 ")}</div>
        ${g?p`<div class="muted">${g}</div>`:u}
      </div>
      <zeitprofil-curve
        .points=${o?.points??[]}
        .context=${a}
        .mode=${n.interpolation}
        .min=${n.min}
        .max=${n.max}
        .step=${n.step}
        .unit=${n.unit}
        .language=${this.language}
        .color=${o?.color??"var(--primary-color)"}
        .nowMinute=${h}
        .nowValue=${f}
        .height=${170}
        .showContinuation=${!1}
      ></zeitprofil-curve>
      ${t.enabled?u:p`<div class="notice warning">${this.t("today.disabled")}</div>`}
      ${t.enabled&&!t.target_available?p`<div class="notice warning">${this.t("today.unavailable")}</div>`:u}
      <div class="actions">
        <label class="field mode">
          ${this.t("today.mode")}
          <select
            class="mode-select"
            @change=${b=>this.changeMode(b.target.value)}
          >
            <option value="auto" ?selected=${E==="auto"}>
              ${this.t("today.mode.auto")}
            </option>
            ${Object.entries(s.profiles).map(([b,be])=>p`<option value=${b} ?selected=${E===b}>${be.name}</option>`)}
          </select>
        </label>
        <button @click=${()=>this._holidayForm?this._holidayForm=null:this.openHolidayForm()}>
          ${this.t("today.add_holiday")}
        </button>
        ${this._config.view!=="full"&&this.canEdit?p`<button class="primary edit" @click=${()=>this.toggleEditor()}>
              ${this._editorOpen?this.t("today.close_editor"):this.t("today.edit")}
            </button>`:u}
      </div>
      ${this._holidayForm?this.renderHolidayForm(e):u}
      ${this._notice?p`<div class="notice success" role="status">${this._notice}</div>`:u}
    `}renderHolidayForm(e){let t=this._holidayForm,s=n=>o=>{this._holidayForm={...t,[n]:o.target.value}};return p`<div class="holiday-form">
      <strong>${this.t("holiday.title")}</strong>
      <div class="row">
        <label class="field">
          ${this.t("holiday.from")}
          <input type="date" .value=${t.from} @change=${s("from")} />
        </label>
        <label class="field">
          ${this.t("holiday.to")}
          <input type="date" .value=${t.to} min=${t.from} @change=${s("to")} />
        </label>
      </div>
      <div class="row">
        <label class="field grow">
          ${this.t("holiday.profile")}
          <select @change=${s("profile")}>
            ${Object.entries(e.schedule.profiles).map(([n,o])=>p`<option value=${n} ?selected=${n===t.profile}>${o.name}</option>`)}
          </select>
        </label>
        <label class="field grow">
          ${this.t("holiday.note")}
          <input type="text" maxlength="100" .value=${t.note} @change=${s("note")} />
        </label>
      </div>
      <div class="row end">
        <button @click=${()=>this._holidayForm=null}>${this.t("holiday.cancel")}</button>
        <button class="primary" @click=${()=>this.submitHoliday()}>${this.t("holiday.save")}</button>
      </div>
    </div>`}render(){if(!this._config)return u;let e=this._config.title??this._data?.title,t;if(this._error)t=p`<div class="notice error">${this._error}</div>`;else if(!this._data)t=p`<div class="muted">${this.t("card.loading")}</div>`;else{let s=this.canEdit&&(this._config.view==="full"||this._editorOpen);t=p`
        ${this.renderToday(this._data)}
        ${s?p`<zeitprofil-editor
              .hass=${this.hass}
              .data=${this._data}
              .language=${this.language}
            ></zeitprofil-editor>`:u}
      `}return p`<ha-card>
      ${e?p`<h1 class="card-header">${e}</h1>`:u}
      <div class="content">${t}</div>
    </ha-card>`}};oe.properties={hass:{attribute:!1},_config:{state:!0},_data:{state:!0},_error:{state:!0},_editorOpen:{state:!0},_holidayForm:{state:!0},_notice:{state:!0},_tick:{state:!0}},oe.styles=[K,w`
      ha-card {
        overflow: visible;
      }
      .card-header {
        margin: 0;
        padding: 16px 16px 0;
        font-size: 20px;
        font-weight: 400;
        line-height: 1.3;
      }
      .content {
        padding: 12px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: var(--zp-gap);
      }
      .headline {
        font-size: 16px;
        font-weight: 500;
        line-height: 1.4;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: flex-end;
      }
      .actions .mode {
        flex: 1 1 140px;
      }
      .actions .mode select {
        width: 100%;
      }
      .holiday-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px;
        border-radius: var(--zp-radius);
        background: rgba(127, 127, 127, 0.08);
      }
      .row.end {
        justify-content: flex-end;
      }
      zeitprofil-editor {
        border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        padding-top: 8px;
      }
    `];customElements.get("zeitprofil-card")||customElements.define("zeitprofil-card",oe);var re=class extends y{constructor(){super(),this._instances=null}setConfig(i){this._config=i}willUpdate(i){i.has("hass")&&this.hass&&this._instances===null&&(this._instances=[],he(this.hass).then(e=>{this._instances=e,!this._config.entry_id&&e.length&&this.update_({entry_id:e[0].entry_id})}).catch(()=>this._instances=[]))}update_(i){let e={...this._config,...i};for(let t of Object.keys(e))(e[t]===""||e[t]===void 0)&&delete e[t];this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}render(){if(!this._config)return u;let i=k(fe(this.hass)),e=this._instances??[];return p`
      <label class="field">
        ${i("config.instance")}
        <select
          @change=${t=>this.update_({entry_id:t.target.value})}
        >
          ${e.length===0?p`<option value="">${i("card.no_instance")}</option>`:u}
          ${e.map(t=>p`<option
                value=${t.entry_id}
                ?selected=${t.entry_id===this._config.entry_id}
              >
                ${t.title}
              </option>`)}
        </select>
      </label>
      <label class="field">
        ${i("config.view")}
        <select
          @change=${t=>this.update_({view:t.target.value})}
        >
          <option value="compact" ?selected=${this._config.view!=="full"}>
            ${i("config.view.compact")}
          </option>
          <option value="full" ?selected=${this._config.view==="full"}>
            ${i("config.view.full")}
          </option>
        </select>
      </label>
      <label class="field">
        ${i("config.title")}
        <input
          type="text"
          .value=${this._config.title??""}
          @change=${t=>this.update_({title:t.target.value})}
        />
      </label>
      <label class="check">
        <input
          type="checkbox"
          .checked=${this._config.allow_edit!==!1}
          @change=${t=>this.update_({allow_edit:t.target.checked})}
        />
        ${i("config.allow_edit")}
      </label>
    `}};re.properties={hass:{attribute:!1},_config:{state:!0},_instances:{state:!0}},re.styles=[K,w`
      :host {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
    `];customElements.get("zeitprofil-card-editor")||customElements.define("zeitprofil-card-editor",re);var Xt=(navigator.language??"en").toLowerCase().startsWith("de")?"de":"en",vt=k(Xt);window.customCards=window.customCards??[];window.customCards.some(r=>r.type==="zeitprofil-card")||window.customCards.push({type:"zeitprofil-card",name:vt("card.name"),description:vt("card.description"),preview:!0});console.info("%c ZEITPROFIL-CARD ","background:#e67e22;color:#fff;border-radius:3px");
