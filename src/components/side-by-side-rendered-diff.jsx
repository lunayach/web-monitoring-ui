import React from 'react';
import SandboxedHtml from './sandboxed-html';

const showRemovals = showType.bind(null, 'removals');
const showAdditions = showType.bind(null, 'additions');

/**
 * @typedef {Object} SideBySideRenderedDiffProps
 * @property {Diff} diff The diff to render
 * @property {Page} page The page this diff pertains to
 */

/**
 * Display two versions of a page, side-by-side.
 *
 * @class SideBySideRenderedDiff
 * @extends {React.Component}
 * @params {SideBySideRenderedDiffProps} props
 */
export default class SideBySideRenderedDiff extends React.Component {
  render () {
    return (
      <div className="side-by-side-render">
        <SandboxedHtml
          html={this.props.diff}
          baseUrl={this.props.page.url}
          transform={showRemovals}
        />
        <SandboxedHtml
          html={this.props.diff}
          baseUrl={this.props.page.url}
          transform={showAdditions}
        />
      </div>
    );
  }
}

function showType (viewType, sourceDocument) {
  // Show correct version of document `<head>`
  if (viewType !== 'additions') {
    const oldHead = sourceDocument.getElementById('wm-diff-old-head').content;
    const styling = sourceDocument.getElementById('wm-diff-style');
    const titleDiff = sourceDocument.querySelector('meta[name="wm-diff-title"]');
    sourceDocument.head.innerHTML = '';
    sourceDocument.head.appendChild(oldHead);
    sourceDocument.head.appendChild(styling);
    sourceDocument.head.appendChild(titleDiff);
  }

  const elementToRemove = viewType === 'additions' ? 'del' : 'ins';
  removeChangeElements(elementToRemove, sourceDocument);
  activateInertChangeElements(viewType, sourceDocument);

  return sourceDocument;
}

/**
 * Remove HTML elements representing additions or removals from a document.
 * If removing an element leaves its parent element empty, the parent element
 * is also removed, and so on recursively up the tree. This is meant to
 * compensate for the fact that our diff is really a text diff that is
 * sensitive to the tree and not an actual tree diff.
 *
 * @param {string} type  Element type to remove, i.e. `ins` or `del`.
 * @param {HTMLDocument} sourceDocument  Document to remove elements from.
 */
function removeChangeElements (type, sourceDocument) {
  function removeEmptyParents (elements) {
    if (elements.size === 0) return;

    const parents = new Set();
    elements.forEach(element => {
      if (element.parentNode
          && element.childElementCount === 0
          && /^[\s\n\r]*$/.test(element.textContent)) {
        parents.add(element.parentNode);
        element.parentNode.removeChild(element);
      }
    });

    return removeEmptyParents(parents);
  }

  const parents = new Set();
  sourceDocument.querySelectorAll(type).forEach(element => {
    parents.add(element.parentNode);
    element.parentNode.removeChild(element);
  });
  removeEmptyParents(parents);
}

/**
 * Activate inert (embedded in `<template>`) elements (e.g. scripts and styles)
 * that were removed as part of the represented change and remove elements that
 * were added. If the `viewType` is `additions`, this does nothing, since added
 * elements are already active.
 *
 * @param {'additions'|'deletions'} viewType Type of view to restrict to
 * @param {HTMLDocument} sourceDocument Document to activate or deactivate
 *                                      elements within
 */
function activateInertChangeElements (viewType, sourceDocument) {
  if ( viewType === 'additions') {
    return;
  }

  sourceDocument.querySelectorAll('.wm-diff-inserted-active')
    .forEach(item => item.remove());

  sourceDocument.querySelectorAll('.wm-diff-deleted-inert')
    .forEach(item => {
      const content = item.content;
      item.parentNode.insertBefore(content, item);
      item.remove();
    });
}
