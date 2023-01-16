const search = require('youtube-search')

var opts = {
    maxResults: 2,
    key: 'AIzaSyD6boKlDTkZshNFwlb0ubvIphWfxc4pNTQ'
}

search('test', opts, (err, results) => {
    if(err) return console.log(err);

    console.dir(results);
})