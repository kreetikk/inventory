const jsonServer = require('json-server')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const userDb = JSON.parse(fs.readFileSync('../usersDB.json', 'UTF-8'))

const SECRET_KEY = process.env.LOGIN || 'very secret thing'
const expiresIn = process.env.LOGIN || '24h'

const server = jsonServer.create()
const router = jsonServer.router('../inventoryDB.json')

server.use(jsonServer.defaults({ static: path.join(process.cwd(), 'public/') }))
server.use(cookieParser())
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true }))

server.post('/auth/login', (req, res) => {
  const { email, password } = req.body

  if (isAuthenticated({email, password}) === false) {
    const status = 401
    const message = 'Incorrect email or password'
    res.status(status).json({status, message})
    return
  }

  const token = createToken({ email })
  userDb.users = userDb.users.map(user => {
    if (user.email === email) user.tokens.push(token)
    user.tokens = user.tokens.slice(-1 * 5) // keep last 5 only
    return user
  })

  saveUserDb()

  res.status(200).json({ email, token })
})

// server.post('/auth/register', registerHandler)

server.post('/auth/reset-password', isAuthorized, (req, res) => {
  const { password } = req.body

  if (!password) {
    const status = 401
    const message = 'Password Field Cannot be empty'
    res.status(status).json({ status, message })
    return
  }

  const token = req.headers.authorization.split(' ')[1]

  userDb.users = userDb.users.map(user => {
    if (user.tokens.includes(token)) user.password = bcrypt.hashSync(password, 10)
    return user
  })

  saveUserDb()

  const message = 'Your password has been changed successfully'
  res.status(200).json({ message })
})

server.use('/api', isAuthorized, router)

server.listen(3000, () => {
  console.log('Listening in port 3000')
})

function registerHandler (req, res) {
  const { email, password } = req.body

  if (userDb.users.findIndex(user => user.email === email) !== -1) {
    const status = 409
    const message = `A user with ${email} already exists`
    res.status(status).json({status, message})
    return
  }

  const token = createToken({ email })

  userDb.users.push({
    email,
    password: bcrypt.hashSync(password, 10),
    tokens: [token]
  })

  saveUserDb()

  res.status(200).json({ email, token })
}

function isAuthorized (req, res, next) {
  if (req.headers.authorization === undefined
    || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Bad authorization header'
    res.status(status).json({status, message})
    return
  }
  try {
     verifyToken(req.headers.authorization.split(' ')[1])
     next()
  } catch (err) {
    const status = 401
    const message = 'Error: token is not valid'
    res.status(status).json({status, message})
  }
}

function isAuthenticated({ email, password }) {
  return userDb.users.findIndex(user =>
    user.email === email && bcrypt.compareSync(password, user.password)) !== -1
}

function createToken(payload){
  return jwt.sign(payload, SECRET_KEY, {expiresIn})
}

function verifyToken (token) {
  return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}

function saveUserDb() {
  fs.writeFileSync('../usersDB.json', JSON.stringify(userDb) , 'utf-8')
}
