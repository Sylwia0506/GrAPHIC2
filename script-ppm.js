(() => {	
	const Image = function(data) {
		const exp = /^(\S+)\s+(\#.*?\n)*\s*(\d+)\s+(\d+)\s+(\d+)?\s*/;
		let match = data.match(exp);
		if (match) {
			const width = this.width = parseInt (match[3], 10),
				height = this.height = parseInt (match[4], 10),
				maxVal = parseInt (match[5], 10),
				bytes = (maxVal < 256)? 1 : 2;
			data = data.substr (match[0].length);
			switch (match[1]) {
				case 'P3':
					this._parser = new ASCIIParser (data, bytes);
					this._formatter = new PPMFormatter (width, height, maxVal);
					break;
				case 'P6':
					this._parser = new BinaryParser (data, bytes);
					this._formatter = new PPMFormatter (width, height, maxVal);
					break;
				default:
					throw new TypeError ('Sorry, your file format is not supported. [' + match[1] + ']');
			}
		} else {
			data = data.split("\n");
			console.log(data);
			data = data.filter(line => line.charAt(0) !== "#");
			data = data.map(line => line.split("#")[0].trim());
			data = data.filter(line => line.length !== 0);
			data = data.join("\n");
			match = data.match(exp);
			if (match) {
				const width = this.width = parseInt (match[3], 10),
					height = this.height = parseInt (match[4], 10),
					maxVal = parseInt (match[5], 10),
					bytes = (maxVal < 256)? 1 : 2;
				data = data.substr (match[0].length);
				switch (match[1]) {
					case 'P3':
						this._parser = new ASCIIParser (data, bytes);
						this._formatter = new PPMFormatter (width, height, maxVal);
						break;
					case 'P6':
						this._parser = new BinaryParser (data, bytes);
						this._formatter = new PPMFormatter (width, height, maxVal);
						break;
					default:
						throw new TypeError ('Sorry, your file format is not supported. [' + match[1] + ']');
				}
			} else {
				throw new TypeError ('Sorry, file does not appear to be a Netpbm file.');
			}
		}
	};
	
	
	Image.prototype.getPNG = function() {
		const canvas = this._formatter.getCanvas (this._parser);
		return Canvas2Image.saveAsPNG (canvas, true);
	};
	

	
	
	BinaryParser = function(data, bytes) {
		this._data = data;
		this._bytes = bytes;
		this._pointer = 0;
	};
	
	
	BinaryParser.prototype.getNextSample = function() {
		if (this._pointer >= this._data.length) return false;

		let val = 0;
		for (let i = 0; i < this._bytes; i++) {
			val = val * 255 + this._data.charCodeAt (this._pointer++);
		}

		return val;
	};
	

	
	
	ASCIIParser = function(data, bytes) {
		this._data = data.split (/\s+/);
		this._bytes = bytes;
		this._pointer = 0;
	};
	
	
	ASCIIParser.prototype.getNextSample = function() {
		if (this._pointer >= this._data.length) return false;
		
		let val = 0;
		for (let i = 0; i < this._bytes; i++) {
			val = val * 255 + parseInt (this._data[this._pointer++], 10);
		}

		return val;
	};
	
	
	
	PPMFormatter = function(width, height, maxVal) {
		this._width = width;
		this._height = height;
		this._maxVal = maxVal;
	};


	PPMFormatter.prototype.getCanvas = function(parser) {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		canvas.width = context.width = this._width;
		canvas.height = context.height = this._height;
		const img = context.getImageData(0, 0, this._width, this._height);
		for (let row = 0; row < this._height; row++) {
			for (let col = 0; col < this._width; col++) {
				const factor = 255 / this._maxVal;
				const r = factor * parser.getNextSample();
				const g = factor * parser.getNextSample();
				const b = factor * parser.getNextSample();
				const position = (row * this._width + col) * 4;
				img.data[position] = r;
				img.data[position + 1] = g;
				img.data[position + 2] = b;
				img.data[position + 3] = 255;
			}	
		}
		context.putImageData(img, 0, 0);
		return canvas;
	};




	PGMFormatter = function(width, height, maxVal) {
		this._width = width;
		this._height = height;
		this._maxVal = maxVal;
	};


	PGMFormatter.prototype.getCanvas = function(parser) {
		const canvas = document.createElement ("canvas");
		const context = canvas.getContext ("2d");
		canvas.width = context.width = this._width;
		canvas.height = context.height = this._height;
		const img = context.getImageData (0, 0, this._width, this._height);
		for (let row = 0; row < this._height; row++) {
			for (let col = 0; col < this._width; col++) {
				const d = parser.getNextSample () * (255 / this._maxVal);
				const position = (row * this._width + col) * 4;
				img.data[position] = d;
				img.data[position + 1] = d;
				img.data[position + 2] = d;
				img.data[position + 3] = 255;
			}	
		}
		context.putImageData(img, 0, 0);
		return canvas;
	};

	


	PBMFormatter = function(width, height) {
		this._width = width;
		this._height = height;
	};


	PBMFormatter.prototype.getCanvas = function(parser) {
		const canvas = document.createElement ("canvas");
		const context = canvas.getContext ("2d");
		
		if (parser instanceof BinaryParser) {
			const data = '';
			const bytesPerLine = Math.ceil (this._width / 8);
			let byte;

			for (let i = 0; i < this._height; i++) {
				const line = parser._data.substr (i * bytesPerLine, bytesPerLine),
					lineData = '';

				for (const j = 0; j < line.length; j++) lineData += ('0000000' + line.charCodeAt (j).toString (2)).substr (-8);
				data += lineData.substr (0, this._width);
			}
								
			while ((byte = (parser.getNextSample ())) !== false) {
				data += ('0000000' + byte.toString (2)).substr (-8);
			}

			parser = new ASCIIParser (data.split ('').join (' '), 1);
		}
		
		canvas.width = context.width = this._width;
		canvas.height = context.height = this._height;

		const img = context.getImageData(0, 0, this._width, this._height);

		for (let row = 0; row < this._height; row++) {
			for (let col = 0; col < this._width; col++) {
				
				const d = (1 - parser.getNextSample ()) * 255,
					pos = (row * this._width + col) * 4;
				img.data[pos] = d;
				img.data[pos + 1] = d;
				img.data[pos + 2] = d;
				img.data[pos + 3] = 255;
			}	
		}

		context.putImageData (img, 0, 0);
		return canvas;
	};

	


	


	
	const landingZone = document.getElementById ('landing-zone'),
		imageList = document.getElementById ('image-list'),
		holder = document.getElementById ('holder');
	

	landingZone.ondragover = function(e) {
		e.preventDefault ();
		return false;	
	};

	
	landingZone.ondrop = function(e) {
		e.preventDefault ();
		
		let outstanding = 0,
			checkOutstanding = function() {
				if (!outstanding) $(landingZone).removeClass ('busy');
			};
			
		$(landingZone).addClass ('busy');
		
		
		for (let i = 0, l = e.dataTransfer.files.length; i < l; i++) {
			outstanding++;
			
			const file = e.dataTransfer.files[i],
				reader = new FileReader();
	
			reader.onload = function(event) {
				const data = event.target.result;
				try {
					const img = new Image (data);
					addImage(img);

				} catch(e) {
					alert(e.message);
				}
			
				outstanding--;
				checkOutstanding ();
			};
		
			reader.readAsBinaryString (file);
		}
				
		return false;
	};




	const addImage = img => {
		const height = img.height;
		const png = img.getPNG();
		$(png).height(0).css({
			left: '-25px'
		}).animate({
			top: (-height / 2) + 'px',
			left: '25px',
			height: height + 'px'
		}); 
		$('<li>').append(png).prependTo(imageList);
	};
})();



const Canvas2Image = (function() {

	// check if we have canvas support
	let bHasCanvas = false;
	const oCanvas = document.createElement("canvas");
	if (oCanvas.getContext("2d")) {
		bHasCanvas = true;
	}

	// no canvas, bail out.
	if (!bHasCanvas) {
		return {
			saveAsBMP : function(){},
			saveAsPNG : function(){},
			saveAsJPEG : function(){}
		}
	}

	const bHasImageData = !!(oCanvas.getContext("2d").getImageData);
	const bHasDataURL = !!(oCanvas.toDataURL);
	const bHasBase64 = !!(window.btoa);

	const strDownloadMime = "image/octet-stream";

	// ok, we're good
	const readCanvasData = function(oCanvas) {
		const iWidth = parseInt(oCanvas.width);
		const iHeight = parseInt(oCanvas.height);
		return oCanvas.getContext("2d").getImageData(0,0,iWidth,iHeight);
	}

	// base64 encodes either a string or an array of charcodes
	const encodeData = function(data) {
		const strData = "";
		if (typeof data == "string") {
			strData = data;
		} else {
			const aData = data;
			for (const i=0;i<aData.length;i++) {
				strData += String.fromCharCode(aData[i]);
			}
		}
		return btoa(strData);
	}

	// creates a base64 encoded string containing BMP data
	// takes an imagedata object as argument
	const createBMP = function(oData) {
		const aHeader = [];
	
		const iWidth = oData.width;
		const iHeight = oData.height;

		aHeader.push(0x42); // magic 1
		aHeader.push(0x4D); 
	
		const iFileSize = iWidth*iHeight*3 + 54; // total header size = 54 bytes
		aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
		aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
		aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
		aHeader.push(iFileSize % 256);

		aHeader.push(0); // reserved
		aHeader.push(0);
		aHeader.push(0); // reserved
		aHeader.push(0);

		aHeader.push(54); // dataoffset
		aHeader.push(0);
		aHeader.push(0);
		aHeader.push(0);

		const aInfoHeader = [];
		aInfoHeader.push(40); // info header size
		aInfoHeader.push(0);
		aInfoHeader.push(0);
		aInfoHeader.push(0);

		const iImageWidth = iWidth;
		aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
		aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
		aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
		aInfoHeader.push(iImageWidth % 256);
	
		const iImageHeight = iHeight;
		aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
		aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
		aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
		aInfoHeader.push(iImageHeight % 256);
	
		aInfoHeader.push(1); // num of planes
		aInfoHeader.push(0);
	
		aInfoHeader.push(24); // num of bits per pixel
		aInfoHeader.push(0);
	
		aInfoHeader.push(0); // compression = none
		aInfoHeader.push(0);
		aInfoHeader.push(0);
		aInfoHeader.push(0);
	
		const iDataSize = iWidth*iHeight*3; 
		aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
		aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
		aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
		aInfoHeader.push(iDataSize % 256); 
	
		for (const i=0;i<16;i++) {
			aInfoHeader.push(0);	// these bytes not used
		}
	
		const iPadding = (4 - ((iWidth * 3) % 4)) % 4;

		const aImgData = oData.data;

		const strPixelData = "";
		const y = iHeight;
		do {
			const iOffsetY = iWidth*(y-1)*4;
			const strPixelRow = "";
			for (const x=0;x<iWidth;x++) {
				const iOffsetX = 4*x;

				strPixelRow += String.fromCharCode(aImgData[iOffsetY+iOffsetX+2]);
				strPixelRow += String.fromCharCode(aImgData[iOffsetY+iOffsetX+1]);
				strPixelRow += String.fromCharCode(aImgData[iOffsetY+iOffsetX]);
			}
			for (const c=0;c<iPadding;c++) {
				strPixelRow += String.fromCharCode(0);
			}
			strPixelData += strPixelRow;
		} while (--y);

		const strEncoded = encodeData(aHeader.concat(aInfoHeader)) + encodeData(strPixelData);

		return strEncoded;
	}


	// sends the generated file to the client
	const saveFile = function(strData) {
		document.location.href = strData;
	}

	const makeDataURI = function(strData, strMime) {
		return "data:" + strMime + ";base64," + strData;
	}

	// generates a <img> object containing the imagedata
	const makeImageObject = function(strSource) {
		const oImgElement = document.createElement("img");
		oImgElement.src = strSource;
		return oImgElement;
	}

	const scaleCanvas = function(oCanvas, iWidth, iHeight) {
		if (iWidth && iHeight) {
			const oSaveCanvas = document.createElement("canvas");
			oSaveCanvas.width = iWidth;
			oSaveCanvas.height = iHeight;
			oSaveCanvas.style.width = iWidth+"px";
			oSaveCanvas.style.height = iHeight+"px";

			const oSavecontext = oSaveCanvas.getContext("2d");

			oSavecontext.drawImage(oCanvas, 0, 0, oCanvas.width, oCanvas.height, 0, 0, iWidth, iHeight);
			return oSaveCanvas;
		}
		return oCanvas;
	}

	return {

		saveAsPNG : function(oCanvas, bReturnImg, iWidth, iHeight) {
			if (!bHasDataURL) {
				return false;
			}
			const oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);
			const strData = oScaledCanvas.toDataURL("image/png");
			if (bReturnImg) {
				return makeImageObject(strData);
			} else {
				saveFile(strData.replace("image/png", strDownloadMime));
			}
			return true;
		},

		saveAsJPEG : function(oCanvas, bReturnImg, iWidth, iHeight) {
			if (!bHasDataURL) {
				return false;
			}

			const oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);
			const strMime = "image/jpeg";
			const strData = oScaledCanvas.toDataURL(strMime);
	
			// check if browser actually supports jpeg by looking for the mime type in the data uri.
			// if not, return false
			if (strData.indexOf(strMime) != 5) {
				return false;
			}

			if (bReturnImg) {
				return makeImageObject(strData);
			} else {
				saveFile(strData.replace(strMime, strDownloadMime));
			}
			return true;
		},

		saveAsBMP : function(oCanvas, bReturnImg, iWidth, iHeight) {
			if (!(bHasImageData && bHasBase64)) {
				return false;
			}

			const oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);

			const oData = readCanvasData(oScaledCanvas);
			const strImgData = createBMP(oData);
			if (bReturnImg) {
				return makeImageObject(makeDataURI(strImgData, "image/bmp"));
			} else {
				saveFile(makeDataURI(strImgData, strDownloadMime));
			}
			return true;
		}
	};

})();