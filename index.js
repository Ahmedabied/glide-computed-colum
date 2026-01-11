"use strict";(()=>{function p(e){return e instanceof Date?e.toISOString():Array.isArray(e)?e.map(p):e}async function h(e,t){let{data:{key:r,params:n}}=e,i,s;try{i=await t(...n)}catch(a){i=void 0;try{s=a.toString()}catch{s="Exception can't be stringified."}}let o={key:r};i!==void 0&&(i=p(i),o.result={type:"string",value:i}),s!==void 0&&(o.error=s),(e.source?.postMessage)(o,"*")}function l(e){return typeof window<"u"&&window.addEventListener("message",t=>h(t,e.run)),{...e,json:JSON.stringify(w(e),null,2)}}var y=`
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
    `,C=`<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.0002 34.828L2.58624 25.414C1.80524 24.633 1.80524 23.367 2.58624 22.586L12.0002 13.172L14.8292 16L6.82924 24L14.8292 32L12.0002 34.828Z" fill="currentColor"/>
<path d="M36.0004 34.828L33.1714 32L41.1714 24L33.1714 16L36.0004 13.172L45.4144 22.586C46.1954 23.367 46.1954 24.633 45.4144 25.414L36.0004 34.828Z" fill="currentColor"/>
<path d="M26.5485 5.57617L17.5723 41.4553L21.4527 42.4261L30.4289 6.54697L26.5485 5.57617Z" fill="currentColor"/>
</svg>`;function w(e){let{name:t,description:r,author:n,result:i,params:s,about:o,video:a}=e,{icon:u=C}=e;return u==="glide"&&(u=y),{name:t,description:r,author:n,result:i,about:o,icon:u,video:a,params:Object.entries(s).map(([d,f])=>({name:d,...f}))}}var c={timeoutSeconds:3600};function g(e){return(new Date().getTime()-e.getTime())/1e3}var m=class{constructor(t=c){this.cache=new Map;this.props={...t,...c}}async get(t){let{timestamp:r,item:n}=this.cache.get(t)??{timestamp:new Date(0)};if(g(r)<this.props.timeoutSeconds)return n;this.cache.delete(t)}async getWith(t,r){let{timestamp:n,item:i}=this.cache.get(t)??{timestamp:new Date(0)};if(g(n)<this.props.timeoutSeconds)return i;{let s=await r(t);return this.set(t,s),s}}set(t,r){return this.cache.set(t,{timestamp:new Date,item:r})}async fetch(t,r=t){return await this.getWith(r,()=>fetch(t).then(n=>n.json()))}};var T=new m,L="https://corsproxy.io/?";function P(e){return/[\u0600-\u06FF]/.test(e)}var b=l({name:"Name Transliterator",description:"Transliterates names between Arabic and English scripts.",author:"Glide User",params:{language:{displayName:"Target Language",type:"string"},name:{displayName:"Name",type:"string"}},result:{type:"string"},async run(e,t){if(e.value===void 0||t.value===void 0)return;let r=e.value.toLowerCase().trim(),n=t.value.trim();if(!n)return"";if(r!=="en"&&r!=="ar")return n;let i=P(n);if(r==="en"&&!i||r==="ar"&&i)return n;let s=r==="en"?`https://transliterate.qcri.org/ar2en/${encodeURIComponent(n)}`:`https://transliterate.qcri.org/en2ar/${encodeURIComponent(n)}`,o=typeof window<"u"?L+encodeURIComponent(s):s;try{return(await T.fetch(o)).results??n}catch(a){return`ERROR: ${a instanceof Error?a.message:String(a)}`}}});})();
//# sourceMappingURL=index.js.map
