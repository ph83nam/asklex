import logger from './log';

/**
 * save food
 * @param {object} entity
 */
function save(entity) {
  logger.save('save food', entity);
}

/**
 * search food
 * @param {object} options
 */
function search(options) {
  logger.save('search food', options);
}

const dao = {
  saveFood: save,
  searchFood: search,
};

export default dao;
