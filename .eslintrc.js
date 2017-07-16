module.exports = {
  "extends": "airbnb",
  "plugins": [],
  "rules": {
    "no-console": "off",
    "no-eval": "off",
    "no-unused-expressions": "off",
    "func-names": "off",

    // doesn't work in node v4 :(
    "strict": "off",
    "prefer-rest-params": "off",
    "react/require-extension" : "off",
    "import/no-extraneous-dependencies" : "off"
  },
  "env": {
      "es6": true,
      "mocha": true,
      "jest": true
   }
};