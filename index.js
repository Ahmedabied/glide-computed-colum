"use strict";(()=>{function m(e){return e instanceof Date?e.toISOString():Array.isArray(e)?e.map(m):e}async function d(e,r){let{data:{key:i,params:t}}=e,n,a;try{n=await r(...t)}catch(u){n=void 0;try{a=u.toString()}catch{a="Exception can't be stringified."}}let s={key:i};n!==void 0&&(n=m(n),s.result={type:"string",value:n}),a!==void 0&&(s.error=a),(e.source?.postMessage)(s,"*")}function p(e){return typeof window<"u"&&window.addEventListener("message",r=>d(r,e.run)),{...e,json:JSON.stringify(h(e),null,2)}}var y=`
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
</svg>`;function h(e){let{name:r,description:i,author:t,result:n,params:a,about:s,video:u}=e,{icon:o=C}=e;return o==="glide"&&(o=y),{name:r,description:i,author:t,result:n,about:s,icon:o,video:u,params:Object.entries(a).map(([g,f])=>({name:g,...f}))}}var w="https://silent-fire-a4ef.ahmed-abied.workers.dev/translate",l=new Map;function L(e){return/[\u0600-\u06FF]/.test(e)}function T(e){return e?e.toLowerCase().split(" ").map(r=>r.charAt(0).toUpperCase()+r.slice(1)).join(" "):""}async function c(e,r,i){if(!e||!e.trim())return"";let t=`${r}:${i}:${e}`;if(l.has(t))return l.get(t);try{let n=await fetch(w,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:e,from:r,to:i})});if(!n.ok)return console.error("Translation failed:",n.status),e;let a=await n.json();if(a.results&&Array.isArray(a.results)&&a.results.length>0){let s=a.results[0];return l.set(t,s),s}return e}catch(n){return console.error("Translation error:",n),e}}var b=p({name:"Name Translator",description:"Translates names between Arabic and English using Azure Translator",author:"Ahmed Abied",about:"Uses Azure Cognitive Services for high-quality name translation.",video:"",params:{language:{displayName:"Target Language",type:"string"},name:{displayName:"Name",type:"string"}},result:{type:"string"},async run(e,r){if(e.value===void 0||r.value===void 0)return;let i=e.value.toLowerCase().trim(),t=r.value.trim();if(!t)return"";if(i!=="en"&&i!=="ar")return t;let n=L(t);if(i==="en"&&!n||i==="ar"&&n)return t;if(i==="en"&&n){let a=await c(t,"ar","en");return T(a)}return i==="ar"&&!n?await c(t,"en","ar"):t}});})();
//# sourceMappingURL=index.js.map
