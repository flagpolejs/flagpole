let Flagpole = require('../../dist/index.js').Flagpole;

process.exit(1);

Flagpole.Suite('API Tests')
    .base('https://stats.nba.com/stats')

    .Scenario('Test Scoreboard End Point')
    .type('json')
    .header('Referer', 'http://stats.nba.com/scores/')
    .header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36')
    .header('Cookie', 'ak_bmsc=C63180407DCB696FAFD098CAA0E5745448F64171352A0000FA75075B76973975~plkuGD8TFLI+gHTHsueIQ7zEXIn5/aWvF6QY1oP2yUV4IylfKiXnnxqooe1Sqv15DMzDrl/d5Qg8NSCTVpCqSGoDOJBJDtNGCdMNDx2/kjmmHehFWxu20wl6I1se1TYnlS4VVpG1YfPhLbeoxRDfWw3tOr1CoUa/kQfyQpO8sGNuMX6eGE/jwVz5+eVLqvY0pWcq3JzQZVYz7IG53iqlJYMdre954pkIHd7BysHUutzmI=; _ga=GA1.2.209622451.1527215613; _gid=GA1.2.1209842759.1527215613; check=true; ug=564824060e9d700a3c8ef142c407a4b6; ugs=1; mbox=session#92eee28c83e046f2836c7398d7808e0a#1527217474|PC#92eee28c83e046f2836c7398d7808e0a.17_34#1590460414; s_cc=true; s_fid=2E4503ABC910218A-25DD120D58A49413; s_sq=%5B%5BB%5D%5D; bm_sv=E128C6FD84C57A8FD89E066C16E1BD0F~G8kwbEIio+Dn+IEA4McSCBqt+dV32VZJdyD72WJwd71swx9ok1cXGDrjeuAhBI1MTMwY4e1WbAs4pU9BJ5ifypasouqIhn5FjVabaSMLlK1O6ErsQNsKWBQDrzYlFqxwtH9+pFn3bpeQoHTLKPOfbA==')
    .open('/scoreboard/?GameDate=05/24/2018&LeagueID=00&DayOffset=0')
    .assertions(function(test) {
        test.status().equals('200');
        test.headers('Content-Type').contains('application/json');
        test.headers('Server').echo();
        test.select('parameters').property('LeagueID').equals('00');
        test.select('resultSets')
            .and().is('array')
            .and().length().greaterThan(0)
            .and().first().find('name').similarTo('GameHeader');

    });

