var C=Object.defineProperty;var U=(e,t,r)=>t in e?C(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var g=(e,t,r)=>U(e,typeof t!="symbol"?t+"":t,r);function y(e){let t=/^https:\/\/bsky\.app\/profile\/([^\/]+)\/post\/([^\/\?#]+)/,r=e.match(t);if(!r)return console.warn(`Invalid BlueSky URL format: ${e}`),null;let[,s,o]=r,n=`at://${s}/app.bsky.feed.post/${o}`;return{handle:s,postId:o,atUri:n}}async function $(e,t=6,r=80){try{let s=new URLSearchParams({uri:e,depth:t.toString(),parentHeight:r.toString()}),o=await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?${s}`);return o.ok?await o.json():(console.warn(`Failed to fetch thread for ${e}: ${o.status}`),null)}catch(s){return console.error(`Error fetching thread for ${e}:`,s),null}}function a(e){let t=document.createElement("div");return t.textContent=e,t.innerHTML}function S(e){let t=typeof e=="string"?new Date(e):e,r=new Date().getTime()-t.getTime(),s=Math.floor(r/6e4),o=Math.floor(r/36e5),n=Math.floor(r/864e5);return s<1?"just now":s<60?`${s}m ago`:o<24?`${o}h ago`:n<7?`${n}d ago`:t.toLocaleDateString()}function w(e,t="full"){let r=a(e.displayName||e.handle),s=a(e.handle);return t==="compact"?`
      <div class="quoted-author">
        <img src="${e.avatar}" alt="${r}" class="quoted-avatar" />
        <div class="quoted-author-info">
          <span class="quoted-author-name">${r}</span>
          <span class="quoted-author-handle">@${s}</span>
        </div>
      </div>
    `:`
    <div class="post-author">
      <img src="${e.avatar}" alt="${r}" class="author-avatar" />
      <div class="author-info">
        <div class="author-name">${r}</div>
        <div class="author-handle">@${s}</div>
      </div>
    </div>
  `}function v(e){let t=e.author,r=e.value,s=a(r.text||"").replace(/\n/g,"<br>"),o="";if(e.embeds&&e.embeds.length>0){let n=e.embeds[0];if(n.$type==="app.bsky.embed.external#view"){let i=n.external;o=`
        <a href="${a(i.uri)}" target="_blank" rel="noopener noreferrer" class="quoted-external-link">
          ${i.thumb?`<img src="${i.thumb}" alt="" class="quoted-link-thumb" loading="lazy" />`:""}
          <div class="quoted-link-details">
            <div class="quoted-link-title">${a(i.title||"")}</div>
          </div>
        </a>
      `}}return`
    <div class="quoted-post">
      ${w(t,"compact")}
      <div class="quoted-content">
        <p>${s}</p>
        ${o}
      </div>
    </div>
  `}function T(e){if(!e)return"";if(e.$type==="app.bsky.embed.images#view")return`<div class="post-images">${e.images.map(t=>`<img src="${t.thumb}" alt="${a(t.alt||"")}" class="post-image" loading="lazy" />`).join("")}</div>`;if(e.$type==="app.bsky.embed.external#view"){let t=e.external;return`
      <a href="${a(t.uri)}" target="_blank" rel="noopener noreferrer" class="post-external-link">
        ${t.thumb?`<img src="${t.thumb}" alt="" class="link-thumb" loading="lazy" />`:""}
        <div class="link-details">
          <div class="link-title">${a(t.title||"")}</div>
          ${t.description?`<div class="link-description">${a(t.description)}</div>`:""}
        </div>
      </a>
    `}if(e.$type==="app.bsky.embed.record#view"&&e.record&&e.record.$type==="app.bsky.embed.record#viewRecord")return v(e.record);if(e.$type==="app.bsky.embed.recordWithMedia#view"){let t="";e.media&&e.media.$type==="app.bsky.embed.images#view"&&(t=`<div class="post-images">${e.media.images.map(s=>`<img src="${s.thumb}" alt="${a(s.alt||"")}" class="post-image" loading="lazy" />`).join("")}</div>`);let r="";return e.record&&e.record.record&&e.record.record.$type==="app.bsky.embed.record#viewRecord"&&(r=v(e.record.record)),t+r}return""}function D(e){return`
    <div class="post-metrics">
      <span class="metric"><span class="icon">\u{1F4AC}</span> ${e.replyCount||0}</span>
      <span class="metric"><span class="icon">\u{1F501}</span> ${e.repostCount||0}</span>
      <span class="metric"><span class="icon">\u2764\uFE0F</span> ${e.likeCount||0}</span>
    </div>
  `}function E(e,t,r){let{post:s,reason:o}=e,n=s.record;if(o&&o.$type==="app.bsky.feed.defs#reasonRepost"&&o.by){let i=o.by;return`
      <div class="post-context">
        ${t?t.replace("<svg",'<svg class="context-icon"'):""}
        <span>${a(i.displayName||i.handle)} reposted</span>
      </div>
    `}if(n.reply){let i=s.author;return`
      <div class="post-context">
        ${r?r.replace("<svg",'<svg class="context-icon"'):""}
        <span>${a(i.displayName||i.handle)} replied</span>
      </div>
    `}return""}function b(e,t={}){let{showMetrics:r=!0,showContext:s=!0,repostIconSvg:o,replyIconSvg:n}=t,{post:i}=e,d=i.record,p=i.author,l=d.text||"",c=new Date(d.createdAt),u=S(c),f=a(l).replace(/\n/g,"<br>"),k=s?E(e,o,n):"",I=w(p,"full"),x=T(i.embed),L=r?D(i):"",M=i.uri.split("/").pop(),q=`https://bsky.app/profile/${p.handle}/post/${M}`;return`
    <div class="bluesky-post">
      ${k}
      ${I}
      <div class="post-content">
        <p>${f}</p>
        ${x}
      </div>
      <div class="post-footer">
        <time datetime="${c.toISOString()}">${u}</time>
        ${L}
      </div>
      <a href="${q}" target="_blank" rel="noopener noreferrer" class="post-link">
        View on BlueSky
      </a>
    </div>
  `}var m=class{constructor(){g(this,"cache",new Map)}parseIconId(e){let t=e.split(":");if(t.length!==2)return console.warn(`Invalid icon identifier format: ${e}. Expected "provider:icon-name"`),null;let[r,s]=t;return r!=="mdi"&&r!=="custom"?(console.warn(`Unknown icon provider: ${r}. Supported: mdi, custom`),null):{provider:r,iconName:s}}getIconUrl(e,t){switch(e){case"mdi":return`https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/${t}.svg`;case"custom":return`/static/icons/${t}.svg`;default:throw new Error(`No URL builder for provider: ${e}`)}}async fetchIcon(e){let t=this.parseIconId(e);if(!t)return null;let r=this.getIconUrl(t.provider,t.iconName);try{let s=await fetch(r);return s.ok?await s.text():(console.warn(`Failed to fetch icon ${e} from ${r}: ${s.status}`),null)}catch(s){return console.warn(`Error fetching icon ${e}:`,s),null}}async getIcon(e){if(this.cache.has(e))return this.cache.get(e);let t=await this.fetchIcon(e);if(!t)return null;t=t.replace(/\sfill="[^"]*"/g,""),t=t.replace(/<path\s/g,'<path fill="white" '),t=t.replace(/<circle\s/g,'<circle fill="white" '),t=t.replace(/<rect\s/g,'<rect fill="white" '),t=t.replace(/<ellipse\s/g,'<ellipse fill="white" '),t=t.replace(/<polygon\s/g,'<polygon fill="white" '),t=t.replace(/<polyline\s/g,'<polyline fill="white" ');let r=`data:image/svg+xml;base64,${btoa(t)}`,s={svgContent:t,dataUri:r};return this.cache.set(e,s),s}async preloadIcons(e){await Promise.all(e.map(t=>this.getIcon(t)))}clearCache(){this.cache.clear()}},h=new m;(async function(){if(document.querySelectorAll(".widget-bluesky-post").length===0)return;let e=null,t=null;async function r(){let[n,i]=await Promise.all([h.getIcon("mdi:repeat-variant"),h.getIcon("mdi:reply")]);n&&(e=n.svgContent),i&&(t=i.svgContent)}async function s(n){(!e||!t)&&await r();let i=n.dataset.url,d=n.dataset.showMetrics==="true";if(!i){n.innerHTML='<div class="error-state"><p>No URL specified</p></div>';return}let p=y(i);if(!p){n.innerHTML=`
      <div class="error-state">
        <p>Invalid BlueSky URL format</p>
        <p class="error-details">Expected format: https://bsky.app/profile/&lt;HANDLE&gt;/post/&lt;ID&gt;</p>
      </div>
    `;return}try{let l=await $(p.atUri);if(!l||!l.thread)throw new Error("Failed to fetch post data");let c=l.thread;if(c.$type==="app.bsky.feed.defs#notFoundPost"){n.innerHTML=`
        <div class="error-state">
          <p>Post not found</p>
          <p class="error-details">This post may have been deleted or is not publicly accessible.</p>
        </div>
      `;return}if(c.$type==="app.bsky.feed.defs#blockedPost"){n.innerHTML=`
        <div class="error-state">
          <p>Post blocked</p>
          <p class="error-details">You do not have permission to view this post.</p>
        </div>
      `;return}let u={post:c.post},f=b(u,{showMetrics:d,showContext:!1,repostIconSvg:e||void 0,replyIconSvg:t||void 0});n.innerHTML=f}catch(l){console.error("Error loading BlueSky post:",l);let c=l instanceof Error?l.message:String(l);n.innerHTML=`
      <div class="error-state">
        <p>Failed to load post</p>
        <p class="error-details">${a(c)}</p>
      </div>
    `}}async function o(){let n=document.querySelectorAll(".widget-bluesky-post");for(let i of n)await s(i)}await r(),await o(),document.addEventListener("nav",o)})();
