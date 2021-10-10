const puppeteer = require('puppeteer');
const fs = require('fs');

async function sleep(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

(async () => {
  const URL = `https://www.amazon.co.jp/gp/goldbox?language=ja_JP`;

  const browser = await puppeteer.launch({});
  const page = await browser.newPage();
  page.setViewport({width: 1440, height: 1200})
  await page.goto(URL); //URLにアクセス
  await sleep(1000);

  const items = await page.$$('[data-testid="deal-card"], .dealTile');

  if (items.length === 0) {
    await browser.close();
    console.log({items});
    return;
  }

  const today = new Date(new Date().toLocaleString({ timeZone: 'Asia/Tokyo' }));
  const y = today.getFullYear();
  const m = ('00' + (today.getMonth()+1)).slice(-2);
  const d = ('00' + today.getDate()).slice(-2);
  const h = ('00' + today.getHours()).slice(-2);
  const min = ('00' + today.getMinutes()).slice(-2);
  const now = `${y}-${m}-${d}-${h}${min}`

  const datas = [];
  for (const item of items) {
    const hrefTarget = await item.$('.a-link-normal');
    const href = `${await (await hrefTarget.getProperty('href')).jsonValue()}&tag=tokkajohotsu-22`;
    const asin = href.match(/[^0-9A-Z]([0-9A-Z]{10})([^0-9A-Z]|$)/);
    const priceTarget = await item.$('.a-price-whole, .dealPriceText');
    const asidePriceTarget = await item.$('.a-size-small.a-color-secondary');
    const imageTarget = await item.$('.a-image-container > img, [role="img"]');
    const label = await item.evaluate(node => node.getAttribute('aria-label'));
    const textContent = await (await item.getProperty('textContent')).jsonValue();
    const price = priceTarget ? await (await priceTarget.getProperty('textContent')).jsonValue() : null;

    var data = {
      href: href,
      date: now,
      asin: asin ? asin[1]: null,
      price: price ? price.replace(/¥/g, '') : null,
      aside_price: asidePriceTarget ? await (await asidePriceTarget.getProperty('textContent')).jsonValue() : null,
      image: imageTarget ? await (await imageTarget.getProperty('src')).jsonValue() : null,
      label: label ? label.replace('セール: ', '') : null,
      textContent: textContent ? textContent.replace(/\n|\s+/g, '') : null,
      // innerHTML: await (await item.getProperty('innerHTML')).jsonValue()
    };
    datas.push(data);
  }
  // console.log({datas});

  try {
    fs.writeFile(`docs/posts/${now}.json`, JSON.stringify(datas, null, '  '), (err)=>{
      if(err) console.log(`error!::${err}`);
    });
    const updated = fs.readFileSync('docs/updated.json', 'utf-8');
    const updated_json = JSON.parse(updated);

    updated_json.push({
      date: now,
      title: datas[0].label,
      image: datas[0].image,
      content: datas[0].textContent
    });
    fs.writeFile(`docs/updated.json`, JSON.stringify(updated_json, null, '  '), (err)=>{
      if(err) console.log(`error!::${err}`);
    });
  } catch (err) {
    console.error(err)
  }
  await browser.close();
})();