const program = require('commander');
const client = require('./client');
const flattenArray = require('flatten-array');
const csvStringify = require('csv-stringify');
const fs = require('fs');

program
  .version('0.1.0')
  .option('-t, --token [token]', 'Github token')
  .option('-l, --languages [languages]', 'List of languages')
  .option('-o, --output [path]', 'Output path for the CSV')
  .parse(process.argv);

if(program.token){
    client.authenticate({
        type: 'token',
        token: program.token
    });
}

const query = 'created:2018-06-06..* language:javascript stars:>0'


const getTrendingRepos = function(){
    client.search
        .repos({q: query, sort: "stars", order: "desc"})
        .then((result) => {
            return Promise.all(result.data.items.map((item) =>{
                return client.activity.getStargazersForRepo({
                    owner: item.owner.login,
                    repo: item.name
                });
            }));
        })
        .then((stargazers) => {
            return flattenArray(stargazers.map((stargazer) => {
                return stargazer.data;
            }));
        })
        .then((users) => {
            return users.map((user) => {
                return {
                        login: user.user.login,
                        git_url: user.user.html_url
                };
            });
        }).then((users) => {
            csvStringify(users, (err, output) => {
                if(err) throw err;
                fs.writeFile("users.csv", output,(err) =>{
                    if (err) throw err;
                    console.log('Le fichier a été sauvegardé !');
                });
            });
        })
        .catch((err) => {
            console.error(err);
        });
}

getTrendingRepos();
