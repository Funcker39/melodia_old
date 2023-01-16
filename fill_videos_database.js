const { MongoClient } = require('mongodb');
const search = require('youtube-search')
const search_data = require('./search_data.json')
const config = require('./config.json')

async function fill_database() {
  const client = new MongoClient(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  console.log('Successfully connected to the Mongo server')
  
  
  for (const type of search_data.types) {
    const collection = client.db("youtube_videos").collection(type);
  
    const videos = []
    let opts = {
      maxResults: 100,
      type: 'video',
      key: config.YT_API_KEY
    }
    search_data.beatmakers.forEach(
      beatmaker => {
        console.log(beatmaker.name)
        beatmaker.types.some(
          _type => {
            const typeName = _type.name
            if (typeName === type) {
              console.log('same type')
              opts.channelId = beatmaker.id;
              search(
                _type.keywords.length > 0 ? _type.keywords[getRandomInt(_type.keywords.length)] : _type,
                opts,
                (err, res) => {
                  if (err) {
                    return console.log(err);
                  }
  
                  console.log("Found: ", res)
                  res.forEach(
                    video => {
                      const storedVideo = {
                        "title": video.title,
                        "channelTitle": video.channelTitle,
                        "link": video.link,
                        "id": video.id
                      };
                      //videos.push(storedVideo);

                      collection.insertOne(
                        storedVideo,
                        () => {
                          console.log("Added: ", storedVideo)
                        }
                      );
                    }
                  )
                }
              );
  
              return true;
            }
          }
        )
      },
      
    )
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

fill_database().then(() => console.log("Fonction terminée"))

