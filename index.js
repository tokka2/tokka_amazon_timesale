const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const URL = `https://www.amazon.co.jp/gp/goldbox`;

  const browser = await puppeteer.launch({});
  const page = await browser.newPage();
  page.setViewport({width: 1440, height: 1200})
  await page.goto(URL); //URLにアクセス
  // Get the "viewport" of the page, as reported by the page.
  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      title: document.title,
      deviceScaleFactor: window.devicePixelRatio
    };
  });
  const items = await page.$$('[data-testid="deal-card"]');

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
  console.log({datas});

  const today = new Date();
  const y = today.getFullYear();
  const m = ('00' + (today.getMonth()+1)).slice(-2);
  const d = ('00' + today.getDate()).slice(-2);

  try {
    fs.writeFile(`docs/${y}${m}${d}.json`, JSON.stringify(datas, null, '  '), (err)=>{
      if(err) console.log(`error!::${err}`);
    });
  } catch (err) {
    console.error(err)
  }
  await browser.close();
})();