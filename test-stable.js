const test = require('tap').test
const fss = require('./').stable
const clone = require('clone')
const s = JSON.stringify

test('circular reference to root', function (assert) {
  const fixture = { name: 'Tywin Lannister' }
  fixture.circle = fixture
  const expected = s(
    { circle: '[Circular]', name: 'Tywin Lannister' }
  )
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('circular getter reference to root', function (assert) {
  const fixture = {
    name: 'Tywin Lannister',
    get circle () {
      return fixture
    }
  }

  const expected = s(
    { circle: '[Circular]', name: 'Tywin Lannister' }
  )
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('nested circular reference to root', function (assert) {
  const fixture = { name: 'Tywin Lannister' }
  fixture.id = { circle: fixture }
  const expected = s(
    { id: { circle: '[Circular]' }, name: 'Tywin Lannister' }
  )
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('child circular reference', function (assert) {
  const fixture = { name: 'Tywin Lannister', child: { name: 'Tyrion Lannister' } }
  fixture.child.dinklage = fixture.child
  const expected = s({
    child: {
      dinklage: '[Circular]', name: 'Tyrion Lannister'
    },
    name: 'Tywin Lannister'
  })
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('nested child circular reference', function (assert) {
  const fixture = { name: 'Tywin Lannister', child: { name: 'Tyrion Lannister' } }
  fixture.child.actor = { dinklage: fixture.child }
  const expected = s({
    child: {
      actor: { dinklage: '[Circular]' }, name: 'Tyrion Lannister'
    },
    name: 'Tywin Lannister'
  })
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('circular objects in an array', function (assert) {
  const fixture = { name: 'Tywin Lannister' }
  fixture.hand = [fixture, fixture]
  const expected = s({
    hand: ['[Circular]', '[Circular]'], name: 'Tywin Lannister'
  })
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('nested circular references in an array', function (assert) {
  const fixture = {
    name: 'Tywin Lannister',
    offspring: [{ name: 'Tyrion Lannister' }, { name: 'Cersei Lannister' }]
  }
  fixture.offspring[0].dinklage = fixture.offspring[0]
  fixture.offspring[1].headey = fixture.offspring[1]

  const expected = s({
    name: 'Tywin Lannister',
    offspring: [
      { dinklage: '[Circular]', name: 'Tyrion Lannister' },
      { headey: '[Circular]', name: 'Cersei Lannister' }
    ]
  })
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('circular arrays', function (assert) {
  const fixture = []
  fixture.push(fixture, fixture)
  const expected = s(['[Circular]', '[Circular]'])
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('nested circular arrays', function (assert) {
  const fixture = []
  fixture.push(
    { name: 'Jon Snow', bastards: fixture },
    { name: 'Ramsay Bolton', bastards: fixture }
  )
  const expected = s([
    { bastards: '[Circular]', name: 'Jon Snow' },
    { bastards: '[Circular]', name: 'Ramsay Bolton' }
  ])
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('repeated non-circular references in objects', function (assert) {
  const daenerys = { name: 'Daenerys Targaryen' }
  const fixture = {
    motherOfDragons: daenerys,
    queenOfMeereen: daenerys
  }
  const expected = s(fixture)
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('repeated non-circular references in arrays', function (assert) {
  const daenerys = { name: 'Daenerys Targaryen' }
  const fixture = [daenerys, daenerys]
  const expected = s(fixture)
  const actual = fss(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('double child circular reference', function (assert) {
  // create circular reference
  const child = { name: 'Tyrion Lannister' }
  child.dinklage = child

  // include it twice in the fixture
  const fixture = { name: 'Tywin Lannister', childA: child, childB: child }
  const cloned = clone(fixture)
  const expected = s({
    childA: {
      dinklage: '[Circular]', name: 'Tyrion Lannister'
    },
    childB: {
      dinklage: '[Circular]', name: 'Tyrion Lannister'
    },
    name: 'Tywin Lannister'
  })
  const actual = fss(fixture)
  assert.is(actual, expected)

  // check if the fixture has not been modified
  assert.deepEqual(fixture, cloned)
  assert.end()
})

test('child circular reference with toJSON', function (assert) {
  // Create a test object that has an overriden `toJSON` property
  TestObject.prototype.toJSON = function () { return { special: 'case' } }
  function TestObject (content) {}

  // Creating a simple circular object structure
  const parentObject = {}
  parentObject.childObject = new TestObject()
  parentObject.childObject.parentObject = parentObject

  // Creating a simple circular object structure
  const otherParentObject = new TestObject()
  otherParentObject.otherChildObject = {}
  otherParentObject.otherChildObject.otherParentObject = otherParentObject

  // Making sure our original tests work
  assert.deepEqual(parentObject.childObject.parentObject, parentObject)
  assert.deepEqual(otherParentObject.otherChildObject.otherParentObject, otherParentObject)

  // Should both be idempotent
  assert.equal(fss(parentObject), '{"childObject":{"special":"case"}}')
  assert.equal(fss(otherParentObject), '{"special":"case"}')

  // Therefore the following assertion should be `true`
  assert.deepEqual(parentObject.childObject.parentObject, parentObject)
  assert.deepEqual(otherParentObject.otherChildObject.otherParentObject, otherParentObject)

  assert.end()
})

test('null object', function (assert) {
  const expected = s(null)
  const actual = fss(null)
  assert.is(actual, expected)
  assert.end()
})

test('null property', function (assert) {
  const expected = s({ f: null })
  const actual = fss({ f: null })
  assert.is(actual, expected)
  assert.end()
})

test('nested child circular reference in toJSON', function (assert) {
  var circle = { some: 'data' }
  circle.circle = circle
  var a = {
    b: {
      toJSON: function () {
        a.b = 2
        return '[Redacted]'
      }
    },
    baz: {
      circle,
      toJSON: function () {
        a.baz = circle
        return '[Redacted]'
      }
    }
  }
  var o = {
    a,
    bar: a
  }

  const expected = s({
    a: {
      b: '[Redacted]',
      baz: '[Redacted]'
    },
    bar: {
      // TODO: This is a known limitation of the current implementation.
      // The ideal result would be:
      //
      // b: 2,
      // baz: {
      //   circle: '[Circular]',
      //   some: 'data'
      // }
      //
      b: '[Redacted]',
      baz: '[Redacted]'
    }
  })
  const actual = fss(o)
  assert.is(actual, expected)
  assert.end()
})
