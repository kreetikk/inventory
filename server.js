const jsonServer = require('json-server')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const auth = {
  login: process.env.LOGIN || 'test',
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
    req.body && req.body.login && req.body.password &&
    req.body.login === auth.login &&
    req.body.password === auth.password
  ) {
    const token = new Buffer(auth.login + ':' + auth.password).toString('base64')
    res.status(200).json({ token })
  } else {
    res.status(401).json({ msg: 'Invalid login or password.' })
  }
})

server.use('/api', isAuthorized, router)

server.listen(3000, () => {
  console.log('Listening in port 3000')
})

function isAuthorized (req, res, next) {
  if (req.headers.authorization) {    
      const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
      const [login, password] = new Buffer(b64auth, 'base64').toString().split(':')
    
      // Verify login and password are set and correct
      if (!login || !password ||
        login !== auth.login ||
        password !== auth.password) {
        res.set('WWW-Authenticate', 'Basic realm="nope"') // change this
        res.status(403).json({ msg: 'Invalid authorization token.' })
        return
      }
    next()
  } else {
    res.status(401).json({ msg: 'No authorization token found.' })
  }
}
