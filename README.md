## js-object-tools

[Status](https://secure.travis-ci.org/structuresound/js-object-tools.png?branch=master)](http://travis-ci.org/structuresound/js-object-tools) [![COVERALLS](https://img.shields.io/coveralls/structuresound/js-object-tools.svg)]()
[![NPM](https://nodei.co/npm/js-object-tools.png?downloads=true)](https://nodei.co/npm/js-object-tools/)

## check

test the type of a JS primitive without the usual bs between dates and objects, or strings and numbers

for example

```js
check(new Date(), Object);
// returns false
check('0', Number);
// returns false
check(0, Number);
// returns true
check(0, undefined);
// returns false
```

## diff

Some helpful methods for diff, merge, clone, flatten, etc ...

see test folder for examples
