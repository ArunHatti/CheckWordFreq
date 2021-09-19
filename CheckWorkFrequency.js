var request = require('request');
var apiKey = "dict.1.1.20210216T114936Z.e4989dccd61b9626.373cddfbfb8a3b2ff30a03392b4e0b076f14cff9";

fetchDataFromNorvig();
//get content of http://norvig.com/big.txt on var using request
function fetchDataFromNorvig() {
    request('http://norvig.com/big.txt', (error, response, body) => {
        console.error('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received    
        //console.log('body:', body); // Print the HTML for the Google homepage.

        var fileContents = body;
        getWordsAndFreqs(fileContents, 10).then(function (outputJson) {
            console.log(JSON.stringify(outputJson));
        }, function (error) {
            console.error(error);
        });
    
    }, 
    function (error) {
        console.error(error);
    });
}
//Get word details using API 
function getWordDetails(wordElement) {
    return new Promise(function (resolve, reject) {
        request('https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=' + apiKey + '&lang=en-en&text=' + wordElement, (err, res, body) => {
            if (err) {
                reject(err);
            }
            resolve(body);
        });
    });
}
 
//find words and thier frequencies. wordfreqs
function getWordsAndFreqs(string, topwords) {
    return new Promise(function (resolve, reject) {
        var cleanString = string.replace(/[.,-/#!$%^&*;:{}=\-_`~()]/g, ""),
        words = cleanString.split(' '),
        wordFreqs = {},
        word, i;
 
        //to filter all empty strings from the array
        words = words.filter(entry => /\S/.test(entry)); 
        for (i = 0; i < words.length; i++) {
            word = words[i];
            wordFreqs[word] = wordFreqs[word] || 0;
            wordFreqs[word]++;
        }
 
        words = Object.keys(wordFreqs);
        
        //sort the array of all the words based of frequencies and get slice of top 10
        var topWordArray = words.sort(function (a, b) {
            return wordFreqs[b] - wordFreqs[a];
        }).slice(0, topwords);
 
        //get details of top words. 
        var returnArray = [];
        var apisToBeCalled = topWordArray.length;
        topWordArray.forEach(word => {
            var wordDetailsApi = getWordDetails(word);
            wordDetailsApi.then(function (wordDetails) {
                wordDetails = JSON.parse(wordDetails);
                var JsonObj = {
                    "count": wordFreqs[word]
                };
                if (wordDetails.def[0]) {
                    if ("syn" in wordDetails.def[0]) {
                        JsonObj.synonyms = wordDetails.def[0].syn;
                    } else {
                        if ("mean" in wordDetails.def[0]) {
                            JsonObj.synonyms = wordDetails.def[0].mean;
                        } 
                        else {
                            JsonObj.synonyms = "No Synonyms found";
                        }
                    }
                    if ("pos" in wordDetails.def[0]) {
                         JsonObj.pos = wordDetails.def[0].pos;
                    } else {
                    JsonObj.pos = "No Part of speech found";
                    }
                } else {
                    JsonObj.synonyms = "No Synonyms found";
                    JsonObj.pos = "No Part of speech found";
                }
 
                returnArray.push({
                    "word": word,
                    "output": JsonObj
                });
                apisToBeCalled--;
                if (apisToBeCalled === 0) {
                    returnArray = returnArray.sort(function (a, b) {
                        return b.output.count - a.output.count
                    })
                    var returnJson = {
                        "topwords": returnArray
                    };
                resolve(returnJson);
                }
            }, function (err) {
                console.error(err);
                reject(err);
            });
        });
    });
}