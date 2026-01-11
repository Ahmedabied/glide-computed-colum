"use strict";(()=>{function u(e){return e instanceof Date?e.toISOString():Array.isArray(e)?e.map(u):e}async function f(e,r){let{data:{key:o,params:s}}=e,n,t;try{n=await r(...s)}catch(l){n=void 0;try{t=l.toString()}catch{t="Exception can't be stringified."}}let i={key:o};n!==void 0&&(n=u(n),i.result={type:"string",value:n}),t!==void 0&&(i.error=t),(e.source?.postMessage)(i,"*")}function m(e){return typeof window<"u"&&window.addEventListener("message",r=>f(r,e.run)),{...e,json:JSON.stringify(y(e),null,2)}}var g=`
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
    `,c=`<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.0002 34.828L2.58624 25.414C1.80524 24.633 1.80524 23.367 2.58624 22.586L12.0002 13.172L14.8292 16L6.82924 24L14.8292 32L12.0002 34.828Z" fill="currentColor"/>
<path d="M36.0004 34.828L33.1714 32L41.1714 24L33.1714 16L36.0004 13.172L45.4144 22.586C46.1954 23.367 46.1954 24.633 45.4144 25.414L36.0004 34.828Z" fill="currentColor"/>
<path d="M26.5485 5.57617L17.5723 41.4553L21.4527 42.4261L30.4289 6.54697L26.5485 5.57617Z" fill="currentColor"/>
</svg>`;function y(e){let{name:r,description:o,author:s,result:n,params:t,about:i,video:l}=e,{icon:a=c}=e;return a==="glide"&&(a=g),{name:r,description:o,author:s,result:n,about:i,icon:a,video:l,params:Object.entries(t).map(([p,d])=>({name:p,...d}))}}var v=m({name:"Echo Text",description:"Returns the exact text that is passed to it.",author:"Glide User",params:{text:{displayName:"Text",type:"string"}},result:{type:"string"},async run(e){if(e.value!==void 0)return e.value}});})();
//# sourceMappingURL=index.js.map
