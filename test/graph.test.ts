/*
this libary is a TypeScript port of a js library written by Jim Riecken
https://github.com/jriecken/dependency-graph
*/

import { assert } from 'chai';
import { Graph } from '../src';

describe('Graph', function () {
  it('should be able to add/remove nodes', function () {
    const graph = new Graph();

    graph.addNode('Foo');
    graph.addNode('Bar');

    assert.equal(graph.hasNode('Foo'), true);
    assert.equal(graph.hasNode('Bar'), true);
    assert.equal(graph.hasNode('NotThere'), false);

    graph.removeNode('Bar');

    assert.equal(graph.hasNode('Bar'), false);
  });

  it('should treat the node data parameter as optional and use the node name as data if node data was not given', function () {
    const graph = new Graph();

    graph.addNode('Foo');

    assert.equal(graph.getNodeData('Foo'), 'Foo');
  });

  it('should be able to associate a node name with data on node add', function () {
    const graph = new Graph();

    graph.addNode('Foo', 'data');

    assert.equal(graph.getNodeData('Foo'), 'data');
  });

  it('should be able to add undefined as node data', function () {
    const graph = new Graph();

    graph.addNode('Foo', undefined);

    assert.equal(graph.getNodeData('Foo'), undefined);
  });

  it('should return true when using hasNode with a node which has falsy data', function () {
    const graph = new Graph();

    const falsyData = ['', 0, null, undefined, false];
    graph.addNode('Foo');

    falsyData.forEach(function (data) {
      graph.setNodeData('Foo', data);

      assert.equal(graph.hasNode('Foo'), true);

      // Just an extra check to make sure that the saved data is correct
      assert.equal(graph.getNodeData('Foo'), data);
    });
  });

  it('should be able to set data after a node was added', function () {
    const graph = new Graph();

    graph.addNode('Foo', 'data');
    graph.setNodeData('Foo', 'data2');

    assert.equal(graph.getNodeData('Foo'), 'data2');
  });

  it('should throw an error if we try to set data for a non-existing node', function () {
    const graph = new Graph();
    assert.throws(function () {
      graph.setNodeData('Foo', 'data');
    }, `Node does not exist: Foo`);
  });

  it('should throw an error if the node does not exists and we try to get data', function () {
    const graph = new Graph();
    assert.throws(function () {
      graph.getNodeData('Foo');
    }, `Node does not exist: Foo`);
  });

  it('should do nothing if creating a node that already exists', function () {
    const graph = new Graph();

    graph.addNode('a');
    graph.addNode('b');

    graph.addDependency('a', 'b');

    graph.addNode('a');

    assert.deepEqual(graph.dependenciesOf('a'), ['b']);
  });

  it('should do nothing if removing a node that does not exist', function () {
    const graph = new Graph();

    graph.addNode('a');
    assert.equal(graph.hasNode('a'), true);

    graph.removeNode('a');
    assert.equal(graph.hasNode('Foo'), false);

    graph.removeNode('a');
    assert.equal(graph.hasNode('Foo'), false);
  });

  it('should be able to add dependencies between nodes', function () {
    const graph = new Graph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');

    graph.addDependency('a', 'b');
    graph.addDependency('a', 'c');

    assert.deepEqual(graph.dependenciesOf('a'), ['b', 'c']);
  });

  it('should throw an error if a node does not exist and a dependency is added', function () {
    const graph = new Graph();

    graph.addNode('a');

    assert.throws(function () {
      graph.addDependency('a', 'b');
    }, 'Node does not exist: b');
  });

  it('should detect cycles', function () {
    const graph = new Graph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');

    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'a');
    graph.addDependency('d', 'a');

    assert.throws(function () {
      graph.dependenciesOf('b');
    }, 'Dependency Cycle Found: b -> c -> a -> b');
  });

  it('should detect cycles in overall order', function () {
    const graph = new Graph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');

    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'a');
    graph.addDependency('d', 'a');

    assert.throws(function () {
      graph.overallOrder();
    }, 'Dependency Cycle Found: a -> b -> c -> a');
  });

  it('should detect cycles in overall order when all nodes have dependants (incoming edges)', function () {
    const graph = new Graph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');

    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'a');

    assert.throws(function () {
      graph.overallOrder();
    }, 'Dependency Cycle Found: a -> b -> c -> a');
  });

  it('should detect cycles in overall order when there are several ' +
    'disconnected subgraphs (with one that does not have a cycle', function () {
      const graph = new Graph();

      graph.addNode('a_1');
      graph.addNode('a_2');
      graph.addNode('b_1');
      graph.addNode('b_2');
      graph.addNode('b_3');

      graph.addDependency('a_1', 'a_2');
      graph.addDependency('b_1', 'b_2');
      graph.addDependency('b_2', 'b_3');
      graph.addDependency('b_3', 'b_1');

      assert.throws(function () {
        graph.overallOrder();
      }, 'Dependency Cycle Found: b_1 -> b_2 -> b_3 -> b_1');
    });

  it('should retrieve dependencies and dependants in the correct order', function () {
    const graph = new Graph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');

    graph.addDependency('a', 'd');
    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');
    graph.addDependency('d', 'b');

    assert.deepEqual(graph.dependenciesOf('a'), ['c', 'b', 'd']);
    assert.deepEqual(graph.dependenciesOf('b'), ['c']);
    assert.deepEqual(graph.dependenciesOf('c'), []);
    assert.deepEqual(graph.dependenciesOf('d'), ['c', 'b']);

    assert.deepEqual(graph.dependantsOf('a'), []);
    assert.deepEqual(graph.dependantsOf('b'), ['a', 'd']);
    assert.deepEqual(graph.dependantsOf('c'), ['a', 'd', 'b']);
    assert.deepEqual(graph.dependantsOf('d'), ['a']);
  });

  it('should be able to resolve the overall order of things', function () {
    const graph = new Graph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');
    graph.addNode('e');

    graph.addDependency('a', 'b');
    graph.addDependency('a', 'c');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'd');

    assert.deepEqual(graph.overallOrder(), ['d', 'c', 'b', 'a', 'e']);
  });

  it('should be able to only retrieve the "leaves" in the overall order', function () {
    const graph = new Graph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addNode('d');
    graph.addNode('e');

    graph.addDependency('a', 'b');
    graph.addDependency('a', 'c');
    graph.addDependency('b', 'c');
    graph.addDependency('c', 'd');

    assert.deepEqual(graph.overallOrder(true), ['d', 'e']);
  });

  it('should be able to give the overall order for a graph with several disconnected subgraphs', function () {
    const graph = new Graph();

    graph.addNode('a_1');
    graph.addNode('a_2');
    graph.addNode('b_1');
    graph.addNode('b_2');
    graph.addNode('b_3');

    graph.addDependency('a_1', 'a_2');
    graph.addDependency('b_1', 'b_2');
    graph.addDependency('b_2', 'b_3');

    assert.deepEqual(graph.overallOrder(), ['a_2', 'a_1', 'b_3', 'b_2', 'b_1']);
  });

  it('should give an empty overall order for an empty graph', function () {
    const graph = new Graph();

    assert.deepEqual(graph.overallOrder(), []);
  });

  it('should still work after nodes are removed', function () {
    const graph = new Graph();

    graph.addNode('a');
    graph.addNode('b');
    graph.addNode('c');
    graph.addDependency('a', 'b');
    graph.addDependency('b', 'c');

    assert.deepEqual(graph.dependenciesOf('a'), ['c', 'b']);

    graph.removeNode('c');

    assert.deepEqual(graph.dependenciesOf('a'), ['b']);
  });

});