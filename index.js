(()=>{var P=Object.defineProperty,T=Object.defineProperties;var L=Object.getOwnPropertyDescriptors;var g=Object.getOwnPropertySymbols;var M=Object.prototype.hasOwnProperty,x=Object.prototype.propertyIsEnumerable;var d=(t,e,n)=>e in t?P(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n,p=(t,e)=>{for(var n in e||(e={}))M.call(e,n)&&d(t,n,e[n]);if(g)for(var n of g(e))x.call(e,n)&&d(t,n,e[n]);return t},f=(t,e)=>T(t,L(e));var m=(t,e,n)=>new Promise((u,i)=>{var a=r=>{try{o(n.next(r))}catch(l){i(l)}},s=r=>{try{o(n.throw(r))}catch(l){i(l)}},o=r=>r.done?u(r.value):Promise.resolve(r.value).then(a,s);o((n=n.apply(t,e)).next())});function h(t){return t instanceof Date?t.toISOString():Array.isArray(t)?t.map(h):t}function S(t,e){return m(this,null,function*(){var o;let{data:{key:n,params:u}}=t,i,a;try{i=yield e(...u)}catch(r){i=void 0;try{a=r.toString()}catch(l){a="Exception can't be stringified."}}let s={key:n};i!==void 0&&(i=h(i),s.result={type:"string",value:i}),a!==void 0&&(s.error=a),((o=t.source)==null?void 0:o.postMessage).call(o,s,"*")})}function y(t){return typeof window!="undefined"&&window.addEventListener("message",e=>S(e,t.run)),f(p({},t),{json:JSON.stringify(O(t),null,2)})}var b=`
        <svg
          width="48"
          height="48"
          viewBox="0 0 26 27"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 14.85L14.3 0V7.29C14.3 11.4653 11.0406 14.85 7.02 14.85H0Z"
            fill="currentColor"
          />
          <path
            d="M11.7 19.71C11.7 15.5347 14.9594 12.15 18.98 12.15H26L11.7 27V19.71Z"
            fill="currentColor"
          />
        </svg>
    `,D=`<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.0002 34.828L2.58624 25.414C1.80524 24.633 1.80524 23.367 2.58624 22.586L12.0002 13.172L14.8292 16L6.82924 24L14.8292 32L12.0002 34.828Z" fill="currentColor"/>
<path d="M36.0004 34.828L33.1714 32L41.1714 24L33.1714 16L36.0004 13.172L45.4144 22.586C46.1954 23.367 46.1954 24.633 45.4144 25.414L36.0004 34.828Z" fill="currentColor"/>
<path d="M26.5485 5.57617L17.5723 41.4553L21.4527 42.4261L30.4289 6.54697L26.5485 5.57617Z" fill="currentColor"/>
</svg>`;function O(t){let{name:e,description:n,author:u,result:i,params:a,about:s,video:o}=t,{icon:r=D}=t;return r==="glide"&&(r=b),{name:e,description:n,author:u,result:i,about:s,icon:r,video:o,params:Object.entries(a).map(([l,w])=>p({name:l},w))}}var C={timeoutSeconds:3600};function v(t){return(new Date().getTime()-t.getTime())/1e3}var c=class{constructor(e=C){this.cache=new Map;this.props=p(p({},e),C)}get(e){return m(this,null,function*(){var i;let{timestamp:n,item:u}=(i=this.cache.get(e))!=null?i:{timestamp:new Date(0)};if(v(n)<this.props.timeoutSeconds)return u;this.cache.delete(e)})}getWith(e,n){return m(this,null,function*(){var a;let{timestamp:u,item:i}=(a=this.cache.get(e))!=null?a:{timestamp:new Date(0)};if(v(u)<this.props.timeoutSeconds)return i;{let s=yield n(e);return this.set(e,s),s}})}set(e,n){return this.cache.set(e,{timestamp:new Date,item:n})}fetch(u){return m(this,arguments,function*(e,n=e){return yield this.getWith(n,()=>fetch(e).then(i=>i.json()))})}};var V=new c,E=y({name:"GitHub Profile",description:"Gets a GitHub Profile for a given username.",author:"David Siegel <david@glideapps.com>",params:{username:{displayName:"Username",type:"string"}},result:{type:"string"},run(t){return m(this,null,function*(){if(t.value===void 0)return;let e=yield V.fetch(`https://api.github.com/users/${t.value}`);return JSON.stringify(e)})}});})();
//# sourceMappingURL=index.js.map
