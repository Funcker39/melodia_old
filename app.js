const http = require('http')
const fs = require('fs')
const stream = require('youtube-audio-stream')
const url = require('url')
const config = require('./config.json')
const search_data = require('./search_data.json')
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000


const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`)
  console.log(req.url)

  switch (pathname) {
    case '/':
      res.writeHead(200, { 'Content-Type': 'text/html' })
      fs.readFile('index.html', (err, data) => {
        if (err) {
          res.writeHead(404)
          res.write('Error: File Not Found')
        } else {
          res.write(data)
          res.end()
        }
      })
      break;
    case '/audio':
      handleAudioReq(req, res)
      break;
    case '/beat':
      handleBeatReq(req, res)
      break;
  }
})

// function handleBeatReq(req, res) {
//   const searchParams = (new URL(req.url, `http://${req.headers.host}`)).searchParams
//   const type = searchParams.get('type')

//   if (!type) {
//     console.log('Error: No video type specified')
//     res.writeHead(400)
//     res.end('Error: No video type specified')
//     return
//   }

//   res.writeHead(200, {
//     'Content-Type': 'application/json',
//   })

//   let searchText = ' type beat'
//   let findBeatmaker = true;
//   switch (type) {
//     case 'old-school':
//       searchText = 'old school'
//       break;
//     case 'drill':
//       searchText = 'drill'
//       break;
//     case 'melodic':
//       searchText = 'melodic'
//       break;
//     default:
//       findBeatmaker = false
//       searchText = type + searchText
//       break;
//   }

//   let opts = {}
//   if (findBeatmaker) {
//     const beatmakersObj = beatmakers
//     let channelIds = []

//     beatmakersObj.list.forEach(beatmaker => {
//       if (beatmaker.types.includes(type))
//         channelIds.push(beatmaker.id)
//     })
//     console.log(channelIds)

//     opts = {
//       maxResults: 100,
//       type: 'video',
//       channelId: channelIds[getRandomInt(channelIds.length)],
//       key: config.YT_API_KEY
//     }
//   } else {
//     opts = {
//       maxResults: 100,
//       type: 'video',
//       key: config.YT_API_KEY
//     }
//   }

//   search(searchText, opts, (err, results) => {
//     if (err) {
//       res.writeHead(500)
//       res.end()
//       return console.log(err)
//     }

//     const beatSelected = results[getRandomInt(results.length)]
//     console.log('\n', beatSelected.title, '\n', beatSelected.channelTitle, '\n', beatSelected.link)
//     res.write(JSON.stringify(beatSelected))
//     res.end()
//   })

// }

function handleBeatReq(req, res) {
  const searchParams = (new URL(req.url, `http://${req.headers.host}`)).searchParams
  const type = searchParams.get('type')

  if (!type) {
    console.log('Error: No video type specified')
    res.writeHead(400)
    res.end('Error: No video type specified')
    return
  }

  res.writeHead(200, {
    'Content-Type': 'application/json',
  })

  let videos = []

  const client = new MongoClient(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  client.connect(err => {
    if (err) {
      res.writeHead(500)
      res.end()
      return console.log(err)
    }

    const db = client.db("youtube_videos");

    db.collections((error, results) => {
      if (error) {
        res.writeHead(500)
        res.end() 
        return console.log(error)
      }

      let collection;
      results.some(collec => {
        if (collec.collectionName === type) {
          collection = collec;
          return true;
        }
      }) ? null : collection = results[getRandomInt(results.length)];

      const cursor = collection.find()

      cursor.forEach(e => videos.push(e), () => {
        const beatSelected = videos[getRandomInt(videos.length)]
        console.log('\n', beatSelected.title, '\n', beatSelected.channelTitle, '\n', beatSelected.link)
        res.write(JSON.stringify(beatSelected))
        res.end()
      })

    })

    
  });
}

async function handleAudioReq(req, res) {
  const searchParams = (new URL(req.url, `http://${req.headers.host}`)).searchParams
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    console.log('Error: No video ID specified')
    res.writeHead(400)
    res.end('Error: No video ID specified')
    return
  }

  res.writeHead(200, {
    "Content-Type": "audio/mpeg",
    'Transfer-Encoding': 'chunked'
  })
  
  try {
    for await (const chunk of stream(`http://youtube.com/watch?v=${videoId}`)) {
      res.write(chunk)
    }
    res.end()
  } catch (err) {
    console.error(err)
    if (!res.headersSent) {
      res.writeHead(500)
      res.end('Internal System Error')
    }
  }
}

server.listen(port, (err) => {
  if (err) {
    console.log('Something went wrong:', err)
  } else {
    console.log('Server is listening on port', port)
  }
})

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}