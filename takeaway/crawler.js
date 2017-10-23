import Crawler from 'simplecrawler';
import cheerio from 'cheerio';
import extend from 'extend';
import log from '../lib/log';
import util from '../lib/util';

/**
 * mapping from uri to area data
 */
const areaMap = {};

/**
 * mapping from uri to kitchen data
 */
const kitchenMap = {};

/**
 * mapping from uri to restaurant data
 */
const restaurantMap = {};

/**
 * mapping from id to food data
 */
const foodMap = {};

/**
 * parse html content
 * @param {Cheerio} $
 * @param {string} parentUri
 */
function parseAreaPage($, parentUri) {
  $('div.restaurant-listing div.delarea a').each((index, element) => {
    const area = {
      uri: element.attribs.href,
      name: element.firstChild.data.trim(),
    };
    if (area.uri && areaMap[area.uri] === undefined) {
      if (areaMap[parentUri]) {
        area.parent = areaMap[parentUri];
      }
      areaMap[area.uri] = area;
      log.info('Detected delivery area', area.name, area.uri);
    }
  });
}

/**
 * parse html content
 * @param {Cheerio} $
 * @param {string} contextUri
 */
function parseSubAreaPage($, contextUri) {
  // parse restaurant
  const restList = $('#irestaurantlist');
  if (restList.length === 1) {
    const restaurants = restList.children('div.restaurant.grid');
    log.debug('parsing restaurants ', restaurants.length - 1);
    restaurants.each((index, element) => {
      const link = $('a.restaurantname', element);
      const href = link.attr('href');
      if (href === '{{RestaurantUrl}}') return;
      if (restaurantMap[href] === undefined) {
        const restaurant = {
          uri: href,
          name: link.text(),
        };
        if (areaMap[contextUri]) {
          restaurant.area = areaMap[contextUri];
        }
        restaurantMap[href] = restaurant;
        log.info('Detected restaurant', restaurant.name, href);
      } else {
        // @todo add location to restaurant
      }
    });
  }
  // parse kitchen
  $('div.filter-kitchen a[data-type="Cuisine"]').each((index, element) => {
    const cuisine = {
      uri: element.attribs.href,
      name: element.firstChild.data.trim(),
    };
    if (cuisine.uri === undefined) return;
    kitchenMap[cuisine.uri] = cuisine;
    log.debug('Ignoring kitchen link', cuisine.name, cuisine.uri);
  });
}

/**
 * parse html
 * ```
 *   url: /en/xHttp/showSidedishes.php
 *   data:
 *      action=add&product=537N10R51&domid=productformpopular537N10R51
 *      &menucat=5N37Q0O1&rest=5753R5N
 *   response: html
 * ```
 *
 * ```
 *   url: /en/xHttp/Basket.php
 *   data:
 *      action=add&menucat=5N37Q0O1&product=537N10R51&rest=5753R5N
 *      &sidedishselectvalue_5ROPO10Q5=0.00&sidedishpulldown_5ROPO10Q5=5ROPO10Q5%3B0.00
 *      &productnumber=1
 *   response: html
 * ```
 * @param {Cherrio} $
 * @param {string} restaurant
 */
function parseRestaurantPage($, restaurant) {
  log.debug('parsing foods of', restaurant.name);

  // parse category details
  $('div.menu-meals-group').each((index, element) => {
    const categoryName = $('.menu-category-head', element).text().trim();
    const timeRestriction = $('.menu-category-time-restriction', element).text();

    // parse meal details
    $('.meal', element).each((mealIndex, mealElement) => {
      const food = {
        id: $('input[name="product"]', mealElement).val().trim(),
        domId: mealElement.attribs.id,
        name: $('span.meal-name', mealElement).text().trim(),
        description: $('*[itemprop="description"]', mealElement).text().trim(),
        choice: $('.meal-description-choose-from', mealElement).text().trim(),
        shop: restaurant,
        category: categoryName,
        restriction: timeRestriction,
      };
      if (food.id && food.name) {
        foodMap[food.id] = food;
        log.debug('parsed food', food.name, food.id);
      } else {
        log.warn('failed to parse food', mealElement);
      }
    });
  });
}

/**
 * Crawler callback
 * @param {*} queueItem
 * @param {*} resources
 */
function onDiscoveryComplete(queueItem, resources) {
  // log.info('discovery completed ', queueItem.url, resources);
  log.debug('discovery completed with ', queueItem.url, resources.length);
}

/**
 * Crawler callback
 * @param {*} queueItem
 * @param {Buffer} responseBuffer
 * @param {*} response
 */
function onFetchComplete(queueItem, responseBuffer, response) {
  log.debug('Received %s (%d bytes)', queueItem.url, responseBuffer.length);
  const contentType = response.headers['content-type'];
  if (contentType.indexOf('text/html') === 0) {
    // parse html for restaurant
    try {
      const $ = cheerio.load(responseBuffer);
      const uri = queueItem.uriPath;

      if (restaurantMap[uri]) {
        parseRestaurantPage($, restaurantMap[uri]);
      } else if (areaMap[uri] && areaMap[uri].parent) {
        parseSubAreaPage($, uri);
      } else {
        parseAreaPage($, uri);
      }
    } catch (ex) {
      log.error('failed to parse html from ', queueItem.url, ex);
    }
  }
}

/**
 * crawl a takeaway website
 * @param {object} options
 */
function crawl(options) {
  const crawler = new Crawler(options.initialUrl || 'https://www.vietnammm.com/en/order-takeaway');
  crawler.interval = options.interval || 3000; // 3 seconds
  crawler.maxConcurrency = options.maxConcurrency || 2;
  crawler.maxDepth = options.maxDepth || 4;

  crawler.addFetchCondition((queueItem, referrerQueueItem, callback) => {
    const interested = (
        // if uri start with /order-
        queueItem.path.match(/\/order-.+$/i) ||
        // if uri is a link to a restaurant
        restaurantMap[queueItem.path] !== undefined
      )
      // if uri is not a kitchen
      && kitchenMap[queueItem.path] === undefined
      // if uri is not an static content
      && !queueItem.path.match(/\.(pdf|js|css|png|svg|jpg|ttf|woff|eot)(\?\d+)?$/i);
    util.invoke(callback, null, interested);
  });

  crawler.on('fetchcomplete', onFetchComplete);
  crawler.on('discoverycomplete', onDiscoveryComplete);

  crawler.on('complete', () => {
    log.info('crawler completed');
    util.invoke(options.callback);
  });

  crawler.start();
}

/**
 * @param {object} event
 * @param {context} context
 * @param {function} callbackFunc
 */
function run(event, context, callbackFunc) {
  const options = {
    initialUrl: process.env.TAKEAWAY_URL,
    interval: process.env.TAKEAWAY_INTERVAL || process.env.CRAWLER_INTERVAL,
    maxConcurrency: process.env.TAKEAWAY_MAX_CONCURRENCY || process.env.CRAWLER_MAX_CONCURRENCY,
    maxDepth: process.env.TAKEAWAY_MAX_DEPTH,
    callback: callbackFunc,
  };
  crawl(options);
}

/**
 * initialize with inner data
 * @param {any} options
 */
function init(options) {
  const mappables = {
    areas: areaMap,
    kitchens: kitchenMap,
    restaurants: restaurantMap,
    foods: foodMap,
  };
  Object.entries(mappables).forEach(([name, values]) => {
    if (options[name] && values) {
      extend(values, options[name]);
    }
  });
}

export { run as default, run };
export {
  init,
  crawl,
};
