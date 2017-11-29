const jsonServer = require('json-server')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const auth = {
  username: process.env.USERNAME || 'test',
  password: process.env.PASSWORD || 'test'
}

const server = jsonServer.create()
const router = jsonServer.router('../inventoryDB.json')
const middlewares = jsonServer.defaults({
  static: path.join(process.cwd(), 'public/')
})

server.use(middlewares)
server.use(cookieParser())
server.use(bodyParser.json())

server.post('/login', (req, res) => {
  if (
    req.body && req.body.username && req.body.password &&
    req.body.username === auth.username &&
    req.body.password === auth.password
  ) {
    const token = new Buffer(auth.username + ':' + auth.password).toString('base64')
    res.status(200).json({ token })
  } else {
    res.sendStatus(401)
  }
})

server.use('/api', isAuthorized, router)

server.listen(3000, () => {
  console.log('Listening in port 3000')
})

function isAuthorized (req, res, next) {
  if (req.headers.authorization) {    
      const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
      const [username, password] = new Buffer(b64auth, 'base64').toString().split(':')
    
      // Verify username and password are set and correct
      if (!username || !password ||
        username !== auth.username ||
        password !== auth.password) {
        res.set('WWW-Authenticate', 'Basic realm="nope"') // change this
        res.status(401).send('You shall not pass.') // custom message
        return
      }
    next()
  } else {
    res.sendStatus(401)
  }
}
