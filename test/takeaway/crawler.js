/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { init as initCrawler, crawl as runCrawler } from '../../takeaway/crawler';

describe('takeaway/crawler', function () {
  it('#crawl:area', function (done) {
    initCrawler({
      areas: {
        '/en/order-takeaway-ho-chi-minh-city': {
          name: 'Ho Chi Minh city',
        },
      },
      kitchens: {},
      restaurants: {},
      foods: {},
    });
    this.timeout(15 * 60 * 1000);
    runCrawler({
      initialUrl: 'https://www.vietnammm.com/en/order-takeaway-ho-chi-minh-city',
      interval: 1000,
      maxConcurrency: 3,
      maxDepth: 1,
      callback: (err) => {
        expect(err).to.be.undefined;
        done(err);
      },
    });
  });

  it('#crawl:subarea', function (done) {
    initCrawler({
      areas: {
        '/en/order-takeaway-district-1': {
          name: 'District 1',
          parent: {
            name: 'Ho Chi Minh city',
          },
        },
      },
      kitchens: {},
      restaurants: {},
      foods: {},
    });
    this.timeout(15 * 60 * 1000);
    runCrawler({
      initialUrl: 'https://www.vietnammm.com/en/order-takeaway-district-1',
      interval: 1000,
      maxConcurrency: 3,
      maxDepth: 1,
      callback: (err) => {
        expect(err).to.be.undefined;
        done(err);
      },
    });
  });

  it('#crawl:restaurant', function (done) {
    initCrawler({
      areas: {},
      kitchens: {},
      restaurants: {
        '/en/italia-pizza-pasta': {
          name: 'Italia Pizza Pasta',
          area: {},
        },
      },
      foods: {},
    });
    this.timeout(15 * 60 * 1000);
    runCrawler({
      initialUrl: 'https://www.vietnammm.com/en/italia-pizza-pasta',
      interval: 1000,
      maxConcurrency: 3,
      maxDepth: 1,
      callback: (err) => {
        expect(err).to.be.undefined;
        done(err);
      },
    });
  });
});
