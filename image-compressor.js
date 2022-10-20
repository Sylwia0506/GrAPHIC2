(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.ImageCompressor = factory());
}(this, (function() { 'use strict';
	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}
	const canvasToBlob = createCommonjsModule(function (module) {
	(function(window) {
	  const CanvasPrototype =
	    window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
	  const hasBlobConstructor =
	    window.Blob &&
	    (function() {
	      try {
	        return Boolean(new Blob())
	      } catch (e) {
	        return false
	      }
	    })();
		const hasArrayBufferViewSupport =
	    hasBlobConstructor &&
	    window.Uint8Array &&
	    (function () {
	      try {
	        return new Blob([new Uint8Array(100)]).size === 100
	      } catch (e) {
	        return false
	      }
	    })();
		const BlobBuilder =
	    window.BlobBuilder ||
	    window.WebKitBlobBuilder ||
	    window.MozBlobBuilder ||
	    window.MSBlobBuilder;
		const dataURIPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/;
		const dataURLtoBlob =
	    (hasBlobConstructor || BlobBuilder) &&
	    window.atob &&
	    window.ArrayBuffer &&
	    window.Uint8Array &&
	    function (dataURI) {
	      var matches,
	        mediaType,
	        isBase64,
	        dataString,
	        byteString,
	        arrayBuffer,
	        intArray,
	        i,
	        bb;
	      matches = dataURI.match(dataURIPattern);
	      if (!matches) {
	        throw new Error('invalid data URI')
	      }
	      mediaType = matches[2]
	        ? matches[1]
	        : 'text/plain' + (matches[3] || ';charset=US-ASCII');
	      isBase64 = !!matches[4];
	      dataString = dataURI.slice(matches[0].length);
	      if (isBase64) {
	        byteString = atob(dataString);
	      } else {
	        byteString = decodeURIComponent(dataString);
	      }
	      arrayBuffer = new ArrayBuffer(byteString.length);
	      intArray = new Uint8Array(arrayBuffer);
	      for (i = 0; i < byteString.length; i += 1) {
	        intArray[i] = byteString.charCodeAt(i);
	      }
	      if (hasBlobConstructor) {
	        return new Blob([hasArrayBufferViewSupport ? intArray : arrayBuffer], {
	          type: mediaType
	        })
	      }
	      bb = new BlobBuilder();
	      bb.append(arrayBuffer);
	      return bb.getBlob(mediaType)
	    };
	  if (window.HTMLCanvasElement && !CanvasPrototype.toBlob) {
	    if (CanvasPrototype.mozGetAsFile) {
	      CanvasPrototype.toBlob = function (callback, type, quality) {
	        var self = this;
	        setTimeout(function () {
	          if (quality && CanvasPrototype.toDataURL && dataURLtoBlob) {
	            callback(dataURLtoBlob(self.toDataURL(type, quality)));
	          } else {
	            callback(self.mozGetAsFile('blob', type));
	          }
	        });
	      };
	    } else if (CanvasPrototype.toDataURL && dataURLtoBlob) {
	      CanvasPrototype.toBlob = function (callback, type, quality) {
	        var self = this;
	        setTimeout(function () {
	          callback(dataURLtoBlob(self.toDataURL(type, quality)));
	        });
	      };
	    }
	  }
	  if (typeof undefined === 'function' && undefined.amd) {
	    undefined(function () {
	      return dataURLtoBlob
	    });
	  } else if (module.exports) {
	    module.exports = dataURLtoBlob;
	  } else {
	    window.dataURLtoBlob = dataURLtoBlob;
	  }
	})(window);
	});
	const toString = Object.prototype.toString;
	const isBlob = function (x) {
		return x instanceof Blob || toString.call(x) === '[object Blob]';
	};
	const DEFAULTS = {
	  checkOrientation: true,
	  maxWidth: Infinity,
	  maxHeight: Infinity,
	  minWidth: 0,
	  minHeight: 0,
	  width: undefined,
	  height: undefined,
	  quality: 1,
	  mimeType: 'auto',
	  convertSize: 5000000,
	  beforeDraw: null,
	  drew: null,
	  success: null,
	  error: null
	};
	// const REGEXP_IMAGE_TYPE = /^image\/.+$/;
	function isImageType(value) {
		return value.toString().split("/")[1] == "jpeg";
	  // return REGEXP_IMAGE_TYPE.test(value);
	}
	function imageTypeToExtension(value) {
	  var includeDot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
	  var extension = isImageType(value) ? value.substr(6) : '';
	  if (extension === 'jpeg') {
	    extension = 'jpg';
	  }
	  if (extension && includeDot) {
	    extension = '.' + extension;
	  }
	  return extension;
	}
	var fromCharCode = String.fromCharCode;
	function getStringFromCharCode(dataView, start, length) {
	  var str = '';
	  var i = void 0;
	  length += start;
	  for (i = start; i < length; i += 1) {
	    str += fromCharCode(dataView.getUint8(i));
	  }
	  return str;
	}
	var _window = window,
	    btoa = _window.btoa;
	function arrayBufferToDataURL(arrayBuffer, mimeType) {
	  var uint8 = new Uint8Array(arrayBuffer);
	  var data = '';
	  if (typeof uint8.forEach === 'function') {
	    uint8.forEach(function (value) {
	      data += fromCharCode(value);
	    });
	  } else {
	    var length = uint8.length;
	    for (var i = 0; i < length; i += 1) {
	      data += fromCharCode(uint8[i]);
	    }
	  }
	  return 'data:' + mimeType + ';base64,' + btoa(data);
	}
	function getOrientation(arrayBuffer) {
	  var dataView = new DataView(arrayBuffer);
	  var orientation = void 0;
	  var littleEndian = void 0;
	  var app1Start = void 0;
	  var ifdStart = void 0;
	  if (dataView.getUint8(0) === 0xFF && dataView.getUint8(1) === 0xD8) {
	    var length = dataView.byteLength;
	    var offset = 2;

	    while (offset < length) {
	      if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
	        app1Start = offset;
	        break;
	      }

	      offset += 1;
	    }
	  }
	  if (app1Start) {
	    var exifIDCode = app1Start + 4;
	    var tiffOffset = app1Start + 10;
	    if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
	      var endianness = dataView.getUint16(tiffOffset);
	      littleEndian = endianness === 0x4949;
	      if (littleEndian || endianness === 0x4D4D /* bigEndian */) {
	          if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002A) {
	            var firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
	            if (firstIFDOffset >= 0x00000008) {
	              ifdStart = tiffOffset + firstIFDOffset;
	            }
	          }
	        }
	    }
	  }
	  if (ifdStart) {
	    var _length = dataView.getUint16(ifdStart, littleEndian);
	    var _offset = void 0;
	    var i = void 0;
	    for (i = 0; i < _length; i += 1) {
	      _offset = ifdStart + i * 12 + 2;
	      if (dataView.getUint16(_offset, littleEndian) === 0x0112) {
					_offset += 8;
					orientation = dataView.getUint16(_offset, littleEndian);
					dataView.setUint16(_offset, 1, littleEndian);
					break;
	      }
	    }
	  }
	  return orientation;
	}
	var REGEXP_DECIMALS = /\.\d*(?:0|9){12}\d*$/i;
	function normalizeDecimalNumber(value) {
	  var times = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100000000000;
	  return REGEXP_DECIMALS.test(value) ? Math.round(value * times) / times : value;
	}
	var classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};
	var createClass = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      Object.defineProperty(target, descriptor.key, descriptor);
	    }
	  }
	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();
	var _extends = Object.assign || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];

	    for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }
	  return target;
	};
	var _window$1 = window,
	    ArrayBuffer$1 = _window$1.ArrayBuffer,
	    FileReader = _window$1.FileReader;
	var URL = window.URL || window.webkitURL;
	var REGEXP_EXTENSION = /\.\w+$/;
	var ImageCompressor = function() {
	  function ImageCompressor(file, options) {
	    classCallCheck(this, ImageCompressor);

	    this.result = null;

	    if (file) {
	      this.compress(file, options);
	    }
	  }
	  createClass(ImageCompressor, [{
	    key: 'compress',
	    value: function compress(file, options) {
	      var _this = this;
	      var image = new Image();
	      options = _extends({}, DEFAULTS, options);
	      if (!ArrayBuffer$1) {
	        options.checkOrientation = false;
	      }
	      return new Promise(function (resolve, reject) {
	        if (!isBlob(file)) {
	          reject(new Error('The first argument must be a File or Blob object.'));
	          return;
	        }
	        var mimeType = file.type;
	        if (!isImageType(mimeType)) {
	          reject(new Error('The first argument must be an image File or Blob object.'));
	          return;
	        }
	        if (!URL && !FileReader) {
	          reject(new Error('The current browser does not support image compression.'));
	          return;
	        }
	        if (URL && !options.checkOrientation) {
	          resolve({
	            url: URL.createObjectURL(file)
	          });
	        } else if (FileReader) {
	          var reader = new FileReader();
	          var checkOrientation = options.checkOrientation && mimeType === 'image/jpeg';
	          reader.onload = function (_ref) {
	            var target = _ref.target;
	            var result = target.result;
	            resolve(checkOrientation ? _extends({
	              url: arrayBufferToDataURL(result, mimeType)
	            }) : {
	              url: result
	            });
	          };
	          reader.onabort = function () {
	            reject(new Error('Aborted to load the image with FileReader.'));
	          };
	          reader.onerror = function () {
	            reject(new Error('Failed to load the image with FileReader.'));
	          };
	          if (checkOrientation) {
	            reader.readAsArrayBuffer(file);
	          } else {
	            reader.readAsDataURL(file);
	          }
	        }
	      }).then(function (data) {
	        return new Promise(function (resolve, reject) {
	          image.onload = function () {
	            return resolve(_extends({}, data, {
	              naturalWidth: image.naturalWidth,
	              naturalHeight: image.naturalHeight
	            }));
	          };
	          image.onabort = function () {
	            reject(new Error('Aborted to load the image.'));
	          };
	          image.onerror = function () {
	            reject(new Error('Failed to load the image.'));
	          };
	          image.alt = file.name;
	          image.src = data.url;
	        });
	      }).then(function (_ref2) {
	        var naturalWidth = _ref2.naturalWidth,
	            naturalHeight = _ref2.naturalHeight,
	            _ref2$rotate = _ref2.rotate,
	            rotate = _ref2$rotate === undefined ? 0 : _ref2$rotate,
	            _ref2$scaleX = _ref2.scaleX,
	            scaleX = _ref2$scaleX === undefined ? 1 : _ref2$scaleX,
	            _ref2$scaleY = _ref2.scaleY,
	            scaleY = _ref2$scaleY === undefined ? 1 : _ref2$scaleY;
	        return new Promise(function (resolve) {
	          var canvas = document.createElement('canvas');
	          var context = canvas.getContext('2d');
	          var aspectRatio = naturalWidth / naturalHeight;
	          var maxWidth = Math.max(options.maxWidth, 0) || Infinity;
	          var maxHeight = Math.max(options.maxHeight, 0) || Infinity;
	          var minWidth = Math.max(options.minWidth, 0) || 0;
	          var minHeight = Math.max(options.minHeight, 0) || 0;
	          var width = naturalWidth;
	          var height = naturalHeight;
	          if (maxWidth < Infinity && maxHeight < Infinity) {
	            if (maxHeight * aspectRatio > maxWidth) {
	              maxHeight = maxWidth / aspectRatio;
	            } else {
	              maxWidth = maxHeight * aspectRatio;
	            }
	          } else if (maxWidth < Infinity) {
	            maxHeight = maxWidth / aspectRatio;
	          } else if (maxHeight < Infinity) {
	            maxWidth = maxHeight * aspectRatio;
	          }
	          if (minWidth > 0 && minHeight > 0) {
	            if (minHeight * aspectRatio > minWidth) {
	              minHeight = minWidth / aspectRatio;
	            } else {
	              minWidth = minHeight * aspectRatio;
	            }
	          } else if (minWidth > 0) {
	            minHeight = minWidth / aspectRatio;
	          } else if (minHeight > 0) {
	            minWidth = minHeight * aspectRatio;
	          }
	          if (options.width > 0) {
	            var _options = options;
	            width = _options.width;

	            height = width / aspectRatio;
	          } else if (options.height > 0) {
	            var _options2 = options;
	            height = _options2.height;
	            width = height * aspectRatio;
	          }
	          width = Math.min(Math.max(width, minWidth), maxWidth);
	          height = Math.min(Math.max(height, minHeight), maxHeight);
	          var destX = -width / 2;
	          var destY = -height / 2;
	          var destWidth = width;
	          var destHeight = height;
	          if (Math.abs(rotate) % 180 === 90) {
	            var _width$height = {
	              width: height,
	              height: width
	            };
	            width = _width$height.width;
	            height = _width$height.height;
	          }
	          canvas.width = normalizeDecimalNumber(width);
	          canvas.height = normalizeDecimalNumber(height);
	          if (!isImageType(options.mimeType)) {
	            options.mimeType = file.type;
	          }
	          var defaultFillStyle = 'transparent';
	          if (file.size > options.convertSize && options.mimeType === 'image/png') {
	            defaultFillStyle = '#fff';
	            options.mimeType = 'image/jpeg';
	          }
	          context.fillStyle = defaultFillStyle;
	          context.fillRect(0, 0, width, height);
	          context.save();
	          context.translate(width / 2, height / 2);
	          context.rotate(rotate * Math.PI / 180);
	          context.scale(scaleX, scaleY);
	          if (options.beforeDraw) {
	            options.beforeDraw.call(_this, context, canvas);
	          }
	          context.drawImage(image, Math.floor(normalizeDecimalNumber(destX)), Math.floor(normalizeDecimalNumber(destY)), Math.floor(normalizeDecimalNumber(destWidth)), Math.floor(normalizeDecimalNumber(destHeight)));
	          if (options.drew) {
	            options.drew.call(_this, context, canvas);
	          }
	          context.restore();
	          var done = function done(result) {
	            resolve({
	              naturalWidth: naturalWidth,
	              naturalHeight: naturalHeight,
	              result: result
	            });
	          };
	          if (canvas.toBlob) {
	            canvas.toBlob(done, options.mimeType, options.quality);
	          } else {
	            done(canvasToBlob(canvas.toDataURL(options.mimeType, options.quality)));
	          }
	        });
	      }).then(function (_ref3) {
	        var naturalWidth = _ref3.naturalWidth,
	            naturalHeight = _ref3.naturalHeight,
	            result = _ref3.result;

	        if (URL && !options.checkOrientation) {
	          URL.revokeObjectURL(image.src);
	        }
	        if (result) {
	          if (result.size > file.size && options.mimeType === file.type && !(options.width > naturalWidth || options.height > naturalHeight || options.minWidth > naturalWidth || options.minHeight > naturalHeight)) {
	            result = file;
	          } else {
	            var date = new Date();
	            result.lastModified = date.getTime();
	            result.lastModifiedDate = date;
	            result.name = file.name;
	            if (result.name && result.type !== file.type) {
	              result.name = result.name.replace(REGEXP_EXTENSION, imageTypeToExtension(result.type));
	            }
	          }
	        } else {
	          result = file;
	        }
	        _this.result = result;
	        if (options.success) {
	          options.success.call(_this, result);
	        }
	        return Promise.resolve(result);
	      }).catch(function (err) {
	        if (!options.error) {
	          throw err;
	        }
	        options.error.call(_this, err);
	      });
	    }
	  }]);
	  return ImageCompressor;
	}();
	return ImageCompressor;
})));
