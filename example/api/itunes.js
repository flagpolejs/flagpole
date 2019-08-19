let Flagpole = require('../../dist/index.js').Flagpole;

const trackSchema = {
    resultCount:  "number",
    results: {
        type: "array",
        items: {
            wrapperType: {
                type: "string",
                enum: ["track"],
                matches: /track/i
            },
            kind: {
                type: "string",
                test: function (value) {
                    return value == 'music-video'
                }
            },
            artistId: "number",
            trackId: "number",
            artistName: "string",
            trackName: "string",
            trackCensoredName: "string",
            artistViewUrl: "string",
            trackViewUrl: "string",
            previewUrl: "string",
            artworkUrl30: "string",
            artworkUrl60: "string",
            artworkUrl100: "string",
            trackPrice: "number",
            releaseDate: "string",
            trackExplicitness: "string",
            trackTimeMillis: "number",
            country: "string",
            currency: "string",
            primaryGenreName: "string",
            discCount: {
                type: "number",
                optional: true
            },
            discNumber: {
                type: "number",
                optional: true
            },
            trackCount: {
                type: "number",
                optional: true
            },
            trackNumber: {
                type: "number",
                optional: true
            },
            collectionId: {
                type: "number",
                optional: true
            },
            collectionName: {
                type: "string",
                optional: true
            },
            collectionCensoredName: {
                type: "string",
                optional: true
            },
            collectionArtistId: {
                type: "number",
                optional: true
            },
            collectionViewUrl: {
                type: "string",
                optional: true
            },
            collectionPrice: {
                type: "number",
                optional: true
            },
            collectionExplicitness: {
                type: "string",
                optional: true
            }
        }
    }
};


let suite = Flagpole.Suite('Test iTunes API')
    .base('https://itunes.apple.com')
    .finally(() => { suite.print(); });

suite.json('Search for Tupac').open('/search?term=2pac&entity=musicVideo')
    .next('Check response code and headers', function () {
        this.assert('HTTP Status is 200', this.response.statusCode).equals(200);
        this.assert(this.response.header('Content-Type')).contains('text/javascript');
        this.assert('Response body is greater than 0', this.response.length).greaterThan(0);
        this.assert('Schema is valid', this.response.jsonBody).schema(trackSchema);
    })
    .next('Verify the data', async function () {
        const resultCount = await this.find('resultCount');
        const searchResults = await this.find('results');
        this.assert(searchResults).type.equals('array');
        this.assert(searchResults.length).greaterThan(0);
        this.comment(searchResults.length);
        this.comment((searchResults.length > 0));
        this.assert(resultCount).greaterThan(0);
        this.assert('Results Count field matches results length', resultCount)
            .equals(searchResults.length);
        this.assert('Every result is a music video', searchResults)
            .every(result => { return result['kind'] == 'music-video'; });
        this.assert('No items are books', searchResults)
            .none(result => { return result['wrapperType'] == 'book'; });
        this.assert('Some tracks are clean version', searchResults)
            .some(result => { return result['trackExplicitness'] == 'notExplicit'; });
        return searchResults;
    })
    .next('Verify first track looks right', async function () {
        const searchResults = await this.result;
        const firstTrack = searchResults.$[0];
        this.assert('Track millimeters value is a number', firstTrack.trackTimeMillis)
            .type.equals('number');
        this.assert('Track number is between 1 and number of tracks', firstTrack.trackNumber)
            .between(1, firstTrack.trackCount);
    });