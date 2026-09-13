// Standard JSDOM polyfills for ProseMirror and TipTap DOM measurements
if (typeof window !== 'undefined') {
  const dummyRect = {
    x: 0,
    y: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    toJSON: () => {}
  };

  if (typeof Range !== 'undefined') {
    if (!Range.prototype.getClientRects) {
      Range.prototype.getClientRects = function () {
        return [dummyRect];
      };
    }
    if (!Range.prototype.getBoundingClientRect) {
      Range.prototype.getBoundingClientRect = function () {
        return dummyRect;
      };
    }
  }

  if (typeof Element !== 'undefined') {
    if (!Element.prototype.getClientRects) {
      Element.prototype.getClientRects = function () {
        return [dummyRect];
      };
    }
    if (!Element.prototype.getBoundingClientRect) {
      Element.prototype.getBoundingClientRect = function () {
        return dummyRect;
      };
    }
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = function () {};
    }
  }
}
