import logger from './log';

/**
 * save food data
 * @param {object} entity
 */
function save(entity) {
  logger.save('save restaurant', entity);
}

/**
 * search restaurant
 * @param {object} options
 */
function search(options) {
  logger.save('search restaurant', options);
}

const dao = {
  saveRestaurant: save,
  searchRestaurant: search,
};

export default dao;
