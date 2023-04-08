# xmp-reader
Extracts XMP data from buffers or files.

A breaking change fork of `https://github.com/shkuznetsov/xmp-reader`. This is meant to be more general.

## Usage

To install the module add it to your project's ``package.json`` dependencies or install manually running:
```
npm install https://github.com/fromkeith/xmp-reader
```

Then pull it in your code:
```javascript
const xmpReader = require('xmp-reader');
```

Now you can either feed it a file name:
```javascript
const data = await xmpReader.fromFile('/path/to/file.jpg');
```

Or a buffer, eg from Sharp:
```javascript
const metadata = await sharp('/path/to/file.jpg').metadata();
const data = await xmpReader.fromBuffer(metadata.xmp);
```


Output will look something like that, depending on your metadata:
```javascript
{
	"raw": ..., // raw XML data
	// list of XMP objects.
	"xmp": [
	    {
	        "MicrosoftPhoto":
	        {
	            "Rating": 50
	        }
	    },
	    {
	        "dc":
	        {
	            "description": "Title",
	            "subject":
	            [
	                "tag1",
	                "tag2"
	            ],
	            "title": "Title"
	        }
	    },
	    {
	        "MicrosoftPhoto":
	        {
	            "LastKeywordXMP":
	            [
	                "tag1",
	                "tag2"
	            ]
	        }
	    },
	    {
	        "xmp":
	        {
	            "Rating": 3
	        }
	    }
	]
}
```

Results can also be flattened for easier access. This merges together all the similar objects.

```javascript
xmpReader.flatten(data.xmp)
// returns
{
	"dc": {
		"description": "Title",
		"subject":
		[
		    "tag1",
		    "tag2"
		],
		"title": "Title"
	},
	"MicrosoftPhoto": {
		"Rating": 50,
		"LastKeywordXMP": [
        "tag1",
        "tag2"
    ]
	},
	"xmp":
	{
	    "Rating": 3
	}
}
```


## License
[MIT License](http://en.wikipedia.org/wiki/MIT_License)