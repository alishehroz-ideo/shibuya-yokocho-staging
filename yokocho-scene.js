'use strict';
window.yokochoShops=[
['韓国食市','赤い庇と白提灯','#a82a22','#ffe8bd'],['中国食市','緑の瓦と木の看板','#bb8548','#231b13'],['近畿食市1','京都・兵庫・滋賀','#44301c','#e7c181'],['北陸食市','赤格子と富士山の壁画','#862c20','#f0cc80'],
['東北食市','大きな提灯と木の厨房','#64402a','#ffe9b5'],['精肉 大黒','牛をかたどった看板','#30251b','#e5bb6a'],['焼鳥 布袋','鶏の装飾と縞の庇','#b42f1c','#ffe79b'],['力士めし 萬','相撲の意匠と瓦屋根','#d8b777','#472516'],
['純喫茶スナック 思ひ出','実店舗は2階','#a52243','#ffe5a2'],['沖縄食市','赤瓦と漁具の灯り','#d28b4e','#432512'],['九州食市','灰色レンガと青白の庇','#352a21','#b6d3b1'],['四国食市','稲穂の看板と青い庇','#252c29','#e7d39d'],
['近畿食市2','大阪・奈良・和歌山','#d4bd91','#2a241d'],['東海食市','レンガと縁取り電球','#38342e','#f5deb0'],['横浜中華食市','黄色い瓦と赤提灯','#4a2421','#ffe1a2'],['関東食市','青緑の瓦と木の看板','#b39a70','#242f2c'],
['北海道食市','丸太の看板と赤い庇','#8d552d','#fff0c8'],['魚利喜','緑の外壁と縞の庇','#554127','#b9d1b0'],['横丁広場','店舗とは別のイベント広場','#963126','#ffe5a6'],['渋谷バル','月と太陽の印と赤い庇','#332c2a','#bbcbd5']
];
(()=>{const strip=document.getElementById('shop-strip');strip.replaceChildren();
window.yokochoShops.forEach((data,i)=>{const bay=document.createElement('div');bay.className='shop-bay';bay.dataset.shop=String(i);window.yokochoAssets.attach(i,bay);bay.setAttribute('aria-label',data[0]);
strip.append(bay);
const option=document.createElement('option');option.value=i;option.textContent=String(i+1).padStart(2,'0')+' · '+data[0];document.getElementById('shop-select').append(option);
});})();
