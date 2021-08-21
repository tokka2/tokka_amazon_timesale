const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const URL = `https://www.amazon.co.jp/gp/goldbox`;

  const browser = await puppeteer.launch({});
  const page = await browser.newPage();
  page.setViewport({width: 1440, height: 1200})
  await page.goto(URL); //URLにアクセス

  const items = await page.$$('[data-testid="deal-card"]');

  if (items.length === 0) {
    await browser.close();
    console.log({items});
    return;
  }

  const today = new Date();
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
    const priceTarget = await item.$('.a-price-whole');
    const asidePriceTarget = await item.$('.a-size-small.a-color-secondary');
    const imageTarget = await item.$('.a-image-container > img');
    // const label = await item.evaluate(node => node.getAttribute('aria-label'));

    var data = {
      href: href,
      date: now,
      asin: asin ? asin[1]: null,
      price: priceTarget ? await (await priceTarget.getProperty('textContent')).jsonValue() : null,
      aside_price: asidePriceTarget ? await (await asidePriceTarget.getProperty('textContent')).jsonValue() : null,
      image: imageTarget ? await (await imageTarget.getProperty('src')).jsonValue() : null,
      label: (await item.evaluate(node => node.getAttribute('aria-label'))).replace('セール: ', ''),
      textContent: await (await item.getProperty('textContent')).jsonValue(),
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
    updated_json.push(now);
    fs.writeFile(`docs/updated.json`, JSON.stringify(updated_json, null, '  '), (err)=>{
      if(err) console.log(`error!::${err}`);
    });
  } catch (err) {
    console.error(err)
  }
  await browser.close();
})();