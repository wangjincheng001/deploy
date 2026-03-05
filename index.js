/**
 * 使用Express框架创建Web服务器
 */
const express = require('express');

// 创建Express应用实例
const app = express();
// 使用中间件解析JSON请求体
app.use(express.json());

// 提供静态文件服务，托管'public'目录下的文件
app.use(express.static('dist'))

// 引入Morgan中间件用于HTTP请求日志记录
const morgan = require('morgan')

/**
 * 自定义Morgan token，用于记录POST请求的请求体
 * @param {Object} request - HTTP请求对象
 * @returns {string} JSON格式的请求体或空字符串
 */
morgan.token('post-body', (request) => {
    if (request.method === 'POST' && request.body) {
        return JSON.stringify(request.body)
    }
    return ''
})

// 自定义Morgan日志格式
const customFormat = ':method :url :status :res[content-length] - :response-time ms :post-body';

// 应用自定义格式的Morgan中间件
app.use(morgan(customFormat))

// 引入Note模型
const Note = require('./models/note')

app.get('/api/persons', (request, response, next) => {
    Note.find({}).then(notes => {
        response.json(notes)
    })
        .catch(error => next(error))
})
app.get('/info', (request, response, next) => {
    const date = new Date()
    Note.estimatedDocumentCount().then(count => {
        response.send(`<p>Phonebook has info for ${count} people</p><p>${date}</p>`)
    })
        .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    Note.findById(id).then(note => {
        response.json(note)
    })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    Note.findByIdAndDelete(id).then(() => {
        response.status(204).end()
    })
        .catch(error => next(error))
})


app.post('/api/persons', (request, response, next) => {
    const body = request.body

    const newPerson = new Note({
        name: body.name,
        number: body.number
    })

    newPerson.save().then(savedPerson => {
        response.json(savedPerson)
    })
        .catch(error => next(error))

})

app.put('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    const body = request.body
    Note.findByIdAndUpdate(id, body, { returnDocument: 'after', runValidators: true, context: 'query' }).then(updatedPerson => {
        response.json(updatedPerson)
    })
        .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
        return response.status(400).json({ error: 'expected value to be unique' })
    }

    // 未知错误，返回 500
    response.status(500).json({ error: 'Internal server error' })

}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

