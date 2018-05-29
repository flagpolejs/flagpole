let Flagpole = require('../../dist/index.js').Flagpole;

Flagpole.Suite('iTunes API Tests')
    .base('https://itunes.apple.com')

    .Scenario('See if there are any 2Pac Videos')
    .open('/search?term=2pac&entity=musicVideo').type('json')
    .assertions(function(test) {

        test.status().equals('200');
        test.headers('Content-Type').contains('text/javascript');

        var resultCount = test.select('resultCount');
        var results = test.select('results');
        var firstTrack = results.first();

        resultCount.is('number');
        resultCount.greaterThan(0);
        results.is('array');
        results.length().equals(resultCount.get());
        firstTrack.property('wrapperType').equals('track');
        firstTrack.property('artworkUrl100').matches(/mzstatic\.com.+100x100bb\.jpg$/);

        test.comment('Loop through each result element');
        results.each(function(test) {
                test.property('trackId').is('number');
                test.property('kind').equals('music-video');
        });

    });

