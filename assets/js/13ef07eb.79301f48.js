"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[9950],{3905:(e,t,n)=>{n.d(t,{Zo:()=>s,kt:()=>v});var a=n(67294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var u=a.createContext({}),p=function(e){var t=a.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},s=function(e){var t=p(e.components);return a.createElement(u.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,u=e.parentName,s=l(e,["components","mdxType","originalType","parentName"]),d=p(n),v=r,f=d["".concat(u,".").concat(v)]||d[v]||c[v]||o;return n?a.createElement(f,i(i({ref:t},s),{},{components:n})):a.createElement(f,i({ref:t},s))}));function v(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,i=new Array(o);i[0]=d;var l={};for(var u in t)hasOwnProperty.call(t,u)&&(l[u]=t[u]);l.originalType=e,l.mdxType="string"==typeof e?e:r,i[1]=l;for(var p=2;p<o;p++)i[p]=n[p];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},16146:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>l,default:()=>d,frontMatter:()=>i,metadata:()=>u,toc:()=>s});n(67294);var a=n(3905);function r(){return r=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var a in n)Object.prototype.hasOwnProperty.call(n,a)&&(e[a]=n[a])}return e},r.apply(this,arguments)}function o(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}const i={},l="Evaluate JavaScript",u={unversionedId:"guides/evaluate-javascript",id:"version-19.8.3/guides/evaluate-javascript",title:"Evaluate JavaScript",description:"Puppeteer allows evaluating JavaScript functions in the context of the page",source:"@site/versioned_docs/version-19.8.3/guides/evaluate-javascript.md",sourceDirName:"guides",slug:"/guides/evaluate-javascript",permalink:"/guides/evaluate-javascript",draft:!1,tags:[],version:"19.8.3",frontMatter:{},sidebar:"docs",previous:{title:"Query Selectors",permalink:"/guides/query-selectors"},next:{title:"Docker",permalink:"/guides/docker"}},p={},s=[{value:"Return types",id:"return-types",level:2},{value:"Passing arguments to the evaluate function",id:"passing-arguments-to-the-evaluate-function",level:2}],c={toc:s};function d(e){var{components:t}=e,n=o(e,["components"]);return(0,a.kt)("wrapper",r({},c,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",r({},{id:"evaluate-javascript"}),"Evaluate JavaScript"),(0,a.kt)("p",null,"Puppeteer allows evaluating JavaScript functions in the context of the page\ndriven by Puppeteer:"),(0,a.kt)("pre",null,(0,a.kt)("code",r({parentName:"pre"},{className:"language-ts"}),"// Import puppeteer\nimport puppeteer from 'puppeteer';\n\n(async () => {\n  // Launch the browser\n  const browser = await puppeteer.launch();\n\n  // Create a page\n  const page = await browser.newPage();\n\n  // Go to your site\n  await page.goto('YOUR_SITE');\n\n  // Evaluate JavaScript\n  const three = await page.evaluate(() => {\n    return 1 + 2;\n  });\n\n  console.log(three);\n\n  // Close browser.\n  await browser.close();\n})();\n")),(0,a.kt)("admonition",r({},{type:"caution"}),(0,a.kt)("p",{parentName:"admonition"},"Although the function is defined in your script context, it actually gets\nstringified by Puppeteer, sent to the target page over Chrome DevTools protocol\nand evaluated there. It means that the function cannot access scope variables in\nyour script.")),(0,a.kt)("p",null,"Alternatively, you can provide a function body as a string:"),(0,a.kt)("pre",null,(0,a.kt)("code",r({parentName:"pre"},{className:"language-ts"}),"// Evaluate JavaScript\nconst three = await page.evaluate(`\n    1 + 2\n`);\n")),(0,a.kt)("admonition",r({},{type:"caution"}),(0,a.kt)("p",{parentName:"admonition"},"The example above produces the equivalent results but it also illustrates that\nthe types and global variables available to the evaluated function cannot be\nknown. Especially, in TypeScript you should be careful to make sure that objects\nreferenced by the evaluated function are correct.")),(0,a.kt)("h2",r({},{id:"return-types"}),"Return types"),(0,a.kt)("p",null,"The functions you evaluate can return values. If the returned value is of a\nprimitive type, it gets automatically converted by Puppeteer to a primitive type\nin the script context like in the previous example."),(0,a.kt)("p",null,"If the script returns an object, Puppeteer serializes it to a JSON and reconstructs it on the script side. This process might not always yield correct results, for example, when you return a DOM node:"),(0,a.kt)("pre",null,(0,a.kt)("code",r({parentName:"pre"},{className:"language-ts"}),"const body = await page.evaluate(() => {\n  return document.body;\n});\nconsole.log(body); // {}, unexpected!\n")),(0,a.kt)("p",null,"To work with the returned objects, Puppeteer offers a way to return objects by reference:"),(0,a.kt)("pre",null,(0,a.kt)("code",r({parentName:"pre"},{className:"language-ts"}),"const body = await page.evaluateHandle(() => {\n  return document.body;\n});\nconsole.log(body instanceof ElementHandle); // true\n")),(0,a.kt)("p",null,"The returned object is either a ",(0,a.kt)("inlineCode",{parentName:"p"},"JSHandle")," or a ",(0,a.kt)("inlineCode",{parentName:"p"},"ElementHandle"),". ",(0,a.kt)("inlineCode",{parentName:"p"},"ElementHandle")," extends ",(0,a.kt)("inlineCode",{parentName:"p"},"JSONHandle")," and it is only created for DOM elements."),(0,a.kt)("p",null,"See the ",(0,a.kt)("a",r({parentName:"p"},{href:"https://pptr.dev/api"}),"API documentation")," for more details about what methods are available for handles."),(0,a.kt)("h2",r({},{id:"passing-arguments-to-the-evaluate-function"}),"Passing arguments to the evaluate function"),(0,a.kt)("p",null,"You can provide arguments to your function:"),(0,a.kt)("pre",null,(0,a.kt)("code",r({parentName:"pre"},{className:"language-ts"}),"const three = await page.evaluate(\n  (a, b) => {\n    return 1 + 2;\n  },\n  1,\n  2\n);\n")),(0,a.kt)("p",null,"The arguments can primitive values or ",(0,a.kt)("inlineCode",{parentName:"p"},"JSHandle"),"s."),(0,a.kt)("admonition",r({},{type:"note"}),(0,a.kt)("p",{parentName:"admonition"},"Page, JSHandle and ElementHandle offer several different helpers to evaluate JavaScript but they all follow the basic principles outlined in this guide.")))}d.isMDXComponent=!0}}]);