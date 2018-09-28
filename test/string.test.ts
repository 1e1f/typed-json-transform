import { assert } from 'chai';
import { trim, toCamel, fromCamel } from '../src';

const email = 'email@domain.com';

const name = 'Full Name';
const camelName = 'fullName';
const upperCamelName = 'FullName';

const camelSentence = 'onceUponATime';
const sentence = 'Once upon a time';

const camelSlug = 'aNiceTitle';
const slug = 'a-nice-title';

describe('string', () => {
  it('can trim a string', () => {
    assert.equal(trim(`${email}    `), email)
  });

  it("doesn't trim all whitespace", () => {
    assert.equal(trim(`  ${name}    `), name)
  });

  it("xform to camelCase", () => {
    assert.equal(toCamel(name), camelName)
  });

  it("xform to UpperCamel", () => {
    assert.equal(toCamel(name, { upperCase: true }), upperCamelName);
  });

  it("xform from camelCase and capitalize each", () => {
    assert.equal(fromCamel(camelName, { capitalize: true }), name);
  });

  it("xform from camelCase and capitalize first", () => {
    assert.equal(fromCamel(camelSentence), sentence);
  });

  it("xform from camelCase to url-safe", () => {
    assert.equal(fromCamel(camelSlug, { delimiter: '-', upperCase: false }), slug);
  });

});
